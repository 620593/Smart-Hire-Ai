/**
 * ATSScorePanel — premium visual dashboard for displaying ATS scoring results.
 *
 * Renders:
 *  - Animated circular gauge for the overall score
 *  - Section score bars (skill, experience, education)
 *  - Missing skills chip grid
 *  - Strengths / weaknesses / suggestions / improvements lists
 *  - Resume metadata footer
 */

import { motion } from "framer-motion";
import type { ATSScoreResponse } from "@/types/ats";

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Map a 0-100 score to a semantic colour token. */
function scoreColour(score: number): string {
  if (score >= 85) return "#22c55e"; // green-500
  if (score >= 70) return "#3b82f6"; // blue-500
  if (score >= 50) return "#f59e0b"; // amber-500
  if (score >= 30) return "#f97316"; // orange-500
  return "#ef4444";                  // red-500
}

/** Map a 0-100 score to a label. */
function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Weak";
  return "Poor";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface GaugeProps {
  score: number;
  size?: number;
}

/** Animated SVG circular gauge for the overall ATS score. */
function CircularGauge({ score, size = 140 }: GaugeProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;
  const colour = scoreColour(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
        {/* Track */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth="10" strokeLinecap="round"
        />
        {/* Progress */}
        <motion.circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={colour}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${colour}80)` }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black"
          style={{ color: colour }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-[9px] text-white/40 font-semibold tracking-widest uppercase">
          /100
        </span>
      </div>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  score: number;
  icon: string;
  delay?: number;
}

/** Horizontal animated progress bar for a single dimension score. */
function ScoreBar({ label, score, icon, delay = 0 }: ScoreBarProps) {
  const colour = scoreColour(score);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-white/70 font-medium">
          <span className="material-symbols-outlined text-[14px]" style={{ color: colour }}>
            {icon}
          </span>
          {label}
        </span>
        <span className="font-bold font-mono" style={{ color: colour }}>{score}/100</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${colour}99, ${colour})`,
            boxShadow: `0 0 8px ${colour}60`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface ChipListProps {
  items: string[];
  variant: "missing" | "improvement";
}

function ChipList({ items, variant }: ChipListProps) {
  if (!items.length) {
    return (
      <p className="text-[11px] text-white/30 italic">None identified.</p>
    );
  }
  const base =
    variant === "missing"
      ? "bg-red-500/10 border border-red-500/20 text-red-300"
      : "bg-blue-500/10 border border-blue-500/20 text-blue-300";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 }}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${base}`}
        >
          {item}
        </motion.span>
      ))}
    </div>
  );
}

interface BulletListProps {
  items: string[];
  colour: string;
  icon: string;
}

function BulletList({ items, colour, icon }: BulletListProps) {
  if (!items.length) {
    return <p className="text-[11px] text-white/30 italic">None identified.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-2 text-xs text-white/70 leading-relaxed"
        >
          <span
            className="material-symbols-outlined text-[14px] mt-0.5 shrink-0"
            style={{ color: colour }}
          >
            {icon}
          </span>
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Section card wrapper
// ---------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  iconColour?: string;
}

function SectionCard({ title, icon, children, iconColour = "#a5b4fc" }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-3"
    >
      <h4 className="flex items-center gap-2 text-[11px] font-bold text-white/50 uppercase tracking-widest">
        <span className="material-symbols-outlined text-[14px]" style={{ color: iconColour }}>
          {icon}
        </span>
        {title}
      </h4>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export interface ATSScorePanelProps {
  data: ATSScoreResponse;
}

/**
 * Premium ATS Score result panel.
 *
 * Drop inside any layout; it manages its own scroll if content overflows.
 */
export function ATSScorePanel({ data }: ATSScorePanelProps) {
  const { result, resume_filename, resume_pages, resume_length, jd_length } =
    data;
  const colour = scoreColour(result.overall_score);
  const label = scoreLabel(result.overall_score);
  const improvements = result["improvements to add"] ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* ── Header row ── */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <CircularGauge score={result.overall_score} />

        <div className="flex-1 space-y-1 text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            ATS Compatibility Score
          </p>
          <h3 className="text-2xl font-black text-white">
            {label}{" "}
            <span className="text-sm font-medium text-white/40">match</span>
          </h3>
          <p className="text-xs text-white/40 font-mono">
            {resume_filename} · {resume_pages}p · {(resume_length / 1000).toFixed(1)}k chars
          </p>
          <p className="text-[10px] text-white/25 font-mono">
            JD: {(jd_length / 1000).toFixed(1)}k chars
          </p>
        </div>

        {/* Pill badge */}
        <div
          className="px-4 py-2 rounded-full text-sm font-black border"
          style={{
            color: colour,
            borderColor: `${colour}40`,
            backgroundColor: `${colour}15`,
          }}
        >
          {result.overall_score}/100
        </div>
      </div>

      {/* ── Dimension scores ── */}
      <SectionCard title="Dimension Scores" icon="equalizer" iconColour="#818cf8">
        <div className="space-y-3">
          <ScoreBar label="Skill Match" score={result.skill_score} icon="code" delay={0.1} />
          <ScoreBar label="Experience" score={result.experience_score} icon="work" delay={0.2} />
          <ScoreBar label="Education" score={result.education_score} icon="school" delay={0.3} />
        </div>
      </SectionCard>

      {/* ── Two-column grid: strengths + weaknesses ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Strengths" icon="thumb_up" iconColour="#22c55e">
          <BulletList items={result.strengths} colour="#22c55e" icon="check_circle" />
        </SectionCard>

        <SectionCard title="Weaknesses" icon="thumb_down" iconColour="#f97316">
          <BulletList items={result.weaknesses} colour="#f97316" icon="cancel" />
        </SectionCard>
      </div>

      {/* ── Missing skills ── */}
      <SectionCard title="Missing Skills" icon="highlight_off" iconColour="#ef4444">
        <ChipList items={result.missing_skills} variant="missing" />
      </SectionCard>

      {/* ── Suggestions ── */}
      <SectionCard title="Suggestions" icon="tips_and_updates" iconColour="#38bdf8">
        <BulletList items={result.suggestions} colour="#38bdf8" icon="arrow_forward" />
      </SectionCard>

      {/* ── Improvements to add ── */}
      <SectionCard title="Add to Your Resume" icon="add_circle" iconColour="#818cf8">
        <ChipList items={improvements} variant="improvement" />
      </SectionCard>
    </motion.div>
  );
}
