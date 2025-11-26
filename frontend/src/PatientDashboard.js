import React, { useState } from "react";
import { Upload, FileText, Shield, Share2, Inbox } from "lucide-react";

// All blockchain interactions are left as TODOs for your friend.
// Right now these functions just log to the console.

export default function PatientDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "myRecords" | "access" | "shared" | "requests"

  // UI state (will be filled by blockchain later)
  const [file, setFile] = useState(null);
  const [records, setRecords] = useState([]); // [{fileType, ipfsHash, timestamp}]
  const [viewer, setViewer] = useState("");
  const [recordIndex, setRecordIndex] = useState("");
  const [sharedRecords, setSharedRecords] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]); // [{doctor, recordIndex, responded, approved}]
  const [account] = useState("0x…patient_wallet_address_here"); // placeholder text

  // ---------- Placeholder functions for blockchain integration ----------

  const uploadToIPFSAndSave = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }
    console.log("TODO: upload file to IPFS and store on-chain", file);
    alert("This is a UI placeholder. Blockchain upload will be implemented.");
  };

  const fetchMyRecords = async () => {
    console.log("TODO: fetch records from MedicalRecordsContract.getMyRecords()");
    // Example demo data – you can remove this once blockchain is wired
    setRecords([
      {
        fileType: "Blood Test",
        ipfsHash: "QmExampleHash123",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ]);
  };

  const grantAccess = async () => {
    if (!viewer || recordIndex === "") {
      alert("Enter doctor address and record index.");
      return;
    }
    console.log(
      "TODO: call contract.grantAccess(viewer, recordIndex)",
      viewer,
      recordIndex
    );
    alert("Access granted (placeholder only).");
  };

  const revokeAccess = async () => {
    if (!viewer || recordIndex === "") {
      alert("Enter doctor address and record index.");
      return;
    }
    console.log(
      "TODO: call contract.revokeAccess(viewer, recordIndex)",
      viewer,
      recordIndex
    );
    alert("Access revoked (placeholder only).");
  };

  const getSharedRecords = async () => {
    console.log(
      "TODO: call contract.getSharedRecords(patient) from a doctor context"
    );
    // This tab is more for doctor-side, here we just show placeholder
    setSharedRecords([
      {
        fileType: "X-Ray",
        ipfsHash: "QmExampleSharedHash456",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ]);
  };

  const fetchIncomingRequests = async () => {
    console.log("TODO: call contract.getMyRequests()");
    // Demo placeholder data
    setIncomingRequests([
      {
        doctor: "0xDoctorExampleAddress123",
        recordIndex: 0,
        responded: false,
        approved: false,
      },
    ]);
  };

  const approveRequest = async (id) => {
    console.log("TODO: call contract.respondToRequest(id, true)", id);
    alert("Request approved (placeholder).");
    // In real integration, refetch from chain
  };

  const rejectRequest = async (id) => {
    console.log("TODO: call contract.respondToRequest(id, false)", id);
    alert("Request rejected (placeholder).");
    // In real integration, refetch from chain
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
            <span className="font-mono break-all">
              {account || "Connect wallet (blockchain todo)"}
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
                  Select a medical file to upload to IPFS and store its reference
                  on the blockchain. Your friend will handle the backend
                  integration.
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
                  Refresh (placeholder)
                </button>
              </div>

              {records.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No records loaded. Click{" "}
                  <span className="font-medium">Refresh</span> to load sample
                  data or integrate blockchain.
                </p>
              )}

              <div className="space-y-3 mt-3">
                {records.map((r, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 p-3 rounded-lg bg-white/80 hover:shadow-sm transition"
                  >
                    <p className="text-sm">
                      <strong>Index:</strong> {i}
                    </p>
                    <p className="text-sm">
                      <strong>Type:</strong> {r.fileType}
                    </p>
                    <p className="text-sm break-all">
                      <strong>IPFS:</strong>{" "}
                      <a
                        href={`https://ipfs.io/ipfs/${r.ipfsHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {r.ipfsHash}
                      </a>
                    </p>
                    <p className="text-sm">
                      <strong>Timestamp:</strong>{" "}
                      {new Date(r.timestamp * 1000).toLocaleString()}
                    </p>
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
                    Manage Doctor Access
                  </h2>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Grant or revoke access to a specific doctor for a specific
                  record index.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="border border-gray-300 p-2 w-full mb-3 rounded-lg text-sm bg-gray-50"
                  onChange={(e) => setViewer(e.target.value)}
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Index
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="border border-gray-300 p-2 w-full mb-4 rounded-lg text-sm bg-gray-50"
                  onChange={(e) => setRecordIndex(e.target.value)}
                />

                <div className="flex gap-3">
                  <button
                    onClick={grantAccess}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex-1 text-sm"
                  >
                    Grant Access (placeholder)
                  </button>
                  <button
                    onClick={revokeAccess}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex-1 text-sm"
                  >
                    Revoke Access (placeholder)
                  </button>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                  How permissions will work
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  These buttons will call smart contract
                  functions like <code>grantAccess</code> and{" "}
                  <code>revokeAccess</code> on  MedicalRecords contract. I can replace these boxes here with image maybe....
                </p>
                <p className="text-xs text-gray-500">
                  Connect this to the deployed contract so the
                  access control is enforced on-chain.
                </p>
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
                  This section will show which records specific doctors can
                  access. For now, it just loads sample data.
                </p>
                <button
                  onClick={getSharedRecords}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Load Sample Shared Records
                </button>
              </div>

              {sharedRecords.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No shared records loaded yet.
                </p>
              )}

              <div className="space-y-3 mt-3">
                {sharedRecords.map((r, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 p-3 rounded-lg bg-white/80 hover:shadow-sm transition"
                  >
                    <p className="text-sm">
                      <strong>Type:</strong> {r.fileType}
                    </p>
                    <p className="text-sm break-all">
                      <strong>IPFS:</strong>{" "}
                      <a
                        href={`https://ipfs.io/ipfs/${r.ipfsHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {r.ipfsHash}
                      </a>
                    </p>
                    <p className="text-sm">
                      <strong>Timestamp:</strong>{" "}
                      {new Date(r.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
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
                  onClick={fetchIncomingRequests}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Refresh (placeholder)
                </button>
              </div>

              {incomingRequests.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No incoming requests. Once your friend wires the contract,
                  doctor requests will show up here.
                </p>
              )}

              <div className="space-y-3 mt-3">
                {incomingRequests.map((req, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 p-3 rounded-lg bg-white/80 hover:shadow-sm transition"
                  >
                    <p className="text-sm break-all">
                      <strong>Doctor:</strong> {req.doctor}
                    </p>
                    <p className="text-sm">
                      <strong>Record Index:</strong> {req.recordIndex}
                    </p>
                    <p className="text-sm">
                      <strong>Status:</strong>{" "}
                      {req.responded
                        ? req.approved
                          ? "Approved"
                          : "Rejected"
                        : "Pending"}
                    </p>

                    {!req.responded && (
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => approveRequest(i)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm"
                        >
                          Approve (placeholder)
                        </button>
                        <button
                          onClick={() => rejectRequest(i)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                        >
                          Reject (placeholder)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
