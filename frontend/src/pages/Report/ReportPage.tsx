import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ReportPage() {
  const [showInsight, setShowInsight] = useState(true);
  const [circleOffset, setCircleOffset] = useState(351.85);

  useEffect(() => {
    const circumference = 2 * Math.PI * 56;
    const timer = setTimeout(() => {
      setCircleOffset(circumference - 0.92 * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 25 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-6 md:p-12 max-w-[1280px] mx-auto w-full space-y-8 relative text-[#dae2fd]"
    >
      {/* Executive Summary Header */}
      <motion.header 
        variants={itemVariants}
        className="glass-card rounded-xl p-lg mb-xl border-l-4 border-l-primary flex flex-col md:flex-row justify-between items-center gap-xl relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/10"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="relative flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90">
              <circle className="text-slate-800" cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" strokeWidth="6"></circle>
              <circle 
                className="text-primary transition-all duration-[1500ms] ease-out" 
                cx="64" 
                cy="64" 
                fill="transparent" 
                id="score-circle" 
                r="56" 
                stroke="currentColor" 
                strokeWidth="6" 
                strokeDasharray="351.85" 
                strokeDashoffset={circleOffset}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-headline-lg text-on-surface">92%</span>
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-mono">Match</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-label-sm text-xs font-bold uppercase tracking-wider font-mono">#SH-4092</span>
              <span className="text-on-surface-variant font-label-sm text-xs font-mono">• Completed 2 hours ago</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Alexander Chen</h1>
            <p className="text-on-surface-variant font-body-lg text-base">Senior Software Engineer Candidate • <span className="text-success font-semibold">Strong Recommend</span></p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto justify-end">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 md:flex-none px-6 py-3 rounded-lg border border-white/10 bg-slate-900/40 text-on-surface font-label-md text-xs font-semibold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">download</span> Export
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 md:flex-none px-6 py-3 rounded-lg bg-primary text-slate-950 font-label-md text-xs font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            Next Steps
          </motion.button>
        </div>
      </motion.header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Summary Text */}
        <motion.section 
          variants={itemVariants}
          className="md:col-span-4 glass-card p-6 rounded-xl flex flex-col justify-between"
        >
          <div>
            <h3 className="font-label-md text-xs font-bold text-primary uppercase mb-4 tracking-widest flex items-center gap-2 font-mono">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span> AI Evaluation
            </h3>
            <p className="text-on-surface font-body-md text-sm leading-relaxed mb-6">
              Alexander demonstrated exceptional technical depth and systems design thinking. His communication style is collaborative and precise, though he tends to speak quickly when excited about complex problems.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold font-mono">
              <span className="text-on-surface-variant">Role Fit</span>
              <span className="text-on-surface">Excellent</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold font-mono">
              <span className="text-on-surface-variant">Salary Alignment</span>
              <span className="text-on-surface">Within Range</span>
            </div>
          </div>
        </motion.section>

        {/* Video Recording & Metrics */}
        <motion.section 
          variants={itemVariants}
          className="md:col-span-8 glass-card rounded-xl overflow-hidden flex flex-col bg-slate-900/40 border border-white/10"
        >
          <div className="relative h-64 bg-slate-900 overflow-hidden group">
            <img 
              className="w-full h-full object-cover opacity-80" 
              alt="Video interview recording with AI overlays" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK3vi8BJoDztW6xwrIPZ2eyFbLO5yw4CbJcnphLDYLw-1-VTKAfY4dOSfzGsZavbc93OH2U5tPsshvBgxoAWewwqhu-lHZwP1ZStdeUTRFVT5zGyDePdOYr29zvgMR-lusKd0UUUAQcPonLmr5o2K6IS5_R_eP2pcsariiTh5pXmK5uy3iiyKuNWt3bHRix8EZq1VdgYKGqAoH7Vui4xc-5QgYtHyLTNgjX_XOD4GnAKf91jWyPrh6-Q"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 cursor-pointer hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-white text-4xl">play_arrow</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-[9px] font-bold text-white uppercase font-mono tracking-tighter">Engagement</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-[9px] font-bold text-white uppercase font-mono tracking-tighter">Technical</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    <span className="text-[9px] font-bold text-white uppercase font-mono tracking-tighter">Correction</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary font-mono">08:42 / 45:00</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full w-full relative">
                <div className="absolute top-0 left-0 h-full bg-primary/40 rounded-full w-full"></div>
                <div className="absolute top-0 left-0 h-full bg-primary rounded-full w-[20%]"></div>
                {/* Markers */}
                <div className="absolute top-1/2 -translate-y-1/2 left-[15%] w-2 h-2 bg-success rounded-full ring-4 ring-success/20 cursor-pointer"></div>
                <div className="absolute top-1/2 -translate-y-1/2 left-[45%] w-2 h-2 bg-warning rounded-full ring-4 ring-warning/20 cursor-pointer"></div>
                <div className="absolute top-1/2 -translate-y-1/2 left-[75%] w-2 h-2 bg-primary rounded-full ring-4 ring-primary/20 cursor-pointer"></div>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6 flex-grow border-t border-white/5 bg-slate-900/20">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider">Eye Contact</span>
              <span className="text-2xl font-bold text-on-surface">88%</span>
              <div className="h-1 bg-white/5 rounded-full"><div className="h-full bg-success w-[88%] rounded-full"></div></div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider">Sentiment</span>
              <span className="text-2xl font-bold text-on-surface">Positive</span>
              <div className="h-1 bg-white/5 rounded-full"><div className="h-full bg-primary w-[75%] rounded-full"></div></div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider">Speech Pace</span>
              <span className="text-2xl font-bold text-on-surface">142 WPM</span>
              <div className="h-1 bg-white/5 rounded-full"><div className="h-full bg-warning w-[60%] rounded-full"></div></div>
            </div>
          </div>
        </motion.section>

        {/* Premium Communication Analysis */}
        <motion.section 
          variants={itemVariants}
          className="md:col-span-6 glass-card p-6 rounded-xl flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Communication Analysis</h3>
            <span className="material-symbols-outlined text-primary/60">waves</span>
          </div>
          <div className="space-y-6 flex-grow">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold font-mono text-on-surface-variant">Emotion Consistency</span>
                <span className="text-[10px] font-bold text-success font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Stable Baseline
                </span>
              </div>
              <div className="flex items-end h-16 gap-[2px] border-b border-white/5 pb-2">
                <div className="flex-1 bg-primary/20 rounded-t-sm h-[30%] transition-all hover:bg-primary/45"></div>
                <div className="flex-1 bg-primary/30 rounded-t-sm h-[45%] transition-all hover:bg-primary/55"></div>
                <div className="flex-1 bg-primary/40 rounded-t-sm h-[60%] transition-all hover:bg-primary/65"></div>
                <div className="flex-1 bg-primary/30 rounded-t-sm h-[50%] transition-all hover:bg-primary/55"></div>
                <div className="flex-1 bg-primary/50 rounded-t-sm h-[75%] transition-all hover:bg-primary/75"></div>
                <div className="flex-1 bg-primary/60 rounded-t-sm h-[85%] transition-all hover:bg-primary/85"></div>
                <div className="flex-1 bg-primary/40 rounded-t-sm h-[65%] transition-all hover:bg-primary/65"></div>
                <div className="flex-1 bg-primary/50 rounded-t-sm h-[80%] transition-all hover:bg-primary/75"></div>
                <div className="flex-1 bg-primary/70 rounded-t-sm h-[95%] transition-all hover:bg-primary/95"></div>
                <div className="flex-1 bg-primary/50 rounded-t-sm h-[70%] transition-all hover:bg-primary/75"></div>
                <div className="flex-1 bg-primary/40 rounded-t-sm h-[60%] transition-all hover:bg-primary/65"></div>
                <div className="flex-1 bg-primary/30 rounded-t-sm h-[40%] transition-all hover:bg-primary/55"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono block mb-1">Clarity Score</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-on-surface">9.4</span>
                  <span className="text-[10px] font-bold text-on-surface-variant font-mono">/10</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono block mb-1">Confidence</span>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-on-surface">High</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Skill Radar Chart */}
        <motion.section 
          variants={itemVariants}
          className="md:col-span-6 glass-card p-6 rounded-xl flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Skill Distribution</h3>
            <span className="material-symbols-outlined text-tertiary">radar</span>
          </div>
          <div className="flex justify-center items-center h-48 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="w-40 h-40 border border-on-surface-variant rounded-full"></div>
              <div className="absolute w-28 h-28 border border-on-surface-variant rounded-full"></div>
              <div className="absolute w-16 h-16 border border-on-surface-variant rounded-full"></div>
            </div>
            <div className="w-32 h-32 bg-primary/20 border-2 border-primary skill-radar relative z-10"></div>
            <div className="absolute top-0 text-center font-label-sm text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Technical</div>
            <div className="absolute bottom-0 text-center font-label-sm text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Soft Skills</div>
            <div className="absolute left-2 text-center font-label-sm text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Leadership</div>
            <div className="absolute right-2 text-center font-label-sm text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Creativity</div>
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <span className="flex items-center gap-1.5 font-label-sm text-xs text-on-surface-variant font-mono">
              <div className="w-2.5 h-2.5 rounded-full bg-primary"></div> Alexander
            </span>
            <span className="flex items-center gap-1.5 font-label-sm text-xs text-on-surface-variant font-mono">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div> Benchmark
            </span>
          </div>
        </motion.section>

        {/* Peer Benchmark Comparison */}
        <motion.section 
          variants={itemVariants}
          className="md:col-span-12 glass-card p-8 rounded-xl relative overflow-hidden bg-slate-900/40 border border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="flex-grow w-full">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">Peer Benchmark Comparison</h4>
                  <p className="text-on-surface-variant text-sm">Candidate vs. Recently Evaluated Senior Engineers</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-4xl font-black text-primary">88<span className="text-xl">th</span></span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono block">Percentile</span>
                </div>
              </div>
              {/* Percentile Slider */}
              <div className="relative h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-primary/10 w-[88%] border-r border-primary/50"></div>
                <div className="w-full h-2 bg-white/10 rounded-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-primary rounded-full w-[88%] shadow-[0_0_10px_rgba(195,192,255,0.5)]"></div>
                </div>
                {/* Cursor */}
                <div className="absolute top-1/2 -translate-y-1/2 left-[88%] -translate-x-1/2">
                  <div className="w-6 h-6 rounded-full bg-primary border-4 border-background flex items-center justify-center shadow-lg"></div>
                </div>
              </div>
              <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
                Alexander scored higher than <strong className="text-primary">88% of candidates</strong>. Top performing areas include <span className="text-white">Architectural Design</span> and <span className="text-white">Rapid Prototyping</span>.
              </p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 px-6 py-3 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all whitespace-nowrap active:scale-95"
            >
              View Ranking Details
            </motion.button>
          </div>
        </motion.section>

        {/* Technical Breakdown */}
        <motion.section variants={itemVariants} className="md:col-span-12 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Technical Accuracy</h3>
            <span className="text-xs text-on-surface-variant font-mono">3 Questions Evaluated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-xl border-l-4 border-l-success bg-gradient-to-r from-success/5 to-transparent">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-on-surface-variant font-mono">Q1: System Scalability</span>
                <span className="text-success font-bold font-mono text-sm">100%</span>
              </div>
              <p className="text-sm text-white">Perfect explanation of horizontal scaling and eventual consistency.</p>
            </div>
            <div className="glass-card p-6 rounded-xl border-l-4 border-l-success bg-gradient-to-r from-success/5 to-transparent">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-on-surface-variant font-mono">Q2: Distributed Locking</span>
                <span className="text-success font-bold font-mono text-sm">95%</span>
              </div>
              <p className="text-sm text-white">Thorough understanding of Redis Redlock and edge cases.</p>
            </div>
            <div className="glass-card p-6 rounded-xl border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-on-surface-variant font-mono">Q3: Concurrency in Go</span>
                <span className="text-warning font-bold font-mono text-sm">78%</span>
              </div>
              <p className="text-sm text-white">Good grasp of channels, but missed some nuance on race conditions.</p>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Footer CTA Section */}
      <motion.footer 
        variants={itemVariants}
        className="mt-12 py-12 border-t border-white/10 flex flex-col items-center gap-6"
      >
        <div className="text-center">
          <h4 className="text-lg font-bold text-white mb-1">Next Steps for Alexander Chen</h4>
          <p className="text-on-surface-variant text-sm">Proceed to the Executive Interview round based on AI recommendation.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined">calendar_today</span> Schedule Executive Round
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-primary text-slate-950 text-xs font-bold hover:opacity-90 transition-all shadow-[0_0_30px_rgba(195,192,255,0.3)] flex items-center gap-1.5 shimmer-effect relative overflow-hidden"
          >
            <span className="material-symbols-outlined">verified</span> Generate Offer Preview
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-xl bg-slate-800 border border-white/10 text-on-surface-variant text-xs font-bold hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined">share</span> Share with Team
          </motion.button>
        </div>
      </motion.footer>

      {/* Floating AI Insight Card */}
      <AnimatePresence>
        {showInsight && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            whileHover={{ scale: 1.05 }}
            className="fixed bottom-6 right-6 z-40 max-w-xs cursor-pointer"
          >
            <div className="glass-card p-4 rounded-xl shadow-2xl border border-primary/20 bg-background/90 backdrop-blur-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
                </div>
                <span className="text-xs font-bold text-primary font-mono tracking-wider uppercase">AI Context</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowInsight(false); }} 
                  className="ml-auto text-on-surface-variant hover:text-white"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <p className="text-xs text-white leading-relaxed">
                Alexander has 94% similarity to your current top performer, Sarah J. (L6 Staff Engineer).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
