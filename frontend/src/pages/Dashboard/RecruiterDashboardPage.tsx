import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";

function StatCard({ icon, label, value, sub, color, delay = 0 }: {
  icon: string; label: string; value: string; sub: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 25 }}
      className="bg-[#131c30] border border-white/8 rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <span className="material-symbols-outlined text-[18px] text-white">{icon}</span>
        </div>
        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#5b5cf6]/10 text-[#5b5cf6]">
          {sub}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-[#8b9ec7] mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

const candidates = [
  { name: "Sarah Kim", role: "Senior Designer", company: "Figma", score: 94, status: "shortlisted", avatar: "SK" },
  { name: "James Lee", role: "Frontend Engineer", company: "Stripe", score: 88, status: "interview", avatar: "JL" },
  { name: "Emily Davis", role: "Product Manager", company: "Google", score: 76, status: "review", avatar: "ED" },
  { name: "Carlos Ruiz", role: "Data Scientist", company: "Uber", score: 91, status: "shortlisted", avatar: "CR" },
  { name: "Mia Chen", role: "UX Researcher", company: "Meta", score: 68, status: "screening", avatar: "MC" },
];

const statusVariant: Record<string, "success" | "primary" | "warning" | "neutral"> = {
  shortlisted: "success",
  interview: "primary",
  review: "warning",
  screening: "neutral",
};

const funnel = [
  { stage: "Applications", count: 284, pct: 100 },
  { stage: "AI Screening", count: 142, pct: 50 },
  { stage: "Interviews", count: 58, pct: 20 },
  { stage: "Offers", count: 12, pct: 4 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 25 } },
};

export function RecruiterDashboardPage() {
  const { user } = useAuth();
  const displayName = user?.first_name || user?.username || "Recruiter";
  const companyName = user?.company_name || "Your Company";

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-6 text-[#dae2fd]"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-[#5b5cf6] text-[10px] font-bold uppercase tracking-widest font-mono mb-1">
            {companyName}
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-white">Recruitment Overview</h1>
          <p className="text-sm text-[#8b9ec7] mt-1">AI-driven insights for your active hiring pipelines.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2.5 bg-[#131c30] border border-white/10 rounded-xl text-sm font-semibold text-[#dae2fd] flex items-center gap-2 hover:border-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2.5 bg-[#5b5cf6] rounded-xl text-sm font-semibold text-white flex items-center gap-2 shadow-lg shadow-[#5b5cf6]/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Interview
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="group" label="Total Candidates" value="1,284" sub="+12%" color="bg-[#5b5cf6]" delay={0.05} />
        <StatCard icon="videocam" label="Active Interviews" value="42" sub="This Week" color="bg-purple-600" delay={0.10} />
        <StatCard icon="pending_actions" label="Pending Reviews" value="18" sub="High Priority" color="bg-amber-600" delay={0.15} />
        <StatCard icon="trending_up" label="Hiring Progress" value="74%" sub="Q4 Goal: 85%" color="bg-emerald-600" delay={0.20} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Candidates Table */}
        <motion.div variants={cardVariants} className="lg:col-span-8 bg-[#131c30] border border-white/8 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent Candidates</h2>
            <button className="text-[#5b5cf6] text-xs font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0f1829]/60 text-[10px] font-bold text-[#5b6fa8] uppercase tracking-wider font-mono border-b border-white/5">
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Applied For</th>
                  <th className="px-5 py-3">Resume Score</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {candidates.map((c, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5b5cf6]/20 flex items-center justify-center text-[10px] font-bold text-[#5b5cf6]">
                          {c.avatar}
                        </div>
                        <span className="text-sm text-white font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <div className="text-xs text-white font-medium">{c.role}</div>
                        <div className="text-[10px] text-[#8b9ec7]">{c.company}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-[#0f1829] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${c.score}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full rounded-full ${c.score >= 85 ? "bg-emerald-500" : c.score >= 70 ? "bg-[#5b5cf6]" : "bg-amber-500"}`}
                          />
                        </div>
                        <span className="text-xs text-[#8b9ec7] font-mono">{c.score}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant[c.status] || "neutral"}>{c.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-3 py-1.5 rounded-lg border border-[#5b5cf6]/20 bg-[#5b5cf6]/5 text-[#5b5cf6] text-xs font-semibold hover:bg-[#5b5cf6]/10 transition-colors"
                      >
                        Review
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right Column — Skill Pool + Hiring Funnel */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Skill Pool Radar */}
          <motion.div variants={cardVariants} className="bg-[#131c30] border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Skill Pool</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36">
                <div className="absolute inset-0 border border-white/5 rounded-full" />
                <div className="absolute inset-4 border border-white/5 rounded-full" />
                <div className="absolute inset-8 border border-white/5 rounded-full" />
                <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(91,92,246,0.4)]" viewBox="0 0 100 100">
                  <polygon
                    fill="rgba(91,92,246,0.2)"
                    stroke="#5b5cf6"
                    strokeWidth="1.5"
                    points="50,8 88,35 75,82 25,82 12,35"
                  />
                  {[{cx:50,cy:8},{cx:88,cy:35},{cx:75,cy:82},{cx:25,cy:82},{cx:12,cy:35}].map((p, i) => (
                    <circle key={i} cx={p.cx} cy={p.cy} r="2.5" fill="#5b5cf6" />
                  ))}
                </svg>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {["Frontend (82%)", "AI/ML (74%)", "Design (91%)", "Backend (67%)", "PM (78%)"].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#5b5cf6]" />
                  <span className="text-[10px] text-[#8b9ec7] font-mono">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hiring Funnel */}
          <motion.div variants={cardVariants} className="bg-[#131c30] border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Hiring Funnel</h3>
            <div className="space-y-3">
              {funnel.map((f, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#dae2fd] font-medium">{f.stage}</span>
                    <span className="text-[#8b9ec7] font-mono">{f.count}</span>
                  </div>
                  <div className="h-2 bg-[#0f1829] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${f.pct}%` }}
                      transition={{ duration: 1, delay: i * 0.15 }}
                      className={`h-full rounded-full ${
                        i === 0 ? "bg-[#5b5cf6]" : i === 1 ? "bg-purple-500" : i === 2 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* AI Insights */}
      <motion.div variants={cardVariants} className="bg-[#131c30] border border-white/8 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">AI Recruiter Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "psychology", color: "text-[#5b5cf6] bg-[#5b5cf6]/10", title: "Top Match This Week", body: "Sarah Kim scores 94% for the Senior Designer role at Figma — recommend fast-tracking." },
            { icon: "warning", color: "text-amber-400 bg-amber-500/10", title: "Pipeline Risk Alert", body: "3 high-priority candidates haven't received follow-up in 5+ days. Act now to retain interest." },
            { icon: "trending_up", color: "text-emerald-400 bg-emerald-500/10", title: "Conversion Improvement", body: "Interview → Offer conversion rate improved 8% vs last quarter with AI screening enabled." },
          ].map((item, i) => (
            <div key={i} className="bg-[#0f1829]/60 border border-white/5 rounded-xl p-4 flex gap-3 items-start">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-1">{item.title}</p>
                <p className="text-[11px] text-[#8b9ec7] leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
