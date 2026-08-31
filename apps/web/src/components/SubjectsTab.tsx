"use client";

import React, { useState } from "react";
import { 
  Book, 
  ArrowLeft, 
  Users, 
  Award,
  ChevronRight
} from "lucide-react";
import { AssessmentRecord, Teacher } from "../utils/db";

interface SubjectsTabProps {
  assessments: AssessmentRecord[];
  teachers: Teacher[];
}

export default function SubjectsTab({ assessments, teachers }: SubjectsTabProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const completedAssessments = assessments.filter(a => a.status === "Completed");

  // Helper to parse subject name from exam name
  const getSubjectNameFromExam = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("physics")) return "Physics";
    if (lower.includes("math")) return "Mathematics";
    if (lower.includes("science")) return "Science";
    if (lower.includes("english")) return "English";
    return "Other";
  };

  // Group assessments by subject
  const subjectsMap: Record<string, AssessmentRecord[]> = {};
  completedAssessments.forEach(exam => {
    const sub = getSubjectNameFromExam(exam.name);
    if (!subjectsMap[sub]) {
      subjectsMap[sub] = [];
    }
    subjectsMap[sub].push(exam);
  });

  const subjectNames = Object.keys(subjectsMap);

  // If a subject is selected, show details
  if (selectedSubject) {
    const subjectExams = subjectsMap[selectedSubject] || [];
    const totalScore = subjectExams.reduce((sum, e) => sum + e.score, 0);
    const totalMax = subjectExams.reduce((sum, e) => sum + e.maxScore, 0);
    const avgPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    
    // Map assigned teacher
    const teacherObj = teachers.find(t => t.subject === selectedSubject);
    const teacherName = teacherObj ? teacherObj.name : "Unassigned";

    // Grade distribution counts
    const gradeDistribution: Record<string, number> = { "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "D": 0, "F": 0 };
    subjectExams.forEach(e => {
      if (e.grade && gradeDistribution[e.grade] !== undefined) {
        gradeDistribution[e.grade]++;
      }
    });

    // Student performance rows
    const studentRows = subjectExams.map(e => {
      const pct = e.percentage || 0;
      
      // Status thresholds mapping:
      // percentage >= 90: Excellent
      // percentage >= 75: Good
      // percentage >= 65: Average
      // percentage < 65: Improvement Required
      let status: "Excellent" | "Good" | "Average" | "Improvement Required" = "Average";
      if (pct >= 90) status = "Excellent";
      else if (pct >= 75) status = "Good";
      else if (pct >= 65) status = "Average";
      else status = "Improvement Required";

      return {
        studentName: e.studentName,
        marks: `${e.score}/${e.maxScore}`,
        percentage: pct,
        grade: e.grade || "F",
        status: status
      };
    });

    const averageMarkVal = studentRows.length > 0 ? (subjectExams.reduce((sum, e) => sum + e.score, 0) / studentRows.length).toFixed(1) : "0";

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedSubject(null)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#0E1322] text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedSubject} Performance</h2>
              <p className="text-xs text-slate-400">Class: Grade 10 • Assigned Teacher: {teacherName}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Metric overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Students Enrolled</span>
            <div className="text-lg font-black text-white">{studentRows.length}</div>
            <p className="text-[10px] text-slate-500">Graded submissions</p>
          </div>
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Class Average Mark</span>
            <div className="text-lg font-black text-white">{averageMarkVal}</div>
            <p className="text-[10px] text-slate-500">Scale index out of {subjectExams[0]?.maxScore || 100}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Class Average %</span>
            <div className="text-lg font-black text-indigo-400">{avgPercent}%</div>
            <p className="text-[10px] text-slate-500">Global performance</p>
          </div>
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Review Status</span>
            <div className={`text-lg font-black ${avgPercent >= 75 ? "text-emerald-450" : "text-amber-450"}`}>
              {avgPercent >= 75 ? "On Track" : "Action Needed"}
            </div>
            <p className="text-[10px] text-slate-500">Pacing evaluation</p>
          </div>
        </div>

        {/* Details and Grade distributions splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student list table */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <span>Student Performance Table</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 font-bold uppercase tracking-wider">Student Name</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Marks</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Percentage</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Grade</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855">
                  {studentRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition">
                      <td className="py-3 font-semibold text-white">{row.studentName}</td>
                      <td className="py-3 text-center text-slate-350">{row.marks}</td>
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

          {/* Grade distribution charts */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
              <Award className="h-4 w-4 text-violet-400" />
              <span>Grade Distribution</span>
            </h3>

            <div className="space-y-4 pt-2">
              {Object.keys(gradeDistribution).map((gr) => {
                const count = gradeDistribution[gr];
                const total = studentRows.length;
                const ratio = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={gr} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300 font-semibold">
                      <span>Grade {gr}</span>
                      <span>{count} Students ({ratio}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className="h-full rounded-full bg-indigo-650"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // General subjects directory view
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Subjects Panel</h2>
          <p className="text-xs text-slate-400">Monitor academic performance indicators and student scores across curriculum subjects</p>
        </div>
      </div>

      {subjectNames.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Book className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No Subjects Tracked</h3>
            <p className="text-xs text-slate-400">Run some assessments grading queries to initialize performance outcomes.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectNames.map((subjectName) => {
            const subjectExams = subjectsMap[subjectName] || [];
            const totalScore = subjectExams.reduce((sum, e) => sum + e.score, 0);
            const totalMax = subjectExams.reduce((sum, e) => sum + e.maxScore, 0);
            const avgPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
            
            // Teacher name
            const teacherObj = teachers.find(t => t.subject === subjectName);
            const teacherName = teacherObj ? teacherObj.name : "Unassigned";

            return (
              <div 
                key={subjectName}
                onClick={() => setSelectedSubject(subjectName)}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 p-5 space-y-4 cursor-pointer hover:shadow-lg transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">{subjectName}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">Teacher: {teacherName}</p>
                  </div>
                  <span className={`rounded-xl px-2.5 py-1 text-xs font-black ${
                    avgPercent >= 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    avgPercent >= 60 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {avgPercent}% Avg
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-855 text-[10.5px] text-slate-400">
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase font-bold">Total Graded</span>
                    <span className="font-extrabold text-slate-200">{subjectExams.length} Submissions</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase font-bold">Class Level</span>
                    <span className="font-extrabold text-slate-200">Grade 10-A</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button className="flex items-center space-x-1 text-[10.5px] text-indigo-400 font-bold group-hover:text-indigo-300 font-bold">
                    <span>Performance Analytics</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
