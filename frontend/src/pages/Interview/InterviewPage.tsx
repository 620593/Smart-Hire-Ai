import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function InterviewPage() {
  const navigate = useNavigate();
  const [questionIndex, setQuestionIndex] = useState(4);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [transcriptText, setTranscriptText] = useState(
    "In my previous role at TechFlow, there was a significant disagreement between the design and engineering teams regarding the implementation of a new component library..."
  );

  // Transcript simulation
  useEffect(() => {
    const phrases = [
      "I addressed this by setting up a cross-functional workshop...",
      "We established a new set of communication protocols...",
      "Ultimately, the project launched two weeks ahead of schedule with 100% adoption.",
      "The conflict actually strengthened our future collaboration model."
    ];
    let currentPhrase = 0;
    const interval = setInterval(() => {
      currentPhrase = (currentPhrase + 1) % phrases.length;
      setTranscriptText(phrases[currentPhrase]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleEndInterview = () => {
    if (window.confirm("End this interview?")) {
      navigate("/reports");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="relative h-[calc(100vh-1px)] w-full flex flex-col overflow-hidden bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container"
    >
      {/* Top Bar Navigation Shell */}
      <motion.header 
        variants={itemVariants}
        className="w-full bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-sm shrink-0"
      >
        <div className="flex justify-between items-center px-12 py-4 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold font-display text-on-surface">SmartHire AI</h1>
            <div className="h-6 w-px bg-white/10"></div>
            {/* Unified Status Bar */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1 rounded-full border border-white/5">
                <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                <span className="text-sm font-semibold font-mono text-on-surface">12:45</span>
                <div className="w-px h-3 bg-white/20 mx-1"></div>
                <span className="text-xs font-semibold font-mono text-on-primary-container">Question {questionIndex} / 12</span>
              </div>
              <div className="flex items-center gap-1.5 text-success bg-success/5 px-3 py-1 rounded-full border border-success/20">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span className="text-xs font-medium font-mono uppercase tracking-wider">Secure Line</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 ring-2 ring-primary/20">
              <img 
                className="w-full h-full object-cover" 
                alt="Candidate Profile" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj3CNmm2-6eIsOTnz27Z2cX1-oFRLzkKRhZftpUVGWW3ayyJgw1sNU7MB1SFjJ9bEshJ5QbXX4tSvdT8CbQgv3QjNxIMoAFtMAT6H1NRPB3VdGXc4nzuutUVoh6AgzdrvmyYxX8JtMDEBIRyCQzozxOimcWM_E_OkUFT7zBKRaHLREi2klOgIUAs6GtnZwebwcqSGlfMNSSkQwSMYs5to8ixV8Wp_cFDcERreyPzVXvsGmmlPWQvGagA"
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Workspace */}
      <main className="relative flex-1 w-full max-w-[1280px] mx-auto px-12 py-6 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Left Panel: AI Analytics */}
        <motion.aside variants={itemVariants} className="col-span-3 flex flex-col gap-6 z-10">
          {/* AI Metrics Card */}
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary/60 text-[20px]">analytics</span>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-outline font-mono">Live Analysis</h3>
            </div>
            {/* Confidence Meter */}
            <div className="space-y-1 opacity-80">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-on-surface-variant">Speech Confidence</span>
                <span className="font-bold text-primary">88%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "88%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-primary/85 rounded-full" 
                  id="confidence-bar"
                />
              </div>
            </div>
            {/* Eye Contact Indicator */}
            <div className="flex items-center justify-between py-1 border-y border-white/5">
              <span className="text-xs font-medium text-on-surface-variant">Eye Contact</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="text-xs font-semibold text-success/80 font-mono">Stable</span>
              </div>
            </div>
            {/* Emotion Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-on-surface-variant font-mono uppercase tracking-wider block">Sentiment</span>
              <div className="h-8 w-full flex items-end gap-[3px] opacity-40">
                <div className="bg-primary w-full h-1/4 rounded-t-xs"></div>
                <div className="bg-primary w-full h-2/4 rounded-t-xs"></div>
                <div className="bg-primary w-full h-3/4 rounded-t-xs"></div>
                <div className="bg-primary w-full h-full rounded-t-xs animate-pulse"></div>
                <div className="bg-primary w-full h-2/4 rounded-t-xs"></div>
                <div className="bg-primary w-full h-1/4 rounded-t-xs"></div>
                <div className="bg-primary w-full h-3/4 rounded-t-xs"></div>
                <div className="bg-primary w-full h-2/4 rounded-t-xs"></div>
              </div>
            </div>
          </div>

          {/* Candidate PIP Preview */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-xl group bg-slate-950 flex items-center justify-center">
            {isCameraOn ? (
              <img 
                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" 
                alt="Candidate Web Cam View" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHWXJpApn6QRGhhlb6mb2aaHJ3rVDS4WD5jXwRcFIHuMJPDP8lK5C6-qyZ7-D8EDALou57MIR-aUUFGNheu9SEhWfeUAiECAboQ-y6eGQmvyi-lKDy7k1I6bOIZGoLHFh9pHk7E7JwTpCMHo2taDOHfyniTCsGmXSGiPwt1jgFrj2KIYGIAnJfwAJaskj5zKjEV84U0mlTv7UMC-uHGKNEdAUjywpkDIbZfQ_zefzg0J7t8WS_-n0e5A"
              />
            ) : (
              <div className="text-center text-xs text-on-surface-variant font-mono">
                <span className="material-symbols-outlined text-4xl block mb-2 text-destructive">videocam_off</span>
                Camera Off
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-background/80 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-bold uppercase font-mono tracking-wider">
              Live Camera
            </div>
          </div>
        </motion.aside>

        {/* Center: AI Avatar Area */}
        <section className="col-span-6 relative flex flex-col items-center justify-center">
          <div className="relative z-10 flex flex-col items-center">
            {/* AI Avatar Sphere */}
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Subtle Pulse Rings */}
              <div className="absolute inset-0 avatar-pulse bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute inset-4 avatar-pulse bg-primary/5 rounded-full blur-2xl [animation-delay:0.5s]"></div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative w-56 h-56 rounded-full border border-primary/20 flex items-center justify-center bg-surface-container-low shadow-[0_0_50px_rgba(195,192,255,0.1)] overflow-hidden"
              >
                {/* Listening Waveform */}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 bg-primary/80 rounded-full listening-wave" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-1.5 bg-primary/80 rounded-full listening-wave" style={{ animationDelay: "0.3s" }}></div>
                  <div className="w-1.5 bg-primary rounded-full listening-wave" style={{ animationDelay: "0.5s" }}></div>
                  <div className="w-1.5 bg-primary/80 rounded-full listening-wave" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-1.5 bg-primary/80 rounded-full listening-wave" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </motion.div>
              {/* Decorative Visualizer Rings */}
              <div className="absolute inset-[-10px] rounded-full border border-primary/5 animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-[-30px] rounded-full border border-white/5 animate-[spin_15s_linear_infinite_reverse]"></div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40"></span>
                <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase font-mono">AI Interviewer Listening</p>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40"></span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: Contextual Information */}
        <motion.aside variants={itemVariants} className="col-span-3 flex flex-col gap-6 z-10">
          {/* Question Card */}
          <div className="glass-panel p-6 rounded-xl border-l-4 border-l-primary relative overflow-hidden bg-surface-container/50">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <span className="material-symbols-outlined text-[64px]">chat_bubble</span>
            </div>
            <span className="text-[10px] font-bold text-primary/80 mb-2 block uppercase tracking-wider font-mono">Current Question</span>
            <h2 className="text-lg font-bold leading-tight text-on-surface">
              &quot;Tell me about a time you had to resolve a conflict within your team.&quot;
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-800/30 rounded-full text-[10px] font-semibold uppercase text-on-surface-variant border border-white/5 font-mono">Conflict Resolution</span>
              <span className="px-3 py-1 bg-slate-800/30 rounded-full text-[10px] font-semibold uppercase text-on-surface-variant border border-white/5 font-mono">Leadership</span>
            </div>
          </div>
          {/* Notes/Tips */}
          <div className="p-6 rounded-xl bg-primary-container/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2 text-primary/80">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="text-[10px] font-bold uppercase tracking-wide font-mono">Interview Tip</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Use the <strong>STAR method</strong> (Situation, Task, Action, Result) to structure your response for maximum clarity and impact.
            </p>
          </div>
        </motion.aside>

        {/* Transcript Overlay */}
        <motion.div 
          variants={itemVariants}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-3xl z-20"
        >
          <div className="glass-panel px-6 py-4 rounded-2xl shadow-2xl border border-white/10 bg-slate-950/95">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-white/10">
                <span className="material-symbols-outlined text-md text-primary">face</span>
              </div>
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={transcriptText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-medium text-on-surface leading-relaxed"
                  >
                    &quot;{transcriptText}&quot;
                  </motion.p>
                </AnimatePresence>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-xs text-primary/60 font-semibold font-mono ml-2">Transcribing...</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating Controls (Bottom Bar) */}
        <motion.div 
          variants={itemVariants}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4"
        >
          <div className="glass-panel p-3 rounded-full flex items-center gap-4 shadow-2xl bg-slate-900/80 border border-white/10">
            {/* Device Controls */}
            <div className="flex items-center gap-1">
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted(!isMuted)} 
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isMuted ? "text-error" : "text-on-surface/80 hover:text-on-surface"}`}
                title="Mute Microphone"
              >
                <span className="material-symbols-outlined text-[20px]">{isMuted ? "mic_off" : "mic"}</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCameraOn(!isCameraOn)} 
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${!isCameraOn ? "text-error" : "text-on-surface/80 hover:text-on-surface"}`}
                title="Toggle Camera"
              >
                <span className="material-symbols-outlined text-[20px]">{isCameraOn ? "videocam" : "videocam_off"}</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)} 
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors text-on-surface/80 hover:text-on-surface" 
                title="Settings"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </motion.button>
            </div>
            
            <div className="h-6 w-px bg-white/10"></div>
            
            {/* Primary Action Controls */}
            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleEndInterview} 
                className="px-6 py-2 bg-transparent text-error text-xs font-semibold rounded-full border border-error/20 hover:bg-error/10 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">call_end</span>
                End Interview
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setQuestionIndex(prev => Math.min(prev + 1, 12))}
                className="px-6 py-2.5 bg-white text-slate-950 text-xs font-bold rounded-full flex items-center gap-1 hover:scale-[1.02] transition-all shadow-xl shadow-white/10 group"
              >
                Next Question
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Background Effect */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(195,192,255,0.03),transparent)] pointer-events-none"></div>
    </motion.div>
  );
}
