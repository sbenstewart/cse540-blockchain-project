// backend/ipfsUploadRoute.js (or similar)
import express from "express";
import multer from "multer";
import { create } from "ipfs-http-client";

const router = express.Router();
const upload = multer(); // memory storage

// Connect to your local IPFS node
const ipfs = create({
  host: "localhost",
  port: 5001,
  protocol: "http",
});

// This was your old uploadFileToIPFS logic, now on backend
async function uploadFileToIPFSBuffer(buffer) {
  try {
    const result = await ipfs.add(buffer);
    return result.cid.toString();
  } catch (err) {
    console.error("IPFS upload error:", err);
    throw new Error("Failed to upload file to IPFS");
  }
}

// POST /api/ipfs-upload
router.post("/ipfs-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const cid = await uploadFileToIPFSBuffer(req.file.buffer);

    res.json({
      cid,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload to IPFS failed:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
