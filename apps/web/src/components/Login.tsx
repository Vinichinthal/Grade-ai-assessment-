"use client";

import React, { useState } from "react";
import { GraduationCap, Sparkles, Eye, EyeOff, Lock, Mail, User, ShieldCheck } from "lucide-react";
import { setSession } from "../utils/db";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic Validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (isSignUp && !name.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    // Simulate Network Request
    setTimeout(() => {
      try {
        if (isSignUp) {
          // Sign Up logic - Store user credentials locally
          const storedUsers = JSON.parse(localStorage.getItem("gradeai_registered_users") || "[]");
          const userExists = storedUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase());

          if (userExists) {
            setError("An account with this email already exists.");
            setLoading(false);
            return;
          }

          const newUser = { email: email.toLowerCase(), password, name, role: "Educator" };
          storedUsers.push(newUser);
          localStorage.setItem("gradeai_registered_users", JSON.stringify(storedUsers));
          
          setSuccessMsg("Account created successfully! You can now log in.");
          setIsSignUp(false);
          setLoading(false);
        } else {
          // Login logic
          const storedUsers = JSON.parse(localStorage.getItem("gradeai_registered_users") || "[]");
          
          // Default credentials check
          const defaultUser = { email: "admin@gradeai.com", password: "password", name: "Dr. Sarah Miller", role: "Lead Evaluator" };
          const allUsers = [defaultUser, ...storedUsers];

          const foundUser = allUsers.find(
            (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
          );

          if (!foundUser) {
            setError("Invalid email or password. Hint: Use admin@gradeai.com / password");
            setLoading(false);
            return;
          }

          setSession({
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role || "Educator"
          });
          onLoginSuccess();
        }
      } catch (err: any) {
        setError("Authentication error. Please try again.");
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] text-slate-100 px-4 py-12 sm:px-6 lg:px-8 font-sans antialiased selection:bg-indigo-900 selection:text-indigo-200">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-violet-600/10 blur-[150px]" />
      </div>

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/20 mb-4 scale-100 hover:scale-105 transition duration-300">
            <GraduationCap className="h-8 w-8" />
            <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-[#0B0F19]">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white">
            Grade<span className="text-indigo-500">AI</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Professional AI-Assisted Grading & Assessment Intelligence
          </p>
        </div>

        {/* Card Body */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h3 className="text-xl font-bold text-white">
              {isSignUp ? "Create a Free Account" : "Sign In to Your Workspace"}
            </h3>
            <p className="text-xs text-slate-400">
              {isSignUp ? "Register to begin analyzing answer sheets" : "Access your grading dashboard and papers"}
            </p>
          </div>

          {/* Success / Error Messages */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-center space-x-2 animate-in fade-in duration-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 flex items-center space-x-2 animate-in fade-in duration-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Dr. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none transition duration-200"
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@gradeai.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none transition duration-200"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => alert("Credentials Tip:\nDefault email: admin@gradeai.com\nDefault password: password")}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none transition duration-200 font-mono"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            {!isSignUp && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-[#0E1322] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs text-slate-400 cursor-pointer select-none">
                  Remember my workspace session
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700 active:scale-98 transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Configuring workspace...</span>
                </div>
              ) : (
                <span>{isSignUp ? "Create Workspace Account" : "Access Platform Workspace"}</span>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              {isSignUp ? "Already have a workspace? Sign In" : "Need an account? Request Workspace Sign Up"}
            </button>
          </div>
        </div>

        {/* Footer Details */}
        <div className="flex items-center justify-center space-x-2 text-[10.5px] text-slate-600 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Professional Grade Secure Server Authentication</span>
        </div>
      </div>
    </div>
  );
}
