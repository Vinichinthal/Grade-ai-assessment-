"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  FileUp, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Camera
} from "lucide-react";
import CameraCaptureModal from "./CameraCaptureModal";

interface UploadCardProps {
  title: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  acceptTypes?: string;
  maxSizeMB?: number;
  badge?: string;
  allowCamera?: boolean;
  onPreview?: () => void;
}

export default function UploadCard({
  title,
  description,
  file,
  onFileChange,
  acceptTypes = ".pdf,image/*",
  maxSizeMB = 25,
  badge = "Step 1",
  allowCamera = true,
  onPreview
}: UploadCardProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateFile = (selectedFile: File): boolean => {
    setError(null);

    // Validate size
    const sizeInMB = selectedFile.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      setError(`File size exceeds the ${maxSizeMB}MB limit.`);
      return false;
    }

    // Validate type
    const isPDF = selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf");
    const isImage = selectedFile.type.startsWith("image/");
    if (!isPDF && !isImage) {
      setError("Unsupported format. Please upload a PDF or an Image.");
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        onFileChange(droppedFile);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        onFileChange(selectedFile);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const isPDF = file ? (file.type === "application/pdf" || file.name.endsWith(".pdf")) : false;

  return (
    <div className="flex flex-col w-full text-slate-100">
      {/* Card Header Info */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-heading text-sm font-bold text-slate-200 tracking-tight">
              {title}
            </h3>
            {badge && (
              <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={file ? undefined : triggerFileInput}
        className={`relative flex flex-col items-center justify-center min-h-[220px] rounded-2xl border-2 transition-all duration-200 p-6 text-center ${
          file 
            ? "border-emerald-950 bg-emerald-950/10 shadow-xs cursor-default" 
            : isDragActive
            ? "border-indigo-500 bg-indigo-950/40 scale-[1.01] shadow-md"
            : "border-dashed border-slate-800 bg-[#090D16] hover:border-indigo-500 hover:bg-[#0F1423]/30 shadow-xs cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center w-full animate-in fade-in duration-300">
            {/* Status Ready Pill */}
            <div className="absolute top-3.5 right-3.5 flex items-center space-x-1.5 rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-900/60">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>READY FOR ANALYSIS</span>
            </div>

            {/* File Icon */}
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-slate-900 shadow-sm border border-slate-800 text-indigo-400 mb-3.5">
              {isPDF ? (
                <FileText className="h-7 w-7 text-indigo-400" />
              ) : (
                <ImageIcon className="h-7 w-7 text-violet-400" />
              )}
            </div>

            {/* File Info */}
            <div className="w-full max-w-[280px] mb-4">
              <p className="text-xs font-bold text-white truncate" title={file.name}>
                {file.name}
              </p>
              <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 mt-1">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="uppercase text-[9px] font-bold bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                  {isPDF ? "PDF Document" : "Image Sheet"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {onPreview && (
                <button
                  type="button"
                  onClick={onPreview}
                  className="flex items-center space-x-1.5 rounded-xl border border-indigo-900/50 bg-indigo-950/40 hover:bg-indigo-600 hover:text-white px-3 py-1.5 text-xs font-semibold text-indigo-300 transition shadow-2xs cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Preview</span>
                </button>
              )}
              <button
                type="button"
                onClick={triggerFileInput}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-350 hover:text-white transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 text-slate-500" />
                <span>Replace File</span>
              </button>
              {allowCamera && (
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center space-x-1.5 rounded-xl border border-indigo-500/30 bg-indigo-600/15 hover:bg-indigo-600/30 hover:border-indigo-500/50 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition shadow-2xs cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Retake Camera</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearFile}
                className="flex items-center space-x-1 rounded-xl border border-red-900/50 bg-red-950/20 hover:bg-red-650 hover:text-white px-3 py-1.5 text-xs font-semibold text-red-400 transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Upload prompt icon */}
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-indigo-950/50 border border-indigo-900/40 text-indigo-400 mb-3.5 shadow-2xs group-hover:scale-105 transition">
              <Upload className="h-6 w-6" />
            </div>

            <p className="text-xs font-bold text-slate-300">
              Drag & drop file or <span className="text-indigo-400 underline decoration-indigo-350 underline-offset-2 hover:text-indigo-300">browse</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports PDF, PNG, JPG or JPEG (Max {maxSizeMB}MB)
            </p>

            {allowCamera && (
              <div className="mt-3 flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                  className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 hover:text-white px-3 py-1.5 text-xs font-semibold text-slate-300 transition shadow-2xs cursor-pointer"
                >
                  <Upload className="h-3 w-3 text-slate-400" />
                  <span>Browse File</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCameraOpen(true);
                  }}
                  className="flex items-center space-x-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600/35 hover:border-indigo-500/60 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition shadow-2xs cursor-pointer group"
                >
                  <Camera className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>Use Camera</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Drag Overlay */}
        {isDragActive && !file && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-indigo-650/95 text-white border-2 border-indigo-750 z-10 animate-in fade-in duration-150">
            <FileUp className="h-10 w-10 text-white animate-bounce mb-2" />
            <p className="text-sm font-bold">Release to upload file</p>
          </div>
        )}
      </div>

      {/* Error notification */}
      {error && (
        <div className="flex items-center space-x-1.5 mt-2 text-xs font-medium text-red-450 animate-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera Capture Modal */}
      {allowCamera && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(capturedFile) => {
            if (validateFile(capturedFile)) {
              onFileChange(capturedFile);
            }
          }}
          title={`Capture ${title}`}
          subtitle={`Position your ${title.toLowerCase()} inside the frame and take a snapshot.`}
        />
      )}
    </div>
  );
}
