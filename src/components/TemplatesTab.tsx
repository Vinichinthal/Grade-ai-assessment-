"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  FileSpreadsheet, 
  Copy, 
  Bookmark, 
  Check, 
  Plus
} from "lucide-react";
import { 
  QPTemplate, 
  getCustomTemplates, 
  deleteCustomTemplate,
  BuilderQuestion,
  DEFAULT_TEMPLATES
} from "../utils/db";

interface TemplatesTabProps {
  onSelectTemplate: (template: QPTemplate) => void;
}

export default function TemplatesTab({ onSelectTemplate }: TemplatesTabProps) {
  const [customTemplates, setCustomTemplates] = useState<QPTemplate[]>([]);

  const defaultTemplates = DEFAULT_TEMPLATES;

  const loadCustomTemplates = () => {
    setCustomTemplates(getCustomTemplates());
  };

  useEffect(() => {
    loadCustomTemplates();
  }, []);

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this custom template?")) {
      deleteCustomTemplate(id);
      loadCustomTemplates();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Templates Description Hero */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md space-y-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Bookmark className="h-4.5 w-4.5 text-indigo-400" />
          <span>Professional Exam Templates</span>
        </h3>
        <p className="text-xs text-slate-400">Choose a default template structure or customize it in the Question Paper Builder to accelerate layout creation.</p>
      </div>

      {/* Templates Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Built-in Standard Templates */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest pl-2 flex items-center space-x-1.5">
            <span>Built-in Layouts</span>
          </h4>

          <div className="space-y-4">
            {defaultTemplates.map((tpl) => (
              <div 
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl)}
                className="group relative bg-[#0E1322]/80 hover:bg-[#0E1322] border border-slate-850 hover:border-slate-700 rounded-3xl p-5 cursor-pointer shadow-sm hover:shadow-lg transition duration-200 animate-in fade-in"
              >
                {/* Visual badge indicator */}
                <div className="absolute top-4 right-4 flex items-center space-x-1">
                  <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-300 uppercase">
                    {tpl.examType}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1 pr-16">
                    <h5 className="text-sm font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">{tpl.name}</h5>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span>{tpl.subject}</span>
                      <span>•</span>
                      <span>{tpl.grade}</span>
                      <span>•</span>
                      <span>{tpl.duration}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-900 border border-slate-800/80 p-3 flex justify-between items-center text-slate-400">
                    <div>
                      Questions: <strong className="text-white">{tpl.questions.length} items</strong>
                    </div>
                    <div>
                      Marks: <strong className="text-indigo-400">{tpl.maxMarks} Max</strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span>Customize Layout</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Saved Templates */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest pl-2 flex items-center space-x-1.5">
            <span>Your Custom Templates</span>
          </h4>

          {customTemplates.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs font-medium bg-slate-900/10">
              No custom saved templates found. Create a structure in the Paper Builder and save it as a template.
            </div>
          ) : (
            <div className="space-y-4">
              {customTemplates.map((tpl) => (
                <div 
                  key={tpl.id}
                  onClick={() => onSelectTemplate(tpl)}
                  className="group relative bg-[#0E1322]/80 hover:bg-[#0E1322] border border-slate-850 hover:border-slate-700 rounded-3xl p-5 cursor-pointer shadow-sm hover:shadow-lg transition duration-200 animate-in fade-in"
                >
                  <div className="absolute top-4 right-4 flex items-center space-x-1.5">
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 uppercase">
                      Custom
                    </span>
                    <button
                      onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition"
                      title="Delete Custom Template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1 pr-20">
                      <h5 className="text-sm font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">{tpl.name}</h5>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                        <span>{tpl.subject}</span>
                        <span>•</span>
                        <span>{tpl.grade}</span>
                        <span>•</span>
                        <span>{tpl.duration}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900 border border-slate-800/80 p-3 flex justify-between items-center text-slate-400">
                      <div>
                        Questions: <strong className="text-white">{tpl.questions.length} items</strong>
                      </div>
                      <div>
                        Marks: <strong className="text-emerald-400">{tpl.maxMarks} Max</strong>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                        <span>Load Layout</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
