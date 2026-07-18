/**
 * InterviewPage — AIRA-powered AI mock interview.
 *
 * Layout:
 *  [Top Bar] — Timer | Progress | Status | End Button
 *  [Main Content]
 *    LEFT  (30%) — Candidate camera feed + Live vision analysis metrics
 *    CENTER(40%) — AIRA avatar + question text
 *    RIGHT (30%) — Question info + tips + transcription status
 *  [Bottom Bar] — Live caption bar (when listening)
 *
 * Flow:
 *  Step 1 — SETUP:  Enter job title + paste resume
 *  Step 2 — READY:  "Start Interview" button (full-screen AIRA)
 *  Step 3 — ACTIVE: Timer + dynamic AIRA questioning
 *  Step 4 — REPORT: navigate("/reports")
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { AIRAAvatar } from "@/components/avatar/AIRAAvatar";
import { useAutoInterviewSession } from "@/hooks/useAutoInterviewSession";
import { useResumeList } from "@/hooks/useResume";
import { apiClient } from "@/lib/axios";
import type { GeneratedQuestion } from "@/services/interview";
import type { VisionMetrics } from "@/types/interview";

// ---------------------------------------------------------------------------
// Browser compat
// ---------------------------------------------------------------------------

const SPEECH_SUPPORTED =
  typeof window !== "undefined" &&
  !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

// ---------------------------------------------------------------------------
// CountdownTimer
// ---------------------------------------------------------------------------

function CountdownTimer({ seconds, running }: { seconds: number; running: boolean }) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const isCritical = seconds <= 30 && running;
  const isLow      = seconds <= 60 && running;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-sm font-bold transition-all ${
      isCritical ? "bg-red-500/15 border-red-500/50 text-red-400" :
      isLow      ? "bg-amber-500/15 border-amber-500/40 text-amber-300" :
      running    ? "bg-violet-500/15 border-violet-500/40 text-violet-200" :
                   "bg-slate-800/50 border-white/10 text-slate-500"
    }`}>
      {/* Blinking dot shows timer is LIVE */}
      {running && (
        <motion.span
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`w-2 h-2 rounded-full shrink-0 ${
            isCritical ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-violet-400"
          }`}
        />
      )}
      <span className="material-symbols-outlined text-sm">timer</span>
      {mins}:{secs}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LiveVisionPanel — candidate camera + real-time metrics
// ---------------------------------------------------------------------------

interface LiveVisionPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  liveMetrics: VisionMetrics;
  isActive: boolean;
  permGranted: boolean;
}

