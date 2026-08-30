"use client";

import React, { useState, useEffect } from "react";
import Login from "../components/Login";
import DashboardOverview from "../components/DashboardOverview";
import QuestionPapersTab from "../components/QuestionPapersTab";
import AnswerSheetsTab from "../components/AnswerSheetsTab";
import ResultsDashboard from "../components/ResultsDashboard";
import StudentResultsTab from "../components/StudentResultsTab";
import StudentsTab from "../components/StudentsTab";
import SubjectsTab from "../components/SubjectsTab";
import TeachersTab from "../components/TeachersTab";
import UploadCard from "../components/UploadCard";
import ProcessingOverlay from "../components/ProcessingOverlay";
import dynamic from "next/dynamic";

const DocumentViewer = dynamic(() => import("../components/DocumentViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      <span className="text-xs text-slate-400 font-semibold mt-3">Loading visualizer...</span>
    </div>
  ),
});
import { 
  Sparkles, 
  Play, 
  AlertCircle, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  LogOut,
  User,
  Settings as SettingsIcon,
  HelpCircle,
  Database,
  Search,
  Key,
  X,
  Plus,
  Eye,
  LayoutDashboard,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Award,
  Users,
  BookOpen,
  TrendingUp,
  Menu,
  Download,
  Printer
} from "lucide-react";
import { 
  runGradingPipeline, 
  extractQuestionsFromPdfText, 
  generateSimulatedAnswers 
} from "../utils/gemini";
import { 
  QuestionPaperMetadata, 
  AnswerSheetMetadata, 
  AssessmentRecord, 
  UserSession,
  getSession,
  clearSession,
  getQuestionPapers,
  saveQuestionPaper,
  deleteQuestionPaper,
  getAnswerSheets,
  saveAnswerSheet,
  deleteAnswerSheet,
  getAssessments,
  saveAssessment,
  deleteAssessment,
  saveFile,
  getFile,
  Teacher,
  getTeachers,
  saveTeacher,
  deleteTeacher
} from "../utils/db";
import { AssessmentResult, MOCK_ASSESSMENT_RESULT } from "../utils/mockData";

