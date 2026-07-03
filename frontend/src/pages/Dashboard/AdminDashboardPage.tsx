import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AdminService } from "@/services/auth";
import { Badge } from "@/components/ui/Badge";
import type { User } from "@/types/auth";

function StatCard({
  icon, label, value, sub, color, delay = 0
}: { icon: string; label: string; value: string; sub: string; color: string; delay?: number }) {
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
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${sub.startsWith("+") ? "bg-emerald-500/15 text-emerald-400" : sub === "HEALTHY" ? "bg-emerald-500/15 text-emerald-400" : "bg-[#5b5cf6]/15 text-[#5b5cf6]"}`}>
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

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 25 } },
};

export function AdminDashboardPage() {
  const { user } = useAuth();
  const displayName = user?.first_name || user?.username || "Admin";

  const [pendingRecruiters, setPendingRecruiters] = useState<User[]>([]);
  const [loadingApproval, setLoadingApproval] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    AdminService.listPendingRecruiters()
      .then(setPendingRecruiters)
      .catch(() => setPendingRecruiters([]));
  }, []);

  const handleApprove = async (userId: string, name: string) => {
    setLoadingApproval(userId);
    try {
      await AdminService.approveRecruiter(userId);
      setPendingRecruiters((prev) => prev.filter((r) => r.id !== userId));
      setActionMessage(`✓ ${name} has been approved.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      setActionMessage("Failed to approve recruiter.");
    } finally {
      setLoadingApproval(null);
    }
  };

  const handleReject = async (userId: string, name: string) => {
    setLoadingApproval(userId);
    try {
      await AdminService.rejectRecruiter(userId);
      setPendingRecruiters((prev) => prev.filter((r) => r.id !== userId));
      setActionMessage(`✗ ${name} has been rejected.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      setActionMessage("Failed to reject recruiter.");
    } finally {
      setLoadingApproval(null);
    }
  };

  const auditLogs = [
    { user: "Marcus Chen", action: "Approved candidate Sarah K.", time: "2 min ago", type: "approve" },
    { user: "System", action: "AI model updated to v2.4", time: "14 min ago", type: "system" },
    { user: "Admin", action: "New recruiter account created", time: "1 hr ago", type: "user" },
    { user: "Lisa Park", action: "Exported candidate report PDF", time: "2 hr ago", type: "export" },
    { user: "System", action: "Nightly DB backup completed", time: "6 hr ago", type: "system" },
  ];

  const aiUsage = [
    { label: "Interview Analysis", pct: 72, color: "bg-[#5b5cf6]" },
    { label: "Resume Parsing", pct: 55, color: "bg-purple-500" },
    { label: "Feedback Gen", pct: 83, color: "bg-emerald-500" },
    { label: "Skill Matching", pct: 41, color: "bg-amber-500" },
  ];

  const latency = [45, 62, 38, 71, 55, 88, 42, 66, 50, 74, 48, 60];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
      className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-6 text-[#dae2fd]"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#5b5cf6] text-[10px] font-bold uppercase tracking-widest font-mono mb-1">Admin Console</p>
          <h1 className="text-2xl md:text-3xl font-black text-white">Welcome back, {displayName}</h1>
          <p className="text-sm text-[#8b9ec7] mt-1">System is operational. All services running normally.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2.5 bg-[#131c30] border border-white/10 rounded-xl text-sm font-semibold text-[#dae2fd] flex items-center gap-2 hover:border-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
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

      {/* Toast */}
      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`px-4 py-3 rounded-xl text-sm font-medium border ${
            actionMessage.startsWith("✓")
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {actionMessage}
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="group" label="Total Users" value="12,482" sub="+14%" color="bg-[#5b5cf6]" delay={0.05} />
        <StatCard icon="videocam" label="Active Interviews" value="482" sub="Live now" color="bg-purple-600" delay={0.1} />
        <StatCard icon="payments" label="Monthly Revenue" value="$84,200" sub="+8%" color="bg-emerald-600" delay={0.15} />
        <StatCard icon="check_circle" label="System Status" value="99.98%" sub="HEALTHY" color="bg-teal-600" delay={0.2} />
      </div>

      {/* Pending Recruiter Approvals — prominent section */}
      <motion.div
        variants={cardVariants}
        className="bg-[#131c30] border border-amber-500/20 rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-400 text-[18px]">pending_actions</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Recruiter Approval Queue</h2>
              <p className="text-xs text-[#8b9ec7]">Review and approve recruiter account requests</p>
            </div>
          </div>
          {pendingRecruiters.length > 0 && (
            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full">
              {pendingRecruiters.length} Pending
            </span>
          )}
        </div>

        {pendingRecruiters.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-[#5b6fa8] text-4xl block mb-3">task_alt</span>
            <p className="text-[#8b9ec7] text-sm">No pending recruiter approvals.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pendingRecruiters.map((recruiter) => (
              <motion.div
                key={recruiter.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#5b5cf6]/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#5b5cf6] text-[18px]">person</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {recruiter.first_name} {recruiter.last_name}
                    </p>
                    <p className="text-xs text-[#8b9ec7] truncate">{recruiter.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-[#5b6fa8] text-[16px]">apartment</span>
                  <span className="text-sm text-[#8b9ec7] truncate">{recruiter.company_name || "—"}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="warning">Pending</Badge>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={loadingApproval === recruiter.id}
                    onClick={() => handleApprove(recruiter.id, `${recruiter.first_name} ${recruiter.last_name}`)}
                    className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {loadingApproval === recruiter.id ? "…" : "Approve"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={loadingApproval === recruiter.id}
                    onClick={() => handleReject(recruiter.id, `${recruiter.first_name} ${recruiter.last_name}`)}
                    className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Reject
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* AI Usage + API Latency Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div variants={cardVariants} className="lg:col-span-5 bg-[#131c30] border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-1">AI Usage & Resource Monitoring</h3>
          <p className="text-xs text-[#8b9ec7] mb-5">Token consumption across AI modules</p>
          <div className="space-y-4">
            {aiUsage.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#dae2fd] font-medium">{item.label}</span>
                  <span className="text-[#8b9ec7] font-mono">{item.pct}%</span>
                </div>
                <div className="h-2 bg-[#0f1829] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="lg:col-span-7 bg-[#131c30] border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-1">API Latency</h3>
          <p className="text-xs text-[#8b9ec7] mb-5">Average response time (ms) last 12 hours</p>
          <div className="flex items-end gap-2 h-32">
            {latency.map((val, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(val / 100) * 100}%` }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
                className={`flex-1 rounded-t ${val > 75 ? "bg-amber-500/60" : "bg-[#5b5cf6]/50"} hover:brightness-125 transition-all relative group`}
                style={{ height: `${(val / 100) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f1829] border border-white/10 px-1.5 py-0.5 rounded text-[9px] text-white whitespace-nowrap">
                  {val}ms
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-[#5b6fa8] font-mono">
            <span>12h ago</span>
            <span>6h ago</span>
            <span>Now</span>
          </div>
        </motion.div>
      </div>

      {/* Audit Logs */}
      <motion.div variants={cardVariants} className="bg-[#131c30] border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent Audit Logs</h3>
          <button className="text-[#5b5cf6] text-xs font-semibold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0f1829]/60 text-[#5b6fa8] uppercase tracking-wider font-mono text-[10px] border-b border-white/5">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLogs.map((log, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5 text-white font-medium">{log.user}</td>
                  <td className="px-5 py-3.5 text-[#8b9ec7]">{log.action}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={
                      log.type === "approve" ? "success" :
                      log.type === "system" ? "neutral" :
                      log.type === "export" ? "primary" : "secondary"
                    }>
                      {log.type}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right text-[#5b6fa8] font-mono">{log.time}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
