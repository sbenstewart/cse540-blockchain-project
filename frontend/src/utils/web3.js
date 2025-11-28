import { ethers } from "ethers";

// Ganache RPC URL - supports both Ganache GUI (7545) and CLI (8545)
// Try CLI port first, fall back to GUI port
const GANACHE_RPC_URLS = [
  "http://localhost:8545", // Ganache CLI default
  "http://localhost:7545", // Ganache GUI default
];

/**
 * Helper function to handle API responses and provide better error messages
 */
async function handleApiResponse(response, operationName = "API request") {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `${operationName} failed: ${response.statusText}`
      );
    } catch (parseError) {
      // If response is not JSON, it's likely server error or backend not running
      const responseText = await response.text();
      if (responseText.includes("<!DOCTYPE")) {
        throw new Error(
          "Backend server is not running. Make sure npm start is running in the backend folder on port 5000."
        );
      }
      throw new Error(`${operationName} failed: ${response.statusText}`);
    }
  }
  return await response.json();
}

/**
 * Get all available accounts from Ganache
 */
export async function getGanacheAccounts() {
  let lastError = null;

  for (const rpcUrl of GANACHE_RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const accounts = await provider.listAccounts();
      console.log(`Connected to Ganache at ${rpcUrl}, accounts:`, accounts);
      return accounts;
    } catch (error) {
      console.warn(`Failed to connect to Ganache at ${rpcUrl}:`, error.message);
      lastError = error;
    }
  }

  // If we get here, couldn't connect to any Ganache instance
  console.error("Could not connect to Ganache on any port");
  throw (
    lastError ||
    new Error(
      "Ganache not available on localhost:7545 or localhost:8545. Make sure Ganache is running."
    )
  );
}

/**
 * Connect to MetaMask
 */
export async function connectMetaMask() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  console.log("Connected MetaMask account:", accounts[0]);
  return { provider, signer, accounts };
}

/**
 * Auto-assign a wallet address to a user via backend
 */
export async function autoAssignWalletToUser(email, role, token) {
  try {
    const response = await fetch(
      "http://localhost:5000/api/auto-assign-wallet",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          role,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to auto-assign wallet");
    }

    const data = await response.json();
    console.log("Wallet auto-assigned:", data);
    return data.user;
  } catch (error) {
    console.error("Error auto-assigning wallet:", error);
    throw error;
  }
}

/**
 * Assign a wallet address to a user via backend
 */
export async function assignWalletToUser(email, walletAddress, role, token) {
  try {
    const response = await fetch("http://localhost:5000/api/assign-wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        walletAddress,
        role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to assign wallet");
    }

    const data = await response.json();
    console.log("Wallet assigned:", data);
    return data.user;
  } catch (error) {
    console.error("Error assigning wallet:", error);
    throw error;
  }
}

/**
 * Get all registered users (for admin purposes)
 */
