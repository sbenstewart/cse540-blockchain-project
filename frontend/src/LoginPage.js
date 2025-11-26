import React, { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient"); // "patient" | "doctor"

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return alert("Please enter your email and password");
    }

    // UI-only: your friend will handle actual auth/wallet later
    onLogin(role);
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

            {/* ROLE SWITCH */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-200 p-1 rounded-full flex gap-2">
                {/* Patient */}
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition
                    ${
                      role === "patient"
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-blue-100 hover:text-blue-700"
                    }`}
                >
                  Patient
                </button>

                {/* Doctor */}
                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition
                    ${
                      role === "doctor"
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-blue-100 hover:text-blue-700"
                    }`}
                >
                  Doctor
                </button>
              </div>
            </div>

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
                  className="w-full py-2.5 px-4 text-[15px] font-medium rounded-md text-white bg-blue-600 !bg-blue-600 hover:!bg-blue-800 focus:outline-none cursor-pointer transition duration-200"
                >
                  Sign in as {role === "doctor" ? "Doctor" : "Patient"}
                </button>

                <p className="text-sm mt-6 text-center text-slate-600">
                  Don't have an account?
                  <a
                    href="#!"
                    className="text-blue-600 ml-1 hover:underline"
                  >
                    Register here
                  </a>
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
