import React, { useState, useEffect } from "react";
import { assignWalletToUser, getAvailableAccounts } from "../utils/web3";

export default function AccountAssignment() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Loading available accounts...");
      const availableAccounts = await getAvailableAccounts();
      console.log("Loaded accounts:", availableAccounts);
      setAccounts(availableAccounts);
      if (availableAccounts.length > 0) {
        setSelectedAccount(availableAccounts[0]);
      } else {
        setError(
          "No available accounts. All accounts may be assigned already."
        );
      }
    } catch (err) {
      console.error("Error loading accounts:", err);
      setError(
        `Failed to load accounts: ${
          err.message || "Unknown error"
        }. Make sure backend is running on localhost:5000.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWallet = async () => {
    try {
      if (!selectedAccount) {
        setError("Please select an account");
        return;
      }

      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userStr || !token) {
        setError("Please login first");
        return;
      }

      const user = JSON.parse(userStr);

      setLoading(true);
      setError("");
      setMessage("");

      await assignWalletToUser(user.email, selectedAccount, user.role, token);

      setMessage(
        `✓ Wallet ${selectedAccount} assigned to ${user.email} (${user.role})`
      );

      // Update localStorage
      user.walletAddress = selectedAccount;
      localStorage.setItem("user", JSON.stringify(user));

      // Remove from available accounts
      setAccounts(accounts.filter((acc) => acc !== selectedAccount));
      if (accounts.length > 1) {
        const nextAccount = accounts.find((acc) => acc !== selectedAccount);
        setSelectedAccount(nextAccount);
      }
    } catch (err) {
      setError(err.message || "Failed to assign wallet");
    } finally {
      setLoading(false);
    }
  };

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const currentWallet = currentUser?.walletAddress;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Assign Web3 Wallet</h2>

      {currentWallet && currentWallet !== "Not assigned" && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <p className="font-medium">Current Wallet:</p>
          <p className="font-mono text-sm break-all">{currentWallet}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Available Ganache Accounts
        </label>
        {loading ? (
          <div className="w-full p-4 border rounded-md bg-gray-50 text-center">
            <p className="text-gray-600">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="w-full p-4 border rounded-md bg-gray-50 text-center">
            <p className="text-gray-600">No accounts available</p>
          </div>
        ) : (
          <>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full p-2 border rounded-md bg-white"
              disabled={loading}
            >
              <option value="">Select an account...</option>
              {accounts.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
            <small className="text-gray-500">
              Total available: {accounts.length}
            </small>
          </>
        )}
      </div>

      <button
        onClick={handleAssignWallet}
        disabled={loading || !selectedAccount}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Assigning..." : "Assign Wallet"}
      </button>

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium">Instructions:</p>
        <ol className="list-decimal list-inside">
          <li>Start Ganache on http://localhost:8545</li>
          <li>Login with your credentials</li>
          <li>Select an available account from the list</li>
          <li>Click "Assign Wallet" to bind it to your account</li>
        </ol>
      </div>
    </div>
  );
}