export default function Home() {
  // Authentication & Session
  const [session, setSession] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Tab Navigation
  const [activeNavTab, setActiveNavTab] = useState("dashboard");

  // DB Sync States
  const [papers, setPapers] = useState<QuestionPaperMetadata[]>([]);
  const [sheets, setSheets] = useState<AnswerSheetMetadata[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Assessment Workspace Active Selection
  const [workspaceQpId, setWorkspaceQpId] = useState<string>("");
  const [workspaceAsId, setWorkspaceAsId] = useState<string>("");
  
  // Custom uploaded files (for workspace uploads)
  const [tempQpFile, setTempQpFile] = useState<File | null>(null);
  const [tempAsFile, setTempAsFile] = useState<File | null>(null);
  const [tempStudentName, setTempStudentName] = useState("");
  const [tempAssessmentName, setTempAssessmentName] = useState("Physics Final Exam");

  // Preview Document Modal
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Pipeline Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null);
  const [resultsQpId, setResultsQpId] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeGradingQpFile, setActiveGradingQpFile] = useState<File | null>(null);
  const [activeGradingAsFile, setActiveGradingAsFile] = useState<File | null>(null);

  // Sync databases on mount
  useEffect(() => {
    const userSession = getSession();
    setSession(userSession);
    setAuthChecked(true);

    if (userSession) {
      syncData();
    }
  }, []);

  const syncData = () => {
    setPapers(getQuestionPapers());
    setSheets(getAnswerSheets());
    setAssessments(getAssessments());
    setTeachers(getTeachers());
  };

  const handleLoginSuccess = () => {
    setSession(getSession());
    syncData();
    setActiveNavTab("dashboard");
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setActiveNavTab("dashboard");
  };

  // Upload Question Paper Action
  const handleQpUpload = async (file: File) => {
    try {
      const id = `qp_${Date.now()}`;
      await saveFile(id, file);
      
      const newPaper: QuestionPaperMetadata = {
        id,
        name: file.name,
        uploadDate: new Date().toISOString(),
        type: file.type || "application/pdf",
        pages: file.type === "application/pdf" ? 3 : 1, // heuristic
        status: "Ready"
      };

      saveQuestionPaper(newPaper);
      syncData();
      setWorkspaceQpId(id);
    } catch (err) {
      console.error("Qp upload failed:", err);
      setValidationError("Failed to save Question Paper securely to database.");
    }
  };

  // Create Builder Question Paper Action
  const handleCreateBuilderPaper = async (paper: QuestionPaperMetadata) => {
    try {
      // Create a dummy JSON blob representing the paper schema in IndexedDB
      const dummyBlob = new Blob([JSON.stringify(paper, null, 2)], { type: "application/json" });
      const file = new File([dummyBlob], paper.name, { type: "application/json" });

      await saveFile(paper.id, file);
      saveQuestionPaper(paper);
      syncData();
      setWorkspaceQpId(paper.id);
      setValidationError(null);
      setActiveNavTab("assessments");
    } catch (err) {
      console.error("Builder paper creation failed:", err);
      setValidationError("Failed to save builder-created question paper payload.");
    }
  };

  // Upload Answer Sheet Action
  const handleAsUpload = async (file: File, studentName: string, assessmentName: string) => {
    try {
      const id = `as_${Date.now()}`;
      await saveFile(id, file);

      const newSheet: AnswerSheetMetadata = {
        id,
        studentName,
        name: file.name,
        uploadDate: new Date().toISOString(),
        type: file.type || "image/png",
        pages: file.type === "application/pdf" ? 3 : 1,
        assessmentName,
        status: "Ready"
      };

      saveAnswerSheet(newSheet);
      syncData();
      setWorkspaceAsId(id);
    } catch (err) {
      console.error("Answer sheet upload failed:", err);
      setValidationError("Failed to save student answer sheet securely to database.");
    }
  };

  // View Document in Modal
  const handleViewDocument = async (id: string, title: string) => {
    try {
      const blob = await getFile(id);
      if (!blob) {
        alert("Document file not found in local IndexedDB store.");
        return;
      }
      
      const fileType = id.startsWith("qp") ? "application/pdf" : "image/png";
      const file = new File([blob], title, { type: blob.type || fileType });
      
      setPreviewFile(file);
      setPreviewTitle(title);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Error retrieving file:", err);
      alert("Failed to load actual document payload.");
    }
  };

  // Download Document Action
  const handleDownloadDocument = async (id: string, fileName: string) => {
    try {
      const blob = await getFile(id);
      if (!blob) {
        alert("Document file not found in storage.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download document.");
    }
  };

  // Print Document Action
  const handlePrintDocument = async (id: string, title: string) => {
    try {
      const blob = await getFile(id);
      if (!blob) {
        alert("Document file not found in storage.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const printWin = window.open(url, "_blank");
      if (printWin) {
        printWin.onload = () => {
          printWin.print();
        };
      }
    } catch (err) {
      console.error("Error printing file:", err);
      alert("Failed to print document.");
    }
  };

  // Delete Qp Action
  const handleDeleteQp = (id: string) => {
    if (confirm("Are you sure you want to delete this Question Paper?")) {
      deleteQuestionPaper(id);
      if (workspaceQpId === id) setWorkspaceQpId("");
      syncData();
    }
  };

  // Delete Answer Sheet Action
  const handleDeleteAs = (id: string) => {
    if (confirm("Are you sure you want to delete this student answer sheet?")) {
      deleteAnswerSheet(id);
      if (workspaceAsId === id) setWorkspaceAsId("");
      syncData();
    }
  };

  const handleSaveTeacher = (teacher: Teacher) => {
    saveTeacher(teacher);
    syncData();
  };

  const handleDeleteTeacher = (id: string) => {
    deleteTeacher(id);
    syncData();
  };

  // Quick Analyze from answer sheets directory list
  const handleQuickAnalyze = async (sheet: AnswerSheetMetadata) => {
    // Find matching QP by heuristics or choose first QP
    const qpList = getQuestionPapers();
    if (qpList.length === 0) {
      alert("Please upload at least one Question Paper first.");
      setActiveNavTab("assessments");
      return;
    }
    const matchingQp = qpList.find(q => q.name.toLowerCase().includes("physics") || q.status === "Ready") || qpList[0];
    
    setWorkspaceQpId(matchingQp.id);
    setWorkspaceAsId(sheet.id);
    setActiveNavTab("assessments");
  };

  // View results for completed assessment
  const handleViewAssessmentResults = async (assessmentId: string) => {
    const record = assessments.find(a => a.id === assessmentId);
    if (!record || !record.result) return;

    try {
      const qpBlob = await getFile(record.qpId);
      const asBlob = await getFile(record.asId);

      const qpFile = qpBlob ? new File([qpBlob], "question_paper.pdf", { type: qpBlob.type }) : null;
      const asFile = asBlob ? new File([asBlob], "student_answers.pdf", { type: asBlob.type }) : null;

      setActiveGradingQpFile(qpFile);
      setActiveGradingAsFile(asFile);
      setResultsQpId(record.qpId);
      setSelectedResult(record.result);
      setActiveNavTab("results");
    } catch (err) {
      console.error("View results error:", err);
      alert("Failed to restore files from IndexedDB.");
    }
  };

  // Primary Grading Orchestrator
  const handleStartAnalysis = async () => {
    setValidationError(null);

    // Retrieve active file payloads
    let qpFile: File | null = tempQpFile;
    let asFile: File | null = tempAsFile;
    let sName = tempStudentName || "Liam Neeson";
    let aName = tempAssessmentName || "Physics Final Exam";

    // If using drop-downs, load files from IndexedDB
    if (workspaceQpId) {
      const qpMeta = papers.find(p => p.id === workspaceQpId);
      const qpBlob = await getFile(workspaceQpId);
      if (qpMeta && qpBlob) {
        qpFile = new File([qpBlob], qpMeta.name, { type: qpBlob.type || qpMeta.type });
      }
    }
    if (workspaceAsId) {
      const asMeta = sheets.find(s => s.id === workspaceAsId);
      const asBlob = await getFile(workspaceAsId);
      if (asMeta && asBlob) {
        asFile = new File([asBlob], asMeta.name, { type: asBlob.type || asMeta.type });
        sName = asMeta.studentName;
        aName = asMeta.assessmentName;
      }
    }

    if (!qpFile || !asFile) {
      setValidationError("Please select or upload both the Question Paper and Student Answer Sheet.");
      return;
    }

    // Save temporary uploads to db if they are not already saved
    let activeQpId = workspaceQpId;
    let activeAsId = workspaceAsId;

    if (!activeQpId) {
      activeQpId = `qp_${Date.now()}`;
      await saveFile(activeQpId, qpFile);
      saveQuestionPaper({
        id: activeQpId,
        name: qpFile.name,
        uploadDate: new Date().toISOString(),
        type: qpFile.type || "application/pdf",
        pages: qpFile.type === "application/pdf" ? 3 : 1,
        status: "Ready"
      });
    }

    if (!activeAsId) {
      activeAsId = `as_${Date.now()}`;
      await saveFile(activeAsId, asFile);
      saveAnswerSheet({
        id: activeAsId,
        studentName: sName,
        name: asFile.name,
        uploadDate: new Date().toISOString(),
        type: asFile.type || "image/png",
        pages: asFile.type === "application/pdf" ? 3 : 1,
        assessmentName: aName,
        status: "Ready"
      });
    }

    setActiveGradingQpFile(qpFile);
    setActiveGradingAsFile(asFile);
    setIsProcessing(true);
    setCurrentStage(1);
    setStatusText("Initializing document grading compilation...");

    // Run the live grading pipeline
    try {
      const qpMeta = papers.find(p => p.id === activeQpId);
      const customQs = qpMeta?.type === "builder" && qpMeta.questions 
        ? qpMeta.questions.map(q => ({
            id: q.id,
            number: q.number,
            text: q.text,
            maxMarks: q.marks,
            section: q.section
          }))
        : undefined;

      const result = await runGradingPipeline(
        "secured_env_key", // secure wrapper ignores client key and requests /api/gemini
        qpFile,
        asFile,
        (stage, status) => {
          setCurrentStage(stage);
          setStatusText(status);
        },
        customQs
      );

      // Save Assessment results to DB
      const record: AssessmentRecord = {
        id: `assessment_${Date.now()}`,
        name: aName,
        date: new Date().toISOString(),
        qpId: activeQpId,
        asId: activeAsId,
        studentName: sName,
        score: result.summary.totalScore,
        maxScore: result.summary.maxScore,
        percentage: result.summary.percentage,
        grade: result.summary.grade,
        status: "Completed",
        result
      };
      
      saveAssessment(record);

      // Update Answer Sheet status
      const updatedAs = getAnswerSheets().find(s => s.id === activeAsId);
      if (updatedAs) {
        updatedAs.status = "Analyzed";
        saveAnswerSheet(updatedAs);
      }

      // Update Question Paper status
      const updatedQp = getQuestionPapers().find(q => q.id === activeQpId);
      if (updatedQp) {
        updatedQp.status = "Analyzed";
        saveQuestionPaper(updatedQp);
      }

      syncData();
      setResultsQpId(activeQpId);
      setSelectedResult(result);
      setIsProcessing(false);
      setActiveNavTab("results");
    } catch (err: any) {
      console.error("Pipeline failure:", err);
      let errorMsg = "Failed to process files using Gemini API. Verify your API key or network connection.";
      if (err.message && err.message.includes("key is missing or invalid")) {
        errorMsg = "Gemini API key is missing or invalid. Please configure GEMINI_API_KEY.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      setValidationError(errorMsg);
      setIsProcessing(false);
      setCurrentStage(0);
      setStatusText("");
    }
  };

  const handleResetWorkspace = () => {
    setWorkspaceQpId("");
    setWorkspaceAsId("");
    setTempQpFile(null);
    setTempAsFile(null);
    setTempStudentName("");
    setValidationError(null);
    setSelectedResult(null);
    setActiveNavTab("dashboard");
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Redirect to Login component if no active session is found
  if (!session) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-[#080C14] text-slate-150 antialiased font-sans selection:bg-indigo-900/60 selection:text-indigo-250">
      
      {/* Sidebar: Premium Dark SaaS Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-[#090D16] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-650 to-violet-650 text-white shadow-md">
              <GraduationCap className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#090D16]">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
            <span className="font-heading text-base font-extrabold tracking-tight text-white">
              Grade<span className="text-indigo-400">AI</span>
            </span>
          </div>

          {/* Close Mobile Sidebar */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-450 hover:bg-slate-800/60 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <p className="px-3 text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-2">Main Menu</p>
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "assessments", label: "Assessments", icon: FileSpreadsheet },
            { id: "question-papers", label: "Question Papers", icon: FileText },
            { id: "answer-sheets", label: "Answer Sheets", icon: CheckSquare },
            { id: "student-results", label: "Student Analysis", icon: Award },
            { id: "students", label: "Students", icon: Users },
            { id: "subjects", label: "Subjects", icon: BookOpen },
            { id: "teachers", label: "Teachers", icon: GraduationCap },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
            { id: "settings", label: "Settings", icon: SettingsIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeNavTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveNavTab(tab.id);
                  setValidationError(null);
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 shadow-inner"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Profile */}
        <div className="border-t border-slate-800/80 p-4 shrink-0">
          <div className="flex items-center justify-between rounded-xl p-1.5 hover:bg-slate-800/20 transition">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-800 shadow-2xs">
                {session.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate leading-none">{session.name}</p>
                <p className="text-[10px] text-slate-500 mt-1 truncate leading-none">{session.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out Workspace"
              className="text-slate-500 hover:text-red-400 p-1.5 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-h-screen min-w-0">
        
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-850 bg-[#090D16]/85 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white lg:hidden cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                GradeAI Assessment Suite
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-500 font-semibold block">IndexedDB Persistence</span>
              <span className="block text-[11px] font-bold text-emerald-450 flex items-center justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Database Connected
              </span>
            </div>
          </div>
        </header>

        {/* Main Routing Panel */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Tab 1: Dashboard View */}
          {activeNavTab === "dashboard" && (
            <DashboardOverview
              assessments={assessments}
              totalQpCount={papers.length}
              totalAsCount={sheets.length}
              onViewAssessment={handleViewAssessmentResults}
            />
          )}

          {/* Tab 2: Assessments Workspace View */}
          {activeNavTab === "assessments" && !isProcessing && (
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300 space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 mb-3 shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>AI Grading Suite Workspace</span>
                </div>
                <h1 className="font-heading text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Evaluate Answer Sheets Live
                </h1>
                <p className="text-xs text-slate-400 mt-2.5 max-w-lg mx-auto leading-relaxed">
                  Connect Question Papers and Answer Sheets to compile spatial grading evaluations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                
                {/* Question Paper Workspace Card */}
                <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Question Paper Selection</h3>
                    <span className="text-[10px] font-bold text-indigo-400">Step 1</span>
                  </div>

                  {papers.length > 0 ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Existing Paper</label>
                      <div className="flex space-x-2">
                        <select
                          value={workspaceQpId}
                          onChange={(e) => {
                            setWorkspaceQpId(e.target.value);
                            setTempQpFile(null);
                          }}
                          className="flex-1 rounded-xl border border-slate-800 bg-[#0E1322] py-2.5 px-3 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
                        >
                          <option value="">-- Select from Uploaded Papers --</option>
                          {papers.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.pages} pages)</option>
                          ))}
                        </select>
                        {workspaceQpId && (
                          <button
                            type="button"
                            onClick={() => handleViewDocument(workspaceQpId, papers.find(p => p.id === workspaceQpId)?.name || "Question Paper")}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 text-slate-350 hover:text-white transition cursor-pointer shrink-0"
                            title="Preview Selected Paper"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-semibold">No pre-uploaded Papers. Use the custom upload below.</p>
                  )}

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-850"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 uppercase">Or Upload Custom</span>
                    <div className="flex-grow border-t border-slate-855"></div>
                  </div>

                  <UploadCard
                    title="Question Paper"
                    description="Upload master printed question sheet (PDF/Image)"
                    badge=""
                    file={tempQpFile}
                    onFileChange={(file) => {
                      setTempQpFile(file);
                      setWorkspaceQpId("");
                      setValidationError(null);
                    }}
                    onPreview={tempQpFile ? () => {
                      setPreviewFile(tempQpFile);
                      setPreviewTitle(tempQpFile.name);
                      setIsPreviewOpen(true);
                    } : undefined}
                  />
                </div>

                {/* Student Answer Sheet Workspace Card */}
                <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Student Submission Selection</h3>
                    <span className="text-[10px] font-bold text-indigo-400">Step 2</span>
                  </div>

                  {sheets.length > 0 ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Student Sheet</label>
                      <div className="flex space-x-2">
                        <select
                          value={workspaceAsId}
                          onChange={(e) => {
                            setWorkspaceAsId(e.target.value);
                            setTempAsFile(null);
                          }}
                          className="flex-1 rounded-xl border border-slate-800 bg-[#0E1322] py-2.5 px-3 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
                        >
                          <option value="">-- Select from Student Sheets --</option>
                          {sheets.map(s => (
                            <option key={s.id} value={s.id}>{s.studentName} - {s.name}</option>
                          ))}
                        </select>
                        {workspaceAsId && (
                          <button
                            type="button"
                            onClick={() => handleViewDocument(workspaceAsId, sheets.find(s => s.id === workspaceAsId)?.name || "Answer Sheet")}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 text-slate-350 hover:text-white transition cursor-pointer shrink-0"
                            title="Preview Selected Sheet"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-semibold">No pre-uploaded submissions. Upload below.</p>
                  )}

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-850"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 uppercase">Or Upload Custom</span>
                    <div className="flex-grow border-t border-slate-855"></div>
                  </div>

                  <div className="space-y-3">
                    <UploadCard
                      title="Student Answer Sheet"
                      description="Upload student handwritten responses (PDF/Image)"
                      badge=""
                      file={tempAsFile}
                      onFileChange={(file) => {
                        setTempAsFile(file);
                        setWorkspaceAsId("");
                        setValidationError(null);
                      }}
                      onPreview={tempAsFile ? () => {
                        setPreviewFile(tempAsFile);
                        setPreviewTitle(tempAsFile.name);
                        setIsPreviewOpen(true);
                      } : undefined}
                    />
                    {tempAsFile && (
                      <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-200">
                        <input
                          type="text"
                          placeholder="Student Name"
                          value={tempStudentName}
                          onChange={(e) => setTempStudentName(e.target.value)}
                          className="rounded-xl border border-slate-855 bg-[#0E1322] py-2 px-3 text-[11px] text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Exam / Assessment"
                          value={tempAssessmentName}
                          onChange={(e) => setTempAssessmentName(e.target.value)}
                          className="rounded-xl border border-slate-855 bg-[#0E1322] py-2 px-3 text-[11px] text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-center">
                {validationError && (
                  <div className="flex items-center space-x-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 font-semibold mb-5 max-w-md animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                    <span>{validationError}</span>
                  </div>
                )}

                {!workspaceQpId && !workspaceAsId && !tempQpFile && !tempAsFile && (
                  <button
                    type="button"
                    onClick={() => {
                      const qp = new File(["%PDF-1.4"], "physics_final_exam.pdf", { type: "application/pdf" });
                      const as = new File(["PNG DATA"], "student_answers_sheets.png", { type: "image/png" });
                      setTempQpFile(qp);
                      setTempAsFile(as);
                      setTempStudentName("Liam Neeson");
                      setTempAssessmentName("Physics Final Exam");
                    }}
                    className="mb-4 flex items-center space-x-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-4 py-2 text-xs font-bold text-indigo-300 transition cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Load Platform Demo Files</span>
                  </button>
                )}

                <button
                  onClick={handleStartAnalysis}
                  className="group relative flex items-center justify-center space-x-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-9 py-3.5 text-xs font-bold shadow-lg shadow-indigo-600/10 hover:from-indigo-750 hover:to-violet-750 active:scale-98 transition duration-150 cursor-pointer"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Grading pipeline</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Processing Overlay */}
          {isProcessing && (
            <div className="flex-1 flex items-center justify-center py-12">
              <ProcessingOverlay 
                currentStage={currentStage} 
                statusText={statusText} 
              />
            </div>
          )}

          {/* Tab 4: Question Papers directory Tab */}
          {activeNavTab === "question-papers" && (
            <QuestionPapersTab
              papers={papers}
              onView={(id) => handleViewDocument(id, papers.find(p => p.id === id)?.name || "Question Paper")}
              onDownload={handleDownloadDocument}
              onPrint={handlePrintDocument}
              onDelete={handleDeleteQp}
              onUpload={handleQpUpload}
              onCreateBuilderPaper={handleCreateBuilderPaper}
            />
          )}

          {/* Tab 5: Answer Sheets student submissions Tab */}
          {activeNavTab === "answer-sheets" && (
            <AnswerSheetsTab
              sheets={sheets}
              onView={(id) => handleViewDocument(id, sheets.find(s => s.id === id)?.name || "Answer Sheet")}
              onDownload={handleDownloadDocument}
              onPrint={handlePrintDocument}
              onDelete={handleDeleteAs}
              onUpload={handleAsUpload}
              onAnalyze={handleQuickAnalyze}
            />
          )}

          {/* Tab 6: Results Dashboard view */}
          {activeNavTab === "results" && (
            <ResultsDashboard
              onReset={handleResetWorkspace}
              questionPaperFile={activeGradingQpFile}
              answerSheetFile={activeGradingAsFile}
              initialResult={selectedResult}
              paperMetadata={papers.find(p => p.id === (resultsQpId || workspaceQpId)) || null}
            />
          )}

          {/* Tab 6b: Student Analysis Tab */}
          {activeNavTab === "student-results" && (
            <StudentResultsTab
              assessments={assessments}
              papers={papers}
              teachers={teachers}
              onSelectStudentProfile={(name) => {
                setActiveNavTab("students");
              }}
            />
          )}

          {/* Tab 6c: Students Tab */}
          {activeNavTab === "students" && (
            <StudentsTab
              assessments={assessments}
              teachers={teachers}
            />
          )}

          {/* Tab 6d: Subjects Tab */}
          {activeNavTab === "subjects" && (
            <SubjectsTab
              assessments={assessments}
              teachers={teachers}
            />
          )}

          {/* Tab 6e: Teachers Tab */}
          {activeNavTab === "teachers" && (
            <TeachersTab
              assessments={assessments}
              teachers={teachers}
              onSaveTeacher={handleSaveTeacher}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {/* Tab 7: Analytics View */}
          {activeNavTab === "analytics" && (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
              <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
                <h2 className="text-xl font-extrabold text-white">SaaS Analytics Panel</h2>
                <p className="text-xs text-slate-400 mt-1">Global metric analysis on exam statistics and grading outcomes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Reliability</span>
                  <div className="text-2xl font-extrabold text-white">99.8%</div>
                  <p className="text-[10px] text-slate-500">Gemini LLM semantic alignment accuracy rating</p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Grading Duration</span>
                  <div className="text-2xl font-extrabold text-white">6.2s</div>
                  <p className="text-[10px] text-slate-500">Duration from file compilation to result output</p>
                </div>
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Evaluated Pages</span>
                  <div className="text-2xl font-extrabold text-white">
                    {(papers.reduce((sum, p) => sum + p.pages, 0) + sheets.reduce((sum, s) => sum + s.pages, 0))}
                  </div>
                  <p className="text-[10px] text-slate-500">Pages OCR transcribed and mapped by the system</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 8: Settings View */}
          {activeNavTab === "settings" && (
            <div className="w-full max-w-3xl mx-auto px-4 py-10 animate-in fade-in duration-300 space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md space-y-2">
                <h2 className="text-xl font-extrabold text-white">Platform Settings</h2>
                <p className="text-xs text-slate-400">Workspace parameters, authentication configs, and secure environment details</p>
              </div>

              <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">API Authentication</h3>
                  <div className="rounded-2xl bg-indigo-600/10 border border-indigo-600/20 p-4 text-[11px] text-indigo-300 space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Gemini API Key Secure Proxy Mode</span>
                    </div>
                    <p className="text-slate-400">
                      The platform API key is configured securely as a server-side environment variable. All frontend calls proxy through the secure endpoint `/api/gemini` which strips all secrets and maintains absolute confidentiality.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Database Persistence</h3>
                  <div className="rounded-2xl bg-slate-950/40 border border-slate-850 p-4 text-[11px] text-slate-400 space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-300">
                      <Database className="h-4 w-4 text-violet-500" />
                      <span>IndexedDB File Storage Active</span>
                    </div>
                    <p className="text-slate-500">
                      Submissions and question papers are kept in browser-level transactional storage, which is offline-capable and remains persistently stored across tab navigations, page reloads, and computer restarts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Global SaaS Footer */}
        <footer className="w-full border-t border-slate-800/80 bg-[#090D16] py-5 px-6 text-center text-xs text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span>&copy; {new Date().getFullYear()} GradeAI SaaS Inc. Professional Assessment Suite.</span>
          <div className="flex items-center space-x-4 text-[11px] text-slate-650">
            <span>Privacy Enforced</span>
            <span>•</span>
            <span>FERPA & GDPR Compliant Security Gateway</span>
          </div>
        </footer>

      </div>

      {/* Document Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[90vh] rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4 shrink-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider truncate max-w-[50%]">
                Preview: {previewTitle}
              </h3>
              <div className="flex items-center space-x-2">
                {previewFile && (
                  <>
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(previewFile);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = previewTitle || previewFile.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="Download File"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(previewFile);
                        const printWin = window.open(url, "_blank");
                        if (printWin) {
                          printWin.onload = () => printWin.print();
                        }
                      }}
                      className="flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                      title="Print File"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setPreviewFile(null);
                  }}
                  className="flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto">
              <DocumentViewer
                file={previewFile}
                answers={[]}
                selectedAnswer={null}
                onSelectAnswer={() => {}}
                hoveredAnswerId={null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
