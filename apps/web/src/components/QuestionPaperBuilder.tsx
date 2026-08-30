"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  Sparkles, 
  Copy, 
  ArrowDown, 
  ArrowUp, 
  BookOpen, 
  FolderPlus, 
  Database,
  ArrowRight,
  Edit,
  Grid,
  FileText
} from "lucide-react";
import { 
  BuilderQuestion, 
  QuestionPaperMetadata, 
  BankQuestion, 
  getBankQuestions, 
  saveCustomTemplate,
  DEFAULT_TEMPLATES,
  QPTemplate
} from "../utils/db";
import QuestionBankTab from "./QuestionBankTab";

interface QuestionPaperBuilderProps {
  initialData?: Partial<QuestionPaperMetadata>;
  onCreatePaper: (paper: QuestionPaperMetadata) => void;
  onCancel: () => void;
}

export default function QuestionPaperBuilder({
  initialData,
  onCreatePaper,
  onCancel
}: QuestionPaperBuilderProps) {
  // Metadata fields
  const [subject, setSubject] = useState(initialData?.subject || "Physics");
  const [grade, setGrade] = useState(initialData?.grade || "Grade 11");
  const [examType, setExamType] = useState(initialData?.examType || "Mid Term");
  const [examName, setExamName] = useState(initialData?.name || "Mid-Term Physics Exam");
  const [duration, setDuration] = useState(initialData?.duration || "2 Hours");
  const [maxMarks, setMaxMarks] = useState(initialData?.maxMarks || 25);
  const [instructions, setInstructions] = useState<string[]>(
    initialData?.instructions || [
      "All questions are compulsory.",
      "Write your answers clearly with appropriate question numbering.",
      "Draw diagrams wherever necessary."
    ]
  );

  // List of sections
  const [sections, setSections] = useState<string[]>(["Section A", "Section B", "Section C"]);
  const [newSectionName, setNewSectionName] = useState("");

  // List of questions
  const [questions, setQuestions] = useState<BuilderQuestion[]>(
    initialData?.questions || [
      { id: "q_1", number: "1", text: "State Newton's first law of motion.", type: "Short Answer", marks: 2, section: "Section A" },
      { id: "q_2", number: "2", text: "Explain the difference between speed and velocity with examples.", type: "Short Answer", marks: 3, section: "Section A" },
      { id: "q_3a", number: "3(a)", text: "Define kinetic energy and state its SI unit.", type: "Short Answer", marks: 2, section: "Section B" },
      { id: "q_3b", number: "3(b)", text: "Calculate the kinetic energy of a 2kg mass moving at a velocity of 5m/s.", type: "Match the Following", marks: 3, section: "Section B" },
      { id: "q_4", number: "4", text: "Discuss the law of conservation of momentum and describe one real-world application.", type: "Long Answer", marks: 5, section: "Section B" },
      { id: "q_5", number: "5", text: "Describe an experiment to measure gravity (g) using a simple pendulum. List two key sources of error.", type: "Descriptive", marks: 10, section: "Section C" }
    ]
  );

  // Temporary state for adding a new question
  const [qNumber, setQNumber] = useState("");
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<BuilderQuestion["type"]>("Short Answer");
  const [qMarks, setQMarks] = useState(2);
  const [qSection, setQSection] = useState("Section A");
  const [qIsOptional, setQIsOptional] = useState(false);
  const [qParentId, setQParentId] = useState<string | null>(null);

  // Editing state
  const [editingQId, setEditingQId] = useState<string | null>(null);

  // Auto calculate max marks toggle
  const [autoCalcMarks, setAutoCalcMarks] = useState(true);

  // Instructions editing states
  const [newInstruction, setNewInstruction] = useState("");
  const [editingInstructionIndex, setEditingInstructionIndex] = useState<number | null>(null);
  const [editingInstructionText, setEditingInstructionText] = useState("");

  // Question Bank import state
  const [showBankImport, setShowBankImport] = useState(false);

  // Preview Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Update total marks dynamically based on question weights
  useEffect(() => {
    if (autoCalcMarks) {
      const sum = questions.reduce((acc, q) => acc + q.marks, 0);
      setMaxMarks(sum);
    }
  }, [questions, autoCalcMarks]);

  // Section Managers
  const handleAddSection = () => {
    if (newSectionName.trim() && !sections.includes(newSectionName.trim())) {
      setSections([...sections, newSectionName.trim()]);
      setNewSectionName("");
    }
  };

  const handleRemoveSection = (section: string) => {
    setSections(sections.filter(s => s !== section));
    // Re-assign questions from removed section to first section
    setQuestions(questions.map(q => q.section === section ? { ...q, section: sections[0] || "Section A" } : q));
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const reordered = [...sections];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    setSections(reordered);
  };

  // Instruction Managers
  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      setInstructions([...instructions, newInstruction.trim()]);
      setNewInstruction("");
    }
  };

  const handleEditInstruction = (index: number) => {
    setEditingInstructionIndex(index);
    setEditingInstructionText(instructions[index]);
  };

  const handleSaveInstruction = () => {
    if (editingInstructionIndex !== null && editingInstructionText.trim()) {
      const updated = [...instructions];
      updated[editingInstructionIndex] = editingInstructionText.trim();
      setInstructions(updated);
      setEditingInstructionIndex(null);
      setEditingInstructionText("");
    }
  };

  const handleDeleteInstruction = (index: number) => {
    setInstructions(instructions.filter((_, idx) => idx !== index));
  };

  const handleMoveInstruction = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= instructions.length) return;

    const reordered = [...instructions];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    setInstructions(reordered);
  };

  // Question Managers
  const handleAddQuestion = () => {
    if (!qText.trim()) return;

    const nextNum = qNumber.trim() || `${questions.length + 1}`;

    if (editingQId) {
      // Modify existing question
      setQuestions(questions.map(q => q.id === editingQId ? {
        ...q,
        number: nextNum,
        text: qText.trim(),
        type: qType,
        marks: qMarks,
        section: qSection,
        isOptional: qIsOptional
      } : q));
      setEditingQId(null);
      setQParentId(null);
    } else {
      // Create new question
      const newQ: BuilderQuestion = {
        id: `q_${Date.now()}`,
        number: nextNum,
        text: qText.trim(),
        type: qType,
        marks: qMarks,
        section: qSection,
        isOptional: qIsOptional,
        parentId: qParentId || undefined
      };

      if (qParentId) {
        // Insert sub-question directly after parent or last sub-question of parent
        const parentIndex = questions.findIndex(x => x.id === qParentId);
        let insertIndex = parentIndex;
        for (let i = parentIndex + 1; i < questions.length; i++) {
          if (questions[i].parentId === qParentId) {
            insertIndex = i;
          } else {
            break;
          }
        }
        const updated = [...questions];
        updated.splice(insertIndex + 1, 0, newQ);
        setQuestions(updated);
      } else {
        setQuestions([...questions, newQ]);
      }
    }

    setQNumber("");
    setQText("");
    setQIsOptional(false);
    setQParentId(null);
  };

  const handleStartEditQuestion = (q: BuilderQuestion) => {
    setEditingQId(q.id);
    setQNumber(q.number);
    setQText(q.text);
    setQType(q.type);
    setQMarks(q.marks);
    setQSection(q.section);
    setQIsOptional(!!q.isOptional);
    setQParentId(q.parentId || null);
  };

  const handleAddSubQuestionTrigger = (parent: BuilderQuestion) => {
    setQSection(parent.section);

    // Auto-generate child numbering label
    const siblings = questions.filter(q => q.parentId === parent.id);
    let nextSubNumber = `${parent.number}(a)`;
    if (siblings.length > 0) {
      const lastSibling = siblings[siblings.length - 1];
      const match = lastSibling.number.match(/\(([a-z])\)/);
      if (match) {
        const nextChar = String.fromCharCode(match[1].charCodeAt(0) + 1);
        nextSubNumber = `${parent.number}(${nextChar})`;
      }
    }

    setQNumber(nextSubNumber);
    setQText("");
    setQType("Short Answer");
    setQMarks(1); // default sub-question weight
    setQIsOptional(false);
    setQParentId(parent.id);
    setEditingQId(null);
  };

  const handleDeleteQuestion = (id: string) => {
    // Delete this question, and also its sub-questions if it's a parent
    setQuestions(questions.filter(q => q.id !== id && q.parentId !== id));
  };

  const handleDuplicateQuestion = (q: BuilderQuestion) => {
    const duplicated: BuilderQuestion = {
      ...q,
      id: `q_dup_${Date.now()}`,
      number: `${q.number} (Copy)`,
      parentId: undefined // duplicated question becomes a top-level copy
    };

    // Insert duplicated question right after the source question
    const srcIndex = questions.findIndex(x => x.id === q.id);
    const updated = [...questions];
    updated.splice(srcIndex + 1, 0, duplicated);
    setQuestions(updated);
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const reordered = [...questions];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    setQuestions(reordered);
  };

  const handleImportQuestionsFromBank = (selectedQs: BankQuestion[]) => {
    const imported: BuilderQuestion[] = selectedQs.map((bq, idx) => ({
      id: `q_imported_${bq.id}_${Date.now()}_${idx}`,
      number: `${questions.length + idx + 1}`,
      text: bq.question,
      type: bq.type as BuilderQuestion["type"],
      marks: bq.marks,
      section: sections[0] || "Section A"
    }));

    setQuestions([...questions, ...imported]);
    setShowBankImport(false);
  };

  // Save current paper configuration as a custom template
  const handleSaveAsTemplate = () => {
    const newTemplate = {
      id: `template_${Date.now()}`,
      name: `${examName} Template`,
      subject,
      grade,
      examType,
      duration,
      maxMarks,
      instructions,
      questions
    };
    saveCustomTemplate(newTemplate);
    alert("Question Paper structure successfully saved to custom Templates catalog!");
  };

  const handleCreatePaper = () => {
    if (!examName.trim()) {
      alert("Please enter an Exam Name.");
      return;
    }
    const metadata: QuestionPaperMetadata = {
      id: `qp_builder_${Date.now()}`,
      name: `${examName}.pdf`, // Save with pdf extension to fit Assessments pipeline search
      uploadDate: new Date().toISOString(),
      type: "builder",
      pages: Math.ceil(questions.length / 3) || 1,
      status: "Ready",
      subject,
      grade,
      examType,
      duration,
      maxMarks,
      instructions,
      questions
    };
    onCreatePaper(metadata);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Question Paper Builder</h2>
            <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-300 uppercase">Interactive</span>
          </div>
          <p className="text-xs text-slate-400">Design custom exam sheets, structure sections, and reuse question bank banks</p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={handleSaveAsTemplate}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save as Template</span>
          </button>
          
          <button
            onClick={handleCreatePaper}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white hover:from-indigo-700 hover:to-violet-700 shadow-md transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Create Question Paper</span>
          </button>
          
          <button
            onClick={onCancel}
            className="text-xs font-bold text-slate-400 hover:text-white px-2.5"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata & Section Config */}
        <div className="space-y-6">
          {/* Metadata Parameters */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4 shadow-xl backdrop-blur-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>Exam Metadata</span>
            </h3>

            <div className="space-y-3 text-xs">
              {/* Preset Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Load Template Layout</label>
                <select
                  value=""
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId) {
                      const tpl = DEFAULT_TEMPLATES.find(t => t.id === selectedId);
                      if (tpl) {
                        setSubject(tpl.subject);
                        setGrade(tpl.grade);
                        setExamType(tpl.examType);
                        setExamName(tpl.name);
                        setDuration(tpl.duration);
                        setInstructions(tpl.instructions);
                        setQuestions(tpl.questions);
                        
                        const uniqueSections = Array.from(new Set(tpl.questions.map(q => q.section)));
                        if (uniqueSections.length > 0) {
                          setSections(uniqueSections);
                        }
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Load Preset Template --</option>
                  {DEFAULT_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.questions.length} Qs)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade/Class</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Name</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Mid Term">Mid Term</option>
                    <option value="Final">Final</option>
                    <option value="Practice">Practice</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none"
                  />
                </div>
              </div>

              {/* Editable Maximum Marks */}
              <div className="space-y-2 rounded-xl bg-slate-950/45 p-3 border border-slate-800/80">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Maximum Marks</span>
                  <div className="flex items-center space-x-1 text-[9px] font-medium lowercase">
                    <input
                      type="checkbox"
                      id="auto-calc"
                      checked={autoCalcMarks}
                      onChange={(e) => setAutoCalcMarks(e.target.checked)}
                      className="h-3 w-3 rounded border-slate-800 bg-[#0E1322] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="auto-calc" className="cursor-pointer">Auto-calculate ({questions.reduce((sum, q) => sum + q.marks, 0)} marks)</label>
                  </div>
                </div>
                <input
                  type="number"
                  value={maxMarks}
                  disabled={autoCalcMarks}
                  onChange={(e) => setMaxMarks(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-xs text-white focus:border-indigo-650 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Sections Manager */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4 shadow-xl backdrop-blur-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
              <Grid className="h-4 w-4 text-violet-400" />
              <span>Section Management</span>
            </h3>

            <div className="space-y-3">
              {/* Add New Section input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="New Section (e.g. Section D)"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-650 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* List of Sections with delete & reorder */}
              <div className="space-y-1.5 pt-1">
                {sections.map((section, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#0E1322]/80 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200">
                    <span className="font-semibold">{section}</span>
                    <div className="flex items-center space-x-1 shrink-0 bg-[#0A0E18] border border-slate-800 rounded p-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"
                        title="Move Section Up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, "down")}
                        disabled={idx === sections.length - 1}
                        className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"
                        title="Move Section Down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(section)}
                          className="p-0.5 text-slate-500 hover:text-red-400 transition"
                          title="Remove section and re-allocate questions"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions Manager */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4 shadow-xl backdrop-blur-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
              <FileText className="h-4 w-4 text-amber-400" />
              <span>Exam Instructions</span>
            </h3>

            <div className="space-y-3">
              {/* Add New Instruction input */}
              <div className="flex flex-col space-y-2">
                <textarea
                  placeholder="Enter a new exam instruction..."
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-650 focus:outline-none min-h-[60px]"
                />
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="w-full bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl py-2 text-xs font-bold transition cursor-pointer"
                >
                  Add Instruction
                </button>
              </div>

              {/* List of Instructions */}
              <div className="space-y-2 pt-1">
                {instructions.map((ins, idx) => (
                  <div key={idx} className="bg-[#0E1322]/80 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 flex flex-col space-y-2">
                    {editingInstructionIndex === idx ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingInstructionText}
                          onChange={(e) => setEditingInstructionText(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-[#0A0E18] p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingInstructionIndex(null)}
                            className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveInstruction}
                            className="bg-indigo-600 hover:bg-indigo-750 text-white rounded px-2.5 py-1 text-[10px] font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start space-x-2">
                        <span className="font-medium text-slate-350 flex-1 leading-relaxed">{idx + 1}. {ins}</span>
                        <div className="flex items-center space-x-1 shrink-0 bg-[#0A0E18] border border-slate-800 rounded p-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveInstruction(idx, "up")}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveInstruction(idx, "down")}
                            disabled={idx === instructions.length - 1}
                            className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditInstruction(idx)}
                            className="p-0.5 text-slate-500 hover:text-indigo-400"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInstruction(idx)}
                            className="p-0.5 text-slate-500 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Designer Layout / Questions Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Question Composer */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4 shadow-xl backdrop-blur-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                <span>Question Composer</span>
              </h3>
              
              <button
                onClick={() => setShowBankImport(true)}
                className="flex items-center space-x-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/20 text-indigo-300 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
              >
                <Database className="h-3 w-3" />
                <span>Import from Bank</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 3(a)"
                    value={qNumber}
                    onChange={(e) => setQNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as BuilderQuestion["type"])}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
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

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marks weight</label>
                  <input
                    type="number"
                    value={qMarks}
                    min={1}
                    max={25}
                    onChange={(e) => setQMarks(parseInt(e.target.value) || 2)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section Location</label>
                  <select
                    value={qSection}
                    onChange={(e) => setQSection(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white focus:border-indigo-650 focus:outline-none cursor-pointer"
                  >
                    {sections.map((sec, idx) => (
                      <option key={idx} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <input
                    type="checkbox"
                    id="optional-checkbox"
                    checked={qIsOptional}
                    onChange={(e) => setQIsOptional(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-850 bg-[#0E1322] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer animate-in fade-in"
                  />
                  <label htmlFor="optional-checkbox" className="ml-2 text-slate-400 cursor-pointer select-none">
                    Mark as Optional question
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Prompt Text</label>
                <textarea
                  placeholder="Enter the question text here..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-[#0E1322] py-2 px-3 text-white placeholder-slate-600 focus:border-indigo-650 focus:outline-none min-h-[60px]"
                />
              </div>

              {qParentId && (
                <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/20 px-3 py-2 text-[10px] text-indigo-300 flex justify-between items-center animate-in fade-in">
                  <span>Adding sub-question under <strong>Q{questions.find(q => q.id === qParentId)?.number}</strong></span>
                  <button
                    type="button"
                    onClick={() => setQParentId(null)}
                    className="text-slate-400 hover:text-white font-bold"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="flex space-x-2">
                {editingQId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQId(null);
                      setQNumber("");
                      setQText("");
                      setQIsOptional(false);
                      setQParentId(null);
                    }}
                    className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 font-bold text-slate-350 transition cursor-pointer text-center"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="flex-2 flex items-center justify-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 font-bold text-white shadow-lg shadow-indigo-600/10 cursor-pointer transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>{editingQId ? "Update Question" : "Add Question to Exam Sheet"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Exam Sheet Outline List */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xs space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Eye className="h-4 w-4 text-indigo-400" />
                <span>Exam Sheet Outline</span>
              </h3>
              
              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center space-x-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-650 border border-indigo-600/20 text-indigo-300 hover:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
              >
                <Eye className="h-3 w-3" />
                <span>Preview Layout</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                No questions added to the exam sheet outline yet. Use the composer above or import from Question Bank.
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((sectionName) => {
                  const sectionQs = questions.filter(q => q.section === sectionName);
                  return (
                     <div key={sectionName} className="space-y-2.5 animate-in fade-in">
                       <h4 className="text-xs font-bold text-indigo-400 border-b border-slate-800/80 pb-1.5 flex justify-between items-center">
                         <span>{sectionName}</span>
                         <span className="text-[10px] text-slate-500 font-semibold uppercase">
                           {sectionQs.reduce((sum, q) => sum + q.marks, 0)} Marks Total
                         </span>
                       </h4>

                       <div className="space-y-2">
                         {sectionQs.length === 0 ? (
                           <div className="pl-3 py-2 text-slate-600 text-[10px] italic">No questions allocated in this section.</div>
                         ) : (
                           sectionQs.map((q) => {
                             const mainIndex = questions.findIndex(x => x.id === q.id);
                             const isSub = !!q.parentId;
                             return (
                               <div 
                                 key={q.id} 
                                 className={`group flex justify-between items-start bg-[#0E1322]/80 border border-slate-850 hover:border-slate-700 rounded-2xl p-3 text-xs leading-normal animate-in fade-in transition-all duration-200 ${
                                   isSub ? "ml-8 border-l-2 border-indigo-500/30 pl-4 bg-[#0A0D16]/40" : ""
                                 }`}
                               >
                                 <div className="space-y-1 min-w-0 pr-4 flex-1">
                                   <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                     <span className="font-extrabold text-white text-[11.5px] tracking-wide shrink-0">Q{q.number}.</span>
                                     <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 font-bold text-[8.5px] text-indigo-300 uppercase shrink-0">
                                       {q.type}
                                     </span>
                                     {q.isOptional && (
                                       <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 font-bold text-[8.5px] text-amber-300 uppercase shrink-0">
                                         Optional
                                       </span>
                                     )}
                                     <span className="text-[9.5px] text-slate-500 font-semibold">[{q.marks} marks]</span>
                                     
                                     {/* Inline Section Changer Dropdown */}
                                     <span className="text-[9.5px] text-slate-500 font-semibold">• Section:</span>
                                     <select
                                       value={q.section}
                                       onChange={(e) => {
                                         const nextSection = e.target.value;
                                         setQuestions(questions.map(x => x.id === q.id ? { ...x, section: nextSection } : x));
                                       }}
                                       className="rounded bg-[#0A0E18] border border-slate-800 text-[9px] text-slate-400 px-1 py-0.2 focus:outline-none cursor-pointer"
                                     >
                                       {sections.map((sec, sIdx) => (
                                         <option key={sIdx} value={sec}>{sec}</option>
                                       ))}
                                     </select>
                                   </div>
                                   <p className="text-slate-300 font-medium break-words leading-relaxed">{q.text}</p>
                                 </div>

                                 <div className="flex items-center space-x-1 border border-slate-800 bg-[#0A0E18] rounded-lg p-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition">
                                   <button
                                     type="button"
                                     onClick={() => handleMoveQuestion(mainIndex, "up")}
                                     disabled={mainIndex === 0}
                                     className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                     title="Move Up"
                                   >
                                     <ArrowUp className="h-3 w-3" />
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => handleMoveQuestion(mainIndex, "down")}
                                     disabled={mainIndex === questions.length - 1}
                                     className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                     title="Move Down"
                                   >
                                     <ArrowDown className="h-3 w-3" />
                                   </button>
                                   {!isSub && (
                                     <button
                                       type="button"
                                       onClick={() => handleAddSubQuestionTrigger(q)}
                                       className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded"
                                       title="Add Sub-Question (e.g. 1(a))"
                                     >
                                       <Plus className="h-3.5 w-3.5" />
                                     </button>
                                   )}
                                   <button
                                     type="button"
                                     onClick={() => handleStartEditQuestion(q)}
                                     className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded"
                                     title="Edit Question"
                                   >
                                     <Edit className="h-3.5 w-3.5" />
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => handleDuplicateQuestion(q)}
                                     className="p-1 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded"
                                     title="Duplicate Question"
                                   >
                                     <Copy className="h-3 w-3" />
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => handleDeleteQuestion(q.id)}
                                     className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded"
                                     title="Delete"
                                   >
                                     <Trash2 className="h-3 w-3" />
                                   </button>
                                 </div>
                               </div>
                             );
                           })
                         )}
                       </div>
                     </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Question Bank Import Popover/Modal */}
      {showBankImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Database className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Import Reusable Question Catalog</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Use search and filters to find and select questions to import</p>
              </div>
              
              <button 
                onClick={() => setShowBankImport(false)}
                className="flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-350 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <QuestionBankTab onAddToBuilder={handleImportQuestionsFromBank} />
            </div>
          </div>
        </div>
      )}

      {/* Exam Paper Print Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4 shrink-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Eye className="h-4.5 w-4.5 text-indigo-400" />
                <span>Question Paper Print Preview</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs text-white font-bold transition cursor-pointer"
                >
                  <span>Print / Save PDF</span>
                </button>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-950 p-6 rounded-2xl border border-slate-850">
              {/* Exam Printout Formatted Structure */}
              <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-slate-100 text-xs font-serif leading-relaxed select-text shadow-xl">
                <div className="text-center border-b-2 border-slate-700 pb-4 space-y-1 font-sans">
                  <h3 className="text-lg font-extrabold tracking-wider uppercase text-white">{examName || "EXAMINATION PAPER"}</h3>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex flex-wrap justify-center gap-3">
                    <span>Subject: {subject}</span>
                    <span>•</span>
                    <span>Class: {grade}</span>
                    <span>•</span>
                    <span>Exam: {examType}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex flex-wrap justify-center gap-3">
                    <span>Duration: {duration}</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-extrabold">Max Marks: {maxMarks}</span>
                  </div>
                </div>

                {instructions.length > 0 && (
                  <div className="border-b border-slate-800 pb-4 space-y-1.5 font-sans">
                    <span className="block text-[10px] font-extrabold text-slate-355 uppercase tracking-wider">Instructions:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[10.5px]">
                      {instructions.map((ins, idx) => (
                        <li key={idx}>{ins}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="space-y-6">
                  {sections.map((sectionName) => {
                    const sectionQs = questions.filter(q => q.section === sectionName);
                    return (
                      <div key={sectionName} className="space-y-3.5">
                        <h4 className="font-sans text-xs font-extrabold text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                          {sectionName}
                        </h4>
                        <div className="space-y-4">
                          {sectionQs.map(q => {
                            const isSub = !!q.parentId;
                            return (
                              <div 
                                key={q.id} 
                                className={`flex justify-between items-start ${isSub ? "ml-6 pl-4 border-l border-slate-800" : ""}`}
                              >
                                <div className="space-y-1 min-w-0 pr-4">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-sans font-extrabold text-white text-[11px]">Q{q.number}.</span>
                                    <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1 py-0.2 font-sans font-bold text-[8px] text-indigo-300 uppercase shrink-0">
                                      {q.type}
                                    </span>
                                    {q.isOptional && (
                                      <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 font-sans font-bold text-[8px] text-amber-300 uppercase shrink-0">
                                        Optional
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-serif leading-relaxed text-[11.5px]">{q.text}</p>
                                </div>
                                <span className="font-sans font-bold text-[10.5px] text-indigo-400 shrink-0">[{q.marks} Marks]</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
