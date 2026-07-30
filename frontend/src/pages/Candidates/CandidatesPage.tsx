import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminService } from "@/services/auth";
import type { User } from "@/types/auth";

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await AdminService.listCandidates();
        setCandidates(data);
      } catch (err: any) {
        console.error("Failed to load candidates:", err);
        setError("Failed to load candidate list. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = candidates.filter((c) => {
    const term = search.toLowerCase();
    const fullName = `${c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase();
    const username = (c.username ?? "").toLowerCase();
    const email = (c.email ?? "").toLowerCase();
    return fullName.includes(term) || username.includes(term) || email.includes(term);
  });

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-6 text-[#dae2fd]">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#5b5cf6] text-xl">group</span>
            <span className="text-xs font-bold text-[#5b5cf6] uppercase tracking-widest font-mono">
              Talent Directory
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Candidates</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            View and manage all candidates registered on the SmartHire AI platform
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate by name, username, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5b5cf6] transition-colors"
          />
        </div>
      </motion.div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-xl bg-[#5b5cf6]/15 border border-[#5b5cf6]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#5b5cf6] text-2xl">groups</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Registered Candidates</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {loading ? "…" : candidates.length}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Accounts</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {loading ? "…" : candidates.filter((c) => c.is_active).length}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-sky-400 text-2xl">verified</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Verified Email Accounts</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {loading ? "…" : candidates.filter((c) => c.is_verified).length}
            </p>
          </div>
        </div>
      </div>

      {/* ── Candidates Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/5 overflow-hidden bg-slate-900/40"
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#5b5cf6]">badge</span>
            All Candidates List ({filtered.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-[#5b5cf6]/30 border-t-[#5b5cf6] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-sm font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            {search ? "No candidate matching your search term." : "No candidates found on the platform."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Candidate Name</th>
                  <th className="py-3.5 px-6">Username</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                <AnimatePresence>
                  {filtered.map((c) => {
                    const fullName =
                      c.first_name || c.last_name
                        ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()
                        : c.username;
                    const initials = fullName.slice(0, 2).toUpperCase();

                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b5cf6] to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-white">{fullName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-400">@{c.username}</td>
                        <td className="py-4 px-6 font-mono text-slate-300">{c.email}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            {c.is_active ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded font-mono">
                                INACTIVE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : "N/A"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
