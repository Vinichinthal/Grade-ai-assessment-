"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Sparkles,
  Database,
  ArrowRight,
  Bookmark,
  BookOpen,
  Tag
} from "lucide-react";
import { 
  BankQuestion, 
  getBankQuestions, 
  saveBankQuestion, 
  deleteBankQuestion 
} from "../utils/db";

interface QuestionBankTabProps {
  onAddToBuilder?: (questions: BankQuestion[]) => void;
}

export default function QuestionBankTab({ onAddToBuilder }: QuestionBankTabProps) {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");

  // Add question state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);

  // Form Fields
  const [subject, setSubject] = useState("Physics");
  const [chapter, setChapter] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [difficulty, setDifficulty] = useState<BankQuestion["difficulty"]>("Medium");
  const [type, setType] = useState("Short Answer");
  const [marks, setMarks] = useState(3);
  const [tagsInput, setTagsInput] = useState("");

  // Select state for multi-action
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadQuestions = () => {
    setQuestions(getBankQuestions());
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // Filter calculations
  const subjects = Array.from(new Set(questions.map((q) => q.subject)));
  const chapters = Array.from(new Set(questions.filter(q => !filterSubject || q.subject === filterSubject).map((q) => q.chapter)));

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !filterSubject || q.subject === filterSubject;
    const matchesChapter = !filterChapter || q.chapter === filterChapter;
    const matchesDifficulty = !filterDifficulty || q.difficulty === filterDifficulty;

    return matchesSearch && matchesSubject && matchesChapter && matchesDifficulty;
  });

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !chapter.trim()) {
      alert("Please fill in the Question and Chapter details.");
      return;
    }

    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const newQuestion: BankQuestion = {
      id: editingQuestion?.id || `bq_${Date.now()}`,
      subject,
      chapter: chapter.trim(),
      question: questionText.trim(),
      difficulty,
      type,
      marks,
      tags
    };

    saveBankQuestion(newQuestion);
    loadQuestions();
    resetForm();
  };

  const handleEditQuestion = (q: BankQuestion) => {
    setEditingQuestion(q);
    setSubject(q.subject);
    setChapter(q.chapter);
    setQuestionText(q.question);
    setDifficulty(q.difficulty);
    setType(q.type);
    setMarks(q.marks);
    setTagsInput(q.tags.join(", "));
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this question from the bank?")) {
      deleteBankQuestion(id);
      loadQuestions();
      const next = new Set(selectedIds);
      next.delete(id);
      setSelectedIds(next);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setChapter("");
    setQuestionText("");
    setTagsInput("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Catalog Filter Controls */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search questions by keyword or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-850 bg-[#0E1322] text-xs text-white placeholder-slate-500 focus:border-indigo-650 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:from-indigo-700 hover:to-violet-700 shadow-md transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddForm ? "View Catalog" : "Add Bank Question"}</span>
            </button>

            {onAddToBuilder && selectedIds.size > 0 && (
              <button
                onClick={() => {
                  const toAdd = questions.filter((q) => selectedIds.has(q.id));
                  onAddToBuilder(toAdd);
                  setSelectedIds(new Set());
                }}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                <span>Add Selected ({selectedIds.size})</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Filter</label>
            <select
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setFilterChapter("");
              }}
              className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic / Chapter</label>
            <select
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value)}
              className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
            >
              <option value="">All Chapters</option>
              {chapters.map((chap, idx) => (
                <option key={idx} value={chap}>{chap}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Panel */}
      {showAddForm && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs animate-in slide-in-from-top duration-300">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2 mb-4">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>{editingQuestion ? "Edit Bank Question" : "Create New Bank Question"}</span>
          </h3>

          <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2.5 px-3 text-white focus:border-indigo-650 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chapter / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Gravity and Motion"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2.5 px-3 text-white focus:border-indigo-650 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marks</label>
                  <input
                    type="number"
                    value={marks}
                    min={1}
                    max={25}
                    onChange={(e) => setMarks(parseInt(e.target.value) || 2)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2.5 px-3 text-white focus:border-indigo-650 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as BankQuestion["difficulty"])}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2.5 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2.5 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
                  >
                    <option value="Short Answer">Short Answer</option>
                    <option value="Long Answer">Long Answer</option>
                    <option value="MCQ">MCQ</option>
                    <option value="True/False">True / False</option>
                    <option value="Fill in the Blank">Fill in the Blank</option>
                    <option value="Match the Following">Match the Following</option>
                    <option value="Descriptive">Descriptive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Gravity, Newton, Laws"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2.5 px-3 text-white focus:border-indigo-650 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Prompt Text</label>
              <textarea
                placeholder="Write the complete question details here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2.5 px-3 text-white placeholder-slate-650 focus:border-indigo-650 focus:outline-none min-h-[80px]"
              />
            </div>

            <div className="flex space-x-2 justify-end pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-750 px-4 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                {editingQuestion ? "Update Question" : "Save to Bank"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Catalog Directory */}
      <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs text-xs space-y-4">
        
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-medium">
            No bank questions match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">
                  <th className="py-3 px-2 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredQuestions.length > 0 && selectedIds.size === filteredQuestions.length}
                      className="h-4 w-4 rounded border-slate-850 bg-[#0E1322] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">Question Prompt</th>
                  <th className="py-3 px-3">Subject & Topic</th>
                  <th className="py-3 px-3">Difficulty</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-3 w-20">Weight</th>
                  <th className="py-3 px-3 w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredQuestions.map((q) => {
                  const isSelected = selectedIds.has(q.id);
                  return (
                    <tr key={q.id} className={`hover:bg-slate-900/35 transition ${isSelected ? "bg-indigo-950/20" : ""}`}>
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(q.id)}
                          className="h-4 w-4 rounded border-slate-850 bg-[#0E1322] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 pr-6 font-medium text-slate-200">
                        <div className="space-y-1">
                          <p className="line-clamp-2" title={q.question}>{q.question}</p>
                          <div className="flex flex-wrap gap-1">
                            {q.tags.map((tag, idx) => (
                              <span key={idx} className="flex items-center space-x-0.5 text-[8.5px] font-semibold text-slate-450 bg-[#0A0E18] border border-slate-800 px-1 py-0.2 rounded">
                                <Tag className="h-2 w-2" />
                                <span>{tag}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        <span className="font-bold text-slate-350 block">{q.subject}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{q.chapter}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block rounded-full px-2 py-0.2 font-extrabold text-[8.5px] uppercase tracking-wider ${
                          q.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-550/20" :
                          q.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-550/20" :
                          "bg-red-500/10 text-red-400 border border-red-550/20"
                        }`}>{q.difficulty}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded font-bold text-slate-350">{q.type}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-indigo-400">{q.marks} Marks</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex justify-center space-x-1.5">
                          <button
                            onClick={() => handleEditQuestion(q)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                            title="Edit question parameters"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition"
                            title="Delete question"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
