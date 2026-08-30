"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  User, 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  Download,
  Check
} from "lucide-react";
import { AssessmentRecord, Teacher } from "../utils/db";

interface StudentsTabProps {
  assessments: AssessmentRecord[];
  teachers: Teacher[];
}

export default function StudentsTab({ assessments, teachers }: StudentsTabProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const completedAssessments = assessments.filter(a => a.status === "Completed");
  const studentNames = Array.from(new Set(completedAssessments.map(a => a.studentName)));

  // Filter students by search
  const filteredStudents = studentNames.filter(name => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to parse subject name from exam name
  const getSubjectNameFromExam = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("physics")) return "Physics";
    if (lower.includes("math")) return "Mathematics";
    if (lower.includes("science")) return "Science";
    if (lower.includes("english")) return "English";
    return "Other";
  };

  const [exportSuccess, setExportSuccess] = useState(false);

  // CSV Export Handler
  const handleExportCsv = (recordsToExport: AssessmentRecord[], filename = "students_analysis") => {
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
      const subject = getSubjectNameFromExam(record.name);
      const teacher = teachers.find((t) => t.subject === subject);
      const studentClass = teacher?.grade || "Grade 10";
      const section = teacher?.section || "A";
      const studentIndex = studentNames.indexOf(record.studentName);
      const studentId = `STU_100${studentIndex >= 0 ? studentIndex + 1 : 1}`;

      const pct = record.percentage !== undefined ? record.percentage : (record.maxScore > 0 ? Math.round((record.score / record.maxScore) * 100) : 0);
      
      let status = "Average";
      if (pct >= 90) status = "Excellent";
      else if (pct >= 75) status = "Good";
      else if (pct >= 65) status = "Average";
      else status = "Improvement Required";

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
    link.download = `${filename}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // If a student is selected, display their detailed profile
  if (selectedStudent) {
    const studentExams = completedAssessments.filter(a => a.studentName === selectedStudent);
    const totalScore = studentExams.reduce((sum, e) => sum + e.score, 0);
    const totalMax = studentExams.reduce((sum, e) => sum + e.maxScore, 0);
    const overallPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    let overallGrade = "F";
    if (overallPercent >= 90) overallGrade = "A+";
    else if (overallPercent >= 80) overallGrade = "A";
    else if (overallPercent >= 70) overallGrade = "B+";
    else if (overallPercent >= 60) overallGrade = "B";
    else if (overallPercent >= 50) overallGrade = "C";
    else if (overallPercent >= 40) overallGrade = "D";

    // Good subjects & areas needing improvement
    const subjectDetails = studentExams.map((exam) => {
      const subjectName = getSubjectNameFromExam(exam.name);
      const percent = exam.percentage || 0;
      
      // Status threshold mapping:
      // percentage >= 90: Excellent
      // percentage >= 75: Good
      // percentage >= 65: Average
      // percentage < 65: Improvement Required
      let status: "Excellent" | "Good" | "Average" | "Improvement Required" = "Average";
      if (percent >= 90) status = "Excellent";
      else if (percent >= 75) status = "Good";
      else if (percent >= 65) status = "Average";
      else status = "Improvement Required";

      // Map teacher
      const teacherObj = teachers.find(t => t.subject === subjectName);

      return {
        subject: subjectName,
        teacher: teacherObj ? teacherObj.name : "Unassigned",
        marks: `${exam.score}/${exam.maxScore}`,
        percentage: percent,
        grade: exam.grade || "F",
        status: status,
        result: exam.result
      };
    });

    const goodPerformances = subjectDetails.filter(s => s.percentage >= 75);
    const improvements = subjectDetails.filter(s => s.percentage < 75);

    // Pre-defined topic suggestions
    const weakTopicsMap: Record<string, string[]> = {
      "Physics": ["Electromagnetism Formulas", "Wave Interactions", "Frictional Force vectors"],
      "Science": ["Water Cycle Processes", "Human Biology Organelle", "Chemical Reaction balances"],
      "Mathematics": ["Quadratic Equations", "Trigonometric Proofs", "Probability statistics"],
      "English": ["Grammar Tense agreement", "Essay thesis formulation", "Critical reading passages"],
      "Other": ["Term review definitions", "Exam time allocation"]
    };

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedStudent(null)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#0E1322] text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white tracking-tight">{selectedStudent}</h2>
                <p className="text-xs text-slate-500 font-medium">ID: STU_1001 • Class: Grade 10 • Section: A</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExportCsv(studentExams, `student_${selectedStudent.replace(/\s+/g, "_").toLowerCase()}_analysis`)}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow shadow-emerald-900/20 cursor-pointer"
            >
              {exportSuccess ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
              <span>{exportSuccess ? "Downloaded!" : "Export CSV"}</span>
            </button>
            <span className={`rounded-xl px-3 py-1.5 text-xs font-black ${
              overallPercent >= 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
              overallPercent >= 60 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
              "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              Overall Performance: {overallGrade} ({overallPercent}%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Performance List */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>Subject Performance & Assignments</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 font-bold uppercase tracking-wider">Subject</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Assigned Teacher</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Marks</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Percentage</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Grade</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855">
                  {subjectDetails.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition">
                      <td className="py-3 font-semibold text-white">{row.subject}</td>
                      <td className="py-3 text-slate-400 font-medium">{row.teacher}</td>
                      <td className="py-3 text-center text-slate-300 font-medium">{row.marks}</td>
                      <td className="py-3 text-center text-slate-300 font-bold">{row.percentage}%</td>
                      <td className="py-3 text-center font-black text-indigo-300">{row.grade}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          row.status === "Excellent" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          row.status === "Good" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          row.status === "Average" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strengths and Weakness overview */}
          <div className="space-y-6">
            {/* Strength areas */}
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Good Performance</span>
              </h3>

              {goodPerformances.length === 0 ? (
                <p className="text-slate-500 text-xs italic">No strong subjects registered (&ge; 75%).</p>
              ) : (
                <div className="space-y-3">
                  {goodPerformances.map((sub, idx) => {
                    // Dynamically map strengths if custom answers are graded
                    let strengthText = "Demonstrates high retention and excellent spatial understanding.";
                    const subResult = sub.result;
                    if (subResult && subResult.answers) {
                      const perfectScores = subResult.answers.filter(ans => {
                        if (!ans.questionId) return false;
                        const qNode = subResult.questions.find(q => q.id === ans.questionId);
                        return qNode ? ans.marksAwarded === qNode.maxMarks : false;
                      });
                      if (perfectScores.length > 0) {
                        const topText = perfectScores[0].extractedText;
                        strengthText = topText.length > 80 ? `${topText.slice(0, 80)}...` : topText;
                      }
                    }

                    return (
                      <div key={idx} className="bg-[#0A0E18] border border-slate-850 p-3.5 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-200">{sub.subject}</span>
                          <span className="text-emerald-400">{sub.percentage}% ({sub.grade})</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                          "{strengthText}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Improvement Needed */}
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Improvement Required</span>
              </h3>

              {improvements.length === 0 ? (
                <p className="text-slate-500 text-xs italic">Student is scoring well in all active subjects.</p>
              ) : (
                <div className="space-y-3">
                  {improvements.map((sub, idx) => {
                    let weakTopics = weakTopicsMap[sub.subject] || weakTopicsMap["Other"];
                    
                    const subResult = sub.result;
                    if (subResult && subResult.answers) {
                      const missedAnswers = subResult.answers.filter(ans => {
                        if (!ans.questionId) return false;
                        const qNode = subResult.questions.find(q => q.id === ans.questionId);
                        return qNode ? ans.marksAwarded < qNode.maxMarks : false;
                      });
                      if (missedAnswers.length > 0) {
                        weakTopics = missedAnswers.map(ans => {
                          const qNode = subResult.questions.find(q => q.id === ans.questionId);
                          return qNode ? qNode.text : "";
                        }).filter(Boolean).slice(0, 3);
                      }
                    }

                    return (
                      <div key={idx} className="bg-[#0A0E18] border border-slate-850 p-3.5 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-200">{sub.subject}</span>
                          <span className="text-amber-400">{sub.percentage}% ({sub.grade})</span>
                        </div>
                        <div className="text-[9.5px] text-slate-500 mt-1">
                          <span className="font-bold text-slate-450 uppercase block text-[8px]">Weak Areas:</span>
                          <ul className="list-disc pl-3.5 mt-0.5 space-y-0.5">
                            {weakTopics.slice(0, 2).map((wt, wIdx) => (
                              <li key={wIdx} className="truncate">{wt}</li>
                            ))}
                          </ul>
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

  // Student directory listing
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header and Search control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Students Directory</h2>
          <p className="text-xs text-slate-400">Manage all student profiles and link their corresponding grading assessments</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => handleExportCsv(completedAssessments, "all_students_analysis")}
            disabled={completedAssessments.length === 0}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 py-2 text-xs font-bold text-white transition shadow shadow-emerald-900/20 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {exportSuccess ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            <span>Export CSV</span>
          </button>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-650 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No Matching Students</h3>
            <p className="text-xs text-slate-400">Ensure student records exist or clear the search keywords query filter.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0A0E18] shadow-xl">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400">
                <th className="p-4 font-bold uppercase tracking-wider">Student Name</th>
                <th className="p-4 font-bold uppercase tracking-wider">ID Reference</th>
                <th className="p-4 font-bold uppercase tracking-wider">Class</th>
                <th className="p-4 font-bold uppercase tracking-wider">Assigned Section</th>
                <th className="p-4 font-bold uppercase tracking-wider text-center">Exams Passed</th>
                <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-855">
              {filteredStudents.map((name, index) => {
                const studentExams = completedAssessments.filter(a => a.studentName === name);
                const passes = studentExams.filter(e => (e.percentage || 0) >= 50).length;

                return (
                  <tr key={name} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 font-extrabold text-white">{name}</td>
                    <td className="p-4 text-slate-400 font-semibold">STU_100{index + 1}</td>
                    <td className="p-4 text-slate-350">Grade 10</td>
                    <td className="p-4 text-slate-350">A</td>
                    <td className="p-4 text-center text-slate-355 font-bold">{passes} / {studentExams.length} Passed</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(name)}
                        className="rounded-lg bg-indigo-650/10 hover:bg-indigo-650 border border-indigo-650/20 text-indigo-300 hover:text-white px-3.5 py-1.5 font-bold transition duration-150 cursor-pointer"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
