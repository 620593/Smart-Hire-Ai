import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1000; // 1 second
    const stepTime = Math.max(Math.floor(duration / end), 15);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return <>{count}{suffix}</>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.first_name || user?.username || "Candidate";

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1, 
      transition: { type: "spring" as const, stiffness: 260, damping: 25 } 
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-6 md:p-12 max-w-[1280px] mx-auto w-full space-y-8 text-[#dae2fd]"
    >
      {/* Welcome Banner */}
      <motion.section 
        variants={cardVariants}
        className="relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur border border-white/5 p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-lg"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4 md:col-span-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Good morning, {displayName}.
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
            You have a mock interview scheduled for <span className="text-primary font-bold">2:00 PM today</span>. Let&apos;s sharpen those skills.
          </p>
          <div className="flex gap-4 pt-2">
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-primary-container to-secondary-container text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-container/20"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Start Practice
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
              whileTap={{ scale: 0.97 }}
              className="border border-white/10 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Reschedule
            </motion.button>
          </div>
        </div>
        <div className="relative z-10 md:col-span-4 bg-slate-900/60 backdrop-blur p-6 rounded-xl flex flex-col items-center justify-center text-center border border-white/10">
          <div className="text-primary font-bold text-4xl mb-1 drop-shadow-sm">
            <CountUp value={85} /><span className="text-xs font-normal opacity-60">/100</span>
          </div>
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider font-mono">Readiness Score</p>
          <div className="mt-4 w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "85%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="bg-primary-container h-full rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"
            />
          </div>
        </div>
      </motion.section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Performance Overview */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-8 bg-slate-900/40 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Performance Overview</h2>
              <p className="text-xs text-on-surface-variant">Your current mastery across core competencies</p>
            </div>
            <Badge>Live Analysis</Badge>
          </div>
          
          <div className="flex flex-1 items-center justify-around gap-8 flex-wrap">
            {/* Radar Placeholder */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 border border-white/5 rounded-full"></div>
              <div className="absolute inset-4 border border-white/5 rounded-full"></div>
              <div className="absolute inset-8 border border-white/5 rounded-full"></div>
              <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(195,192,255,0.4)]" viewBox="0 0 100 100">
                <polygon fill="rgba(195,192,255,0.2)" points="50,10 90,40 70,85 30,85 10,40" stroke="#c3c0ff" strokeWidth="1"></polygon>
                <circle cx="50" cy="10" fill="#c3c0ff" r="2"></circle>
                <circle cx="90" cy="40" fill="#c3c0ff" r="2"></circle>
                <circle cx="70" cy="85" fill="#c3c0ff" r="2"></circle>
                <circle cx="30" cy="85" fill="#c3c0ff" r="2"></circle>
                <circle cx="10" cy="40" fill="#c3c0ff" r="2"></circle>
              </svg>
            </div>
            
            {/* Skills List */}
            <div className="flex-grow max-w-md space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold font-mono">
                  <span className="text-white">Technical Depth</span>
                  <span className="text-on-surface-variant">92%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "92%" }}
                    transition={{ duration: 1, delay: 0.1 }}
                    className="h-full bg-success rounded-full"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold font-mono">
                  <span className="text-white">Communication</span>
                  <span className="text-on-surface-variant">78%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold font-mono">
                  <span className="text-white">Problem Solving</span>
                  <span className="text-on-surface-variant">88%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "88%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-secondary rounded-full"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold font-mono">
                  <span className="text-white">Confidence</span>
                  <span className="text-on-surface-variant">81%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "81%" }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full bg-warning rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Side Panels */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <motion.div 
            variants={cardVariants}
            className="bg-slate-900/40 backdrop-blur border-l-2 border-l-purple-500 border-y border-r border-white/10 p-6 rounded-2xl flex-1 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 font-mono uppercase tracking-widest">
                <span className="material-symbols-outlined text-purple-500 text-sm">auto_awesome</span>
                Resume Health
              </h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold leading-none text-white">
                  <CountUp value={78} suffix="%" />
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono mb-1">ATS Score</span>
              </div>
              <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                We found 3 missing keywords for the &quot;Senior Product Designer&quot; role in your current resume.
              </p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-white/5 transition-colors"
            >
              Optimize Resume
            </motion.button>
          </motion.div>

          <motion.div 
            variants={cardVariants}
            className="bg-slate-900/40 backdrop-blur border border-white/10 p-6 rounded-2xl flex-1"
          >
            <h3 className="text-xs font-bold text-white mb-4 font-mono uppercase tracking-widest">Quick Tips</h3>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[18px]">mic</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Try talking slower during technical explanations.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded bg-success/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Your STAR method application has improved by 15%.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Practice Sessions */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-12 bg-slate-900/40 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Practice Sessions</h2>
            <button className="text-primary text-xs font-semibold hover:underline">View All History</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/20 text-[10px] font-bold text-on-surface-variant uppercase font-mono border-b border-white/5 tracking-wider">
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Session Date</th>
                  <th className="px-6 py-4">AI Score</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">palette</span>
                      </div>
                      <div>
                        <div className="text-sm text-white font-semibold">Senior Product Designer</div>
                        <div className="text-xs text-on-surface-variant">Figma Inc. • Mock</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs font-mono">Oct 24, 2023</td>
                  <td className="px-6 py-4">
                    <Badge variant="success">88/100</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
                    >
                      View Feedback
                    </motion.button>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">code</span>
                      </div>
                      <div>
                        <div className="text-sm text-white font-semibold">Lead Frontend Engineer</div>
                        <div className="text-xs text-on-surface-variant">Stripe • Real-world Prep</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs font-mono">Oct 21, 2023</td>
                  <td className="px-6 py-4">
                    <Badge variant="primary">76/100</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
                    >
                      View Feedback
                    </motion.button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Improvement Trends & Upcoming Schedule */}
        <motion.div 
          variants={cardVariants}
          className="md:col-span-8 bg-slate-900/40 backdrop-blur border border-white/10 rounded-2xl p-6 h-64 flex flex-col"
        >
          <h3 className="text-xs font-bold text-white mb-6 font-mono uppercase tracking-widest">Improvement Trends</h3>
          <div className="flex-1 flex items-end gap-3 pb-2 px-2">
            <div className="flex-1 bg-primary-container/20 rounded-t h-[40%] group relative transition-all hover:bg-primary-container/40">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-[9px] text-white">62</div>
            </div>
            <div className="flex-1 bg-primary-container/30 rounded-t h-[55%] group relative transition-all hover:bg-primary-container/50">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-[9px] text-white">68</div>
            </div>
            <div className="flex-1 bg-primary-container/40 rounded-t h-[65%] group relative transition-all hover:bg-primary-container/60">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-[9px] text-white">74</div>
            </div>
            <div className="flex-1 bg-primary-container/60 rounded-t h-[80%] group relative transition-all hover:bg-primary-container/80">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-[9px] text-white">81</div>
            </div>
            <div className="flex-1 bg-primary-container rounded-t h-[95%] group relative transition-all hover:brightness-110 shadow-[0_-4px_12px_rgba(79,70,229,0.2)]">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-[9px] text-white">88</div>
            </div>
          </div>
          <div className="flex justify-between px-2 text-[9px] text-on-surface-variant font-mono">
            <span>Oct 1</span>
            <span>Oct 8</span>
            <span>Oct 15</span>
            <span>Oct 22</span>
            <span>Today</span>
          </div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          className="md:col-span-4 bg-slate-900/40 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col justify-between"
        >
          <h3 className="text-xs font-bold text-white mb-6 font-mono uppercase tracking-widest">Upcoming Schedule</h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="flex gap-3 border-l-4 border-primary pl-4 py-1 bg-primary-container/5 rounded-r-lg">
              <div>
                <div className="text-[9px] font-bold text-primary uppercase font-mono">2:00 PM Today</div>
                <div className="text-sm text-white font-semibold">Mock Technical Interview</div>
                <div className="text-xs text-on-surface-variant">Focus: React &amp; System Design</div>
              </div>
            </div>
            <div className="flex gap-3 border-l-4 border-slate-700 pl-4 py-1">
              <div>
                <div className="text-[9px] font-bold text-on-surface-variant uppercase font-mono">Oct 28 • 10:00 AM</div>
                <div className="text-sm text-white font-semibold">Stripe Intro Call</div>
                <div className="text-xs text-on-surface-variant">Real Company Interview</div>
              </div>
            </div>
            <div className="flex gap-3 border-l-4 border-slate-700 pl-4 py-1">
              <div>
                <div className="text-[9px] font-bold text-on-surface-variant uppercase font-mono">Nov 02 • 3:30 PM</div>
                <div className="text-sm text-white font-semibold">Mock Behavioral</div>
                <div className="text-xs text-on-surface-variant">Focus: Leadership Principles</div>
              </div>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 w-full flex items-center justify-center gap-2 text-primary text-xs font-semibold py-2.5 border border-primary/20 rounded-xl hover:bg-primary/5 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Open Calendar
          </motion.button>
        </motion.div>

      </div>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
        <p>© {new Date().getFullYear()} SmartHire AI Platform. All rights reserved.</p>
        <div className="flex gap-6">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-primary transition-colors" href="#">System Status</a>
        </div>
      </footer>

      {/* FAB */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-container text-white rounded-full shadow-lg shadow-primary/20 flex items-center justify-center hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all z-40 group"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
        <span className="absolute right-16 bg-slate-900 text-white px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all pointer-events-none text-xs border border-white/10 font-mono">Schedule New Session</span>
      </motion.button>
    </motion.div>
  );
}
