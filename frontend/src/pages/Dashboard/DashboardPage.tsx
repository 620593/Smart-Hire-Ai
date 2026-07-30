import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useResumeList } from "@/hooks/useResume";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";

interface LocalReport {
  candidate_name: string;
  job_title: string;
  result: {
    overall_score: number;
    recommendation: string;
    summary: string;
    strengths: string[];
    improvement_areas: string[];
    weak_question_indices: number[];
  };
  question_results: Array<{ question_index: number; question_text: string; result: { overall_score: number } }>;
  weak_questions: Array<{ question_index: number; top_improvement: string }>;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end || end === 0) {
      setCount(end);
      return;
    }
    const duration = 1000;
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
  const navigate = useNavigate();
  const displayName = user?.first_name || user?.username || "Candidate";
  const { data: resumeList } = useResumeList();

  const [lastReport, setLastReport] = useState<LocalReport | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("last_interview_report");
      if (stored) {
        setLastReport(JSON.parse(stored) as LocalReport);
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  const hasReport = lastReport !== null;
  const overallScore = lastReport?.result.overall_score ?? 0;
  const recommendation = lastReport?.result.recommendation ?? "Not Available";
  const totalQuestions = lastReport?.question_results?.length ?? 0;
  const resumeCount = resumeList?.resumes?.length ?? 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 md:col-span-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-400 text-sm">psychology</span>
            <span className="text-xs font-bold text-violet-400 font-mono uppercase tracking-wider">SmartHire AIRA Platform</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {getTimeGreeting()}, {displayName}.
          </h1>
          <p className="text-base md:text-lg text-slate-300 max-w-xl leading-relaxed">
            {hasReport 
              ? `Your last completed interview was for ${lastReport.job_title || "Software Engineer"}. Practice continuously with AIRA.`
              : "Ready to test your interview skills? Start a 10-minute dynamic mock interview with AIRA."}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/interviews")}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-violet-500/20"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Start Mock Interview
            </motion.button>

            {hasReport && (
              <motion.button 
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/reports", { state: { report: lastReport } })}
                className="border border-white/10 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">assessment</span>
                View Last Report
              </motion.button>
            )}
          </div>
        </div>

        <div className="relative z-10 md:col-span-4 bg-slate-900/60 backdrop-blur p-6 rounded-xl flex flex-col items-center justify-center text-center border border-white/10">
          <div className="text-violet-400 font-bold text-4xl mb-1 drop-shadow-sm">
            {hasReport ? <CountUp value={overallScore} /> : "—"}
            <span className="text-xs font-normal opacity-60 text-slate-400">/100</span>
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">Latest Readiness Score</p>
          <div className="mt-4 w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${hasReport ? overallScore : 0}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="bg-violet-500 h-full rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            />
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <motion.div variants={cardVariants} className="bg-slate-900/40 backdrop-blur border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Questions Answered</span>
            <span className="material-symbols-outlined text-violet-400 text-lg">forum</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalQuestions}</div>
          <p className="text-[11px] text-slate-500 mt-1">In recent interview</p>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-slate-900/40 backdrop-blur border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">AI Score</span>
            <span className="material-symbols-outlined text-emerald-400 text-lg">bar_chart</span>
          </div>
          <div className="text-2xl font-bold text-white">{hasReport ? `${overallScore}%` : "N/A"}</div>
          <p className="text-[11px] text-slate-500 mt-1">Overall performance</p>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-slate-900/40 backdrop-blur border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Recommendation</span>
            <span className="material-symbols-outlined text-amber-400 text-lg">verified</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{recommendation}</div>
          <p className="text-[11px] text-slate-500 mt-1">AIRA Evaluation</p>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-slate-900/40 backdrop-blur border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Resumes Uploaded</span>
            <span className="material-symbols-outlined text-blue-400 text-lg">description</span>
          </div>
          <div className="text-2xl font-bold text-white">{resumeCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Available for interviews</p>
        </motion.div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Performance & Summary */}
        <motion.div variants={cardVariants} className="md:col-span-8 bg-slate-900/40 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Recent Interview Insights</h2>
              <p className="text-xs text-slate-400">Analysis from your latest session with AIRA</p>
            </div>
            <Badge variant="primary">{hasReport ? "Latest Report" : "No Session Yet"}</Badge>
          </div>

          {hasReport ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-white/5">
                {lastReport.result.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Top Strengths
                  </span>
                  <ul className="space-y-1.5">
                    {(lastReport?.result?.strengths ?? []).slice(0, 3).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 uppercase font-mono flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span> Key Improvements
                  </span>
                  <ul className="space-y-1.5">
                    {(lastReport?.result?.improvement_areas ?? (lastReport?.result as any)?.["improvements to add"] ?? []).slice(0, 3).map((imp: string, i: number) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-violet-400 text-2xl">mic</span>
              </div>
              <p className="text-sm font-bold text-white">No practice sessions completed yet</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Start a practice interview to receive real-time speech, eye-contact, and AI evaluation feedback.
              </p>
              <button 
                onClick={() => navigate("/interviews")}
                className="mt-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/20"
              >
                Launch Mock Interview
              </button>
            </div>
          )}
        </motion.div>

        {/* Quick Actions & Tips */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <motion.div variants={cardVariants} className="bg-slate-900/40 backdrop-blur border border-white/10 p-6 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 text-sm">bolt</span>
              Quick Actions
            </h3>
            
            <button 
              onClick={() => navigate("/interviews")}
              className="w-full p-3 bg-slate-800/60 hover:bg-slate-800 border border-white/5 rounded-xl flex items-center gap-3 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-base">mic</span>
              </div>
              <div>
                <div className="text-xs font-bold text-white">Mock Interview</div>
                <div className="text-[11px] text-slate-400">Practice with AIRA avatar</div>
              </div>
            </button>

            <button 
              onClick={() => navigate("/reports")}
              className="w-full p-3 bg-slate-800/60 hover:bg-slate-800 border border-white/5 rounded-xl flex items-center gap-3 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-base">analytics</span>
              </div>
              <div>
                <div className="text-xs font-bold text-white">AI Feedback</div>
                <div className="text-[11px] text-slate-400">View detailed reports</div>
              </div>
            </button>

            <button 
              onClick={() => navigate("/resume")}
              className="w-full p-3 bg-slate-800/60 hover:bg-slate-800 border border-white/5 rounded-xl flex items-center gap-3 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-base">description</span>
              </div>
              <div>
                <div className="text-xs font-bold text-white">Resume Section</div>
                <div className="text-[11px] text-slate-400">Upload & parse CV</div>
              </div>
            </button>
          </motion.div>

          <motion.div variants={cardVariants} className="bg-slate-900/40 backdrop-blur border border-white/10 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-white mb-3 font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-sm">lightbulb</span>
              Preparation Tips
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2.5 items-start">
                <span className="material-symbols-outlined text-violet-400 text-sm mt-0.5">forum</span>
                <p className="text-xs text-slate-300 leading-relaxed">Use the <strong>STAR method</strong> (Situation, Task, Action, Result) for structured answers.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">videocam</span>
                <p className="text-xs text-slate-300 leading-relaxed">Maintain steady eye contact with the camera for optimal body language scores.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5">record_voice_over</span>
                <p className="text-xs text-slate-300 leading-relaxed">Speak clearly and continuously; 2.5s of silence submits your answer automatically.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
