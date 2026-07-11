import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useInterviewSession } from "@/hooks/useInterviewSession";
import type { InterviewQuestion } from "@/types/interview";

// ---------------------------------------------------------------------------
// Browser-compat check (Web Speech API)
// ---------------------------------------------------------------------------

const SPEECH_SUPPORTED =
  typeof window !== "undefined" &&
  !!(
    (window as unknown as Record<string, unknown>)["SpeechRecognition"] ||
    (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"]
  );

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

// ---------------------------------------------------------------------------
// Timer component (isolated to avoid re-rendering the entire page)
// ---------------------------------------------------------------------------

function ElapsedTimer({ active }: { active: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      startRef.current = performance.now() - elapsed * 1000;
      const tick = () => {
        setElapsed((performance.now() - startRef.current) / 1000);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = Math.floor(elapsed % 60).toString().padStart(2, "0");
  return <span className="text-sm font-semibold font-mono text-on-surface">{m}:{s}</span>;
}

// ---------------------------------------------------------------------------
// Metric Bar
// ---------------------------------------------------------------------------

function MetricBar({ label, value, color = "bg-primary" }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-on-surface-variant">{label}</span>
        <span className="font-bold text-primary">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Accept questions from route state (e.g., passed from Dashboard)
  const routeQuestions: InterviewQuestion[] | undefined = location.state?.questions;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const {
    session,
    isVisionReady,
    isListening,
    liveMetrics,
    startAnswer,
    submitAnswer,
    endInterview,
  } = useInterviewSession(videoRef as React.RefObject<HTMLVideoElement | null>, routeQuestions);

  const currentQuestion = session.questions[session.currentIndex];
  const totalQuestions = session.questions.length;
  const isLastQuestion = session.currentIndex >= totalQuestions - 1 && session.phase === "done";

  // ── Auto-start listening when phase resets to idle after done ───────────
  useEffect(() => {
    if (hasStarted && session.phase === "idle") {
      // Do nothing — wait for user to click "Start Answering"
    }
  }, [hasStarted, session.phase]);

  // ── Mute video element when isMuted changes ──────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = true; // camera feed is always muted (no echo)
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStartInterview = () => {
    if (!SPEECH_SUPPORTED) return;
    setHasStarted(true);
    startAnswer();
  };

  const handleNextQuestion = async () => {
    if (session.phase !== "listening") return;
    await submitAnswer();
  };

  const handleEndInterview = async () => {
    setShowEndConfirm(false);
    try {
      const candidateName =
        localStorage.getItem("candidate_name") ?? "Candidate";
      const report = await endInterview(candidateName, location.state?.jobTitle ?? "");
      navigate("/reports", { state: { report } });
    } catch (err) {
      console.error("Failed to finalize interview:", err);
      navigate("/reports");
    }
  };

  // ── Browser compat warning ─────────────────────────────────────────────
  if (!SPEECH_SUPPORTED) {
    return (
      <div className="h-screen flex items-center justify-center bg-background px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-10 rounded-2xl max-w-lg text-center border border-warning/30 bg-warning/5"
        >
          <span className="material-symbols-outlined text-warning text-6xl block mb-4">
            warning
          </span>
          <h2 className="text-2xl font-bold text-on-surface mb-3">
            Browser Not Supported
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
            Speech recognition is not supported in this browser. For the best
            interview experience, please use{" "}
            <strong className="text-white">Google Chrome</strong> or{" "}
            <strong className="text-white">Microsoft Edge</strong>.
          </p>
          <div className="flex gap-3 justify-center text-xs text-on-surface-variant font-mono">
            <span className="px-3 py-1.5 rounded-full border border-white/10 bg-slate-800/50">
              Chrome 33+
            </span>
            <span className="px-3 py-1.5 rounded-full border border-white/10 bg-slate-800/50">
              Edge 79+
            </span>
            <span className="px-3 py-1.5 rounded-full border border-white/10 bg-slate-800/50">
              Opera 20+
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="relative h-[calc(100vh-1px)] w-full flex flex-col overflow-hidden bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container"
    >
      {/* ── Top Bar ── */}
      <motion.header
        variants={itemVariants}
        className="w-full bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-sm shrink-0"
      >
        <div className="flex justify-between items-center px-12 py-4 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold font-display text-on-surface">SmartHire AI</h1>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              {/* Timer + progress */}
              <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1 rounded-full border border-white/5">
                <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                <ElapsedTimer active={session.phase === "listening"} />
                <div className="w-px h-3 bg-white/20 mx-1" />
                <span className="text-xs font-semibold font-mono text-on-primary-container">
                  Q {session.currentIndex + 1} / {totalQuestions}
                </span>
              </div>

              {/* Phase indicator */}
              <AnimatePresence mode="wait">
                {session.phase === "listening" && (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center gap-1.5 text-success bg-success/5 px-3 py-1 rounded-full border border-success/20"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                    </span>
                    <span className="text-xs font-medium font-mono uppercase tracking-wider">
                      Recording
                    </span>
                  </motion.div>
                )}
                {session.phase === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center gap-1.5 text-warning bg-warning/5 px-3 py-1 rounded-full border border-warning/20"
                  >
                    <span className="material-symbols-outlined text-[14px] animate-spin">
                      progress_activity
                    </span>
                    <span className="text-xs font-medium font-mono uppercase tracking-wider">
                      Analysing
                    </span>
                  </motion.div>
                )}
                {session.phase === "idle" && !hasStarted && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container-highest/50 px-3 py-1 rounded-full border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
                    <span className="text-xs font-medium font-mono uppercase tracking-wider">Ready</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 ring-2 ring-primary/20 bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Main Workspace ── */}
      <main className="relative flex-1 w-full max-w-[1280px] mx-auto px-12 py-6 grid grid-cols-12 gap-6 overflow-hidden">

        {/* ── Left Panel: Live AI Analytics ── */}
        <motion.aside variants={itemVariants} className="col-span-3 flex flex-col gap-6 z-10">
          {/* Live Metrics Card */}
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary/60 text-[20px]">analytics</span>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-outline font-mono">
                Live Analysis
              </h3>
              {!isVisionReady && (
                <span className="ml-auto text-[9px] text-on-surface-variant font-mono animate-pulse">
                  Loading…
                </span>
              )}
            </div>

            <MetricBar label="Eye Contact" value={liveMetrics.eye_contact_percent} />
            <MetricBar label="Attention" value={liveMetrics.attention_percent} color="bg-tertiary" />
            <MetricBar label="Confidence" value={liveMetrics.confidence} color="bg-success" />

            {/* Eye contact status */}
            <div className="flex items-center justify-between py-1 border-y border-white/5">
              <span className="text-xs font-medium text-on-surface-variant">Face Detected</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      liveMetrics.face_presence_percent > 50 ? "bg-success" : "bg-error"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      liveMetrics.face_presence_percent > 50 ? "bg-success" : "bg-error"
                    }`}
                  />
                </span>
                <span
                  className={`text-xs font-semibold font-mono ${
                    liveMetrics.face_presence_percent > 50 ? "text-success/80" : "text-error/80"
                  }`}
                >
                  {liveMetrics.face_presence_percent > 50 ? "Detected" : "Not found"}
                </span>
              </div>
            </div>

            {/* Smile + Blink */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase font-mono block mb-1">
                  Smile
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {Math.round(liveMetrics.smile_score_percent)}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase font-mono block mb-1">
                  Blink/min
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {Math.round(liveMetrics.blink_rate_per_minute)}
                </span>
              </div>
            </div>
          </div>

          {/* Live Camera PIP */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-xl group bg-slate-950 flex items-center justify-center">
            {/* Real camera feed */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover group-hover:grayscale-0 transition-all duration-500"
              autoPlay
              muted
              playsInline
            />
            {/* Overlay when not started */}
            {!hasStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-center text-xs text-on-surface-variant font-mono">
                <span className="material-symbols-outlined text-4xl block mb-2 text-on-surface-variant/40">
                  videocam
                </span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-background/80 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-bold uppercase font-mono tracking-wider">
              Live Camera
            </div>
          </div>
        </motion.aside>

        {/* ── Center: AI Avatar ── */}
        <section className="col-span-6 relative flex flex-col items-center justify-center">
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-80 h-80 flex items-center justify-center">
              <div className="absolute inset-0 avatar-pulse bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute inset-4 avatar-pulse bg-primary/5 rounded-full blur-2xl [animation-delay:0.5s]" />

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-56 h-56 rounded-full border border-primary/20 flex items-center justify-center bg-surface-container-low shadow-[0_0_50px_rgba(195,192,255,0.1)] overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {session.phase === "processing" ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <span className="material-symbols-outlined text-primary text-4xl animate-spin">
                        progress_activity
                      </span>
                      <span className="text-[10px] text-primary/60 font-mono text-center px-4">
                        {session.processingMessage}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="wave"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      {[0.1, 0.3, 0.5, 0.2, 0.4].map((delay, i) => (
                        <div
                          key={i}
                          className={`w-1.5 rounded-full listening-wave ${
                            isListening ? "bg-primary" : "bg-primary/30"
                          }`}
                          style={{ animationDelay: `${delay}s` }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="absolute inset-[-10px] rounded-full border border-primary/5 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-[-30px] rounded-full border border-white/5 animate-[spin_15s_linear_infinite_reverse]" />
            </div>

            <div className="mt-8 text-center">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
                <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase font-mono">
                  {session.phase === "listening"
                    ? "Recording Your Answer"
                    : session.phase === "processing"
                    ? "Processing…"
                    : "AI Interviewer"}
                </p>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Panel: Question + Tip ── */}
        <motion.aside variants={itemVariants} className="col-span-3 flex flex-col gap-6 z-10">
          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={session.currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel p-6 rounded-xl border-l-4 border-l-primary relative overflow-hidden bg-surface-container/50"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <span className="material-symbols-outlined text-[64px]">chat_bubble</span>
              </div>
              <span className="text-[10px] font-bold text-primary/80 mb-2 block uppercase tracking-wider font-mono">
                Question {session.currentIndex + 1} of {totalQuestions}
              </span>
              <h2 className="text-base font-bold leading-snug text-on-surface">
                &quot;{currentQuestion?.text}&quot;
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-slate-800/30 rounded-full text-[10px] font-semibold uppercase text-on-surface-variant border border-white/5 font-mono">
                  {currentQuestion?.category}
                </span>
              </div>

              {/* Per-question result badge */}
              <AnimatePresence>
                {session.phase === "done" &&
                  session.results[session.currentIndex - 1] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-success font-mono uppercase">
                          Score
                        </span>
                        <span className="text-sm font-bold text-success">
                          {session.results[session.currentIndex - 1].result.overall_score}/100
                        </span>
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Tip Card */}
          <div className="p-6 rounded-xl bg-primary-container/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2 text-primary/80">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="text-[10px] font-bold uppercase tracking-wide font-mono">
                Interview Tip
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {currentQuestion?.tip}
            </p>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {session.error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-mono"
              >
                {session.error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>

        {/* ── Live Transcript Caption Overlay ── */}
        <motion.div
          variants={itemVariants}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-3xl z-20"
        >
          <AnimatePresence>
            {(session.liveCaption || session.phase === "listening") && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="glass-panel px-6 py-4 rounded-2xl shadow-2xl border border-white/10 bg-slate-950/95"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-white/10">
                    <span className="material-symbols-outlined text-md text-primary">mic</span>
                  </div>
                  <div className="flex-1 min-h-[24px]">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={session.liveCaption}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium text-on-surface leading-relaxed"
                      >
                        {session.liveCaption || (
                          <span className="text-on-surface-variant/50 italic">
                            Listening… start speaking
                          </span>
                        )}
                      </motion.p>
                    </AnimatePresence>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                      <span className="text-xs text-primary/60 font-semibold font-mono ml-2">
                        Transcribing…
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Floating Controls ── */}
        <motion.div
          variants={itemVariants}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4"
        >
          <div className="glass-panel p-3 rounded-full flex items-center gap-4 shadow-2xl bg-slate-900/80 border border-white/10">
            {/* Device controls */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted(!isMuted)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  isMuted ? "text-error" : "text-on-surface/80 hover:text-on-surface"
                }`}
                title="Mute Microphone"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isMuted ? "mic_off" : "mic"}
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors text-on-surface/80 hover:text-on-surface"
                title="Settings"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </motion.button>
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Primary actions */}
            <div className="flex items-center gap-3">
              {/* End interview */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowEndConfirm(true)}
                className="px-5 py-2 bg-transparent text-error text-xs font-semibold rounded-full border border-error/20 hover:bg-error/10 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">call_end</span>
                End Interview
              </motion.button>

              {/* Start / Next / Submit */}
              {!hasStarted ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStartInterview}
                  disabled={!isVisionReady}
                  className="px-6 py-2.5 bg-white text-slate-950 text-xs font-bold rounded-full flex items-center gap-1.5 hover:scale-[1.02] transition-all shadow-xl shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  {isVisionReady ? "Start Interview" : "Loading…"}
                </motion.button>
              ) : session.phase === "listening" ? (
                isLastQuestion ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-success text-slate-950 text-xs font-bold rounded-full flex items-center gap-1 shadow-xl shadow-success/20"
                  >
                    Finish & Get Report
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-white text-slate-950 text-xs font-bold rounded-full flex items-center gap-1 hover:scale-[1.02] transition-all shadow-xl shadow-white/10 group"
                  >
                    Next Question
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </motion.button>
                )
              ) : session.phase === "done" ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startAnswer}
                  className="px-6 py-2.5 bg-white text-slate-950 text-xs font-bold rounded-full flex items-center gap-1 shadow-xl shadow-white/10"
                >
                  <span className="material-symbols-outlined text-[18px]">mic</span>
                  Start Answering
                </motion.button>
              ) : (
                // processing phase — show spinner
                <div className="px-6 py-2.5 bg-white/10 text-white text-xs font-bold rounded-full flex items-center gap-2 opacity-60">
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  Analysing…
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── End Interview Confirmation Modal ── */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEndConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-2xl max-w-sm w-full mx-4 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-on-surface mb-2">End Interview?</h3>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                This will submit all your answers and generate your AI-powered assessment
                report. {session.results.length} of {totalQuestions} questions answered.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-on-surface-variant text-sm font-semibold hover:bg-white/5 transition-colors"
                >
                  Continue
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEndInterview}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-slate-950 text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                >
                  End & Get Report
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(195,192,255,0.03),transparent)] pointer-events-none" />
    </motion.div>
  );
}