function LiveVisionPanel({ videoRef, liveMetrics, isActive, permGranted }: LiveVisionPanelProps) {
  const metrics = [
    {
      label: "Eye Contact",
      value: liveMetrics?.eye_contact_percent ?? 0,
      icon: "visibility",
      good: 70,
      color: "violet",
    },
    {
      label: "Attention",
      value: liveMetrics?.attention_percent ?? 0,
      icon: "psychology",
      good: 65,
      color: "blue",
    },
    {
      label: "Confidence",
      value: liveMetrics?.confidence ?? 0,
      icon: "emoji_emotions",
      good: 60,
      color: "emerald",
    },
    {
      label: "Face Presence",
      value: liveMetrics?.face_presence_percent ?? 0,
      icon: "accessibility_new",
      good: 65,
      color: "amber",
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Camera feed */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900/80 border border-white/8 aspect-video shrink-0">
        {permGranted ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
            <span className="material-symbols-outlined text-3xl">videocam_off</span>
            <span className="text-xs font-mono">Camera not available</span>
          </div>
        )}

        {/* Camera overlay badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
          <motion.div
            animate={{ opacity: isActive ? [1, 0.3, 1] : 1 }}
            transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
            className={`w-2 h-2 rounded-full ${isActive ? "bg-red-500" : "bg-slate-600"}`}
          />
          <span className="text-[10px] font-mono text-white/70">
            {isActive ? "LIVE" : "PAUSED"}
          </span>
        </div>

        {/* Candidate label */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
          <span className="text-[10px] font-mono text-white/70">You</span>
        </div>
      </div>

      {/* Live analysis metrics */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-violet-400 text-sm">analytics</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Live Analysis
          </span>
          {isActive && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
            />
          )}
        </div>

        {metrics.map(({ label, value, icon, good, color }) => {
          const pct = Math.min(Math.round(value), 100);
          const isGood = pct >= good;
          const colorMap: Record<string, string> = {
            violet:  "bg-violet-400",
            blue:    "bg-blue-400",
            emerald: "bg-emerald-400",
            amber:   "bg-amber-400",
          };
          const barColor = colorMap[color] ?? "bg-violet-400";
          const textColor = isGood ? "text-emerald-400" : pct > 40 ? "text-amber-400" : "text-red-400";

          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-500 text-sm">{icon}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{label}</span>
                </div>
                <span className={`text-[11px] font-bold font-mono ${textColor}`}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${barColor} ${isActive ? "opacity-100" : "opacity-30"}`}
                />
              </div>
            </div>
          );
        })}

        {!isActive && (
          <p className="text-[10px] text-slate-600 font-mono text-center pt-1">
            Analysis active during listening
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SetupScreen
// ---------------------------------------------------------------------------

interface SetupProps {
  onReady: (jobTitle: string, resumeText: string, jobDesc: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  permGranted: boolean;
  permError: string | null;
}

function SetupScreen({ onReady, videoRef, permGranted, permError }: SetupProps) {
  const [resumeText,     setResumeText]     = useState("");
  const [jobDesc,        setJobDesc]        = useState("");
  const [jobTitle,       setJobTitle]       = useState("");
  const [error,          setError]          = useState<string | null>(null);
  const [resumeLoading,  setResumeLoading]  = useState(false);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-fetch the user's latest resume from the Resume section
  const { data: resumeList } = useResumeList();
  useEffect(() => {
    const resumes = resumeList?.resumes;
    if (!resumes || resumes.length === 0 || resumeText) return;
    // Use the most recently uploaded resume
    const latest = resumes.sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )[0];
    setResumeLoading(true);
    setResumeFilename(latest.original_filename);
    apiClient
      .get<{ text: string }>(`/resumes/${latest.id}/text`)
      .then((res) => {
        if (res.data?.text) setResumeText(res.data.text);
      })
      .catch(() => { /* silently ignore — user can paste manually */ })
      .finally(() => setResumeLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeList]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.type === "application/pdf") {
      setError("PDF detected — please copy-paste your resume text into the box below.");
      return;
    }
    const text = await file.text();
    setResumeText(text);
  };

  const handleReady = () => {
    if (!jobTitle.trim()) { setError("Please enter the job title."); return; }
    onReady(jobTitle.trim(), resumeText.trim(), jobDesc.trim());
  };

  return (
    <div className="min-h-screen bg-[#080C18] text-white flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/6 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="w-full bg-slate-900/70 backdrop-blur-xl border-b border-white/8 px-8 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-violet-400 text-sm">psychology</span>
        </div>
        <span className="font-bold text-white">SmartHire AI</span>
        <span className="text-slate-500 text-sm ml-2">· Interview Setup</span>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-8 py-10 grid grid-cols-12 gap-8">
        {/* Left — form */}
        <div className="col-span-7 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Let's prepare your interview</h1>
            <p className="text-sm text-slate-400">
              AIRA will generate <strong className="text-white">5 personalised questions</strong> based on
              your resume and role. Each question adapts based on your previous answers.
            </p>
          </div>

          {/* Camera permission */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-mono ${
            permGranted
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
              : permError
              ? "bg-red-500/5 border-red-500/20 text-red-400"
              : "bg-amber-500/5 border-amber-500/20 text-amber-400"
          }`}>
            <span className="material-symbols-outlined text-sm">
              {permGranted ? "videocam" : permError ? "videocam_off" : "videocam"}
            </span>
            {permGranted
              ? "Camera & microphone ready"
              : permError
              ? `Camera error: ${permError}`
              : "Requesting camera & microphone…"}
            {permGranted && (
              <div className="ml-auto w-16 h-12 rounded-lg overflow-hidden border border-white/10 bg-black">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              </div>
            )}
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-violet-400 text-sm">work</span>
              Job Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReady()}
              placeholder="e.g. Senior Software Engineer, Product Manager…"
              className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>

          {/* Resume */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 text-sm">description</span>
              Resume / CV
              <span className="text-slate-500 font-normal">(optional but recommended)</span>
              {resumeLoading && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="material-symbols-outlined text-sm">progress_activity</motion.span>
                  Fetching resume…
                </span>
              )}
              {resumeFilename && !resumeLoading && resumeText && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {resumeFilename}
                </span>
              )}
            </label>
            <div
              className="border border-dashed border-white/15 rounded-xl p-4 cursor-pointer hover:border-violet-500/30 transition-all bg-slate-800/20 group"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-500 group-hover:text-violet-400 transition-colors">upload_file</span>
                <span className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">
                  {resumeText ? "✓ Resume loaded — click to replace" : "Upload resume (.txt, .pdf)"}
                </span>
              </div>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Or paste your resume text here…"
              rows={5}
              className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-xs text-slate-300 placeholder-slate-600 font-mono resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>

          {/* Job Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 text-sm">article</span>
              Job Description
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description here for more targeted questions…"
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReady}
            disabled={!jobTitle.trim()}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-base">arrow_forward</span>
            Proceed to Interview
          </motion.button>
        </div>

        {/* Right — AIRA + instructions */}
        <div className="col-span-5 flex flex-col items-center gap-5 pt-8">
          <AIRAAvatar state="greeting" />
          <div className="text-center">
            <p className="text-sm font-bold text-white">AIRA</p>
            <p className="text-xs text-slate-400">AI Recruitment Assistant</p>
          </div>
          <div className="w-full p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">What to expect</p>
            {[
              ["auto_awesome", "Questions generated dynamically — no pre-loading"],
              ["psychology",   "AIRA adapts each question based on your answer"],
              ["record_voice_over", "AIRA reads each question aloud via voice"],
              ["mic",          "Speak naturally — 2.5s silence auto-submits"],
              ["analytics",    "Live eye contact, posture & confidence analysis"],
              ["timer",        "10 minutes total · 5 personalised questions"],
            ].map(([icon, text]) => (
              <div key={icon} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="material-symbols-outlined text-violet-400/70 text-sm">{icon}</span>
                {text}
              </div>
            ))}
          </div>
          {!SPEECH_SUPPORTED && (
            <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">warning</span>
              Speech recognition requires Chrome or Edge.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main InterviewPage
// ---------------------------------------------------------------------------

export function InterviewPage() {
  const navigate = useNavigate();

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permGranted,  setPermGranted]  = useState(false);
  const [permError,    setPermError]    = useState<string | null>(null);
  const [seedQ1,       setSeedQ1]       = useState<GeneratedQuestion | null>(null);
  const [jobTitle,     setJobTitle]     = useState("");
  const [resumeText,   setResumeText]   = useState("");
  const [jobDesc,      setJobDesc]      = useState("");
  const [hasSetup,     setHasSetup]     = useState(false);
  const [hasStarted,   setHasStarted]   = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const candidateName = localStorage.getItem("candidate_name") ?? "Candidate";

  // Request camera + mic on mount
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: true })
      .then((s) => {
        streamRef.current = s;
        setPermGranted(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.muted = true;
        }
      })
      .catch((err) => {
        setPermError(err.message ?? "Permission denied");
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const {
    session,
    isVisionReady,
    isListening,
    liveMetrics,
    isSpeaking,
    startInterview,
    endInterviewEarly,
  } = useAutoInterviewSession(
    videoRef as React.RefObject<HTMLVideoElement | null>,
    seedQ1,
    streamRef,
  );

  // Setup complete
  const handleSetupReady = useCallback(
    (jt: string, rt: string, jd: string) => {
      setJobTitle(jt);
      setResumeText(rt);
      setJobDesc(jd);
      setSeedQ1(null);
      setHasSetup(true);
    },
    []
  );

  // Start interview
  const handleStart = useCallback(() => {
    if (!permGranted) return;
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
    }
    setHasStarted(true);
    void startInterview(
      candidateName, jobTitle, resumeText, jobDesc,
      (report) => navigate("/reports", { state: { report: report ?? undefined } })
    );
  }, [permGranted, startInterview, candidateName, jobTitle, resumeText, jobDesc, navigate]);

  const handleEndEarly = useCallback(async () => {
    setShowEndModal(false);
    const report = await endInterviewEarly();
    navigate("/reports", { state: { report: report ?? undefined } });
  }, [endInterviewEarly, navigate]);

  // Step 1: Setup
  if (!hasSetup) {
    return (
      <SetupScreen
        onReady={handleSetupReady}
        videoRef={videoRef}
        permGranted={permGranted}
        permError={permError}
      />
    );
  }

  // Step 2 & 3: Full-screen interview
  const currentQ    = session.currentQuestion ?? session.questions[session.currentIndex];
  const totalQ      = 5;
  const liveCaption = session.liveCaption;
  const visionActive = session.phase === "listening";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#060912] text-white overflow-hidden"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-600/4 rounded-full blur-3xl" />
      </div>

      {/* ── Top Bar ── */}
      <header className="relative z-10 shrink-0 w-full bg-black/30 backdrop-blur-xl border-b border-white/6 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Brand + job */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-violet-400 text-sm">psychology</span>
            </div>
            <div>
              <span className="text-sm font-bold text-white">SmartHire AI</span>
              <span className="text-slate-500 text-xs ml-2 font-mono">· {jobTitle}</span>
            </div>
          </div>

          {/* Progress dots */}
          {hasStarted && (
            <div className="flex items-center gap-2">
              {Array.from({ length: totalQ }).map((_, i) => {
                const done   = i < session.results.length;
                const active = i === session.currentIndex && hasStarted;
                const score  = session.results[i]?.result?.overall_score;
                return (
                  <motion.div
                    key={i}
                    animate={{ scale: active ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 1, repeat: active ? Infinity : 0 }}
                    className={`rounded-full transition-all ${
                      done
                        ? score! >= 65
                          ? "w-3 h-3 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                          : "w-3 h-3 bg-amber-400"
                        : active
                        ? "w-3 h-3 bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]"
                        : "w-2 h-2 bg-slate-700"
                    }`}
                  />
                );
              })}
              <span className="text-xs text-slate-500 font-mono ml-1">
                {session.results.length}/{totalQ}
              </span>
            </div>
          )}

          {/* Status + Timer + End */}
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {session.phase === "listening" && (
                <motion.span key="rec"
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/8 px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Recording
                </motion.span>
              )}
              {isSpeaking && session.phase !== "listening" && (
                <motion.span key="spk"
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-violet-400 bg-violet-500/8 px-3 py-1 rounded-full border border-violet-500/20 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />AIRA Speaking
                </motion.span>
              )}
              {(session.phase === "processing" || session.phase === "generating_question") && (
                <motion.span key="proc"
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-amber-400 bg-amber-500/8 px-3 py-1 rounded-full border border-amber-500/20 text-xs font-mono">
                  <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                  {session.phase === "generating_question" ? "Thinking…" : "Analysing…"}
                </motion.span>
              )}
            </AnimatePresence>

            <CountdownTimer seconds={session.timeRemainingSec} running={hasStarted} />

            {hasStarted && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowEndModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold hover:bg-red-500/15 transition-all"
              >
                <span className="material-symbols-outlined text-sm">call_end</span>
                End
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main 3-column layout ── */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-0 overflow-hidden">

        {/* LEFT — Camera + Live Vision Analysis */}
        <aside className="col-span-3 flex flex-col p-4 border-r border-white/5 overflow-hidden">
          <LiveVisionPanel
            videoRef={videoRef}
            liveMetrics={liveMetrics}
            isActive={visionActive}
            permGranted={permGranted}
          />
        </aside>

        {/* CENTER — AIRA + Question */}
        <section className="col-span-6 flex flex-col items-center justify-center px-6 overflow-hidden">
          <motion.div
            animate={{ y: hasStarted ? 0 : [0, -8, 0] }}
            transition={hasStarted ? {} : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-4"
          >
            <AIRAAvatar state={session.airaState} />

            {/* AIRA speaking indicator */}
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-violet-400"
              />
              <span className="text-sm font-semibold text-violet-300 tracking-wide">AIRA</span>
              {isSpeaking && (
                <div className="flex items-center gap-0.5 ml-1">
                  {[0, 0.1, 0.2].map((d, i) => (
                    <motion.div key={i} className="w-1 h-3 bg-violet-400/60 rounded-full"
                      animate={{ scaleY: [1, 2.5, 1] }}
                      transition={{ duration: 0.4, delay: d, repeat: Infinity }} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Question text */}
          <AnimatePresence mode="wait">
            {currentQ && hasStarted && (
              <motion.div
                key={currentQ.text.slice(0, 40)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="mt-6 max-w-xl w-full text-center px-4"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-500/30" />
                  <span className="text-[11px] font-bold text-violet-400/80 uppercase tracking-widest font-mono">
                    Question {session.currentIndex + 1} of {totalQ}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-500/30" />
                </div>
                <p className="text-lg font-semibold text-white leading-relaxed tracking-tight">
                  "{currentQ.text}"
                </p>
                {currentQ.category && (
                  <span className="mt-3 inline-block px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[11px] text-violet-300/80 font-mono">
                    {currentQ.category}
                  </span>
                )}
              </motion.div>
            )}

            {/* Pre-start */}
            {!hasStarted && (
              <motion.div
                key="prestart"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 w-full max-w-sm"
              >
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-violet-500/20 backdrop-blur text-center space-y-4">
                  <p className="text-sm text-slate-400 leading-relaxed">
                    AIRA will generate each question <strong className="text-white">dynamically</strong>,
                    adapting to your previous answers in real time.
                  </p>

                  {!SPEECH_SUPPORTED && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2 text-left">
                      <span className="material-symbols-outlined text-sm shrink-0">warning</span>
                      Speech recognition requires Chrome or Edge.
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    disabled={!permGranted || !SPEECH_SUPPORTED}
                    id="start-interview-btn"
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-base rounded-xl shadow-xl shadow-violet-500/30 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">play_circle</span>
                    Start Interview with AIRA
                  </motion.button>

                  {!permGranted && (
                    <p className="text-xs text-amber-400">
                      Camera & microphone permission required
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {session.error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono text-center"
              >
                {session.error}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* RIGHT — Interview info + transcription status */}
        <aside className="col-span-3 flex flex-col p-4 border-l border-white/5 gap-4 overflow-y-auto">
          {/* Session info */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/6 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Session</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Candidate</span>
                <span className="text-white font-semibold">{candidateName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Role</span>
                <span className="text-white font-semibold truncate max-w-[120px]">{jobTitle}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Answered</span>
                <span className="text-white font-semibold">{session.results.length} / {totalQ}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Vision AI</span>
                <span className={`font-semibold ${isVisionReady ? "text-emerald-400" : "text-amber-400"}`}>
                  {isVisionReady ? "Ready" : "Loading…"}
                </span>
              </div>
            </div>
          </div>

          {/* Tip card */}
          {currentQ?.tip && hasStarted && (
            <motion.div
              key={currentQ.tip}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/15 space-y-2"
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-violet-400 text-sm">lightbulb</span>
                <span className="text-[10px] font-bold text-violet-400/80 uppercase tracking-wider font-mono">Tip</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{currentQ.tip}</p>
            </motion.div>
          )}

          {/* Instructions */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">How it works</p>
            {[
              ["mic", "Speak clearly into your microphone"],
              ["timer", "2.5s of silence auto-submits your answer"],
              ["replay", 'Say "repeat" to re-hear the question'],
              ["auto_awesome", "AIRA adapts each question to your answers"],
            ].map(([icon, text]) => (
              <div key={icon} className="flex items-start gap-2 text-[11px] text-slate-500">
                <span className="material-symbols-outlined text-slate-600 text-sm shrink-0 mt-0.5">{icon}</span>
                {text}
              </div>
            ))}
          </div>

          {/* Live transcription status */}
          {session.phase === "listening" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
                <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider font-mono">
                  Recording
                </span>
              </div>
              <p className="text-xs text-emerald-300/70 leading-relaxed min-h-[40px]">
                {liveCaption || <span className="text-slate-600 italic">Listening for your voice…</span>}
              </p>
            </motion.div>
          )}

          {/* Processing status */}
          {(session.phase === "processing" || session.phase === "generating_question") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-amber-400 animate-spin text-lg">progress_activity</span>
              <span className="text-xs text-amber-300/80 font-mono">{session.processingMessage}</span>
            </motion.div>
          )}
        </aside>
      </main>

      {/* ── Bottom caption bar: ALWAYS visible during listening phase ── */}
      <AnimatePresence>
        {session.phase === "listening" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative z-10 shrink-0 mx-4 mb-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 rounded-2xl border border-emerald-500/30 animate-pulse pointer-events-none" />
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <motion.span
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="material-symbols-outlined text-emerald-400 text-xl"
                >mic</motion.span>
              </div>
              <div className="flex-1 min-w-0">
                {liveCaption ? (
                  <>
                    <p className="text-sm text-white leading-relaxed">{liveCaption}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-end gap-0.5">
                        {[0, 0.12, 0.24].map((d, i) => (
                          <motion.div key={i} className="w-1 bg-emerald-400/60 rounded-full"
                            animate={{ height: ["3px", "10px", "3px"] }}
                            transition={{ duration: 0.6, delay: d, repeat: Infinity }} />
                        ))}
                      </div>
                      <span className="text-[10px] text-emerald-400/60 font-mono">Transcribing</span>
                      <span className="ml-auto text-[10px] text-slate-500 font-mono">
                        {liveCaption.trim().split(/\s+/).filter(Boolean).length} words · 2.5s silence submits
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-400 italic">Listening… speak your answer now</p>
                    <div className="flex items-end gap-0.5">
                      {[0, 0.15, 0.3, 0.15, 0].map((d, i) => (
                        <motion.div key={i} className="w-1 bg-emerald-400/40 rounded-full"
                          animate={{ height: ["4px", "12px", "4px"] }}
                          transition={{ duration: 0.9, delay: d, repeat: Infinity }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── End confirm modal ── */}
      <AnimatePresence>
        {showEndModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowEndModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="bg-[#0e1628] border border-white/10 p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
                <span className="material-symbols-outlined text-red-400 text-xl">call_end</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 text-center">End Interview Early?</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed text-center">
                AIRA will compile a report from{" "}
                <strong className="text-white">{session.results.length}</strong> of{" "}
                <strong className="text-white">{totalQ}</strong> answered questions.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/5 transition-colors"
                >
                  Continue
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleEndEarly}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25"
                >
                  End & Get Report
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
