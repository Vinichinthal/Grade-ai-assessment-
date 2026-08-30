"use client";

import React, { useState, useEffect } from "react";
import { 
  Menu, 
  Search, 
  Bell, 
  Key, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  X,
  Lock,
  Cpu,
  ChevronDown
} from "lucide-react";

interface HeaderProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onMenuToggle?: () => void;
  title?: string;
  subtitle?: string;
}

export default function Header({ 
  apiKey, 
  onApiKeyChange, 
  onMenuToggle,
  title = "AI Assessment Portal",
  subtitle = "Evaluate handwritten answer sheets with intelligent question mapping"
}: HeaderProps) {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onApiKeyChange(tempKey.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsApiKeyModalOpen(false);
    }, 600);
  };

  const handleClear = () => {
    onApiKeyChange("");
    setTempKey("");
    setIsApiKeyModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        {/* Left Section: Mobile Menu + Page Context */}
        <div className="flex items-center space-x-3 lg:space-x-4">
          <button
            onClick={onMenuToggle}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-heading text-sm font-bold text-slate-900 sm:text-base">
                {title}
              </h1>
              <span className="hidden sm:inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>System Active</span>
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-500 md:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Center / Search bar (Linear / Figma style) */}
        <div className="hidden lg:flex flex-1 max-w-xs mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assessment, students, questions..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-12 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section: API Key Chip, Notifications, Profile */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* API Key Trigger Button */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            type="button"
            className={`group flex items-center space-x-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              apiKey
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            <Key className={`h-3.5 w-3.5 ${apiKey ? "text-emerald-600" : "text-indigo-600"}`} />
            <span className="hidden sm:inline">
              {apiKey ? "Gemini API Active" : "Connect Gemini Key"}
            </span>
            <span className="sm:hidden">
              {apiKey ? "API Key" : "Connect"}
            </span>
            <span className={`h-2 w-2 rounded-full ${apiKey ? "bg-emerald-500" : "bg-indigo-400"}`}></span>
          </button>

          {/* AI Model Badge */}
          <div className="hidden xl:flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
            <Cpu className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-[11px] font-medium">Gemini 1.5 Flash</span>
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
          </button>

          {/* Compact User Menu */}
          <div className="flex items-center space-x-2 pl-1">
            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100 shadow-2xs">
              SM
            </div>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Gemini API Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Connect your Google Gemini key for live grading & OCR
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none transition font-mono"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Secure Client-Side Storage</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your API key is stored securely in your browser's localStorage and is sent directly to Google Gemini APIs. It is never logged on any external server.
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 pt-1 underline"
                >
                  <span>Get a Gemini API Key from Google AI Studio</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex items-center justify-between pt-2">
                {apiKey ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Disconnect Key
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsApiKeyModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition cursor-pointer"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Key</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
