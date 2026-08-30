"use client";

import React, { useState, useMemo, useRef } from "react";
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  TrendingUp, 
  Percent, 
  ChevronRight, 
  Users, 
  ShieldCheck, 
  Sparkles,
  BookOpen,
  Download,
  Filter,
  RotateCcw,
  Calendar,
  Layers,
  FileSpreadsheet,
  Check,
  Search,
  Eye,
  Printer,
  FileDown,
  X,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { AssessmentRecord, QuestionPaperMetadata, Teacher } from "../utils/db";

interface StudentResultsTabProps {
  assessments: AssessmentRecord[];
  papers?: QuestionPaperMetadata[];
  teachers?: Teacher[];
  onSelectStudentProfile?: (studentName: string) => void;
}

export default function StudentResultsTab({ 
  assessments, 
  papers = [], 
  teachers = [], 
  onSelectStudentProfile 
}: StudentResultsTabProps) {
  // Navigation & Drilldown State
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [viewQuestionModal, setViewQuestionModal] = useState<AssessmentRecord | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // 8 Filters State
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [assessmentFilter, setAssessmentFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateStartFilter, setDateStartFilter] = useState<string>("");
  const [dateEndFilter, setDateEndFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Only real completed or scored assessments
  const completedAssessments = useMemo(() => {
    return assessments.filter(a => a.status === "Completed" || (a.score !== undefined && a.maxScore > 0));
  }, [assessments]);

  // Helper to parse subject name from exam name or metadata
  const getSubjectNameFromExam = (name: string, qpId?: string) => {
    if (qpId) {
      const paper = papers.find(p => p.id === qpId);
      if (paper?.subject) return paper.subject;
    }
    const lower = name.toLowerCase();
    if (lower.includes("physics")) return "Physics";
    if (lower.includes("math")) return "Mathematics";
    if (lower.includes("science")) return "Science";
    if (lower.includes("english")) return "English";
    if (lower.includes("chemistry")) return "Chemistry";
    if (lower.includes("biology")) return "Biology";
    return "Other";
  };

  // Derive unique filter options from real stored data
  const uniqueStudentNames = useMemo(() => {
    return Array.from(new Set(completedAssessments.map(a => a.studentName))).filter(Boolean).sort();
  }, [completedAssessments]);

  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(completedAssessments.map(a => getSubjectNameFromExam(a.name, a.qpId)))).filter(Boolean).sort();
  }, [completedAssessments, papers]);

  const uniqueAssessments = useMemo(() => {
    return Array.from(new Set(completedAssessments.map(a => a.name))).filter(Boolean).sort();
  }, [completedAssessments]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    papers.forEach(p => {
      if (p.grade) classes.add(p.grade);
    });
    teachers.forEach(t => {
      if (t.grade) classes.add(t.grade);
    });
    if (classes.size === 0) {
      classes.add("Grade 10");
    }
    return Array.from(classes).sort();
  }, [papers, teachers]);

  const uniqueSections = useMemo(() => {
    const sections = new Set<string>(["A", "B", "C"]);
    teachers.forEach(t => {
      if (t.section) sections.add(t.section);
    });
    return Array.from(sections).sort();
  }, [teachers]);

  const uniqueGrades = ["A+", "A", "B+", "B", "C", "D", "F"];
  const uniqueStatuses = ["Excellent", "Good", "Average", "Improvement Required"];

  // Check if any filter is active
  const isAnyFilterActive = studentFilter !== "all" || 
    subjectFilter !== "all" || 
    assessmentFilter !== "all" || 
    classFilter !== "all" || 
    sectionFilter !== "all" ||
    gradeFilter !== "all" ||
    statusFilter !== "all" ||
    dateStartFilter !== "" || 
    dateEndFilter !== "" || 
    searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setStudentFilter("all");
    setSubjectFilter("all");
    setAssessmentFilter("all");
    setClassFilter("all");
    setSectionFilter("all");
    setGradeFilter("all");
    setStatusFilter("all");
    setDateStartFilter("");
    setDateEndFilter("");
    setSearchQuery("");
  };

  // Filtered dataset respecting all 8 active filters
  const filteredAssessments = useMemo(() => {
    return completedAssessments.filter((a) => {
      const subject = getSubjectNameFromExam(a.name, a.qpId);
      const paper = papers.find(p => p.id === a.qpId);
      const studentClass = paper?.grade || "Grade 10";
      const teacher = teachers.find(t => t.subject === subject);
      const section = teacher?.section || "A";
      const recordDate = a.date ? a.date.split("T")[0] : "";
      
      const pct = a.percentage !== undefined ? a.percentage : (a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0);
      let calculatedStatus = "Average";
      if (pct >= 90) calculatedStatus = "Excellent";
      else if (pct >= 75) calculatedStatus = "Good";
      else if (pct >= 65) calculatedStatus = "Average";
      else calculatedStatus = "Improvement Required";

      if (studentFilter !== "all" && a.studentName !== studentFilter) return false;
      if (subjectFilter !== "all" && subject !== subjectFilter) return false;
      if (assessmentFilter !== "all" && a.name !== assessmentFilter) return false;
      if (classFilter !== "all" && studentClass !== classFilter) return false;
      if (sectionFilter !== "all" && section !== sectionFilter) return false;
      if (gradeFilter !== "all" && a.grade !== gradeFilter) return false;
      if (statusFilter !== "all" && calculatedStatus !== statusFilter) return false;
      if (dateStartFilter && recordDate && recordDate < dateStartFilter) return false;
      if (dateEndFilter && recordDate && recordDate > dateEndFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.studentName.toLowerCase().includes(q);
        const matchesExam = a.name.toLowerCase().includes(q);
        const matchesSub = subject.toLowerCase().includes(q);
        if (!matchesName && !matchesExam && !matchesSub) return false;
      }

      return true;
    });
  }, [completedAssessments, studentFilter, subjectFilter, assessmentFilter, classFilter, sectionFilter, gradeFilter, statusFilter, dateStartFilter, dateEndFilter, searchQuery, papers, teachers]);

  // Overall Statistics from filtered data
  const totalFilteredScore = filteredAssessments.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalFilteredMax = filteredAssessments.reduce((sum, a) => sum + (a.maxScore || 0), 0);
  const avgFilteredPercent = totalFilteredMax > 0 ? Math.round((totalFilteredScore / totalFilteredMax) * 100) : 0;
  const passedAssessmentsCount = filteredAssessments.filter(a => (a.percentage || 0) >= 50).length;
  const uniqueStudentsInFiltered = Array.from(new Set(filteredAssessments.map(a => a.studentName)));

  // Core CSV Export Function
  const handleExportCsv = (recordsToExport = filteredAssessments, customFilenamePrefix = "student_analysis") => {
    const headers = [
      "Student Name",
      "Student ID",
      "Class",
      "Section",
      "Subject",
      "Assessment",
      "Marks Obtained",
      "Maximum Marks",
      "Percentage",
      "Grade",
      "Performance Status",
      "Question-wise Marks",
      "Date"
    ];

    const rows = recordsToExport.map((record) => {
      const subject = getSubjectNameFromExam(record.name, record.qpId);
      const paper = papers.find((p) => p.id === record.qpId);
      const studentClass = paper?.grade || "Grade 10";
      const teacher = teachers.find((t) => t.subject === subject);
      const section = teacher?.section || "A";
      const studentIndex = uniqueStudentNames.indexOf(record.studentName);
      const studentId = `STU_100${studentIndex >= 0 ? studentIndex + 1 : 1}`;

      const pct = record.percentage !== undefined ? record.percentage : (record.maxScore > 0 ? Math.round((record.score / record.maxScore) * 100) : 0);
      
      let status = "Average";
      if (pct >= 90) status = "Excellent";
      else if (pct >= 75) status = "Good";
      else if (pct >= 65) status = "Average";
      else status = "Improvement Required";

      // Question-wise marks extraction
      let questionWiseMarks = "N/A";
      if (
        record.result &&
        Array.isArray(record.result.questions) &&
        record.result.questions.length > 0
      ) {
        const qParts = record.result.questions.map((q, idx) => {
          const ans = record.result?.answers?.find((a) => a.questionId === q.id);
          const qNum = q.number || String(idx + 1);
          const awarded = ans ? ans.marksAwarded : 0;
          return `Q${qNum}: ${awarded}/${q.maxMarks}`;
        });
        questionWiseMarks = qParts.join("; ");
      }

      const formattedDate = record.date
        ? new Date(record.date).toISOString().split("T")[0]
        : "N/A";

      return [
        record.studentName,
        studentId,
        studentClass,
        section,
        subject,
        record.name,
        record.score,
        record.maxScore,
        `${pct}%`,
        record.grade || "N/A",
        status,
        questionWiseMarks,
        formattedDate
      ];
    });

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r") || str.includes(";")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `${customFilenamePrefix}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // Print Student Report
  const handlePrintStudentReport = () => {
    window.print();
  };

  // Strengths and Weaknesses mappings for drill-down view
  const strengthFeedbackMap: Record<string, { strength: string, feedback: string }> = {
    "Physics": { strength: "Analytical Mechanics", feedback: "Demonstrates exceptional conceptual grasp of Newtonian kinematics and mathematical solving." },
    "Mathematics": { strength: "Problem Solving", feedback: "Strong understanding of algebra, geometry derivations, and logical structure proofs." },
    "English": { strength: "Comprehension & Vocabulary", feedback: "Articulate vocabulary, proper grammatical composition, and strong reading insights." },
    "Science": { strength: "Scientific Inquiry", feedback: "Excellent grasp of life sciences, cycles, and lab experiment methodologies." },
    "Chemistry": { strength: "Molecular Chemistry", feedback: "Strong understanding of chemical equations, reactions, and periodic classifications." },
    "Biology": { strength: "Life Processes", feedback: "Accurate cellular diagrams and clear understanding of physiological systems." },
    "Other": { strength: "Core Competency", feedback: "Exhibits solid dedication and has mastered the foundational syllabus requirements." }
  };

  const weakTopicsMap: Record<string, { topics: string[], recommendation: string }> = {
    "Physics": { 
      topics: ["Electromagnetism Formulas", "Wave Interactions", "Frictional Force vectors"], 
      recommendation: "Review textbook chapters 4 and 5; practice mock worksheets on projectile vectors." 
    },
    "Science": { 
      topics: ["Water Cycle Processes", "Human Biology Organelle", "Chemical Reaction balances"], 
      recommendation: "Focus on schematic diagrams; practice biological labeling and molecular balancing equations." 
    },
    "Mathematics": { 
      topics: ["Quadratic Equations", "Trigonometric Proofs", "Probability statistics"], 
      recommendation: "Spend 20 minutes daily on step-by-step proofs; utilize interactive graph tools for visualizations." 
    },
    "English": { 
      topics: ["Grammar Tense agreement", "Essay thesis formulation", "Critical reading passages"], 
      recommendation: "Participate in reading groups; draft weekly write-ups and submit them for peer revisions." 
    },
    "Chemistry": {
      topics: ["Stoichiometry Calculations", "Organic Reaction Mechanisms", "Acid-Base Titration"],
      recommendation: "Practice balancing chemical equations and review organic functional group properties."
    },
    "Biology": {
      topics: ["Cell Division Phases", "Genetics & Punnett Squares", "Ecosystem Energy Flow"],
      recommendation: "Draw and annotate biological diagrams to strengthen recall on multistep physiological cycles."
    },
    "Other": { 
      topics: ["Term review definitions", "Exam time allocation"], 
      recommendation: "Review weekly study guides and organize summary flashcards before assessment starts." 
    }
  };

  // IF SINGLE STUDENT IS SELECTED (DRILL-DOWN REPORT VIEW)
  if (selectedStudent) {
    const studentExams = completedAssessments.filter(a => a.studentName === selectedStudent);
    const totalScore = studentExams.reduce((sum, e) => sum + e.score, 0);
    const totalMax = studentExams.reduce((sum, e) => sum + e.maxScore, 0);
    const overallPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    
    // Subject-wise rows for this student
    const subjectRows = studentExams.map((exam) => {
      const subjectName = getSubjectNameFromExam(exam.name, exam.qpId);
      const percent = exam.percentage !== undefined ? exam.percentage : (exam.maxScore > 0 ? Math.round((exam.score / exam.maxScore) * 100) : 0);
      
      let status: "Excellent" | "Good" | "Average" | "Improvement Required" = "Average";
      if (percent >= 90) status = "Excellent";
      else if (percent >= 75) status = "Good";
      else if (percent >= 65) status = "Average";
      else status = "Improvement Required";

      return {
        subject: subjectName,
        examName: exam.name,
        date: exam.date,
        score: exam.score,
        maxScore: exam.maxScore,
        percentage: percent,
        grade: exam.grade || "F",
        status: status,
        examId: exam.id,
        record: exam,
        result: exam.result
      };
    });

    const passedSubjects = subjectRows.filter(s => s.percentage >= 50).length;
    const needImprovementCount = subjectRows.filter(s => s.percentage < 75).length;
    const strongSubjects = subjectRows.filter(s => s.percentage >= 75);
    const weakSubjects = subjectRows.filter(s => s.percentage < 75);

    let overallGrade = "F";
    if (overallPercent >= 90) overallGrade = "A+";
    else if (overallPercent >= 80) overallGrade = "A";
    else if (overallPercent >= 70) overallGrade = "B+";
    else if (overallPercent >= 60) overallGrade = "B";
    else if (overallPercent >= 50) overallGrade = "C";
    else if (overallPercent >= 40) overallGrade = "D";

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300 print:p-0 print:m-0">
        
        {/* Header controls & Export CSV + Print buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md gap-4 print:border-none print:bg-white print:text-black">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedStudent(null)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0E1322] text-slate-400 hover:text-white transition cursor-pointer print:hidden"
              title="Back to All Students Analysis"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white print:text-black tracking-tight">{selectedStudent}</h2>
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20 print:hidden">
                  Student Analysis
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600">Class: Grade 10 • Section: A • Assessments: {studentExams.length}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 print:hidden">
            {/* Print Report / PDF Button */}
            <button
              onClick={handlePrintStudentReport}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer"
              title="Print Student Report Card or Save as PDF"
            >
              <Printer className="h-4 w-4 text-violet-400" />
              <span>Print / PDF</span>
            </button>

            {/* Export CSV Button for this Student */}
            <button
              onClick={() => handleExportCsv(studentExams, `student_${selectedStudent.replace(/\s+/g, "_").toLowerCase()}_analysis`)}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md cursor-pointer ${
                exportSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20"
              }`}
            >
              {exportSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>CSV Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </>
              )}
            </button>

            {onSelectStudentProfile && (
              <button
                onClick={() => onSelectStudentProfile(selectedStudent)}
                className="flex items-center space-x-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:text-white transition cursor-pointer"
              >
                <span>Student Profile</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Numerical Stats overview */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Marks</span>
            <div className="text-lg font-black text-white">{totalScore}</div>
            <p className="text-[10px] text-slate-500">Marks scored</p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Max Marks</span>
            <div className="text-lg font-black text-white">{totalMax}</div>
            <p className="text-[10px] text-slate-500">Scale base</p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Overall %</span>
            <div className="text-lg font-black text-indigo-400">{overallPercent}%</div>
            <p className="text-[10px] text-slate-500">Weighted average</p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Overall Grade</span>
            <div className="text-lg font-black text-violet-400">{overallGrade}</div>
            <p className="text-[10px] text-slate-500">Academic scale</p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Passed</span>
            <div className="text-lg font-black text-emerald-400">{passedSubjects}</div>
            <p className="text-[10px] text-slate-500">Exams (&ge; 50%)</p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Review Required</span>
            <div className="text-lg font-black text-amber-400">{needImprovementCount}</div>
            <p className="text-[10px] text-slate-500">Exams (&lt; 75%)</p>
          </div>
        </div>

        {/* Main split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Subject-wise Results Table & Charts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span>Subject-wise & Question Results ({subjectRows.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">Real Stored Evaluation Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 uppercase tracking-wider">Subject & Exam</th>
                      <th className="py-2.5 uppercase tracking-wider text-center">Marks</th>
                      <th className="py-2.5 uppercase tracking-wider text-center">Percentage</th>
                      <th className="py-2.5 uppercase tracking-wider text-center">Grade</th>
                      <th className="py-2.5 uppercase tracking-wider text-center">Status</th>
                      <th className="py-2.5 uppercase tracking-wider text-right">Question Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {subjectRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20 transition">
                        <td className="py-3">
                          <div className="font-bold text-white">{row.subject}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{row.examName}</div>
                        </td>
                        <td className="py-3 text-center text-slate-300 font-medium">{row.score}/{row.maxScore}</td>
                        <td className="py-3 text-center text-slate-300 font-bold">{row.percentage}%</td>
                        <td className="py-3 text-center font-black text-indigo-300">{row.grade}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            row.status === "Excellent" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            row.status === "Good" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            row.status === "Average" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setViewQuestionModal(row.record)}
                            className="inline-flex items-center space-x-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Questions</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Visualizations */}
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-violet-400" />
                <span>Performance Visualizations</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Subject Performance Comparison</span>
                  <div className="space-y-3.5">
                    {subjectRows.map((row, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold text-slate-350">
                          <span>{row.subject}</span>
                          <span>{row.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#080C14] h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${
                              row.percentage >= 90 ? "from-emerald-500 to-teal-500" :
                              row.percentage >= 75 ? "from-indigo-500 to-violet-500" :
                              row.percentage >= 65 ? "from-amber-500 to-yellow-500" :
                              "from-red-500 to-pink-500"
                            }`}
                            style={{ width: `${Math.max(row.percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Performance Overview</span>
                  <div className="bg-[#0E1322]/80 border border-slate-850 p-4 rounded-2xl flex flex-col justify-center h-full space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Academic Rating</span>
                      <span className="text-white font-extrabold">{overallPercent >= 75 ? "Satisfactory Progress" : "Supervision Requested"}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 rounded-full border-4 border-slate-850 flex items-center justify-center">
                        <span className="font-extrabold text-sm text-indigo-400">{overallPercent}%</span>
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 opacity-20" />
                      </div>
                      <div className="text-[10px] text-slate-400 space-y-1">
                        <p className="font-bold text-slate-300">Grade target: 80%</p>
                        <p>Currently pacing {overallPercent >= 80 ? "above" : "below"} average benchmark.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Strengths & Weaknesses */}
          <div className="space-y-6">
            {/* Good Performance Card */}
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Good Performance (Strengths)</span>
              </h3>

              {strongSubjects.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No subjects registered scoring &ge; 75% yet.</p>
              ) : (
                <div className="space-y-4">
                  {strongSubjects.map((row, idx) => {
                    const meta = strengthFeedbackMap[row.subject] || strengthFeedbackMap["Other"];
                    return (
                      <div key={idx} className="bg-[#0A0E18] border border-slate-850 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-white text-xs">{row.subject}</span>
                          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            {row.percentage}% ({row.grade})
                          </span>
                        </div>
                        <div className="text-[10.5px] space-y-1">
                          <p className="text-slate-400 font-bold">Key Strength: <span className="text-indigo-300">{meta.strength}</span></p>
                          <p className="text-slate-400 leading-relaxed italic">"{meta.feedback}"</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Improvement Required Card */}
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Improvement Required (Weaknesses)</span>
              </h3>

              {weakSubjects.length === 0 ? (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-[10.5px] text-emerald-400 leading-relaxed text-center font-bold">
                  Excellent overall standing! No subjects require urgent interventions at this time.
                </div>
              ) : (
                <div className="space-y-4">
                  {weakSubjects.map((row, idx) => {
                    const meta = weakTopicsMap[row.subject] || weakTopicsMap["Other"];
                    return (
                      <div key={idx} className="bg-[#0A0E18] border border-slate-850 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-white text-xs">{row.subject}</span>
                          <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            {row.percentage}% ({row.grade})
                          </span>
                        </div>
                        
                        <div className="text-[10px] space-y-1">
                          <span className="block font-bold text-slate-500 uppercase">Areas to Improve:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-350">
                            {meta.topics.map((t, tIdx) => (
                              <li key={tIdx}>{t}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="text-[10px] border-t border-slate-850 pt-2 text-slate-400">
                          <span className="font-bold text-indigo-400 block">Recommended Focus:</span>
                          <p className="leading-relaxed mt-0.5 text-slate-300">{meta.recommendation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // MAIN STUDENT ANALYSIS DASHBOARD & FILTERED VIEW
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner with Title & Export CSV / Print Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Student Analysis</h2>
            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
              Live Data
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time student performance intelligence, 8-criteria multi-filter, question breakdown, and CSV/PDF export
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Print Cohort Report */}
          <button
            onClick={handlePrintStudentReport}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer"
            title="Print Full Cohort Report"
          >
            <Printer className="h-4 w-4 text-violet-400" />
            <span>Print Report</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={() => handleExportCsv(filteredAssessments)}
            disabled={filteredAssessments.length === 0}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-lg cursor-pointer ${
              exportSuccess
                ? "bg-emerald-600 text-white"
                : filteredAssessments.length === 0
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20 active:scale-98"
            }`}
            title="Export currently displayed and filtered student analysis records to CSV"
          >
            {exportSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Export Complete!</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export CSV ({filteredAssessments.length})</span>
              </>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-[#0E1322] p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "table" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "cards" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 8-Criteria Multi-Filter Bar */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs">
            <Filter className="h-4 w-4 text-indigo-400" />
            <span>8-Criteria Multi-Filter Bar</span>
            <span className="text-[10px] text-slate-500 font-normal">
              (Student, Subject, Assessment, Class, Section, Grade, Status, Date)
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[11px] text-slate-400 font-medium">
              Showing <span className="text-white font-bold">{filteredAssessments.length}</span> of <span className="text-white font-bold">{completedAssessments.length}</span> records
            </span>
            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 8 Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* 1. Student Filter */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Student</label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-2 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All ({uniqueStudentNames.length})</option>
              {uniqueStudentNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* 2. Subject Filter */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-2 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All ({uniqueSubjects.length})</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* 3. Assessment Filter */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Assessment</label>
            <select
              value={assessmentFilter}
              onChange={(e) => setAssessmentFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-2 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All ({uniqueAssessments.length})</option>
              {uniqueAssessments.map((exam) => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </div>

          {/* 4. Class Filter */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-2 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* 5. Section Filter */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-2 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>Sec {sec}</option>
              ))}
            </select>
          </div>

          {/* 6. Grade Filter */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Grade</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-2 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* 7. Performance Status Filter */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-2 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* 8. Date Range Filter */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Date Bound</label>
            <input
              type="date"
              value={dateStartFilter}
              onChange={(e) => setDateStartFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-1.5 px-2 text-xs text-white focus:border-indigo-600 focus:outline-none transition"
              title="Start Date"
            />
          </div>
        </div>

        {/* Keyword Search Input */}
        <div className="relative pt-1">
          <span className="absolute inset-y-0 left-0 pl-3 pt-1 flex items-center text-slate-500 pointer-events-none">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search by student name, subject, or assessment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-[#0A0E18] py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Aggregate Numerical Statistics from Filtered Data */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Filtered Records</span>
          <div className="text-xl font-black text-white">{filteredAssessments.length}</div>
          <p className="text-[10px] text-slate-500">{uniqueStudentsInFiltered.length} unique students</p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Marks</span>
          <div className="text-xl font-black text-white">{totalFilteredScore} / {totalFilteredMax}</div>
          <p className="text-[10px] text-slate-500">Marks accumulated</p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Average Score</span>
          <div className="text-xl font-black text-indigo-400">{avgFilteredPercent}%</div>
          <p className="text-[10px] text-slate-500">Cohort avg</p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate (&ge;50%)</span>
          <div className="text-xl font-black text-emerald-400">
            {filteredAssessments.length > 0 ? Math.round((passedAssessmentsCount / filteredAssessments.length) * 100) : 0}%
          </div>
          <p className="text-[10px] text-slate-500">{passedAssessmentsCount} assessments passed</p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Export Format</span>
          <div className="text-xl font-black text-teal-400">CSV & PDF</div>
          <p className="text-[10px] text-slate-500">Question-wise breakdown</p>
        </div>
      </div>

      {/* Main Content: Filtered Table OR Student Cards */}
      {filteredAssessments.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No Matching Data Found</h3>
            <p className="text-xs text-slate-400">
              {completedAssessments.length === 0 
                ? "No graded assessment records found. Run the grading pipeline to generate evaluation data."
                : "No records match the currently selected filter criteria. Try resetting filters."}
            </p>
          </div>
          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Filter Criteria</span>
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW WITH QUESTION-WISE DETAILS */
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl overflow-hidden font-sans">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
              <span>Filtered Student Assessments ({filteredAssessments.length})</span>
            </h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExportCsv(filteredAssessments)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrintStudentReport}
                className="text-xs text-violet-400 hover:text-violet-300 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Subject & Exam</th>
                  <th className="py-3 px-3">Class / Section</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-center">Percentage</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855">
                {filteredAssessments.map((record, index) => {
                  const subject = getSubjectNameFromExam(record.name, record.qpId);
                  const paper = papers.find((p) => p.id === record.qpId);
                  const studentClass = paper?.grade || "Grade 10";
                  const teacher = teachers.find((t) => t.subject === subject);
                  const section = teacher?.section || "A";
                  const studentIndex = uniqueStudentNames.indexOf(record.studentName);
                  const studentId = `STU_100${studentIndex >= 0 ? studentIndex + 1 : 1}`;

                  const pct = record.percentage !== undefined ? record.percentage : (record.maxScore > 0 ? Math.round((record.score / record.maxScore) * 100) : 0);
                  
                  let status = "Average";
                  if (pct >= 90) status = "Excellent";
                  else if (pct >= 75) status = "Good";
                  else if (pct >= 65) status = "Average";
                  else status = "Improvement Required";

                  return (
                    <tr key={record.id || index} className="hover:bg-slate-800/20 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{record.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{studentId}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-200">{subject}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{record.name}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        <span>{studentClass}</span> • <span className="text-slate-400">Sec {section}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-200">
                        {record.score} / {record.maxScore}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-indigo-400">
                        {pct}%
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-violet-300">
                        {record.grade || "N/A"}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          status === "Excellent" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          status === "Good" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          status === "Average" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setViewQuestionModal(record)}
                          className="inline-flex items-center space-x-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2 py-1 text-[10px] font-semibold transition cursor-pointer"
                          title="View Question-wise marks"
                        >
                          <span>Questions</span>
                        </button>
                        <button
                          onClick={() => setSelectedStudent(record.studentName)}
                          className="inline-flex items-center space-x-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/20 text-indigo-300 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          <span>Report</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueStudentsInFiltered.map((name, index) => {
            const studentExams = filteredAssessments.filter(a => a.studentName === name);
            const totalScore = studentExams.reduce((sum, e) => sum + e.score, 0);
            const totalMax = studentExams.reduce((sum, e) => sum + e.maxScore, 0);
            const avgPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
            
            let overallGrade = "F";
            if (avgPercent >= 90) overallGrade = "A+";
            else if (avgPercent >= 80) overallGrade = "A";
            else if (avgPercent >= 70) overallGrade = "B+";
            else if (avgPercent >= 60) overallGrade = "B";
            else if (avgPercent >= 50) overallGrade = "C";
            else if (avgPercent >= 40) overallGrade = "D";

            return (
              <div 
                key={name}
                onClick={() => setSelectedStudent(name)}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 p-5 space-y-4 cursor-pointer hover:shadow-lg transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">{name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">ID: STU_100{index + 1} • Grade 10-A</p>
                  </div>
                  <span className={`rounded-xl px-2.5 py-1 text-xs font-black ${
                    avgPercent >= 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    avgPercent >= 60 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {avgPercent}% ({overallGrade})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-[10.5px] border-t border-slate-850 text-slate-400">
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase font-bold">Matching Exams</span>
                    <span className="font-extrabold text-slate-200">{studentExams.length} Assessments</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase font-bold">Total Marks</span>
                    <span className="font-extrabold text-slate-200">{totalScore} / {totalMax}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportCsv(studentExams, `student_${name.replace(/\s+/g, "_").toLowerCase()}_analysis`);
                    }}
                    className="flex items-center space-x-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    <Download className="h-3 w-3" />
                    <span>CSV</span>
                  </button>
                  <button className="flex items-center space-x-1 text-[10.5px] text-indigo-400 font-bold group-hover:text-indigo-300">
                    <span>View Student Report</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Question-wise Marks Breakdown Modal */}
      {viewQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span>Question-wise Marks: {viewQuestionModal.studentName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{viewQuestionModal.name} • Score: {viewQuestionModal.score}/{viewQuestionModal.maxScore} ({viewQuestionModal.percentage}%)</p>
              </div>
              <button 
                onClick={() => setViewQuestionModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-sans">
              {viewQuestionModal.result?.questions && viewQuestionModal.result.questions.length > 0 ? (
                viewQuestionModal.result.questions.map((q, idx) => {
                  const ans = viewQuestionModal.result?.answers?.find(a => a.questionId === q.id);
                  const marksAwarded = ans ? ans.marksAwarded : 0;
                  const isFullMarks = marksAwarded === q.maxMarks;
                  const isZero = marksAwarded === 0;

                  return (
                    <div key={q.id || idx} className="rounded-xl bg-[#0E1322] border border-slate-800 p-3.5 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5 flex-1">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase">Question {q.number || idx + 1} ({q.section || "General"})</span>
                          <p className="text-xs font-semibold text-slate-200">{q.text}</p>
                        </div>
                        <span className={`rounded px-2 py-0.5 text-xs font-black shrink-0 ${
                          isFullMarks ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          isZero ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {marksAwarded} / {q.maxMarks} Marks
                        </span>
                      </div>

                      {ans?.feedback && (
                        <div className="rounded-lg bg-slate-900/60 p-2 text-[10.5px] text-slate-400 border border-slate-800/80">
                          <span className="font-bold text-slate-300">Feedback: </span>
                          <span>{ans.feedback}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Detailed question nodes not available for this record. Total score: {viewQuestionModal.score} / {viewQuestionModal.maxScore}.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setViewQuestionModal(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
