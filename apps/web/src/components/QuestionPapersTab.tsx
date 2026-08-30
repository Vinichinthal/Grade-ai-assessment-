"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  FileText, 
  Trash2, 
  Eye, 
  Calendar, 
  UploadCloud, 
  AlertCircle,
  Plus,
  BookOpen,
  Database,
  Bookmark,
  Sparkles,
  ArrowRight,
  FolderOpen,
  Download,
  Printer
} from "lucide-react";
import { QuestionPaperMetadata, QPTemplate } from "../utils/db";
import QuestionPaperBuilder from "./QuestionPaperBuilder";
import QuestionBankTab from "./QuestionBankTab";
import TemplatesTab from "./TemplatesTab";

interface QuestionPapersTabProps {
  papers: QuestionPaperMetadata[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File) => void;
  onCreateBuilderPaper: (paper: QuestionPaperMetadata) => void;
  onDownload?: (id: string, name: string) => void;
  onPrint?: (id: string, name: string) => void;
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
}

export default function QuestionPapersTab({
  papers,
  onView,
  onDelete,
  onUpload,
  onCreateBuilderPaper,
  onDownload,
  onPrint,
  activeSubTab: externalActiveSubTab,
  setActiveSubTab: externalSetActiveSubTab
}: QuestionPapersTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Sub-tabs management
  const [internalSubTab, setInternalSubTab] = useState("directory");
  const activeSubTab = externalActiveSubTab || internalSubTab;
  const setActiveSubTab = (tab: string) => {
    if (externalSetActiveSubTab) {
      externalSetActiveSubTab(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  // Selected template data for customization loading
  const [builderInitialData, setBuilderInitialData] = useState<Partial<QuestionPaperMetadata> | undefined>(undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const isPDF = selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf");
      const isImage = selectedFile.type.startsWith("image/");
      
      if (!isPDF && !isImage) {
        setError("Unsupported format. Please upload a PDF or an Image.");
        return;
      }
      
      setError(null);
      onUpload(selectedFile);
    }
  };

  const handleSelectTemplate = (tpl: QPTemplate) => {
    // Set builder initial configurations based on template
    setBuilderInitialData({
      name: tpl.name,
      subject: tpl.subject,
      grade: tpl.grade,
      examType: tpl.examType,
      duration: tpl.duration,
      maxMarks: tpl.maxMarks,
      instructions: tpl.instructions,
      questions: tpl.questions
    });
    // Open builder subtab
    setActiveSubTab("builder");
  };

  const handleCreatePaperFromBuilder = (paper: QuestionPaperMetadata) => {
    onCreateBuilderPaper(paper);
    setBuilderInitialData(undefined);
    setActiveSubTab("directory");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Sub navigation bar */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-bold uppercase tracking-wider text-slate-400 select-none shrink-0 pb-1">
        <button
          onClick={() => {
            setBuilderInitialData(undefined);
            setActiveSubTab("directory");
          }}
          className={`flex items-center space-x-1.5 pb-2.5 border-b-2 transition cursor-pointer ${
            activeSubTab === "directory" 
              ? "border-indigo-500 text-white" 
              : "border-transparent hover:text-slate-200"
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          <span>All Papers</span>
        </button>
        <button
          onClick={() => {
            setBuilderInitialData(undefined);
            setActiveSubTab("builder");
          }}
          className={`flex items-center space-x-1.5 pb-2.5 border-b-2 transition cursor-pointer ${
            activeSubTab === "builder" 
              ? "border-indigo-500 text-white" 
              : "border-transparent hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Paper Builder</span>
        </button>
        <button
          onClick={() => setActiveSubTab("bank")}
          className={`flex items-center space-x-1.5 pb-2.5 border-b-2 transition cursor-pointer ${
            activeSubTab === "bank" 
              ? "border-indigo-500 text-white" 
              : "border-transparent hover:text-slate-200"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Question Bank</span>
        </button>
        <button
          onClick={() => setActiveSubTab("templates")}
          className={`flex items-center space-x-1.5 pb-2.5 border-b-2 transition cursor-pointer ${
            activeSubTab === "templates" 
              ? "border-indigo-500 text-white" 
              : "border-transparent hover:text-slate-200"
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Templates</span>
        </button>
      </div>

      {activeSubTab === "directory" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Question Papers Directory</h2>
              <p className="text-xs text-slate-400 mt-1">Manage and view the master printed question papers for your courses</p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-600/10 cursor-pointer transition active:scale-98"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload New Paper</span>
              </button>

              <button
                onClick={() => {
                  setBuilderInitialData(undefined);
                  setActiveSubTab("builder");
                }}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-350 hover:text-white transition cursor-pointer"
              >
                <Plus className="h-4 w-4 text-indigo-400" />
                <span>Build New Paper</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Table / List Grid */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">File Name</th>
                    <th className="pb-3">Upload/Created Date</th>
                    <th className="pb-3">Source/File Type</th>
                    <th className="pb-3 text-center">Questions / Pages</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {papers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No question papers found. Upload or build a question paper above to begin.
                      </td>
                    </tr>
                  ) : (
                    papers.map((p) => (
                      <tr key={p.id} className="group hover:bg-slate-800/20 transition">
                        <td className="py-4 pl-2 font-bold text-white group-hover:text-indigo-400 transition">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                            <span className="truncate max-w-[220px]" title={p.name}>{p.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-400">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span>{new Date(p.uploadDate).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-400 uppercase">
                          {p.type === "builder" ? (
                            <span className="rounded bg-indigo-500/10 border border-indigo-550/20 px-2 py-0.5 font-bold text-[8.5px] text-indigo-400">
                              BUILDER
                            </span>
                          ) : (
                            <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-[9.5px]">
                              {(p.type && typeof p.type === "string" && p.type.includes("/")) ? p.type.split("/")[1] : (p.type || "PDF")}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-center font-semibold text-slate-355 text-slate-300">
                          {p.type === "builder" && p.questions ? (
                            <span>{p.questions.length} Items ({p.maxMarks} Marks)</span>
                          ) : (
                            <span>{p.pages} Pages</span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            p.status === "Analyzed" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${p.status === "Analyzed" ? "bg-emerald-400" : "bg-indigo-400"}`} />
                            <span>{p.status}</span>
                          </span>
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onView(p.id)}
                              className="inline-flex items-center space-x-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/20 text-indigo-300 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                              title="Preview Document"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </button>
                            {onDownload && (
                              <button
                                onClick={() => onDownload(p.id, p.name)}
                                className="inline-flex items-center space-x-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2 py-1 text-[10px] font-semibold transition cursor-pointer"
                                title="Download File"
                              >
                                <Download className="h-3 w-3" />
                              </button>
                            )}
                            {onPrint && (
                              <button
                                onClick={() => onPrint(p.id, p.name)}
                                className="inline-flex items-center space-x-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2 py-1 text-[10px] font-semibold transition cursor-pointer"
                                title="Print File"
                              >
                                <Printer className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => onDelete(p.id)}
                              className="inline-flex items-center space-x-1 rounded-lg bg-red-500/10 hover:bg-red-650 border border-red-500/20 text-red-400 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
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
      )}

      {activeSubTab === "builder" && (
        <QuestionPaperBuilder
          initialData={builderInitialData}
          onCreatePaper={handleCreatePaperFromBuilder}
          onCancel={() => {
            setBuilderInitialData(undefined);
            setActiveSubTab("directory");
          }}
        />
      )}

      {activeSubTab === "bank" && (
        <QuestionBankTab />
      )}

      {activeSubTab === "templates" && (
        <TemplatesTab onSelectTemplate={handleSelectTemplate} />
      )}

    </div>
  );
}
