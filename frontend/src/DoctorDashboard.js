import React, { useState, useEffect } from "react";
import { Shield, Share2, Search } from "lucide-react";

// All blockchain interactions are left as TODOs for your friend.
// Right now these functions just log to the console.

export default function DoctorDashboard({ onLogout }) {
  const [doctorTab, setDoctorTab] = useState("request"); // "request" | "shared" | "search"

  const [patientAddress, setPatientAddress] = useState("");
  const [doctorRecordIndex, setDoctorRecordIndex] = useState("");
  const [accessibleRecords, setAccessibleRecords] = useState([]); // will come from blockchain
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

  // Also listen to storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const user = localStorage.getItem("user");
      setAccount(user ? JSON.parse(user).walletAddress : "Not assigned");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Doctor can only request access, not approve or revoke
  const requestAccess = async (req, res) => {
    if (!patientAddress || doctorRecordIndex === "") {
      alert("Enter patient address and record index.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5050/api/access-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientWallet: patientAddress,
          recordIndex: Number(doctorRecordIndex),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send access request");
      }
      alert("Access request sent!");
      setPatientAddress("");
      setDoctorRecordIndex("");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  // Doctor can only view records shared by patients (when approved)
  const fetchAccessibleRecords = async () => {
    if (!patientAddress) {
      alert("Enter patient address.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5050/api/approved-access?patientWallet=${patientAddress}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      console.log("Accessible records response:", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch accessible records");
      }
      // Map access requests to medical record objects (recordId)
      let accessRequests = Array.isArray(data)
        ? data
        : Array.isArray(data.records)
        ? data.records
        : [];
      // Only include those with populated recordId and status 'approved'
      const records = accessRequests
        .filter((req) => req.status === "approved" && req.recordId)
        .map((req) => req.recordId);
      setAccessibleRecords(records);
    } catch (error) {
      alert("Error: " + error.message);
      setAccessibleRecords([]);
    }
  };

  const doctorTabButton = (id, label) => (
    <button
      key={id}
      onClick={() => setDoctorTab(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition
        ${
          doctorTab === id
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
            Doctor Portal
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
          {doctorTabButton("request", "Request Access")}
          {doctorTabButton("shared", "View Accessible Records")}
          {doctorTabButton("search", "Search Patient Records")}
        </div>

        {/* Tab content */}
        <div className="p-4 md:p-6">
          {/* REQUEST ACCESS TAB */}
          {doctorTab === "request" && (
            <div className="bg-white/90 rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-indigo-600" />
                <h2 className="text-xl font-semibold text-indigo-700">
                  Request Access to Patient Records
                </h2>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                Enter the patient address and the record index you want access
                to. This will trigger an on-chain permission request your friend
                will wire up.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                className="border border-gray-300 p-2 w-full mb-3 rounded-lg text-sm bg-gray-50"
                onChange={(e) => setPatientAddress(e.target.value)}
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Record Index
              </label>
              <input
                type="number"
                placeholder="0"
                className="border border-gray-300 p-2 w-full mb-4 rounded-lg text-sm bg-gray-50"
                onChange={(e) => setDoctorRecordIndex(e.target.value)}
              />

              <button
                onClick={requestAccess}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Request Access
              </button>
            </div>
          )}

          {/* VIEW ACCESSIBLE RECORDS TAB */}
          {doctorTab === "shared" && (
            <div>
              <div className="bg-white/90 rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="text-indigo-600" />
                  <h2 className="text-xl font-semibold text-indigo-700">
                    Records You Can Access
                  </h2>
                </div>

                <p className="text-gray-600 text-sm mb-3">
                  Enter the patient address to load records they have granted
                  you access to.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="border border-gray-300 p-2 w-full mb-3 rounded-lg text-sm bg-gray-50"
                  onChange={(e) => setPatientAddress(e.target.value)}
                />

                <button
                  onClick={fetchAccessibleRecords}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Fetch Accessible Records (placeholder)
                </button>
              </div>

              {accessibleRecords.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No accessible records loaded yet.
                </p>
              )}

              <div className="space-y-3 mt-3">
                {accessibleRecords.map((r, i) => {
                  // Log timestamp for debugging
                  console.log("Record timestamp:", r.timestamp);
                  let displayDate = "";
                  if (r.timestamp) {
                    // If it's a string or ms, use directly
                    if (
                      typeof r.timestamp === "string" ||
                      r.timestamp > 1000000000000
                    ) {
                      displayDate = new Date(r.timestamp).toLocaleString();
                    } else {
                      // Assume seconds
                      displayDate = new Date(
                        r.timestamp * 1000
                      ).toLocaleString();
                    }
                  } else {
                    displayDate = "Unknown";
                  }
                  return (
                    <div
                      key={i}
                      className="border border-gray-200 p-3 rounded-lg bg-white/80 hover:shadow-sm transition"
                    >
                      <p className="text-sm">
                        <strong>Type:</strong>{" "}
                        {r.fileType || r.fileName?.split(".").pop()}
                      </p>
                      <p className="text-sm break-all">
                        <strong>IPFS:</strong>{" "}
                        <a
                          href={`http://localhost:8080/ipfs/${r.ipfsHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          {r.ipfsHash}
                        </a>
                      </p>
                      <p className="text-sm">
                        <strong>Timestamp:</strong> {displayDate}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEARCH PATIENT RECORDS TAB */}
          {doctorTab === "search" && (
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <Search className="text-indigo-600" />
                <h2 className="text-xl font-semibold text-indigo-700">
                  Search Patient Records
                </h2>
              </div>
              <p className="text-gray-700 text-sm mb-2">
                Doctors cannot search arbitrary records. They can only view
                records that patients have explicitly granted access to.
              </p>
              <p className="text-xs text-gray-500">
                Should we add something like searching within the set of records
                doc has already have access to, filtered by type, date, or
                keywords. We might need to extend the smart contract and UI for
                that later if needed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
