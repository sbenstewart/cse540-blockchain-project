const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/medical-records";

// ============= MONGODB CONNECTION =============
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

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
  timestamp: { type: Date, default: Date.now },
  sharedWith: { type: Array, default: [] }, // Array of wallet addresses with access
});

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

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
      user.walletAddress = getNextAvailableWallet(user.role);
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
function getNextAvailableWallet(role) {
  const ganacheAccounts = [
    "0x0906e8b12a14b69f5e148b851882130434efb4d3",
    "0x7ea2626c2945cc2d40413923d5abf3ecc4755593",
    "0xd4d9a3a69c5f5a8b1f2e3d4c5b6a7f8e9d0c1b2a",
    "0xc1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0",
    "0xb0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9",
    "0xa9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0",
    "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f08",
    "0x8f9e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f097",
    "0x7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0a6",
    "0x6f7e8d9c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0b5",
  ];

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

    // Use userId from JWT token, not from body
    const medicalRecord = new MedicalRecord({
      userId: req.userId, // From verified token
      walletAddress,
      ipfsHash,
      fileName,
      description,
    });

    await medicalRecord.save();
    console.log(
      `Medical record saved: ${fileName} (IPFS: ${ipfsHash}) for user: ${req.userId}`
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

    const records = await MedicalRecord.find({
      userId: req.userId,
    }).sort({ timestamp: -1 });

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

// ============= HEALTH CHECK =============
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend server is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
