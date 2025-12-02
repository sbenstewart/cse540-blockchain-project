// import ether from "ethers";
import contractJson from "../build/contracts/MedicalRecordsContract.json" assert { type: "json" };
import { Web3 } from "web3";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import multer from "multer";
import { create } from "ipfs-http-client";
import ipfsUploadRouter from "./ipfsUploadRoute.js";

const upload = multer();

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api", ipfsUploadRouter);

const ipfs = create({
  host: "localhost",
  port: 5001,
  protocol: "http",
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/medical-records";

// ============= MONGODB CONNECTION =============
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const web3 = new Web3("http://127.0.0.1:7545"); // Ganache RPC

async function loadAccounts() {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts);
  return accounts;
}

// ============= USER SCHEMA =============
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "doctor"], required: true },
  walletAddress: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// ============= MEDICAL RECORDS SCHEMA =============
const medicalRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  walletAddress: { type: String, required: true },
  ipfsHash: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  description: { type: String, default: "" },
  recordIndex: { type: Number, default: 0 }, // Record index for identification
  timestamp: { type: Date, default: Date.now },
  sharedWith: { type: Array, default: [] }, // Array of {walletAddress, doctorId} with access
});

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

// ============= ACCESS REQUEST SCHEMA =============
const accessRequestSchema = new mongoose.Schema({
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MedicalRecord",
    required: true,
  },
  patientId: { type: String, required: true }, // Patient's MongoDB ID
  patientWallet: { type: String, required: true },
  doctorId: { type: String, required: true }, // Doctor's MongoDB ID
  doctorWallet: { type: String, required: true },
  recordIndex: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "revoked"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date, default: null },
});

const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);

// ============= TRACK ASSIGNED ACCOUNTS =============
let assignedAccounts = {
  patient: [],
  doctor: [],
};

// Load assigned accounts from MongoDB on startup
async function loadAssignedAccounts() {
  try {
    const users = await User.find({ walletAddress: { $ne: null } });
    users.forEach((user) => {
      if (user.walletAddress && user.role) {
        if (!assignedAccounts[user.role].includes(user.walletAddress)) {
          assignedAccounts[user.role].push(user.walletAddress);
        }
      }
    });
    console.log("Loaded assigned accounts:", assignedAccounts);
  } catch (err) {
    console.error("Error loading assigned accounts:", err);
  }
}

// Call on server start
setTimeout(() => loadAssignedAccounts(), 2000);

//============== CONTRACT SETUP ==============
const networkId = Object.keys(contractJson.networks)[0];
const address = contractJson.networks[networkId].address;

const contract = new web3.eth.Contract(contractJson.abi, address);

