"use client";

import React, { useEffect, useState } from "react";
import { 
  Loader2, 
  Check, 
  Sparkles, 
  Layers, 
  Cpu, 
  FileText, 
  CheckCircle2,
  Terminal,
  Activity
} from "lucide-react";

interface ProcessingOverlayProps {
  currentStage: number; // 0 to 6
  statusText?: string;
  onComplete?: () => void;
}

interface Step {
  id: number;
  label: string;
  subtext: string;
  activeLogs: string[];
}

const STAGES: Step[] = [
  {
    id: 1,
    label: "Uploading Documents",
    subtext: "Staging question paper and answer sheets securely",
    activeLogs: [
      "Connecting to GradeAI storage gateway...",
      "Validating master question paper payload...",
      "Validating student answer sheet payload...",
      "Checking document integrity and hashes... verified.",
    ],
  },
  {
    id: 2,
    label: "Reading Paper & OCR",
    subtext: "Scanning document layout, typography, and structure",
    activeLogs: [
      "Initializing high-resolution OCR renderer...",
      "Extracting text boundaries and spatial coordinates...",
      "Filtering layout noise and alignment artifacts...",
      "Optical character recognition completed with 99.4% confidence.",
    ],
  },
  {
    id: 3,
    label: "Extracting Questions",
    subtext: "Identifying question numbers, sub-parts, and max marks",
    activeLogs: [
      "Parsing question headers and numbering schemes...",
      "Detecting max marks allocations (e.g. Q1: 2 marks, Q2: 3 marks)...",
      "Separating composite sub-questions: 11(a) and 11(b)...",
      "Master question schema compiled successfully.",
    ],
  },
  {
    id: 4,
    label: "Mapping Answers",
    subtext: "Aligning student handwriting to corresponding questions",
    activeLogs: [
      "Segmenting handwritten paragraph blocks...",
      "Running semantic similarity and question label detection...",
      "Mapping Page 2 handwritten paragraph to Question 11(b)...",
      "Tracking unanswered questions and unmatched annotations...",
    ],
  },
  {
    id: 5,
    label: "Evaluating Responses",
    subtext: "Scoring student answers against master marking scheme",
    activeLogs: [
      "Evaluating Question 1: Perfect conceptual match (2/2 marks)...",
      "Evaluating Question 11(a): Partial response detected (1.5/3 marks)...",
      "Evaluating Question 11(b): Missing essential formula derivation...",
      "Computing aggregate scorecards and weighted grades...",
    ],
  },
  {
    id: 6,
    label: "Generating Feedback",
    subtext: "Formulating strengths, missing points, and suggestions",
    activeLogs: [
      "Synthesizing customized student feedback...",
      "Highlighting key conceptual strengths and remediation areas...",
      "Compiling evaluation summary scorecard...",
      "Assessment ready for educator review.",
    ],
  },
];

export default function ProcessingOverlay({ currentStage, statusText }: ProcessingOverlayProps) {
  const [logIndex, setLogIndex] = useState(0);

  // Cycle through active logs to make the interface look highly dynamic
  useEffect(() => {
    setLogIndex(0);
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, [currentStage]);

  const progressPercentage = Math.min(100, Math.round(((currentStage - 0.5) / STAGES.length) * 100));

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] w-full max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Title / Animation */}
      <div className="text-center mb-8">
        <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 border border-indigo-100 shadow-sm">
          <Sparkles className="h-7 w-7 animate-pulse text-indigo-600" />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[9px]">
            <Activity className="h-2.5 w-2.5 animate-spin" />
          </span>
        </div>
        <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
          Analyzing Assessment
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          GradeAI is extracting questions, mapping handwritten answers, and synthesizing scoring recommendations.
        </p>
      </div>

      {/* Main Progress Tracker Panel */}
      <div className="w-full rounded-2xl bg-white p-6 shadow-sm border border-slate-200 mb-6">
        {/* Progress Bar & Header */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
            <span className="uppercase tracking-wider text-[11px]">Analysis Progress</span>
            <span className="text-indigo-600 font-extrabold text-xs">{progressPercentage}% Complete</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 transition-all duration-500 ease-out rounded-full shadow-xs"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Stages Checklist */}
        <div className="space-y-3">
          {STAGES.map((step) => {
            const isCompleted = currentStage > step.id;
            const isActive = currentStage === step.id;

            return (
              <div
                key={step.id}
                className={`flex items-start space-x-3.5 p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-50/70 border border-indigo-200/80 shadow-2xs" 
                    : isCompleted
                    ? "bg-slate-50/50 border border-slate-100"
                    : "border border-transparent opacity-60"
                }`}
              >
                {/* Step Status Icon */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : isActive ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-bold">
                      {step.id}
                    </div>
                  )}
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-bold ${
                        isActive
                          ? "text-indigo-900"
                          : isCompleted
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </h4>
                    {isActive && (
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Running
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      isActive ? "text-indigo-700/80 font-medium" : "text-slate-500"
                    }`}
                  >
                    {step.subtext}
                  </p>

                  {/* Active Terminal Logs */}
                  {isActive && (
                    <div className="mt-3 rounded-xl bg-slate-900 p-3 font-mono text-[10px] text-slate-300 shadow-inner border border-slate-800 space-y-1">
                      <div className="flex items-center space-x-1.5 text-indigo-400 font-bold uppercase tracking-wider text-[9px] mb-1.5 pb-1 border-b border-slate-800">
                        <Terminal className="h-3 w-3" />
                        <span>AI Pipeline Stream</span>
                      </div>
                      <div className="space-y-1">
                        {step.activeLogs.slice(0, logIndex + 1).map((log, index) => (
                          <div key={index} className="flex items-start space-x-1.5 animate-in fade-in duration-200">
                            <span className="text-slate-500 shrink-0">&gt;</span>
                            <span className={index === logIndex && !statusText ? "text-emerald-400 font-medium" : "text-slate-400"}>
                              {log}
                            </span>
                          </div>
                        ))}
                        {statusText && (
                          <div className="flex items-start space-x-1.5 animate-in fade-in duration-200 text-indigo-300 font-semibold">
                            <span className="text-indigo-400 shrink-0">&gt;</span>
                            <span>{statusText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
