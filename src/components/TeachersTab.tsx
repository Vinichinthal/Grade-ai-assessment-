"use client";

import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  BookOpen, 
  Layers, 
  Award, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  X,
  GraduationCap
} from "lucide-react";
import { AssessmentRecord, Teacher } from "../utils/db";

interface TeachersTabProps {
  assessments: AssessmentRecord[];
  teachers: Teacher[];
  onSaveTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

export default function TeachersTab({ 
  assessments, 
  teachers, 
  onSaveTeacher, 
  onDeleteTeacher 
}: TeachersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "dashboard">("directory");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    teachers.length > 0 ? teachers[0].id : null
  );

  // Edit / Add Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("Mathematics");
  const [formGrade, setFormGrade] = useState("Grade 10");
  const [formSection, setFormSection] = useState("A");
  const [formError, setFormError] = useState<string | null>(null);

  const completedAssessments = assessments.filter(a => a.status === "Completed");

  // Helper to extract subject names from assessments
  const getSubjectNameFromExam = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("physics")) return "Physics";
    if (lower.includes("math")) return "Mathematics";
    if (lower.includes("science")) return "Science";
    if (lower.includes("english")) return "English";
    return "Other";
  };

  const getAssessmentsForSubject = (subject: string) => {
    return completedAssessments.filter(
      a => getSubjectNameFromExam(a.name) === subject
    );
  };

  // Form handlers
  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormName("");
    setFormEmail("");
    setFormSubject("Mathematics");
    setFormGrade("Grade 10");
    setFormSection("A");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormEmail(teacher.email);
    setFormSubject(teacher.subject);
    setFormGrade(teacher.grade);
    setFormSection(teacher.section);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Name field is required.");
      return;
    }
    if (!formEmail.trim() || !formEmail.includes("@")) {
      setFormError("A valid email is required.");
      return;
    }

    const teacherPayload: Teacher = {
      id: editingTeacher ? editingTeacher.id : `t_${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      subject: formSubject,
      grade: formGrade,
      section: formSection
    };

    onSaveTeacher(teacherPayload);
    setIsFormOpen(false);
    
    // Auto select if first teacher added
    if (!selectedTeacherId) {
      setSelectedTeacherId(teacherPayload.id);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Are you sure you want to remove this teacher assignment?")) {
      onDeleteTeacher(id);
      if (selectedTeacherId === id) {
        const remaining = teachers.filter(t => t.id !== id);
        setSelectedTeacherId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  // Compute teacher dashboard analytics
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) || null;
  
  let dashboardStats = {
    assignedSubjects: [] as string[],
    assignedClasses: [] as string[],
    totalStudents: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    avgClassScore: 0,
    subjectBreakdown: [] as any[]
  };

  if (selectedTeacher) {
    const teacherSubject = selectedTeacher.subject;
    const teacherGrade = selectedTeacher.grade;
    const teacherSection = selectedTeacher.section;

    dashboardStats.assignedSubjects = [teacherSubject];
    dashboardStats.assignedClasses = [`${teacherGrade}-${teacherSection}`];
    
    // Get all assessments for this subject
    const subjectExams = getAssessmentsForSubject(teacherSubject);
    dashboardStats.completedAssessments = subjectExams.length;

    // We can count pending based on answer sheets matching the assessment name pattern or simply hardcode/mock based on real metadata
    dashboardStats.pendingAssessments = assessments.filter(
      a => a.status === "Pending" && getSubjectNameFromExam(a.name) === teacherSubject
    ).length;

    const uniqueStudents = Array.from(new Set(subjectExams.map(e => e.studentName)));
    dashboardStats.totalStudents = uniqueStudents.length;

    const totalScorePercent = subjectExams.reduce((sum, e) => sum + (e.percentage || 0), 0);
    dashboardStats.avgClassScore = subjectExams.length > 0 ? Math.round(totalScorePercent / subjectExams.length) : 0;

    // For each subject, compute stats
    dashboardStats.assignedSubjects.forEach(sub => {
      const exams = getAssessmentsForSubject(sub);
      const scores = exams.map(e => e.percentage || 0);
      const avg = exams.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / exams.length) : 0;
      const highest = exams.length > 0 ? Math.max(...scores) : 0;
      const lowest = exams.length > 0 ? Math.min(...scores) : 0;
      const needImprovement = exams.filter(e => (e.percentage || 0) < 75).map(e => ({
        studentName: e.studentName,
        score: e.percentage || 0,
        grade: e.grade || "F"
      }));

      dashboardStats.subjectBreakdown.push({
        subject: sub,
        studentsCount: Array.from(new Set(exams.map(e => e.studentName))).length,
        avgScore: avg,
        highestScore: highest,
        lowestScore: lowest,
        needImprovementList: needImprovement
      });
    });
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Tab Switcher Headers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Teachers Management</h2>
          <p className="text-xs text-slate-400">Map course instructors to curriculum subjects and view performance reports</p>
        </div>

        <div className="flex bg-slate-955 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab("directory")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeSubTab === "directory"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Subject Mapping
          </button>
          <button
            onClick={() => setActiveSubTab("dashboard")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeSubTab === "dashboard"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Teacher Dashboard
          </button>
        </div>
      </div>

      {/* Directory CRUD view */}
      {activeSubTab === "directory" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Assigned Faculty Members</h3>
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition shadow shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Teacher</span>
            </button>
          </div>

          {teachers.length === 0 ? (
            <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-12 text-center max-w-md mx-auto space-y-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Teachers Assigned</h3>
                <p className="text-xs text-slate-400">Add your first teacher assignment to map grades to educators.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => (
                <div 
                  key={teacher.id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white border border-slate-850 flex items-center justify-center font-bold text-xs">
                        {teacher.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">{teacher.name}</h4>
                        <span className="inline-flex items-center text-[10px] text-slate-400 font-semibold mt-0.5">
                          <Mail className="h-3 w-3 mr-1 text-slate-500" />
                          {teacher.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-850 text-[10.5px] text-slate-400">
                    <div>
                      <span className="block text-slate-500 text-[8.5px] uppercase font-bold tracking-wider">Subject</span>
                      <span className="font-extrabold text-slate-200">{teacher.subject}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[8.5px] uppercase font-bold tracking-wider">Class & Sec</span>
                      <span className="font-extrabold text-slate-200">{teacher.grade} - {teacher.section}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-850/40">
                    <button
                      onClick={() => handleOpenEdit(teacher)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-850 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Edit Assignment"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(teacher.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-850 bg-slate-900 hover:bg-red-500/10 text-slate-450 hover:text-red-400 transition cursor-pointer"
                      title="Remove Assignment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teacher Performance Dashboard View */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Teacher Analytics Engine</h3>
            
            {teachers.length > 0 && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-bold uppercase shrink-0">Select Teacher:</span>
                <select
                  value={selectedTeacherId || ""}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-3.5 text-xs text-white focus:border-indigo-600 focus:outline-none transition cursor-pointer w-full sm:w-48"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!selectedTeacher ? (
            <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-12 text-center max-w-md mx-auto space-y-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Selected Teacher</h3>
                <p className="text-xs text-slate-400">Ensure at least one teacher assignment exists to view dashboard data.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Premium Analytics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Subject</span>
                  <div className="text-base font-extrabold text-white truncate">{selectedTeacher.subject}</div>
                  <p className="text-[10px] text-slate-500">Core focus</p>
                </div>
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Class</span>
                  <div className="text-base font-extrabold text-white">{selectedTeacher.grade}-{selectedTeacher.section}</div>
                  <p className="text-[10px] text-slate-500">Target classroom</p>
                </div>
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Students</span>
                  <div className="text-xl font-black text-white">{dashboardStats.totalStudents}</div>
                  <p className="text-[10px] text-slate-500">Unique enrollment</p>
                </div>
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Pending Tasks</span>
                  <div className="text-xl font-black text-rose-400">{dashboardStats.pendingAssessments}</div>
                  <p className="text-[10px] text-slate-500">Awaiting grading</p>
                </div>
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
                  <div className="text-xl font-black text-emerald-400">{dashboardStats.completedAssessments}</div>
                  <p className="text-[10px] text-slate-500">Graded sheets</p>
                </div>
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Avg Class Score</span>
                  <div className="text-xl font-black text-indigo-400">{dashboardStats.avgClassScore}%</div>
                  <p className="text-[10px] text-slate-500">Global average</p>
                </div>
              </div>

              {/* Subject Breakdown Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Area: Subject Stats Summary Cards */}
                <div className="lg:col-span-2 space-y-6">
                  {dashboardStats.subjectBreakdown.map((subStat, idx) => (
                    <div 
                      key={idx}
                      className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-6"
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{subStat.subject} Course Performance</h4>
                          <p className="text-[10px] text-slate-400">Classroom statistical summaries</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                      </div>

                      {/* Stat Metrics Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-[#0A0E18] p-4 rounded-2xl border border-slate-850 space-y-1">
                          <span className="text-[8.5px] font-bold text-slate-550 uppercase">Students</span>
                          <div className="text-lg font-black text-slate-200">{subStat.studentsCount}</div>
                        </div>
                        <div className="bg-[#0A0E18] p-4 rounded-2xl border border-slate-850 space-y-1">
                          <span className="text-[8.5px] font-bold text-slate-550 uppercase">Average Score</span>
                          <div className="text-lg font-black text-indigo-400">{subStat.avgScore}%</div>
                        </div>
                        <div className="bg-[#0A0E18] p-4 rounded-2xl border border-slate-850 space-y-1">
                          <span className="text-[8.5px] font-bold text-slate-550 uppercase">Highest Score</span>
                          <div className="text-lg font-black text-emerald-400">{subStat.highestScore}%</div>
                        </div>
                        <div className="bg-[#0A0E18] p-4 rounded-2xl border border-slate-850 space-y-1">
                          <span className="text-[8.5px] font-bold text-slate-550 uppercase">Lowest Score</span>
                          <div className="text-lg font-black text-rose-400">{subStat.lowestScore}%</div>
                        </div>
                      </div>

                      {/* Pure CSS graphic chart */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject Range Comparison</span>
                        <div className="w-full bg-[#070B14] rounded-xl h-10 border border-slate-850 relative flex items-center overflow-hidden">
                          {subStat.highestScore > 0 ? (
                            <>
                              <div 
                                className="absolute h-full bg-indigo-500/20 border-l border-r border-indigo-500" 
                                style={{ 
                                  left: `${subStat.lowestScore}%`, 
                                  width: `${subStat.highestScore - subStat.lowestScore}%` 
                                }}
                              />
                              <div 
                                className="absolute w-2 h-full bg-indigo-400" 
                                style={{ left: `${subStat.avgScore}%` }}
                                title={`Average: ${subStat.avgScore}%`}
                              />
                            </>
                          ) : (
                            <span className="text-slate-500 text-[10px] mx-auto italic">No test data recorded to generate ranges.</span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[8px] font-bold text-slate-500">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Area: Students Needing Improvement */}
                <div>
                  <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>Review Interventions Needed</span>
                    </h4>

                    {dashboardStats.subjectBreakdown.length === 0 || 
                     dashboardStats.subjectBreakdown.every(s => s.needImprovementList.length === 0) ? (
                      <p className="text-slate-500 text-xs italic py-4 text-center">
                        All students in this subject are scoring above the 75% threshold!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">
                          Students scoring &lt; 75% in assigned courses:
                        </span>
                        
                        {dashboardStats.subjectBreakdown.flatMap(s => s.needImprovementList).map((stu, sIdx) => (
                          <div 
                            key={sIdx} 
                            className="flex justify-between items-center bg-[#0A0E18] border border-slate-850 p-3 rounded-xl"
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-200 block">{stu.studentName}</span>
                              <span className="text-[9px] text-slate-500 font-semibold uppercase">Subject Score</span>
                            </div>
                            <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-400">
                              {stu.score}% ({stu.grade})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* CRUD Edit / Add Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-white">
                  {editingTeacher ? "Edit Teacher Assignment" : "Add Teacher Assignment"}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure details for classroom subject instruction
                </p>
              </div>
            </div>

            {formError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. John Doe"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john.doe@gradeai.edu"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-3 text-xs text-white focus:border-indigo-650 focus:outline-none transition"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Physics">Physics</option>
                    <option value="English">English</option>
                    <option value="Chemistry">Chemistry</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</label>
                    <select
                      value={formGrade}
                      onChange={(e) => setFormGrade(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-3 text-xs text-white focus:border-indigo-650 focus:outline-none transition"
                    >
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</label>
                    <select
                      value={formSection}
                      onChange={(e) => setFormSection(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-[#0E1322] py-2 px-3 text-xs text-white focus:border-indigo-650 focus:outline-none transition"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow transition cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
