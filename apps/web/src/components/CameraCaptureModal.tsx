"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  SwitchCamera, 
  Sparkles, 
  Maximize2,
  ScanLine
} from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  subtitle?: string;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Capture Question Paper",
  subtitle = "Position the question paper clearly inside the frame and capture a high-resolution photo."
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCapturingFlash, setIsCapturingFlash] = useState<boolean>(false);
  const [error, setError] = useState<{
    title: string;
    message: string;
    type: "denied" | "not_found" | "not_readable" | "unsupported" | "generic";
  } | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<{
    dataUrl: string;
    blob: Blob;
    file: File;
  } | null>(null);

  // Stop active media stream tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string, mode?: "environment" | "user") => {
    setIsLoading(true);
    setError(null);
    setCapturedPreview(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError({
        title: "Camera API Unavailable",
        message: "Camera access is not supported on this browser or requires a secure context (HTTPS / localhost).",
        type: "unsupported"
      });
      setIsLoading(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: mode || facingMode,
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 }
            },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      // Enumerate available video devices
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevs);
        if (deviceId) {
          setSelectedDeviceId(deviceId);
        } else if (videoDevs.length > 0 && !selectedDeviceId) {
          const currentTrack = mediaStream.getVideoTracks()[0];
          const settings = currentTrack ? currentTrack.getSettings() : null;
          if (settings && settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          }
        }
      } catch (devErr) {
        console.warn("Device enumeration failed:", devErr);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errType: "denied" | "not_found" | "not_readable" | "generic" = "generic";
      let errTitle = "Camera Access Error";
      let errMessage = "Unable to connect to camera. Please check permissions and try again.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errType = "denied";
        errTitle = "Camera Permission Denied";
        errMessage = "Camera access was denied. Please allow camera permissions in your browser address bar/settings to capture question papers.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errType = "not_found";
        errTitle = "Camera Device Not Found";
        errMessage = "No camera was detected on this device. Please connect a webcam or upload a file directly.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errType = "not_readable";
        errTitle = "Camera Currently Busy";
        errMessage = "Your camera is already in use by another application or tab. Please close other camera apps and retry.";
      }

      setError({
        title: errTitle,
        message: errMessage,
        type: errType
      });
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, selectedDeviceId, stream]);

  // Effect when modal open state changes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCapturedPreview(null);
      setError(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Keep video ref playing if stream exists
  useEffect(() => {
    if (videoRef.current && stream && !capturedPreview) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, capturedPreview]);

  // Switch camera device / facing mode
  const handleSwitchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];
      setSelectedDeviceId(nextDevice.deviceId);
      startCamera(nextDevice.deviceId);
    } else {
      const nextMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(nextMode);
      startCamera(undefined, nextMode);
    }
  };

  // Capture current frame from video to canvas
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    // Trigger visual flash
    setIsCapturingFlash(true);
    setTimeout(() => setIsCapturingFlash(false), 200);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, un-mirror on capture for proper readability
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const file = new File([blob], `Question_Paper_Camera_${timestamp}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now()
        });

        setCapturedPreview({
          dataUrl,
          blob,
          file
        });
      },
      "image/jpeg",
      0.95
    );
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPreview(null);
  };

  // Confirm photo and forward to processing
  const handleConfirm = () => {
    if (capturedPreview) {
      onCapture(capturedPreview.file);
      handleModalClose();
    }
  };

  // Close modal cleanly
  const handleModalClose = () => {
    stopStream();
    setCapturedPreview(null);
    setError(null);
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleModalClose();
      } else if (e.key === " " && !capturedPreview && !isLoading && !error) {
        e.preventDefault();
        handleCapture();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, capturedPreview, isLoading, error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div 
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] bg-[#0A0E1A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
              <Camera className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {title}
                </h3>
                {!error && !capturedPreview && !isLoading && (
                  <span className="flex items-center space-x-1 rounded-full bg-emerald-950/70 border border-emerald-800/70 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                )}
                {capturedPreview && (
                  <span className="rounded-full bg-indigo-950/70 border border-indigo-800/70 px-2 py-0.5 text-[9px] font-bold text-indigo-300">
                    REVIEW PHOTO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Switch camera button (if multiple devices or live mode) */}
            {!capturedPreview && !error && !isLoading && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                title="Switch Camera Device / Lens"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            )}

            {/* Close modal */}
            <button
              type="button"
              onClick={handleModalClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 hover:text-white text-slate-400 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] bg-black flex items-center justify-center overflow-hidden">
          {/* Flash animation */}
          {isCapturingFlash && (
            <div className="absolute inset-0 bg-white z-30 opacity-90 animate-out fade-out duration-200 pointer-events-none" />
          )}

          {/* 1. Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center z-10">
              <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-300">
                Initializing camera feed...
              </p>
              <p className="text-[10px] text-slate-500 max-w-xs">
                Please allow browser camera permissions if prompted
              </p>
            </div>
          )}

          {/* 2. Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-3 z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/60 border border-red-800/80 text-red-400 shadow-md">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {error.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {error.message}
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(selectedDeviceId)}
                  className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Camera</span>
                </button>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* 3. Live Video View */}
          {!error && !capturedPreview && (
            <div className={`relative w-full h-full flex items-center justify-center ${isLoading ? "hidden" : "flex"}`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full max-h-[60vh] object-contain"
              />

              {/* Document Alignment Frame Overlay */}
              <div className="absolute inset-4 sm:inset-8 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                {/* Corner bracket reticles */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg" />
                </div>

                {/* Center scan hint */}
                <div className="self-center flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-medium text-slate-300">
                  <ScanLine className="h-3 w-3 text-indigo-400 animate-pulse" />
                  <span>Align Question Paper inside border</span>
                </div>

                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />
                </div>
              </div>
            </div>
          )}

          {/* 4. Captured Photo Review Mode */}
          {capturedPreview && (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPreview.dataUrl}
                alt="Captured Question Paper"
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
              />
              <div className="absolute top-4 left-4 flex items-center space-x-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 border border-white/10 text-[10px] font-bold text-indigo-300">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span>Captured Snapshot ({Math.round(capturedPreview.file.size / 1024)} KB)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-sm shrink-0 flex items-center justify-between">
          {!capturedPreview ? (
            /* Live mode footer */
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">Space</kbd> or click shutter to take photo
              </span>

              <div className="flex items-center justify-center flex-1 sm:flex-initial">
                <button
                  type="button"
                  disabled={isLoading || !!error}
                  onClick={handleCapture}
                  className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer ring-4 ring-indigo-500/20"
                  title="Capture Question Paper"
                >
                  <Camera className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleModalClose}
                className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Review mode footer */
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-[#0E1322] hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                <span>Retake Photo</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="rounded-xl border border-slate-800 bg-transparent hover:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm & Use Question Paper</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
