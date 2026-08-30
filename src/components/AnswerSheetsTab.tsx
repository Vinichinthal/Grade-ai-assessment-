"use client";

import React, { useRef, useState } from "react";
import { 
  CheckSquare, 
  Trash2, 
  Eye, 
  Calendar, 
  Sparkles, 
  UploadCloud, 
  AlertCircle,
  Play,
  User,
  BookOpen,
  Download,
  Printer
} from "lucide-react";
import { AnswerSheetMetadata } from "../utils/db";

interface AnswerSheetsTabProps {
  sheets: AnswerSheetMetadata[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File, studentName: string, assessmentName: string) => void;
  onAnalyze: (sheet: AnswerSheetMetadata) => void;
  onDownload?: (id: string, name: string) => void;
  onPrint?: (id: string, name: string) => void;
}

export default function AnswerSheetsTab({
  sheets,
  onView,
  onDelete,
  onUpload,
  onAnalyze,
  onDownload,
  onPrint
}: AnswerSheetsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload overlay form states
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [assessmentName, setAssessmentName] = useState("Physics Final Exam");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }
    if (!studentName.trim()) {
      setError("Please enter the student's name.");
      return;
    }

    onUpload(selectedFile, studentName.trim(), assessmentName.trim());
    
    // Reset Form
    setSelectedFile(null);
    setStudentName("");
    setShowUploadForm(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Student Answer Sheets</h2>
          <p className="text-xs text-slate-400 mt-1">Review, view, and analyze student handwritten exam submissions</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-600/10 cursor-pointer transition active:scale-98"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Student Sheet</span>
          </button>
        </div>
      </div>

      {/* Upload Overlay Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
                <span>Upload Student Submission</span>
              </h3>
              <button 
                onClick={() => setShowUploadForm(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer text-xs"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="flex items-center space-x-1.5 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter Student Name (e.g. Liam Neeson)"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none transition"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment / Exam</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Physics Final Exam"
                    value={assessmentName}
                    onChange={(e) => setAssessmentName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none transition"
                  />
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Upload</label>
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 rounded-xl border border-slate-850 bg-[#0E1322] hover:bg-slate-800/50 py-2.5 text-xs text-slate-400 transition cursor-pointer"
                  >
                    {selectedFile ? selectedFile.name : "Select PDF / Image Sheet"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 transition cursor-pointer"
              >
                <span>Upload & Save Submission</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Table / Grid */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold">
                <th className="pb-3 pl-2">Student Name</th>
                <th className="pb-3">File Name</th>
                <th className="pb-3">Upload Date</th>
                <th className="pb-3">Assessment</th>
                <th className="pb-3 text-center">Pages</th>
                <th className="pb-3 text-center">Analysis Status</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sheets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No student answer sheets found. Click Upload Student Sheet above to add one.
                  </td>
                </tr>
              ) : (
                sheets.map((s) => (
                  <tr key={s.id} className="group hover:bg-slate-800/20 transition">
                    <td className="py-4 pl-2 font-bold text-white group-hover:text-indigo-400 transition">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{s.studentName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-300 font-medium">
                      {s.name}
                    </td>
                    <td className="py-4 text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{new Date(s.uploadDate).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-slate-300">
                      {s.assessmentName}
                    </td>
                    <td className="py-4 text-center font-semibold text-slate-300">
                      {s.pages}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        s.status === "Analyzed" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${s.status === "Analyzed" ? "bg-emerald-400" : "bg-amber-400"}`} />
                        <span>{s.status}</span>
                      </span>
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onView(s.id)}
                          className="inline-flex items-center space-x-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/20 text-indigo-300 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>
                        {onDownload && (
                          <button
                            onClick={() => onDownload(s.id, s.name)}
                            className="inline-flex items-center space-x-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2 py-1 text-[10px] font-semibold transition cursor-pointer"
                            title="Download File"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        )}
                        {onPrint && (
                          <button
                            onClick={() => onPrint(s.id, s.name)}
                            className="inline-flex items-center space-x-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2 py-1 text-[10px] font-semibold transition cursor-pointer"
                            title="Print File"
                          >
                            <Printer className="h-3 w-3" />
                          </button>
                        )}
                        {s.status === "Ready" && (
                          <button
                            onClick={() => onAnalyze(s)}
                            className="inline-flex items-center space-x-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                            title="Start AI Grading Analysis"
                          >
                            <Play className="h-3 w-3" />
                            <span>Analyze</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(s.id)}
                          className="inline-flex items-center space-x-1 rounded-lg bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
