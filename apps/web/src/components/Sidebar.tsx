"use client";

import React from "react";
import { 
  GraduationCap, 
  LayoutDashboard, 
  FileSpreadsheet, 
  FileText, 
  CheckSquare, 
  Award, 
  Settings, 
  HelpCircle, 
  Sparkles, 
  X,
  ChevronRight,
  ShieldCheck,
  Cpu
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
}

export default function Sidebar({
  activeTab = "dashboard",
  onTabChange,
  isOpen,
  onClose,
  apiKey,
}: SidebarProps) {
  const mainNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "Home" },
    { id: "assessments", label: "Assessments", icon: FileSpreadsheet, badge: "Active" },
    { id: "question-papers", label: "Question Papers", icon: FileText },
    { id: "answer-sheets", label: "Answer Sheets", icon: CheckSquare },
    { id: "results", label: "Results & Grading", icon: Award },
  ];

  const secondaryNav = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Guides", icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xs transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo & Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
              <GraduationCap className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-heading text-lg font-bold tracking-tight text-slate-900">
                  Grade<span className="text-indigo-600">AI</span>
                </span>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 border border-indigo-100">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Assessment Suite
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AI Engine Status Banner */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-600">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-800">
                  {apiKey ? "Gemini 1.5 Live" : "Simulator Mode"}
                </p>
                <div className="flex items-center space-x-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${apiKey ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}></span>
                  <span className="text-[9.5px] text-slate-400">
                    {apiKey ? "API Connected" : "Local Engine"}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              FAST
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              Main Menu
            </p>
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-indigo-50/90 text-indigo-700 font-semibold shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Secondary Navigation */}
          <div>
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              Preferences
            </p>
            <nav className="space-y-1">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={`group flex w-full items-center space-x-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User / Profile Footer Area */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 transition cursor-pointer">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <span>SM</span>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  Dr. Sarah Miller
                </p>
                <p className="text-[10.5px] text-slate-400 truncate">
                  Lead Evaluator
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
