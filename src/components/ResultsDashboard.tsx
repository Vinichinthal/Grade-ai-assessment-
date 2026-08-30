"use client";

import React, { useState, useEffect } from "react";
import { 
  MOCK_ASSESSMENT_RESULT, 
  QuestionNode, 
  StudentAnswerNode,
  AssessmentResult 
} from "../utils/mockData";
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  FileSearch, 
  RefreshCw, 
  ArrowLeft, 
  FileText, 
  Percent,
  Check,
  Search,
  Sparkles,
  X,
  Sliders,
  Eye,
  Edit3,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  GraduationCap
} from "lucide-react";
import dynamic from "next/dynamic";
import { QuestionPaperMetadata } from "../utils/db";

const DocumentViewer = dynamic(() => import("./DocumentViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      <span className="text-xs text-slate-500 font-semibold mt-3">Loading visualizer...</span>
    </div>
  ),
});

interface ResultsDashboardProps {
  onReset: () => void;
  questionPaperFile: File | null;
  answerSheetFile: File | null;
  initialResult: AssessmentResult | null;
  paperMetadata?: QuestionPaperMetadata | null;
}

type TabType = "all" | "mapped" | "unanswered" | "unmatched";

export default function ResultsDashboard({ 
  onReset, 
  questionPaperFile, 
  answerSheetFile, 
  initialResult,
  paperMetadata
}: ResultsDashboardProps) {
  const [questions, setQuestions] = useState<QuestionNode[]>(() => {
    return initialResult ? initialResult.questions : MOCK_ASSESSMENT_RESULT.questions;
  });
  const [answers, setAnswers] = useState<StudentAnswerNode[]>(() => {
    return initialResult ? initialResult.answers : MOCK_ASSESSMENT_RESULT.answers;
  });
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(() => {
    const qList = initialResult ? initialResult.questions : MOCK_ASSESSMENT_RESULT.questions;
    return qList.length > 0 ? qList[0].id : null;
  });

  // Automatically switch document view to student answer sheet when a question is selected
  useEffect(() => {
    if (selectedQuestionId) {
      const isQuestion = questions.some((q) => q.id === selectedQuestionId);
      if (isQuestion) {
        setActiveDocTab("answers");
      }
    }
  }, [selectedQuestionId, questions]);

  // Modals and Visualizer State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<"qp" | "answers">("answers");
  const [activeDocPage, setActiveDocPage] = useState<number>(1);

  // Edit form state
  const [editingAnswer, setEditingAnswer] = useState<StudentAnswerNode | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formMappedQId, setFormMappedQId] = useState<string | "unmatched">("unmatched");
  const [formMarks, setFormMarks] = useState<number>(0);
  const [formFeedback, setFormFeedback] = useState<string>("");
  const [formExtractedText, setFormExtractedText] = useState<string>("");

  // Filtered lists
  const unansweredQuestions = questions.filter(
    (q) => !answers.some((a) => a.questionId === q.id)
  );
  
  const unmatchedAnswers = answers.filter((a) => a.questionId === null);
  const mappedAnswers = answers.filter((a) => a.questionId !== null);

  const getAnswerForQuestion = (qId: string) => {
    return answers.find((a) => a.questionId === qId) || null;
  };

  const getQuestionForAnswer = (ans: StudentAnswerNode) => {
    if (!ans.questionId) return null;
    return questions.find((q) => q.id === ans.questionId) || null;
  };

  // Re-calculate statistics dynamically
  const maxScore = questions.reduce((sum, q) => sum + q.maxMarks, 0);
  const totalScore = answers.reduce((sum, a) => sum + (a.questionId ? a.marksAwarded : 0), 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  
  // Breakdown counts
  const correctCount = answers.filter((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    return q && a.marksAwarded === q.maxMarks;
  }).length;

  const partiallyCorrectCount = answers.filter((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    return q && a.marksAwarded > 0 && a.marksAwarded < q.maxMarks;
  }).length;

  const incorrectCount = answers.filter((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    return q && a.marksAwarded === 0 && a.questionId !== null;
  }).length;

  // Calculate Grade
  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 85) grade = "A";
  else if (percentage >= 80) grade = "B+";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 50) grade = "D";

  const aiNotes = `Simulated and AI evaluation completed for assessment. ` + 
    (unansweredQuestions.length > 0 
      ? `Identified ${unansweredQuestions.length} unanswered questions (Question ${unansweredQuestions.map(q => q.number).join(', ')}) resulting in lost marks. ` 
      : "All questions were addressed in the answer sheets. ") +
    (unmatchedAnswers.length > 0
      ? `Found ${unmatchedAnswers.length} extra unmatched answer block on Page ${unmatchedAnswers.map(a => a.pages.join(', ')).join(', ')}.`
      : "No unmatched answer annotations remaining.");

  // Form Handlers
  const openEditModal = (qId: string | null, ans: StudentAnswerNode | null) => {
    setEditingAnswer(ans);
    setEditingQuestionId(qId);
    setFormMappedQId(qId || "unmatched");
    setFormMarks(ans ? ans.marksAwarded : 0);
    setFormFeedback(ans ? ans.feedback : "Teacher manual grading evaluation.");
    setFormExtractedText(ans ? ans.extractedText : "Manually transcribed answer response.");
    setIsEditModalOpen(true);
  };

  const handleFormQIdChange = (val: string) => {
    setFormMappedQId(val);
    if (val === "unmatched") {
      setFormMarks(0);
    } else {
      const q = questions.find((x) => x.id === val);
      if (q && formMarks > q.maxMarks) {
        setFormMarks(q.maxMarks);
      }
    }
  };

  const handleSaveGrading = (
    ansId: string | null,
    qId: string | null,
    marks: number,
    feedback: string,
    extractedText: string
  ) => {
    if (ansId) {
      // Modify existing
      setAnswers((prev) =>
        prev.map((a) => {
          if (a.id === ansId) {
            return {
              ...a,
              questionId: qId,
              marksAwarded: qId ? marks : 0,
              feedback: feedback,
              extractedText: extractedText,
            };
          }
          return a;
        })
      );
    } else {
      // Create new
      const newAns: StudentAnswerNode = {
        id: `a_manual_${Date.now()}`,
        questionId: qId,
        extractedText: extractedText,
        pages: [1],
        marksAwarded: qId ? marks : 0,
        aiConfidence: 100,
        feedback: feedback,
      };
      setAnswers((prev) => [...prev, newAns]);
      if (qId) {
        setSelectedQuestionId(qId);
      }
    }
    setIsEditModalOpen(false);
  };

  const openScanModal = (qId: string | null, ans: StudentAnswerNode | null) => {
    if (qId) {
      setActiveDocTab("qp");
    } else if (ans) {
      setActiveDocTab("answers");
      setActiveDocPage(ans.pages[0] || 1);
    } else {
      setActiveDocTab("qp");
    }
    setIsScanModalOpen(true);
  };

  const handleSelectQuestionFromScan = (qId: string) => {
    setSelectedQuestionId(qId);
    setIsScanModalOpen(false);
    const ans = getAnswerForQuestion(qId);
    if (ans) {
      setActiveTab("mapped");
    } else {
      setActiveTab("unanswered");
    }
  };

  const handleSelectAnswerFromScan = (ansId: string, qId: string | null) => {
    if (qId) {
      setSelectedQuestionId(qId);
      setActiveTab("mapped");
    } else {
      setSelectedQuestionId(ansId);
      setActiveTab("unmatched");
    }
    setIsScanModalOpen(false);
  };

  // Selected item details
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || null;
  const selectedAnswerNode = selectedQuestionId 
    ? answers.find((a) => a.questionId === selectedQuestionId || a.id === selectedQuestionId) || null
    : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-300">
      
      {/* Top Header Bar & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white transition bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 shadow-2xs hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-slate-400" />
          <span>Upload New Assessment</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 px-3 py-1.5 text-xs text-indigo-300 font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Evaluation Completed</span>
          </div>

          <button
            onClick={() => openScanModal(null, null)}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-2xs cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-slate-400" />
            <span>Full Scan Mode</span>
          </button>
        </div>
      </div>

      {/* 1. Score Summary Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-7">
        
        {/* Total Score & Grade Card */}
        <div className="lg:col-span-4 rounded-2xl bg-slate-900 p-6 border border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-950/20 blur-2xl"></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                Assessment Scorecard
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                percentage >= 80 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : percentage >= 60 
                  ? "bg-amber-50 text-amber-700 border-amber-200" 
                  : "bg-red-50 text-red-700 border-red-200"
              }`}>
                Grade {grade}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 mt-3">
              <span className="font-heading text-4xl font-extrabold text-slate-900 tracking-tight">
                {totalScore}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                / {maxScore} marks
              </span>
            </div>

            {/* Score progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                <span>Score Percentage</span>
                <span className="text-indigo-600 font-bold">{percentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-medium uppercase">Correct</span>
                <span className="font-bold text-slate-800">{correctCount} Items</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-medium uppercase">Partial</span>
                <span className="font-bold text-slate-800">{partiallyCorrectCount} Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Evaluator Insights Card */}
        <div className="lg:col-span-8 rounded-2xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="font-heading text-xs font-bold text-slate-900 uppercase tracking-wider">
                  AI Evaluator Insights & Feedback
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                Automated Synthesis
              </span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-normal mt-2.5">
              {aiNotes}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-center">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="block text-base font-extrabold text-slate-900">{questions.length}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Questions</span>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-100">
              <span className="block text-base font-extrabold text-emerald-700">{mappedAnswers.length}</span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Mapped</span>
            </div>
            <div className="rounded-xl bg-red-50/70 p-2.5 border border-red-100">
              <span className="block text-base font-extrabold text-red-700">{unansweredQuestions.length}</span>
              <span className="text-[10px] font-bold text-red-700 uppercase">Unanswered</span>
            </div>
            <div className="rounded-xl bg-amber-50/70 p-2.5 border border-amber-100">
              <span className="block text-base font-extrabold text-amber-700">{unmatchedAnswers.length}</span>
              <span className="text-[10px] font-bold text-amber-700 uppercase">Unmatched</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Tabs Filter */}
      <div className="flex border-b border-slate-200 mb-6 space-x-2 sm:space-x-4 overflow-x-auto pb-px text-xs font-semibold">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2.5 px-2 border-b-2 transition uppercase tracking-wide cursor-pointer ${
            activeTab === "all" 
              ? "border-indigo-600 text-indigo-700 font-bold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          All Items ({questions.length + unmatchedAnswers.length})
        </button>
        <button
          onClick={() => setActiveTab("mapped")}
          className={`pb-2.5 px-2 border-b-2 transition uppercase tracking-wide cursor-pointer ${
            activeTab === "mapped" 
              ? "border-indigo-600 text-indigo-700 font-bold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Mapped Answers ({mappedAnswers.length})
        </button>
        <button
          onClick={() => setActiveTab("unanswered")}
          className={`pb-2.5 px-2 border-b-2 transition uppercase tracking-wide cursor-pointer ${
            activeTab === "unanswered" 
              ? "border-indigo-600 text-indigo-700 font-bold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Unanswered Questions ({unansweredQuestions.length})
        </button>
        <button
          onClick={() => setActiveTab("unmatched")}
          className={`pb-2.5 px-2 border-b-2 transition uppercase tracking-wide cursor-pointer ${
            activeTab === "unmatched" 
              ? "border-indigo-600 text-indigo-700 font-bold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Unmatched Content ({unmatchedAnswers.length})
        </button>
      </div>

      {/* 3. Main Dashboard Panels (Split-Screen Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Questions / Unmatched sidebar */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3.5 border-b border-slate-100 pb-2.5 select-none">
              <span className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <span>
                  {activeTab === "unmatched" ? "Unmatched Scribbles List" : "Question Sheet Map"}
                </span>
              </span>
              <span className="text-[10.5px] font-medium text-slate-400">
                {activeTab === "unmatched" ? "Anomalies" : `${questions.length} Questions`}
              </span>
            </div>

            {/* Scrollable List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              
              {/* If tab is Unmatched only, show unmatched scribbles list */}
              {activeTab === "unmatched" ? (
                unmatchedAnswers.length > 0 ? (
                  unmatchedAnswers.map((ans) => {
                    const isSelected = selectedQuestionId === ans.id;
                    return (
                      <div
                        key={ans.id}
                        onClick={() => setSelectedQuestionId(ans.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex flex-col items-start cursor-pointer ${
                          isSelected 
                            ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-xs" 
                            : "bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                            Unmatched Scribble
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Page {ans.pages.join(", ")}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-800 mt-2.5 line-clamp-2 leading-relaxed font-serif italic">
                          "{ans.extractedText}"
                        </p>

                        {isSelected && (
                          <div className="mt-3.5 w-full border-t border-slate-200/80 pt-3 animate-in fade-in duration-200 space-y-3">
                            <div className="bg-white border border-amber-200/80 rounded-xl p-3 text-xs leading-relaxed text-slate-700">
                              <span className="font-bold text-amber-800 uppercase text-[9px] block mb-1">
                                AI Assessment
                              </span>
                              {ans.feedback}
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(null, ans);
                                }}
                                className="flex items-center space-x-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl px-3 py-1.5 transition cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>Map to Question</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openScanModal(null, ans);
                                }}
                                className="flex items-center space-x-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 transition cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Full Scan</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-xs text-slate-500 font-medium">
                    No unmatched scribbles or anomalies found in this answer sheet.
                  </div>
                )
              ) : (
                /* Standard Questions List */
                questions.map((q) => {
                  const ans = getAnswerForQuestion(q.id);
                  const isUnanswered = !ans;
                  const isSelected = selectedQuestionId === q.id;

                  // Skip nodes if tab filters active
                  if (activeTab === "mapped" && isUnanswered) return null;
                  if (activeTab === "unanswered" && !isUnanswered) return null;

                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestionId(q.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex flex-col items-start cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs" 
                          : "bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-indigo-700 shadow-2xs">
                            Q {q.number}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {q.section}
                          </span>
                        </div>
                        <span className="text-[10.5px] font-semibold text-slate-500">
                          {q.maxMarks} Marks Max
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-800 mt-2 line-clamp-2 leading-relaxed font-medium">
                        {q.text}
                      </p>

                      {/* Mapping Status Badge */}
                      <div className="mt-3 flex items-center justify-between w-full">
                        {ans ? (
                          <span className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            ans.marksAwarded === q.maxMarks
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ans.marksAwarded > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            <Check className="h-3 w-3" />
                            <span>Graded: {ans.marksAwarded}/{q.maxMarks} Marks</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                            <AlertCircle className="h-3 w-3" />
                            <span>Unanswered</span>
                          </span>
                        )}

                        {ans && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Page {ans.pages.join(", ")}
                          </span>
                        )}
                      </div>

                      {/* Expanded grading details card */}
                      {isSelected && (
                        <div className="mt-3.5 w-full border-t border-slate-200/80 pt-3 animate-in fade-in duration-200 space-y-3">
                          {ans ? (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  Evaluation Status:
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase border ${
                                    ans.marksAwarded === q.maxMarks
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : ans.marksAwarded > 0
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}>
                                    {ans.marksAwarded === q.maxMarks ? "Correct" : ans.marksAwarded > 0 ? "Partially Correct" : "Incorrect"}
                                  </span>
                                  <span className="font-extrabold text-indigo-700">
                                    {ans.marksAwarded} / {q.maxMarks}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs leading-relaxed text-slate-700">
                                <span className="block text-[9.5px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                                  AI Feedback
                                </span>
                                {ans.feedback}
                              </div>

                              <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 text-xs leading-relaxed text-slate-800 italic font-serif">
                                <span className="block text-[9.5px] font-bold text-indigo-700 uppercase tracking-wider not-italic mb-1">
                                  Extracted handwriting:
                                </span>
                                "{ans.extractedText}"
                              </div>

                              <div className="flex justify-end space-x-2 pt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(q.id, ans);
                                  }}
                                  className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl px-3 py-1.5 transition cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Adjust Grading</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openScanModal(q.id, ans);
                                  }}
                                  className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 transition cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Full Scan</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status:</span>
                                <span className="font-bold text-red-600 uppercase text-[10px]">Unanswered</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                No handwriting mapped to this question in the student's submission. 0 marks were awarded.
                              </p>
                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(q.id, null);
                                  }}
                                  className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl px-3 py-1.5 transition cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Manually Grade Item</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* AI Mapping Diagnostics Collapsible Console */}
            <div className="mt-4 border-t border-slate-200 pt-3">
              <details className="group">
                <summary className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider cursor-pointer list-none select-none hover:text-slate-900 transition">
                  <span className="flex items-center space-x-1.5">
                    <span>⚙️ AI Mapping Diagnostics</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                
                <div className="mt-3 rounded-xl bg-slate-900 p-3 font-mono text-[10px] text-slate-300 space-y-2 leading-relaxed shadow-inner select-text">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5 text-indigo-400 font-bold uppercase text-[9px] tracking-widest">
                    <span>Mapping Diagnostic Logs</span>
                    <span>Status</span>
                  </div>
                  
                  {questions.map((q) => {
                    const ans = getAnswerForQuestion(q.id);
                    if (ans) {
                      const boxes = ans.boundingBoxes || [];
                      const boxStrings = boxes.map(b => `[Pg ${b.page}: x=${b.box[1]/10}%, y=${b.box[0]/10}%, w=${(b.box[3]-b.box[1])/10}%, h=${(b.box[2]-b.box[0])/10}%]`).join(", ");
                      return (
                        <div key={q.id} className="border-b border-slate-800/80 pb-1.5 last:border-0">
                          <div className="flex justify-between items-start">
                            <span>Q{q.number} &rarr; Mapped: {ans.id} (Conf: {ans.aiConfidence}%)</span>
                            <span className="text-emerald-400 font-bold uppercase text-[8.5px] bg-emerald-950 px-1.5 py-0.5 rounded shrink-0">Mapped</span>
                          </div>
                          <div className="text-[8.5px] text-slate-400 pl-2 mt-0.5 truncate">{boxStrings}</div>
                        </div>
                      );
                    }
                    return (
                      <div key={q.id} className="flex justify-between items-start border-b border-slate-800/80 pb-1.5 last:border-0">
                        <span className="text-slate-500">Q{q.number} &rarr; No Answer detected</span>
                        <span className="text-red-400 font-bold uppercase text-[8.5px] bg-red-950 px-1.5 py-0.5 rounded shrink-0">Missing</span>
                      </div>
                    );
                  })}

                  {unmatchedAnswers.map((ans) => {
                    const boxes = ans.boundingBoxes || [];
                    const boxStrings = boxes.map(b => `[Pg ${b.page}: x=${b.box[1]/10}%, y=${b.box[0]/10}%, w=${(b.box[3]-b.box[1])/10}%, h=${(b.box[2]-b.box[0])/10}%]`).join(", ");
                    return (
                      <div key={ans.id} className="border-b border-slate-800/80 pb-1.5 last:border-0">
                        <div className="flex justify-between items-start">
                          <span className="text-amber-400">Extra Scribble &rarr; {ans.id}</span>
                          <span className="text-amber-400 font-bold uppercase text-[8.5px] bg-amber-950 px-1.5 py-0.5 rounded shrink-0">Unmatched</span>
                        </div>
                        <div className="text-[8.5px] text-amber-500/80 pl-2 mt-0.5 truncate">{boxStrings}</div>
                      </div>
                    );
                  })}

                  <div className="border-t border-slate-800 pt-2 mt-2 space-y-1 text-slate-400 font-semibold text-[9.5px]">
                    <div>Total Questions: <span className="text-slate-200 font-bold">{questions.length}</span></div>
                    <div>Mapped Answers: <span className="text-emerald-400 font-bold">{mappedAnswers.length}</span></div>
                    <div>Unanswered Questions: <span className="text-red-400 font-bold">{unansweredQuestions.length}</span></div>
                    <div>Unmatched Anomalies: <span className="text-amber-400 font-bold">{unmatchedAnswers.length}</span></div>
                  </div>
                </div>
              </details>
            </div>

          </div>
        </div>

        {/* Right column: Document Page Viewer Workspace */}
        <div className="lg:col-span-7 flex flex-col h-[680px] rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Viewer Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 select-none">
            <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveDocTab("answers")}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeDocTab === "answers"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Student Answer Sheet
              </button>
              <button
                onClick={() => setActiveDocTab("qp")}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeDocTab === "qp"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Master Question Paper
              </button>
            </div>
            
            <div className="text-[11px] text-slate-500 font-semibold">
              {activeDocTab === "answers" ? "Handwriting Overlays Active" : "Master Exam Text"}
            </div>
          </div>

          {/* Actual canvas pages container */}
          <DocumentViewer
            file={activeDocTab === "answers" ? answerSheetFile : questionPaperFile}
            answers={answers}
            selectedAnswer={
              selectedQuestionId 
                ? answers.find(a => a.questionId === selectedQuestionId || a.id === selectedQuestionId) || null
                : null
            }
            onSelectAnswer={(ansId, qId) => {
              if (qId) {
                setSelectedQuestionId(qId);
                setActiveTab("mapped");
              } else {
                setSelectedQuestionId(ansId);
                setActiveTab("unmatched");
              }
            }}
            hoveredAnswerId={null}
            paperMetadata={paperMetadata}
          />

        </div>

      </div>

      {/* 4. Teacher Adjust Grading Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Teacher Review & Adjustment
                </h3>
                <p className="text-xs text-slate-500">
                  Teacher grading overrides AI evaluation recommendations
                </p>
              </div>
            </div>

            {/* Extracted response preview */}
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Extracted Student Response
              </span>
              <textarea
                rows={2}
                value={formExtractedText}
                onChange={(e) => setFormExtractedText(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-serif italic focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div className="space-y-4">
              {/* Question selection dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Map to Question
                </label>
                <select
                  value={formMappedQId}
                  onChange={(e) => handleFormQIdChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 transition"
                >
                  <option value="unmatched">Unmatched scribble (Not graded)</option>
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      Q {q.number}: {q.text.slice(0, 55)}... ({q.maxMarks} Marks Max)
                    </option>
                  ))}
                </select>
              </div>

              {/* Marks awarded (only if mapped) */}
              {formMappedQId !== "unmatched" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Awarded Marks
                    </label>
                    <span className="text-xs text-indigo-700 font-bold">
                      {formMarks} / {questions.find(q => q.id === formMappedQId)?.maxMarks || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={questions.find(q => q.id === formMappedQId)?.maxMarks || 10}
                    step="0.5"
                    value={formMarks}
                    onChange={(e) => setFormMarks(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold mt-1">
                    <span>0 Marks</span>
                    <span>Max Marks: {questions.find(q => q.id === formMappedQId)?.maxMarks || 0}</span>
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teacher Feedback & Evaluation Notes
                </label>
                <textarea
                  rows={3}
                  value={formFeedback}
                  onChange={(e) => setFormFeedback(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
                  placeholder="Enter custom grading notes and remediation feedback..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveGrading(
                  editingAnswer ? editingAnswer.id : null,
                  formMappedQId === "unmatched" ? null : formMappedQId,
                  formMarks,
                  formFeedback,
                  formExtractedText
                )}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Confirm Adjustments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Document Scan Visualizer Modal (Full Scan) */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">
                    High-Resolution Document Scan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Explore original uploaded document reference pages and OCR bounding box annotations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Document Selector & Page Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActiveDocTab("qp")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    activeDocTab === "qp"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Master Question Paper
                </button>
                <button
                  onClick={() => setActiveDocTab("answers")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    activeDocTab === "answers"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Student Answer Sheets
                </button>
              </div>

              {activeDocTab === "answers" && (
                <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-xl">
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      onClick={() => setActiveDocPage(page)}
                      className={`h-7 w-9 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activeDocPage === page
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-slate-600 hover:bg-white/80"
                      }`}
                    >
                      Pg {page}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Document Area */}
            <div className="flex-grow overflow-auto bg-slate-100 rounded-xl border border-slate-200 relative min-h-[450px] w-full flex flex-col">
              <DocumentViewer
                file={activeDocTab === "qp" ? questionPaperFile : answerSheetFile}
                answers={activeDocTab === "qp" ? [] : answers}
                selectedAnswer={
                  activeDocTab === "qp"
                    ? null
                    : (selectedQuestionId ? answers.find(a => a.questionId === selectedQuestionId || a.id === selectedQuestionId) || null : null)
                }
                onSelectAnswer={(ansId, qId) => {
                  handleSelectAnswerFromScan(ansId, qId);
                }}
                hoveredAnswerId={null}
                paperMetadata={paperMetadata}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
