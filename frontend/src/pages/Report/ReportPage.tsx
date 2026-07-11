import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import type {
  InterviewFinalizeResponse,
  QuestionAnalysisResponse,
  WeakQuestion,
} from "@/types/interview";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 25 },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

function scoreBorderColor(score: number): string {
  if (score >= 80) return "border-l-success";
  if (score >= 60) return "border-l-warning";
  return "border-l-error";
}

function scoreGradient(score: number): string {
  if (score >= 80) return "from-success/5";
  if (score >= 60) return "from-warning/5";
  return "from-error/5";
}

function recommendationBadgeColor(rec: string): string {
  switch (rec) {
    case "Strong Recommend": return "bg-success/10 text-success border-success/20";
    case "Recommend":        return "bg-primary/10 text-primary border-primary/20";
    case "Neutral":          return "bg-warning/10 text-warning border-warning/20";
    default:                 return "bg-error/10 text-error border-error/20";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-on-surface-variant">{label}</span>
        <span className={`font-bold ${scoreColor(value)}`}>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className={`h-full rounded-full ${
            value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-error"
          }`}
        />
      </div>
    </div>
  );
}

function QuestionCard({
  qr,
  isWeak,
  weak,
}: {
  qr: QuestionAnalysisResponse;
  isWeak: boolean;
  weak?: WeakQuestion;
}) {
  const [expanded, setExpanded] = useState(isWeak);
  const r = qr.result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 rounded-xl border-l-4 bg-gradient-to-r to-transparent ${scoreBorderColor(r.overall_score)} ${scoreGradient(r.overall_score)}`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider">
              Q{qr.question_index + 1}
            </span>
            {isWeak && (
              <span className="px-2 py-0.5 bg-error/10 text-error text-[9px] font-bold uppercase rounded font-mono border border-error/20">
                Needs Work
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-on-surface leading-snug">
            {qr.question_text}
          </p>
          {r.answer_summary && (
            <p className="text-xs text-on-surface-variant mt-1 italic leading-relaxed">
              "{r.answer_summary}"
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-2xl font-black font-mono ${scoreColor(r.overall_score)}`}>
            {r.overall_score}
          </span>
          <span className="text-[9px] text-on-surface-variant font-mono">/100</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-primary/60 hover:text-primary font-mono mt-1 transition-colors"
          >
            {expanded ? "Hide ▲" : "Details ▼"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score breakdown */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider mb-2">
                  Score Breakdown
                </h5>
                <StatBar label="Answer Quality" value={r.answer_quality_score} />
                <StatBar label="Communication" value={r.communication_score} />
                <StatBar label="Body Language" value={r.body_language_score} />
                <StatBar label="Relevance" value={r.relevance_score} />
              </div>

              {/* Feedback */}
              <div className="space-y-3">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {r.feedback}
                </p>

                {r.strengths.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-success uppercase font-mono block mb-1">
                      Strengths
                    </span>
                    <ul className="space-y-1">
                      {r.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs text-on-surface-variant">
                          <span className="text-success mt-0.5">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isWeak && weak && (
                  <div className="p-3 rounded-lg bg-error/5 border border-error/15">
                    <span className="text-[10px] font-bold text-error uppercase font-mono block mb-1">
                      Top Improvement
                    </span>
                    <p className="text-xs text-on-surface-variant">{weak.top_improvement}</p>
                  </div>
                )}

                {/* Vision metrics summary */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: "Eye Contact", val: qr.vision_metrics.eye_contact_percent },
                    { label: "Confidence", val: qr.vision_metrics.confidence },
                    { label: "Attention", val: qr.vision_metrics.attention_percent },
                  ].map(({ label, val }) => (
                    <div key={label} className="text-center p-2 rounded bg-white/5">
                      <span className="text-[9px] text-on-surface-variant font-mono block">
                        {label}
                      </span>
                      <span className={`text-sm font-bold ${scoreColor(val)}`}>
                        {Math.round(val)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Real data from the interview session (passed via router state)
  const report: InterviewFinalizeResponse | undefined = location.state?.report;

  const [showInsight, setShowInsight] = useState(true);
  const [circleOffset, setCircleOffset] = useState(351.85);

  const overallScore = report?.result.overall_score ?? 92;
  const circumference = 2 * Math.PI * 56;

  useEffect(() => {
    const timer = setTimeout(() => {
      setCircleOffset(circumference - (overallScore / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [overallScore, circumference]);

  // Aggregate vision metrics across all questions
  const avgMetrics = report
    ? {
        eyeContact:
          report.question_results.reduce(
            (s, q) => s + q.vision_metrics.eye_contact_percent,
            0
          ) / report.question_results.length,
        confidence:
          report.question_results.reduce(
            (s, q) => s + q.vision_metrics.confidence,
            0
          ) / report.question_results.length,
        attention:
          report.question_results.reduce(
            (s, q) => s + q.vision_metrics.attention_percent,
            0
          ) / report.question_results.length,
      }
    : { eyeContact: 88, confidence: 71, attention: 92 };

  const weakIndices = new Set(report?.result.weak_question_indices ?? []);
  const weakMap = new Map(
    report?.weak_questions.map((w) => [w.question_index, w]) ?? []
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-6 md:p-12 max-w-[1280px] mx-auto w-full space-y-8 relative text-[#dae2fd]"
    >
      {/* ── Executive Summary Header ── */}
      <motion.header
        variants={itemVariants}
        className="glass-card rounded-xl p-lg mb-xl border-l-4 border-l-primary flex flex-col md:flex-row justify-between items-center gap-xl relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/10"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="flex items-center gap-6 w-full md:w-auto">
          {/* Score ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90">
              <circle
                className="text-slate-800"
                cx="64"
                cy="64"
                fill="transparent"
                r="56"
                stroke="currentColor"
                strokeWidth="6"
              />
              <circle
                className={`transition-all duration-[1500ms] ease-out ${
                  overallScore >= 80
                    ? "text-success"
                    : overallScore >= 60
                    ? "text-warning"
                    : "text-error"
                }`}
                cx="64"
                cy="64"
                fill="transparent"
                id="score-circle"
                r="56"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray="351.85"
                strokeDashoffset={circleOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-headline-lg text-on-surface">
                {overallScore}%
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-mono">
                Overall
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-label-sm text-xs font-bold uppercase tracking-wider font-mono">
                SmartHire AI
              </span>
              {report && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold uppercase border font-mono ${recommendationBadgeColor(
                    report.result.recommendation
                  )}`}
                >
                  {report.result.recommendation}
                </span>
              )}
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {report?.candidate_name ?? "Candidate"}
            </h1>
            <p className="text-on-surface-variant font-body-lg text-base">
              {report?.job_title
                ? `${report.job_title} Candidate`
                : "Interview Assessment"}{" "}
              •{" "}
              <span
                className={`font-semibold ${
                  overallScore >= 80
                    ? "text-success"
                    : overallScore >= 60
                    ? "text-warning"
                    : "text-error"
                }`}
              >
                {report?.result.recommendation ?? "Assessment Complete"}
              </span>
            </p>
            {report && (
              <p className="text-on-surface-variant text-xs mt-1 font-mono">
                {report.total_questions} questions • {report.weak_questions.length} need work
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/interviews")}
            className="flex-1 md:flex-none px-6 py-3 rounded-lg border border-white/10 bg-slate-900/40 text-on-surface font-label-md text-xs font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            New Interview
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 md:flex-none px-6 py-3 rounded-lg bg-primary text-slate-950 font-label-md text-xs font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </motion.button>
        </div>
      </motion.header>

      {/* ── Main Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* AI Evaluation Summary */}
        <motion.section
          variants={itemVariants}
          className="md:col-span-4 glass-card p-6 rounded-xl flex flex-col justify-between"
        >
          <div>
            <h3 className="font-label-md text-xs font-bold text-primary uppercase mb-4 tracking-widest flex items-center gap-2 font-mono">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              AI Evaluation
            </h3>
            <p className="text-on-surface font-body-md text-sm leading-relaxed mb-4">
              {report?.result.overall_feedback ??
                "Complete an interview to see your personalised AI evaluation here."}
            </p>
            {report && (
              <>
                <p className="text-on-surface-variant text-xs leading-relaxed mb-2">
                  <strong className="text-white">Communication:</strong>{" "}
                  {report.result.communication_summary}
                </p>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  <strong className="text-white">Body Language:</strong>{" "}
                  {report.result.body_language_summary}
                </p>
              </>
            )}
          </div>

          {report && (
            <div className="pt-6 border-t border-white/10 space-y-3 mt-4">
              <div>
                <span className="text-[10px] font-bold text-success uppercase font-mono tracking-wider block mb-2">
                  Top Strengths
                </span>
                {report.result.top_strengths.map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs text-on-surface-variant mb-1">
                    <span className="text-success">✓</span> {s}
                  </div>
                ))}
              </div>
              <div>
                <span className="text-[10px] font-bold text-warning uppercase font-mono tracking-wider block mb-2">
                  Top Improvements
                </span>
                {report.result.top_improvements.map((imp, i) => (
                  <div key={i} className="flex gap-2 text-xs text-on-surface-variant mb-1">
                    <span className="text-warning">→</span> {imp}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* Vision Metrics Panel */}
        <motion.section
          variants={itemVariants}
          className="md:col-span-8 glass-card rounded-xl overflow-hidden flex flex-col bg-slate-900/40 border border-white/10"
        >
          <div className="p-6 border-b border-white/5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                visibility
              </span>
              Body Language & Vision Analysis
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Averaged across all questions via real-time MediaPipe analysis
            </p>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 flex-grow bg-slate-900/20">
            {[
              { label: "Eye Contact", val: avgMetrics.eyeContact, icon: "visibility" },
              { label: "Confidence", val: avgMetrics.confidence, icon: "psychology" },
              { label: "Attention", val: avgMetrics.attention, icon: "center_focus_strong" },
              {
                label: "Face Presence",
                val: report
                  ? report.question_results.reduce(
                      (s, q) => s + q.vision_metrics.face_presence_percent,
                      0
                    ) / report.question_results.length
                  : 99,
                icon: "face",
              },
            ].map(({ label, val, icon }) => (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary/60 text-[16px]">
                    {icon}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider">
                    {label}
                  </span>
                </div>
                <span className={`text-2xl font-bold ${scoreColor(val)}`}>
                  {Math.round(val)}%
                </span>
                <div className="h-1 bg-white/5 rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    className={`h-full rounded-full ${
                      val >= 80 ? "bg-success" : val >= 60 ? "bg-warning" : "bg-error"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Weak Questions — highlighted */}
        {report && report.weak_questions.length > 0 && (
          <motion.section
            variants={itemVariants}
            className="md:col-span-12 glass-card p-6 rounded-xl border border-error/20 bg-error/5"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-error text-[20px]">
                warning
              </span>
              <h3 className="text-base font-bold text-white">
                Questions Needing Improvement ({report.weak_questions.length})
              </h3>
              <span className="ml-auto text-xs text-on-surface-variant font-mono">
                Score below 60
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.weak_questions.map((wq) => (
                <div
                  key={wq.question_index}
                  className="p-4 rounded-xl bg-error/5 border border-error/15"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-on-surface-variant font-mono">
                      Q{wq.question_index + 1}
                    </span>
                    <span className="text-error font-bold font-mono text-sm">
                      {wq.overall_score}/100
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium mb-2 leading-snug">
                    {wq.question_text}
                  </p>
                  <p className="text-xs text-on-surface-variant mb-2 leading-relaxed">
                    {wq.primary_feedback}
                  </p>
                  <div className="p-2 rounded bg-error/10 border border-error/20">
                    <span className="text-[10px] font-bold text-error font-mono block mb-0.5">
                      ACTION ITEM
                    </span>
                    <p className="text-xs text-on-surface-variant">{wq.top_improvement}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Per-Question Breakdown */}
        <motion.section variants={itemVariants} className="md:col-span-12 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Question-by-Question Analysis
            </h3>
            <span className="text-xs text-on-surface-variant font-mono">
              {report?.total_questions ?? 0} Questions Evaluated
            </span>
          </div>

          {report ? (
            <div className="space-y-4">
              {report.question_results.map((qr) => (
                <QuestionCard
                  key={qr.question_index}
                  qr={qr}
                  isWeak={weakIndices.has(qr.question_index)}
                  weak={weakMap.get(qr.question_index)}
                />
              ))}
            </div>
          ) : (
            /* Fallback placeholder when no real data */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { q: "Q1: System Scalability", score: 100, color: "border-l-success", gradient: "from-success/5" },
                { q: "Q2: Distributed Locking", score: 95, color: "border-l-success", gradient: "from-success/5" },
                { q: "Q3: Concurrency in Go", score: 78, color: "border-l-warning", gradient: "from-warning/5" },
              ].map(({ q, score, color, gradient }) => (
                <div
                  key={q}
                  className={`glass-card p-6 rounded-xl border-l-4 bg-gradient-to-r to-transparent ${color} ${gradient}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-on-surface-variant font-mono">{q}</span>
                    <span className={`font-bold font-mono text-sm ${scoreColor(score)}`}>{score}%</span>
                  </div>
                  <p className="text-sm text-white">Complete an interview to see real analysis.</p>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* ── Footer ── */}
      <motion.footer
        variants={itemVariants}
        className="mt-12 py-12 border-t border-white/10 flex flex-col items-center gap-6"
      >
        <div className="text-center">
          <h4 className="text-lg font-bold text-white mb-1">
            Next Steps for {report?.candidate_name ?? "You"}
          </h4>
          <p className="text-on-surface-variant text-sm">
            {report
              ? report.result.recommendation === "Strong Recommend" || report.result.recommendation === "Recommend"
                ? "Proceed to the next round based on AI recommendation."
                : "Review the improvement areas before your next interview."
              : "Complete an interview to unlock personalised next steps."}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/interviews")}
            className="px-6 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined">replay</span>
            Retake Interview
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-primary text-slate-950 text-xs font-bold hover:opacity-90 transition-all shadow-[0_0_30px_rgba(195,192,255,0.3)] flex items-center gap-1.5 relative overflow-hidden shimmer-effect"
          >
            <span className="material-symbols-outlined">verified</span>
            Share Report
          </motion.button>
        </div>
      </motion.footer>

      {/* ── Floating AI Insight ── */}
      <AnimatePresence>
        {showInsight && report && (
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
                <span className="text-xs font-bold text-primary font-mono tracking-wider uppercase">
                  AI Insight
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowInsight(false); }}
                  className="ml-auto text-on-surface-variant hover:text-white"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <p className="text-xs text-white leading-relaxed">
                {report.weak_questions.length === 0
                  ? "Excellent performance across all questions! 🎉"
                  : `Focus on Question${report.weak_questions.length > 1 ? "s" : ""} ${report.weak_questions
                      .map((w) => w.question_index + 1)
                      .join(", ")} before your next interview.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