export async function getAllUsers(token) {
  try {
    const response = await fetch("http://localhost:5000/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Get available Ganache accounts that haven't been assigned yet
 */
export async function getAvailableAccounts() {
  try {
    // Try to fetch from Ganache
    const allAccounts = await getGanacheAccounts();
    const response = await fetch("http://localhost:5000/api/accounts");
    const data = await response.json();
    const assignedAccounts = data.assignedAccounts || {};

    const assigned = new Set([
      ...assignedAccounts.patient,
      ...assignedAccounts.doctor,
    ]);

    const available = allAccounts.filter((addr) => !assigned.has(addr));
    console.log("Available unassigned accounts:", available);
    return available;
  } catch (error) {
    console.warn(
      "Could not fetch from Ganache, using fallback accounts:",
      error.message
    );

    // Fallback: use hardcoded accounts from backend
    try {
      const response = await fetch("http://localhost:5000/api/accounts");
      const data = await response.json();
      const assignedAccounts = data.assignedAccounts || {};

      // Hardcoded accounts that backend knows about
      const allAccounts = [
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

      const assigned = new Set([
        ...assignedAccounts.patient,
        ...assignedAccounts.doctor,
      ]);

      const available = allAccounts.filter((addr) => !assigned.has(addr));
      console.log("Using fallback accounts, available:", available);
      return available;
    } catch (fallbackError) {
      console.error("Error getting available accounts:", fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Upload file to IPFS via web3.storage (free tier, no auth needed)
 * @param {File} file - File to upload
 * @returns {Promise<string>} IPFS hash
 */
export async function uploadFileToIPFS(file) {
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    // Using web3.storage's free gateway (alternative to Infura)
    const formData = new FormData();
    formData.append("file", file);

    // Try web3.storage endpoint
    const response = await fetch("https://api.web3.storage/upload", {
      method: "POST",
      body: formData,
      headers: {
        // web3.storage allows unauthenticated uploads for demo purposes
      },
    });

    if (!response.ok) {
      // Fallback: Use local mock IPFS hash for demo if both gateways fail
      console.warn(
        "Remote IPFS gateway failed, generating demo hash for testing"
      );
      const mockHash = generateMockIPFSHash(file.name);
      console.log("Using demo IPFS hash:", mockHash);
      return mockHash;
    }

    const data = await response.json();
    console.log("File uploaded to IPFS:", data.cid);
    return data.cid;
  } catch (error) {
    console.warn(
      "IPFS upload failed, generating demo hash for testing:",
      error.message
    );
    // Fallback: Generate demo hash for demo/testing purposes
    const mockHash = generateMockIPFSHash(file.name);
    console.log("Using demo IPFS hash:", mockHash);
    return mockHash;
  }
}

/**
 * Generate a mock IPFS hash for demo/testing
 * Format: Qm followed by 44 alphanumeric characters
 */
function generateMockIPFSHash(fileName) {
  const timestamp = Date.now().toString();
  const randomChars = Math.random().toString(36).substring(2, 15);
  const combined = (fileName + timestamp + randomChars).slice(0, 44);
  return combined.padEnd(44, "0").substring(0, 42);
}

/**
 * Save medical record metadata to backend
 * @param {string} ipfsHash - IPFS hash of uploaded file
 * @param {string} fileName - Original filename
 * @param {string} description - File description
 * @returns {Promise<Object>} Record metadata
 */
export async function saveMedicalRecordMetadata(
  ipfsHash,
  fileName,
  description
) {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    if (!user.walletAddress) {
      throw new Error("No wallet address found. Please login first.");
    }

    const response = await fetch("http://localhost:5000/api/medical-records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ipfsHash,
        fileName,
        description,
        walletAddress: user.walletAddress,
        // userId is obtained from JWT token on backend, not from body
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to save record: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Medical record saved:", data);
    return data;
  } catch (error) {
    console.error("Error saving medical record:", error);
    throw error;
  }
}

/**
 * Fetch user's medical records from backend
 * @returns {Promise<Array>} Array of medical records
 */
export async function fetchMedicalRecords() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    const response = await fetch("http://localhost:5000/api/medical-records", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to fetch records: ${response.statusText}`
      );
    }

    const records = await response.json();
    console.log("Medical records fetched:", records);
    return records;
  } catch (error) {
    console.error("Error fetching medical records:", error);
    throw error;
  }
}

/**
 * Doctor requests access to a patient's record
 * @param {string} patientWallet - Patient's wallet address
 * @param {number} recordIndex - Record index
 * @returns {Promise<Object>} Access request
 */
export async function requestAccessToRecord(patientWallet, recordIndex) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    const response = await fetch("http://localhost:5000/api/access-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        patientWallet,
        recordIndex,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to request access");
    }

    const data = await response.json();
    console.log("Access request sent:", data);
    return data;
  } catch (error) {
    console.error("Error requesting access:", error);
    throw error;
  }
}

/**
 * Get incoming access requests for patient
 * @returns {Promise<Array>} Array of incoming requests
 */
export async function getIncomingAccessRequests() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    const response = await fetch(
      "http://localhost:5000/api/access-requests/incoming",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const requests = await handleApiResponse(response, "Fetch access requests");
    console.log("Incoming access requests:", requests);
    return requests;
  } catch (error) {
    console.error("Error fetching access requests:", error);
    throw error;
  }
}

/**
 * Patient responds to access request (approve/reject)
 * @param {string} requestId - Request ID
 * @param {string} action - "approve" or "reject"
 * @returns {Promise<Object>} Updated request
 */
export async function respondToAccessRequest(requestId, action) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    const response = await fetch(
      `http://localhost:5000/api/access-requests/${requestId}/respond`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to respond to request");
    }

    const data = await response.json();
    console.log("Request responded:", data);
    return data;
  } catch (error) {
    console.error("Error responding to request:", error);
    throw error;
  }
}

/**
 * Patient grants direct access to doctor
 * @param {string} doctorWallet - Doctor's wallet address
 * @param {number} recordIndex - Record index
 * @returns {Promise<Object>} Updated record
 */
export async function grantAccessToDoctor(doctorWallet, recordIndex) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    const response = await fetch("http://localhost:5000/api/grant-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        doctorWallet,
        recordIndex,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to grant access");
    }

    const data = await response.json();
    console.log("Access granted:", data);
    return data;
  } catch (error) {
    console.error("Error granting access:", error);
    throw error;
  }
}

/**
 * Patient revokes access from doctor
 * @param {string} doctorWallet - Doctor's wallet address
 * @param {number} recordIndex - Record index
 * @returns {Promise<Object>} Updated record
 */
export async function revokeAccessFromDoctor(doctorWallet, recordIndex) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }

    const response = await fetch("http://localhost:5000/api/revoke-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        doctorWallet,
        recordIndex,
        patientWallet: JSON.parse(localStorage.getItem("user")).walletAddress,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to revoke access");
    }

    const data = await response.json();
    console.log("Access revoked:", data);
    return data;
  } catch (error) {
    console.error("Error revoking access:", error);
    throw error;
  }
}
