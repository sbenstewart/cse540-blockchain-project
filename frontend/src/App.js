import React, { useState } from "react";
import LoginPage from "./LoginPage";
import PatientDashboard from "./PatientDashboard";
import DoctorDashboard from "./DoctorDashboard";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // "patient" | "doctor"

  const handleLogin = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (userRole === "patient") {
    return <PatientDashboard onLogout={handleLogout} />;
  }

  if (userRole === "doctor") {
    return <DoctorDashboard onLogout={handleLogout} />;
  }

  // Fallback (should not really happen)
  return <LoginPage onLogin={handleLogin} />;
}
