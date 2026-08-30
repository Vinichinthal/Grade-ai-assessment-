"use client";

import React from "react";
import { 
  FileText, 
  CheckSquare, 
  Award, 
  Clock, 
  TrendingUp, 
  Users, 
  Percent, 
  Calendar,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Layers
} from "lucide-react";
import { AssessmentRecord } from "../utils/db";

interface DashboardOverviewProps {
  assessments: AssessmentRecord[];
  totalQpCount: number;
  totalAsCount: number;
  onViewAssessment: (id: string) => void;
}

export default function DashboardOverview({
  assessments,
  totalQpCount,
  totalAsCount,
  onViewAssessment
}: DashboardOverviewProps) {
  // Statistics Calculations
  const totalAssessments = assessments.length;
  const completedAssessments = assessments.filter(a => a.status === "Completed").length;
  const pendingAssessments = assessments.filter(a => a.status === "Pending").length;
  
  // Average Score
  const avgScorePercent = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + (a.percentage || 0), 0) / assessments.length)
    : 0;

  // Grade Breakdown for Analytics
  const gradeDistribution: Record<string, number> = { "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "D": 0, "F": 0 };
  assessments.forEach(a => {
    if (a.grade && gradeDistribution[a.grade] !== undefined) {
      gradeDistribution[a.grade]++;
    }
  });

  const recentActivity = [
    { text: "Physics Final Exam graded with score 19.5/25 (Grade B+)", time: "10 minutes ago", icon: Sparkles, color: "text-emerald-500 bg-emerald-500/10" },
    { text: "Answer Sheet student_answers.pdf uploaded for evaluation", time: "25 minutes ago", icon: CheckSquare, color: "text-indigo-500 bg-indigo-500/10" },
    { text: "Question Paper physics_final_exam.pdf compiled", time: "40 minutes ago", icon: FileText, color: "text-violet-500 bg-violet-500/10" },
    { text: "Lead Evaluator Sarah Miller workspace connected", time: "1 hour ago", icon: Users, color: "text-blue-500 bg-blue-500/10" }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-indigo-400">Dr. Sarah Miller</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            System performance active. Google Gemini API is securely proxying all evaluations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-xs text-indigo-300 font-semibold shadow-inner">
          <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <span>Gemini v3.5 Flash Engaged</span>
        </div>
      </div>

      {/* Numerical Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Assessments */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2 shadow-sm hover:border-slate-700 transition">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Assessments</span>
            <Layers className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{totalAssessments}</div>
            <div className="text-[10px] text-slate-500">Grading projects</div>
          </div>
        </div>

        {/* Question Papers */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2 shadow-sm hover:border-slate-700 transition">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Papers</span>
            <FileText className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{totalQpCount}</div>
            <div className="text-[10px] text-slate-500">Question sets</div>
          </div>
        </div>

        {/* Answer Sheets */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2 shadow-sm hover:border-slate-700 transition">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Answer Sheets</span>
            <CheckSquare className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{totalAsCount}</div>
            <div className="text-[10px] text-slate-500">Student uploads</div>
          </div>
        </div>

        {/* Completed Assessments */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2 shadow-sm hover:border-slate-700 transition">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
            <Award className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{completedAssessments}</div>
            <div className="text-[10px] text-slate-500">AI evaluated</div>
          </div>
        </div>

        {/* Average Score */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2 shadow-sm hover:border-slate-700 transition">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Score</span>
            <Percent className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{avgScorePercent}%</div>
            <div className="text-[10px] text-slate-500">Platform average</div>
          </div>
        </div>

        {/* Pending Assessments */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2 shadow-sm hover:border-slate-700 transition">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
            <Clock className="h-4 w-4 text-rose-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{pendingAssessments}</div>
            <div className="text-[10px] text-slate-500">Awaiting analysis</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Analytics & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score Overview and Distribution Charts */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Performance Distribution Overview</h3>
                <p className="text-[10px] text-slate-400">Score curve and grade distribution metrics</p>
              </div>
              <TrendingUp className="h-5 w-5 text-indigo-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Graphic Chart representation using SVG */}
              <div className="flex flex-col space-y-2 items-center bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 self-start uppercase">Score Curves</span>
                <div className="w-full h-32 flex items-end justify-between px-2 pt-4 relative">
                  {/* Grid Lines */}
                  <div className="absolute top-1/4 left-0 right-0 h-[1px] bg-slate-800/30" />
                  <div className="absolute top-2/4 left-0 right-0 h-[1px] bg-slate-800/30" />
                  <div className="absolute top-3/4 left-0 right-0 h-[1px] bg-slate-800/30" />
                  
                  {/* Curve path */}
                  <svg className="absolute inset-0 w-full h-full text-indigo-500/10 fill-indigo-500/5" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 0,90 Q 20,40 40,60 T 80,10 T 100,20 L 100,100 L 0,100 Z" fill="currentColor" />
                    <path d="M 0,90 Q 20,40 40,60 T 80,10 T 100,20" fill="none" stroke="#6366f1" strokeWidth="2.5" />
                  </svg>
                  
                  <div className="z-10 absolute bottom-2 right-2 flex items-center space-x-1 bg-indigo-500 px-2 py-0.5 rounded text-[9px] font-bold text-white">
                    <span>Performance standard deviation: 86%</span>
                  </div>
                </div>
                <div className="w-full flex justify-between px-2 text-[8.5px] font-bold text-slate-500 pt-1 border-t border-slate-800/50">
                  <span>Class Avg: 78%</span>
                  <span>Newton Physics Exam</span>
                </div>
              </div>

              {/* Grade distribution chart */}
              <div className="flex flex-col space-y-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Grade Distribution</span>
                <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                  {Object.entries(gradeDistribution).map(([gradeLabel, count]) => {
                    const maxCount = Math.max(...Object.values(gradeDistribution), 1);
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={gradeLabel} className="flex items-center text-[10.5px]">
                        <span className="w-6 font-bold text-indigo-400">{gradeLabel}</span>
                        <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden mx-2.5">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded" 
                            style={{ width: `${Math.max(pct, count > 0 ? 10 : 0)}%` }} 
                          />
                        </div>
                        <span className="w-4 text-right text-slate-400 font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Assessments Section */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Recent Assessments Log</h3>
                <p className="text-[10px] text-slate-400">Review evaluation status for student submissions</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">Assessment Name</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Student</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3 text-center">Grade</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {assessments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        No assessments recorded. Click Assessments tab to upload and grade your first sheet.
                      </td>
                    </tr>
                  ) : (
                    assessments.map((a) => (
                      <tr key={a.id} className="group hover:bg-slate-800/20 transition">
                        <td className="py-3.5 pl-2 font-bold text-white group-hover:text-indigo-400 transition">
                          {a.name}
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {new Date(a.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-300">
                          {a.studentName}
                        </td>
                        <td className="py-3.5 text-center font-bold text-indigo-400">
                          {a.score} / {a.maxScore}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 font-extrabold text-[10px] text-indigo-300">
                            {a.grade}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            a.status === "Completed" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${a.status === "Completed" ? "bg-emerald-400" : "bg-amber-400"}`} />
                            <span>{a.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            onClick={() => onViewAssessment(a.id)}
                            className="inline-flex items-center space-x-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/20 text-indigo-300 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                          >
                            <span>View Results</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Activity Sidebar */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Recent Activity Feed</h3>
                <p className="text-[10px] text-slate-400">Workspace event stream</p>
              </div>
              <Activity className="h-4.5 w-4.5 text-slate-400" />
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, idx) => {
                const Icon = activity.icon;
                return (
                  <div key={idx} className="flex space-x-3 text-[11px] items-start">
                    <div className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg border border-slate-800 ${activity.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-slate-300 leading-normal">{activity.text}</p>
                      <p className="text-[9.5px] text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight">System Configuration</h3>
            <div className="rounded-2xl bg-indigo-600/10 border border-indigo-600/20 p-4 text-[11.5px] text-indigo-300 space-y-2.5">
              <div className="flex items-center space-x-1.5 font-bold text-indigo-200">
                <Sparkles className="h-4 w-4" />
                <span>Active Model: Gemini 3.5 Flash</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                Evaluations are compiled using advanced optical layout mapping and zero-shot reasoning. Grading is direct, secure, and fully aligned with the syllabus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
