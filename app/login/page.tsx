"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "../../lib/context/UserContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const router = useRouter();
  const { loginUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Fetch credentials from GCP bucket using username path
      console.log('Attempting login with username:', email); // email variable contains username
      const response = await fetch(`/api/storage/fetch?path=${email}/credentials/login_credentials.json`);
      console.log('Fetch response:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('Fetch error:', await response.text());
        throw new Error('Failed to fetch credentials');
      }

      const credentials = await response.json();
      console.log('Full credentials response:', credentials);
      console.log('Credentials check:', { email, storedUsername: credentials.username });

      if (credentials.userId === email && credentials.password === password) {
        const user = {
          id: credentials.userId,
          username: credentials.userId,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          email: credentials.email,
          phone: '',
          photoUrl: '',
          photos: [],
          password: password
        };
        localStorage.setItem('aliveHereUser', JSON.stringify(user));
        await loginUser(email, password);
        router.push("/conversation");
      } else if (credentials.username === email && credentials.password === password) {
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus("processing");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setResetStatus("success");
        setResetEmail("");
      } else {
        setResetStatus("error");
      }
    } catch (error) {
      setResetStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">

      <main className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-md mx-auto bg-slate-800/50 p-8 rounded-lg border border-slate-700">
          <h1 className="text-3xl font-light mb-6 text-center">Welcome Back</h1>
          <p className="text-slate-300 mb-8 text-center">
            Sign in to continue your legacy journey.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
                className="w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-600"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
                  className="w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-600"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : 'Sign In'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Forgot your password?
              </button>
            </div>
          </form>

          {isResetModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-black p-8 rounded-lg max-w-md w-full border border-slate-700 shadow-xl">
                <h2 className="text-2xl font-light mb-6">Reset Password</h2>

                {resetStatus === "success" ? (
                  <div>
                    <p className="text-green-400 mb-4">
                      Password reset email sent!
                    </p>
                    <p className="text-slate-300 mb-6">
                      Please check your email for further instructions.
                    </p>
                    <button
                      onClick={() => {
                        setIsResetModalOpen(false);
                        setResetStatus("");
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset}>
                    <div className="mb-4">
                      <label
                        htmlFor="resetEmail"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="resetEmail"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        style={{ backgroundColor: "#141c2f", color: "#e2e8f0" }}
                        className="w-full px-4 py-2 bg-[#141c2f] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-600"
                        required
                      />
                    </div>

                    {resetStatus === "error" && (
                      <div className="bg-red-500/10 border border-red-500/50 rounded p-3 mb-4">
                        <p className="text-red-400 text-sm">
                          Failed to send reset email. Please try again.
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsResetModalOpen(false)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetStatus === "processing"}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md disabled:opacity-50"
                      >
                        {resetStatus === "processing"
                          ? "Sending..."
                          : "Send Reset Link"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          <p className="text-center mt-6 text-slate-400">
            Don't have an account?{" "}
            <Link
              href="/registration"
              className="text-blue-400 hover:text-blue-300"
            >
              Register here
            </Link>
          </p>
        </div>
      </main>

      <footer className="bg-slate-950 py-6 w-full mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} AliveHere. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}