import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Please enter your email and password");
      }

      // Call backend API to login
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();

      // Store token and user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Login successful:", data.user);

      // Call parent onLogin with role
      onLogin(data.user.role);

      // Redirect after state updates in App.js
      setTimeout(() => {
        navigate(
          data.user.role === "doctor"
            ? "/doctor-dashboard"
            : "/patient-dashboard"
        );
      }, 100);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div className="bg-gray-100 lg:h-screen flex items-center justify-center p-4">
      <div className="max-w-6xl bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.3)] p-4 lg:p-5 rounded-md">
        <div className="grid md:grid-cols-2 items-center gap-y-8">
          {/* Left side - form */}
          <form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto w-full p-4 md:p-6"
          >
            <div className="mb-6 text-center">
              <img
                src="https://cdn.vectorstock.com/i/750p/53/79/medical-symbol-vector-985379.avif"
                alt="Medical Logo"
                className="w-24 mb-4 mx-auto block"
              />
              <h2 className="text-xl font-semibold text-slate-900">
                Medical Records Portal
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-sm text-slate-900 bg-slate-100 focus:bg-transparent pl-4 py-3 rounded-md border border-slate-100 focus:border-blue-600 outline-none transition-all"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-sm text-slate-900 bg-slate-100 focus:bg-transparent pl-4 py-3 rounded-md border border-slate-100 focus:border-blue-600 outline-none transition-all"
                  placeholder="Enter password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-slate-300 rounded-md"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-3 block text-sm text-slate-900"
                  >
                    Remember me
                  </label>
                </div>

                <a href="#!" className="text-blue-600 text-sm hover:underline">
                  Forgot password?
                </a>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-[15px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-800 focus:outline-none cursor-pointer transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-sm mt-6 text-center text-slate-600">
                  Don't have an account?
                  <button
                    type="button"
                    onClick={handleRegisterClick}
                    className="text-blue-600 ml-1 hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </form>

          {/* Right side - image and overlay text */}
          <div className="w-full h-full">
            <div className="aspect-square bg-gray-50 relative before:absolute before:inset-0 before:bg-blue-600/70 rounded-md overflow-hidden w-full h-full">
              <img
                src="https://readymadeui.com/team-image.webp"
                className="w-full h-full object-cover"
                alt="login visual"
              />
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6">
                <h1 className="text-white text-4xl font-semibold">Sign in</h1>
                <p className="text-blue-100 text-[15px] font-medium mt-4 leading-relaxed">
                  Welcome back! Access your medical records safely and stay in
                  control of your health.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