// ============= REGISTER ENDPOINT =============
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Missing email, password, or role" });
    }

    if (role !== "patient" && role !== "doctor") {
      return res
        .status(400)
        .json({ error: 'Role must be "patient" or "doctor"' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    console.log(`User registered: ${email} (${role})`);

    res.status(201).json({
      message: "Registration successful",
      email,
      role,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= LOGIN ENDPOINT =============
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    // Find user in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Auto-assign wallet if not already assigned
    if (!user.walletAddress) {
      user.walletAddress = await getNextAvailableWallet(user.role);
      await user.save();
      assignedAccounts[user.role].push(user.walletAddress);
      console.log(`Auto-assigned wallet to ${email}: ${user.walletAddress}`);
    }

    // Generate JWT token (include userId for database lookups)
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    console.log(token);

    console.log(`User logged in: ${email}`);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= VERIFY TOKEN ENDPOINT =============
app.post("/api/verify-token", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: "Invalid token" });
  }
});

// ============= GET GANACHE ACCOUNTS =============
app.get("/api/accounts", (req, res) => {
  res.json({
    message: "Connect to Ganache on http://localhost:8545 using Web3",
    assignedAccounts,
  });
});

// ============= GET NEXT AVAILABLE WALLET =============
// Returns the next unassigned Ganache account based on role
async function getNextAvailableWallet(role) {
  const ganacheAccounts = await loadAccounts();

  // Count how many wallets already assigned to this role
  const assignedCount = assignedAccounts[role].length;

  // Simple assignment: patients get index 0, 2, 4... and doctors get 1, 3, 5...
  const startIndex = role === "patient" ? 0 : 1;
  const nextIndex = startIndex + assignedCount * 2;

  if (nextIndex < ganacheAccounts.length) {
    return ganacheAccounts[nextIndex];
  }

  // Fallback if all accounts are used
  console.warn(
    `All ${role} accounts may be assigned. Cycling through available accounts.`
  );
  return ganacheAccounts[nextIndex % ganacheAccounts.length];
}

// ============= ASSIGN WALLET ADDRESS TO USER =============
app.post("/api/assign-wallet", async (req, res) => {
  try {
    const { email, walletAddress, role } = req.body;

    if (!email || !walletAddress || !role) {
      return res
        .status(400)
        .json({ error: "Missing email, walletAddress, or role" });
    }

    // Update user in MongoDB
    const user = await User.findOneAndUpdate(
      { email },
      { walletAddress },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Track assigned account
    if (!assignedAccounts[role].includes(walletAddress)) {
      assignedAccounts[role].push(walletAddress);
    }

    console.log(`Wallet assigned: ${email} -> ${walletAddress} (${role})`);

    res.json({
      message: "Wallet assigned successfully",
      user: {
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= AUTO-ASSIGN WALLET ENDPOINT =============
app.post("/api/auto-assign-wallet", async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: "Missing email or role" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If already has wallet, return it
    if (user.walletAddress) {
      return res.json({
        message: "User already has a wallet",
        user: {
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
        },
      });
    }

    // Get next available wallet
    const walletAddress = getNextAvailableWallet(role);

    // Update user in MongoDB
    user.walletAddress = walletAddress;
    await user.save();

    // Track assigned account
    if (!assignedAccounts[role].includes(walletAddress)) {
      assignedAccounts[role].push(walletAddress);
    }

    console.log(`Auto-assigned wallet: ${email} -> ${walletAddress} (${role})`);

    res.json({
      message: "Wallet auto-assigned successfully",
      user: {
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= GET ALL USERS =============
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "email role walletAddress");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= MEDICAL RECORDS ENDPOINTS =============

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token decoded:", decoded);
    req.userId = decoded.userId; // MongoDB _id as string
    req.user = decoded; // Full decoded token
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Save medical record (POST)
app.post("/api/medical-records", verifyToken, async (req, res) => {
  try {
    const { ipfsHash, fileName, description, walletAddress } = req.body;

    console.log("Medical records POST - req.userId:", req.userId);
    console.log("Medical records POST - req.user:", req.user);
    console.log("Request body:", {
      ipfsHash,
      fileName,
      description,
      walletAddress,
    });
    const fileType = fileName.split(".").pop();
    const tx = await contract.methods
      .addRecord(ipfsHash, fileType)
      .send({ from: walletAddress });
    console.log("Blockchain transaction is done:", tx);

    if (!ipfsHash || !fileName || !walletAddress) {
      return res
        .status(400)
        .json({ error: "Missing ipfsHash, fileName, or walletAddress" });
    }

    if (!req.userId) {
      console.error("CRITICAL: req.userId is missing!");
      return res
        .status(401)
        .json({ error: "User ID not found in token. Please login again." });
    }

    // Get the next record index for this user
    const recordCount = await MedicalRecord.countDocuments({
      userId: req.userId,
    });
    const recordIndex = recordCount;

    // Use userId from JWT token, not from body
    const medicalRecord = new MedicalRecord({
      userId: req.userId, // From verified token
      walletAddress,
      ipfsHash,
      fileName,
      description,
      recordIndex: recordIndex, // Auto-assign sequential index
    });

    await medicalRecord.save();
    console.log(
      `Medical record saved: ${fileName} (IPFS: ${ipfsHash}) with recordIndex ${recordIndex} for user: ${req.userId}`
    );

    res.json({
      message: "Medical record saved successfully",
      record: medicalRecord,
    });
  } catch (error) {
    console.error("Error saving medical record:", error);
    if (error.code === 11000) {
      res.status(400).json({ error: "File already uploaded (duplicate hash)" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get user's medical records (GET)
app.get("/api/medical-records", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let records = await MedicalRecord.find({
      userId: req.userId,
    }).sort({ timestamp: 1 }); // Sort by oldest first to assign indices in order

    // Auto-fix: Assign recordIndex to any records that don't have one
    let hasUpdates = false;
    for (let i = 0; i < records.length; i++) {
      if (
        records[i].recordIndex === null ||
        records[i].recordIndex === undefined
      ) {
        records[i].recordIndex = i;
        await records[i].save();
        hasUpdates = true;
        console.log(
          `Auto-assigned recordIndex ${i} to record ${records[i].fileName}`
        );
      }
    }

    // Sort by newest first for display
    records = records.sort((a, b) => b.timestamp - a.timestamp);

    console.log(
      `Fetching ${records.length} records for user ${req.userId}:`,
      records.map((r) => ({
        fileName: r.fileName,
        recordIndex: r.recordIndex,
      }))
    );

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single record by IPFS hash (GET)
app.get("/api/medical-records/:ipfsHash", verifyToken, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      ipfsHash: req.params.ipfsHash,
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Check if user has access (owner or in sharedWith list)
    if (
      record.userId !== req.userId &&
      !record.sharedWith.includes(req.userId)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ACCESS CONTROL ENDPOINTS =============

// Doctor requests access to a patient's record (POST)
app.post("/api/access-request", verifyToken, async (req, res) => {
  try {
    const { patientWallet, recordIndex } = req.body;

    console.log("Access request received:");
    console.log("  Doctor ID:", req.userId);
    console.log("  Patient Wallet:", patientWallet);
    console.log("  Record Index:", recordIndex);

    if (!patientWallet || recordIndex === undefined) {
      return res
        .status(400)
        .json({ error: "Missing patientWallet or recordIndex" });
    }

    // Find patient by wallet address
    const patient = await User.findOne({ walletAddress: patientWallet });
    console.log("  Patient found:", patient ? patient.email : "NOT FOUND");

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Find the record
    const record = await MedicalRecord.findOne({
      userId: patient._id.toString(),
      recordIndex: recordIndex,
    });

    console.log("  Record found:", record ? record.fileName : "NOT FOUND");

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Get doctor info from token
    const doctor = await User.findById(req.userId);
    console.log("  Doctor found:", doctor ? doctor.email : "NOT FOUND");

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Check if request already exists
    const existingRequest = await AccessRequest.findOne({
      recordId: record._id,
      doctorId: req.userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Request already pending" });
    }

    // Create access request
    const accessRequest = new AccessRequest({
      recordId: record._id,
      patientId: patient._id.toString(),
      patientWallet: patient.walletAddress,
      doctorId: req.userId,
      doctorWallet: doctor.walletAddress,
      recordIndex: recordIndex,
    });

    await accessRequest.save();
    console.log(
      `✓ Access request created: doctor ${doctor.email} -> patient ${patient.email} for record index ${recordIndex}`
    );
    console.log(`  Request ID: ${accessRequest._id}`);

    res.json({
      message: "Access request sent to patient",
      request: {
        id: accessRequest._id,
        patientWallet: accessRequest.patientWallet,
        doctorWallet: accessRequest.doctorWallet,
        recordIndex: accessRequest.recordIndex,
        status: accessRequest.status,
        createdAt: accessRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error creating access request:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get incoming access requests for patient (GET)
app.get("/api/access-requests/incoming", verifyToken, async (req, res) => {
  try {
    console.log("Fetching incoming requests for patient:", req.userId);

    const requests = await AccessRequest.find({
      patientId: req.userId,
      status: "pending",
    })
      .populate("recordId")
      .sort({ createdAt: -1 });

    console.log(`  Found ${requests.length} incoming requests`);
    requests.forEach((r, i) => {
      console.log(
        `  ${i + 1}. Doctor: ${r.doctorWallet}, Record Index: ${
          r.recordIndex
        }, Status: ${r.status}`
      );
    });

    res.json(requests);
  } catch (error) {
    console.error("❌ Error fetching access requests:", error);
    res.status(500).json({ error: error.message });
  }
});

// Patient approves or rejects access request (PUT)
app.put(
  "/api/access-requests/:requestId/respond",
  verifyToken,
  async (req, res) => {
    try {
      const { action } = req.body; // "approve" or "reject"

      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const accessRequest = await AccessRequest.findById(req.params.requestId);
      if (!accessRequest) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Verify patient is the owner
      if (accessRequest.patientId !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (accessRequest.status !== "pending") {
        return res.status(400).json({ error: "Request already responded" });
      }

      // Update request status
      accessRequest.status = action === "approve" ? "approved" : "rejected";
      accessRequest.respondedAt = new Date();
      await accessRequest.save();

      // If approved, add doctor to sharedWith list
      if (action === "approve") {
        const record = await MedicalRecord.findById(accessRequest.recordId);
        const patientWallet = accessRequest.patientWallet;
        const doctorWallet = accessRequest.doctorWallet;
        const recordIndex = Number(accessRequest.recordIndex);
        const tx = await contract.methods
          .grantAccess(doctorWallet, recordIndex)
          .send({ from: patientWallet });

        console.log(
          "Blockchain transaction is done for giving access:",
          tx.transactionHash
        );

        // Optional: verify what doctor sees now
        // const sharedRecords = await contract.methods
        //   .getSharedRecords(patientWallet)
        //   .call({ from: doctorWallet });

        // console.log("Doctor can see (on-chain):", sharedRecords);

        console.log("Access granted to doctor!");
        if (record) {
          // Check if already in sharedWith
          const alreadyShared = record.sharedWith.some(
            (entry) => entry.doctorWallet === accessRequest.doctorWallet
          );
          if (!alreadyShared) {
            record.sharedWith.push({
              doctorWallet: accessRequest.doctorWallet,
              doctorId: accessRequest.doctorId,
            });
            await record.save();
          }
        }
      }

      console.log(
        `Access request ${action}ed: doctor ${accessRequest.doctorWallet} -> patient ${accessRequest.patientWallet}`
      );

      res.json({
        message: `Access request ${action}ed`,
        request: accessRequest,
      });
    } catch (error) {
      console.error("Error responding to access request:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get doctor's approved access (for viewing records)
app.get("/api/approved-access", verifyToken, async (req, res) => {
  try {
    const doctor = await User.findById(req.userId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const approvedRequests = await AccessRequest.find({
      doctorId: req.userId,
      status: "approved",
    })
      .populate("recordId")
      .sort({ respondedAt: -1 });

    res.json(approvedRequests);
  } catch (error) {
    console.error("Error fetching approved access:", error);
    res.status(500).json({ error: error.message });
  }
});

// Patient grants access directly (without request)
app.post("/api/grant-access", verifyToken, async (req, res) => {
  try {
    const { doctorWallet, recordIndex } = req.body;

    if (!doctorWallet || recordIndex === undefined) {
      return res
        .status(400)
        .json({ error: "Missing doctorWallet or recordIndex" });
    }

    // Find doctor by wallet
    const doctor = await User.findOne({ walletAddress: doctorWallet });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Find record
    const record = await MedicalRecord.findOne({
      userId: req.userId,
      recordIndex: recordIndex,
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Check if already shared
    const alreadyShared = record.sharedWith.some(
      (entry) => entry.doctorWallet === doctorWallet
    );

    if (alreadyShared) {
      return res.status(400).json({ error: "Already shared with this doctor" });
    }

    // Add doctor to sharedWith
    record.sharedWith.push({
      doctorWallet: doctorWallet,
      doctorId: doctor._id.toString(),
    });

    await record.save();
    console.log(
      `Direct access granted: doctor ${doctorWallet} -> patient record ${recordIndex}`
    );

    res.json({
      message: "Access granted successfully",
      record: record,
    });
  } catch (error) {
    console.error("Error granting access:", error);
    res.status(500).json({ error: error.message });
  }
});

// Patient revokes access
app.post("/api/revoke-access", verifyToken, async (req, res) => {
  try {
    console.log("Revoke access request body:", req.body);
    const { doctorWallet, recordIndex, patientWallet } = req.body;

    const tx = await contract.methods
      .revokeAccess(doctorWallet, recordIndex)
      .send({ from: patientWallet });

    console.log("Access revoked on blockchain:", tx.transactionHash);

    if (!doctorWallet || recordIndex === undefined) {
      return res
        .status(400)
        .json({ error: "Missing doctorWallet or recordIndex" });
    }

    // Find record
    const record = await MedicalRecord.findOne({
      userId: req.userId,
      recordIndex: recordIndex,
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Remove doctor from sharedWith
    record.sharedWith = record.sharedWith.filter(
      (entry) => entry.doctorWallet !== doctorWallet
    );

    await record.save();
    // status is updated to revoke
    await AccessRequest.updateMany(
      {
        recordId: record._id,
        doctorWallet: doctorWallet,
        status: "approved",
      },
      {
        $set: {
          status: "revoked",
          respondedAt: new Date(),
        },
      }
    );

    console.log(
      `Access revoked: doctor ${doctorWallet} from patient record ${recordIndex}`
    );

    res.json({
      message: "Access revoked successfully",
      record: record,
    });
  } catch (error) {
    console.error("Error revoking access:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============= DEBUG: Check all records in database =============
app.get("/api/debug/records", async (req, res) => {
  try {
    const records = await MedicalRecord.find({}).sort({ timestamp: -1 });
    res.json({
      totalRecords: records.length,
      records: records.map((r) => ({
        _id: r._id,
        fileName: r.fileName,
        userId: r.userId,
        recordIndex: r.recordIndex,
        timestamp: r.timestamp,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= MIGRATION: Add recordIndex to existing records =============
app.post("/api/migrate-record-indices", async (req, res) => {
  try {
    console.log(
      "Starting migration: adding recordIndex to existing records..."
    );

    // Get all records grouped by userId
    const records = await MedicalRecord.find({}).sort({
      userId: 1,
      timestamp: 1,
    });

    console.log(`Total records in database: ${records.length}`);

    let updated = 0;
    const userRecordMap = {};

    for (const record of records) {
      // Count how many records this user has with index already set
      if (!userRecordMap[record.userId]) {
        userRecordMap[record.userId] = 0;
      }

      // If record doesn't have a valid recordIndex, assign one
      if (record.recordIndex === undefined || record.recordIndex === null) {
        record.recordIndex = userRecordMap[record.userId];
        await record.save();
        updated++;
        console.log(
          `✓ Updated ${record.fileName}: recordIndex = ${record.recordIndex}`
        );
      } else {
        console.log(
          `✓ Already has index: ${record.fileName} (index=${record.recordIndex})`
        );
      }

      userRecordMap[record.userId]++;
    }

    console.log(`Migration complete! Updated ${updated} records.`);

    res.json({
      message: `Migration completed. Updated ${updated} records.`,
      recordsUpdated: updated,
      totalRecords: records.length,
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============= HEALTH CHECK =============
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend server is running" });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
