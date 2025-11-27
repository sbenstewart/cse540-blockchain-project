import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import PatientDashboard from "./PatientDashboard";
import DoctorDashboard from "./DoctorDashboard";
import AccountAssignment from "./components/AccountAssignment";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // "patient" | "doctor"
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Failed to parse user data:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
      setLoading(false);
    };

    checkLoginStatus();

    // Listen for storage changes (login from another tab)
    window.addEventListener("storage", checkLoginStatus);
    return () => window.removeEventListener("storage", checkLoginStatus);
  }, []);

  const handleLogin = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes - Assign Wallet */}
        <Route
          path="/assign-wallet"
          element={
            isLoggedIn ? <AccountAssignment /> : <Navigate to="/login" />
          }
        />

        {/* Protected Routes - Patient */}
        <Route
          path="/patient-dashboard"
          element={
            isLoggedIn && userRole === "patient" ? (
              <PatientDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Routes - Doctor */}
        <Route
          path="/doctor-dashboard"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <DoctorDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              userRole === "doctor" ? (
                <Navigate to="/doctor-dashboard" />
              ) : (
                <Navigate to="/patient-dashboard" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
