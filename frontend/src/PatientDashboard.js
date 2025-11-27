import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Shield,
  Share2,
  Inbox,
  Check,
  X,
} from "lucide-react";
import {
  uploadFileToIPFS,
  saveMedicalRecordMetadata,
  fetchMedicalRecords,
  grantAccessToDoctor,
  revokeAccessFromDoctor,
  getIncomingAccessRequests,
  respondToAccessRequest,
} from "./utils/web3";

// All blockchain interactions are left as TODOs for your friend.
// Right now these functions just log to the console.

export default function PatientDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "myRecords" | "access" | "shared" | "requests"

  // UI state (will be filled by blockchain later)
  const [file, setFile] = useState(null);
  const [records, setRecords] = useState([]); // [{fileType, ipfsHash, timestamp}]
  const [viewer, setViewer] = useState("");
  const [recordIndex, setRecordIndex] = useState("");
  const [incomingRequests, setIncomingRequests] = useState([]); // [{doctor, recordIndex, responded, approved}]
  const [account, setAccount] = useState(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).walletAddress : "Not assigned";
  });

  // Update account whenever component mounts or when user data changes
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setAccount(userData.walletAddress || "Not assigned");
    }
  }, []);

  // Fetch records when "My Records" tab is opened
  useEffect(() => {
    if (activeTab === "myRecords") {
      fetchMyRecords();
    } else if (activeTab === "requests") {
      fetchIncomingRequests();
    }
  }, [activeTab]);

  const fetchIncomingRequests = async () => {
    try {
      const requests = await getIncomingAccessRequests();
      setIncomingRequests(requests);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    }
  };

  // Also listen to storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const user = localStorage.getItem("user");
      setAccount(user ? JSON.parse(user).walletAddress : "Not assigned");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ---------- Placeholder functions for blockchain integration ----------

  const uploadToIPFSAndSave = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    try {
      alert("Uploading file to IPFS... Please wait.");

      // Upload file to IPFS
      const ipfsHash = await uploadFileToIPFS(file);
      console.log("File uploaded to IPFS with hash:", ipfsHash);

      // Save metadata to backend
      await saveMedicalRecordMetadata(
        ipfsHash,
        file.name,
        `Medical record uploaded on ${new Date().toLocaleDateString()}`
      );

      alert(
        `File uploaded successfully!\n\nIPFS Hash: ${ipfsHash}\n\nFile is now stored on IPFS and metadata saved to blockchain.`
      );

      // Clear file input
      setFile(null);

      // Refresh records
      await fetchMyRecords();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  const fetchMyRecords = async () => {
    try {
      const fetchedRecords = await fetchMedicalRecords();
      setRecords(fetchedRecords);
      console.log("Records fetched and displayed:", fetchedRecords);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      alert(`Failed to fetch records: ${error.message}`);
    }
  };

  const tabButton = (id, label) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition
        ${
          activeTab === id
            ? "border-indigo-600 text-indigo-700"
            : "border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-200"
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 flex flex-col items-center py-6 px-4">
      {/* TOP BAR */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700">
            Patient Portal
          </h1>
          <p className="text-gray-600 text-sm md:text-base mt-1">
            Connected account:{" "}
            <span className="font-mono break-all text-green-600">
              {account}
            </span>
          </p>
        </div>
        <button
          onClick={onLogout}
          className="self-end bg-white/80 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      {/* CARD WITH TABS */}
      <div className="w-full max-w-6xl bg-white/80 rounded-xl shadow border border-gray-200">
        {/* Tabs header */}
        <div className="px-4 pt-4 border-b border-gray-100 flex flex-wrap gap-2">
          {tabButton("upload", "Upload Record")}
          {tabButton("myRecords", "My Records")}
          {tabButton("access", "Access & Permissions")}
          {tabButton("shared", "Shared With Doctors")}
          {tabButton("requests", "Incoming Requests")}
        </div>

        {/* Tab content */}
        <div className="p-4 md:p-6">
          {/* UPLOAD TAB */}
          {activeTab === "upload" && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/90 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="text-indigo-600" />
                  <h2 className="text-xl font-semibold text-indigo-700">
                    Upload Medical Record
                  </h2>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Select a medical file to upload to IPFS and store its
                  reference on the blockchain. Your friend will handle the
                  backend integration.
                </p>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="border border-gray-300 rounded-lg w-full p-2 mb-3 text-sm bg-gray-50"
                />
                <button
                  onClick={uploadToIPFSAndSave}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
                >
                  Upload & Save (placeholder)
                </button>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                  How this will work
                </h3>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                  <li>Your file is uploaded to IPFS.</li>
                  <li>Only the IPFS hash & metadata is stored on-chain.</li>
                  <li>
                    You control which doctors can access each record through the
                    Access tab.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* MY RECORDS TAB */}
          {activeTab === "myRecords" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-600" />
                  <h2 className="text-xl font-semibold text-indigo-700">
                    My Records
                  </h2>
                </div>
                <button
                  onClick={fetchMyRecords}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Refresh Records
                </button>
              </div>

              {records.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No records found. Upload a medical record to see it here.
                </p>
              )}

              <div className="space-y-3 mt-3">
                {records.map((r) => (
                  <div
                    key={r._id}
                    className="border border-gray-200 p-4 rounded-lg bg-white/80 hover:shadow-sm transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-indigo-700">
                          {r.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(r.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded font-semibold ml-2">
                        Index: {r.recordIndex}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {r.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="text-xs">
                        <strong>IPFS:</strong>{" "}
                        <a
                          href={`https://ipfs.io/ipfs/${r.ipfsHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline break-all"
                        >
                          {r.ipfsHash.substring(0, 15)}...
                        </a>
                      </div>
                      <div className="text-xs text-gray-500">
                        <strong>Shared with:</strong>{" "}
                        {r.sharedWith?.length || 0} doctor(s)
                      </div>
                    </div>
                    {r.sharedWith && r.sharedWith.length > 0 && (
                      <div className="text-xs bg-green-50 p-2 rounded mb-2">
                        <strong>Access granted to:</strong>
                        <div className="mt-1">
                          {r.sharedWith.map((doctor, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center"
                            >
                              <span>
                                {doctor.doctorWallet.substring(0, 10)}...
                              </span>
                              <button
                                onClick={async () => {
                                  try {
                                    await revokeAccessFromDoctor(
                                      doctor.doctorWallet,
                                      r.recordIndex
                                    );
                                    await fetchMyRecords();
                                  } catch (error) {
                                    alert(
                                      "Failed to revoke access: " +
                                        error.message
                                    );
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Revoke
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCESS & PERMISSIONS TAB */}
          {activeTab === "access" && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/90 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="text-indigo-600" />
                  <h2 className="text-xl font-semibold text-indigo-700">
                    Grant Access to Doctor
                  </h2>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Enter doctor's wallet address and record index to grant them
                  access.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="border border-gray-300 p-2 w-full mb-3 rounded-lg text-sm bg-gray-50"
                  value={viewer}
                  onChange={(e) => setViewer(e.target.value)}
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Index
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="border border-gray-300 p-2 w-full mb-4 rounded-lg text-sm bg-gray-50"
                  value={recordIndex}
                  onChange={(e) => setRecordIndex(e.target.value)}
                />

                <button
                  onClick={async () => {
                    if (!viewer || recordIndex === "") {
                      alert("Enter doctor address and record index.");
                      return;
                    }
                    try {
                      await grantAccessToDoctor(viewer, parseInt(recordIndex));
                      alert("Access granted to doctor!");
                      setViewer("");
                      setRecordIndex("");
                      await fetchMyRecords();
                    } catch (error) {
                      alert("Failed: " + error.message);
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Grant Access
                </button>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                  About Access Control
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>
                    ✓ Grant access to specific doctors for specific records
                  </li>
                  <li>✓ Revoke access anytime from the record details</li>
                  <li>✓ Receive & respond to access requests from doctors</li>
                  <li>✓ Full control over your medical records</li>
                </ul>
              </div>
            </div>
          )}

          {/* SHARED WITH DOCTORS TAB */}
          {activeTab === "shared" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="text-indigo-600" />
                  <h2 className="text-xl font-semibold text-indigo-700">
                    Shared Records
                  </h2>
                </div>
              </div>

              <div className="bg-white/90 rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
                <p className="text-sm text-gray-700 mb-3">
                  This section will show records shared with you by patients.
                  <strong> (Doctor feature - coming soon)</strong>
                </p>
                <button
                  disabled
                  className="bg-gray-400 cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm"
                >
                  View Shared Records (Doctor Feature)
                </button>
              </div>

              <p className="text-gray-500 text-sm">
                No shared records available. This feature is for doctors to view
                patient records they have access to.
              </p>
            </div>
          )}

          {/* INCOMING REQUESTS TAB */}
          {activeTab === "requests" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Inbox className="text-indigo-600" />
                  <h2 className="text-xl font-semibold text-indigo-700">
                    Incoming Access Requests
                  </h2>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const requests = await getIncomingAccessRequests();
                      setIncomingRequests(requests);
                    } catch (error) {
                      alert("Failed to fetch requests: " + error.message);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Refresh
                </button>
              </div>

              {incomingRequests.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No pending access requests from doctors.
                </p>
              )}

              <div className="space-y-3 mt-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="border border-yellow-200 p-4 rounded-lg bg-yellow-50 hover:shadow-sm transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-indigo-700">
                          Access Request from Doctor
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div>
                        <strong>Doctor:</strong>{" "}
                        <span className="break-all">
                          {req.doctorWallet.substring(0, 15)}...
                        </span>
                      </div>
                      <div>
                        <strong>Record Index:</strong> {req.recordIndex}
                      </div>
                      <div className="col-span-2">
                        <strong>File:</strong>{" "}
                        {req.recordId?.fileName || "Unknown"}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await respondToAccessRequest(req._id, "approve");
                            alert("Request approved!");
                            const requests = await getIncomingAccessRequests();
                            setIncomingRequests(requests);
                          } catch (error) {
                            alert("Failed: " + error.message);
                          }
                        }}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex-1 justify-center"
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await respondToAccessRequest(req._id, "reject");
                            alert("Request rejected!");
                            const requests = await getIncomingAccessRequests();
                            setIncomingRequests(requests);
                          } catch (error) {
                            alert("Failed: " + error.message);
                          }
                        }}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex-1 justify-center"
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {incomingRequests.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Tip:</strong> Check this tab regularly for access
                    requests from doctors. You can approve or reject each
                    request individually.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
