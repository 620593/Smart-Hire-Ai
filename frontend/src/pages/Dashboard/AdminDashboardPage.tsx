/**
 * AdminDashboardPage — Full-control admin panel for SmartHire AI.
 *
 * Tabs:
 *  1. Overview      — live platform stats + quick-action cards
 *  2. Recruiters    — list all, approve / reject / delete inline
 *  3. Users         — all platform users, activate / deactivate
 *  4. System Health — live DB / Gemini / Groq status probes
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AdminService,
  type PlatformStats,
  type SystemHealth,
  type ApiKeyStatus as ApiKeyStatusType,
  type UpdateApiKeysRequest,
} from "@/services/auth";
import type { User } from "@/types/auth";

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
const fade = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

// ---------------------------------------------------------------------------
// Tiny UI atoms
// ---------------------------------------------------------------------------

function Badge({ label, variant }: { label: string; variant: "success" | "warning" | "error" | "neutral" }) {
  const cls = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10  text-amber-400  border-amber-500/20",
    error:   "bg-red-500/10    text-red-400    border-red-500/20",
    neutral: "bg-white/5       text-slate-400  border-white/10",
  }[variant];
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border font-mono ${cls}`}>
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  );
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: string; label: string; value: string | number; sub: string; color: string;
}) {
  return (
    <motion.div
      variants={fade}
      className="glass-card p-5 rounded-xl flex items-center gap-4 border border-white/5"
    >
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-white text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{sub}</p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Overview
// ---------------------------------------------------------------------------

function OverviewTab({ stats, loading }: { stats: PlatformStats | null; loading: boolean }) {
  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon="group"            label="Total Users"         value={loading ? "…" : stats?.total_users ?? 0}          sub="All roles"                  color="bg-primary/70" />
        <StatCard icon="badge"            label="Recruiters"          value={loading ? "…" : stats?.total_recruiters ?? 0}      sub="All statuses"               color="bg-violet-600/70" />
        <StatCard icon="person"           label="Candidates"          value={loading ? "…" : stats?.total_candidates ?? 0}      sub="Registered"                 color="bg-sky-600/70" />
        <StatCard icon="pending"          label="Pending Approval"    value={loading ? "…" : stats?.pending_recruiters ?? 0}    sub="Need review"                color="bg-amber-500/70" />
        <StatCard icon="check_circle"     label="Active Recruiters"   value={loading ? "…" : stats?.active_recruiters ?? 0}    sub="Approved & active"          color="bg-emerald-600/70" />
        <StatCard icon="block"            label="Suspended"           value={loading ? "…" : stats?.suspended_recruiters ?? 0} sub="Deactivated accounts"       color="bg-red-600/70" />
      </div>

      {/* Quick-action tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "how_to_reg",  title: "Recruiter Approvals",   body: "Review and approve new recruiter accounts waiting for access.",              tab: 1, cta: "Review Now",   color: "border-amber-500/30  bg-amber-500/5"  },
          { icon: "manage_accounts", title: "User Management",   body: "View, activate, or deactivate any user account on the platform.",            tab: 2, cta: "Manage Users", color: "border-primary/30    bg-primary/5"    },
          { icon: "monitor_heart", title: "System Health",       body: "Live status of PostgreSQL, Gemini 3.1 Flash-Lite, and Groq llama-3.3-70b.",       tab: 3, cta: "Check Health", color: "border-emerald-500/30 bg-emerald-500/5" },
        ].map(({ icon, title, body, cta, color }) => (
          <motion.div
            key={title}
            variants={fade}
            className={`glass-card p-6 rounded-xl border ${color} flex flex-col gap-3`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
              <span className="font-bold text-white text-sm">{title}</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed flex-1">{body}</p>
            <span className="text-xs font-bold text-primary font-mono">{cta} →</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Recruiters
// ---------------------------------------------------------------------------

function RecruitersTab() {
  const [recruiters, setRecruiters] = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<"all" | "pending" | "active" | "suspended">("all");
  const [search, setSearch]       = useState("");
  const [acting, setActing]       = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecruiters(await AdminService.listAllRecruiters()); }
    catch { showToast("Failed to load recruiters", false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = recruiters.filter((r) => {
    const matchesSearch =
      search === "" ||
      `${r.first_name} ${r.last_name} ${r.email} ${r.company_name ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "pending"   && !r.is_approved) ||
      (filter === "active"    && r.is_approved && r.is_active) ||
      (filter === "suspended" && !r.is_active);
    return matchesSearch && matchesFilter;
  });

  const act = async (id: string, action: "approve" | "reject" | "delete") => {
    setActing(id + action);
    try {
      if (action === "approve") { await AdminService.approveRecruiter(id); showToast("Recruiter approved"); }
      if (action === "reject")  { await AdminService.rejectRecruiter(id);  showToast("Recruiter suspended"); }
      if (action === "delete")  { await AdminService.deleteRecruiter(id);  showToast("Recruiter deleted"); }
      await load();
    } catch { showToast("Action failed", false); }
    finally { setActing(null); }
  };

  const statusBadge = (r: User) => {
    if (!r.is_approved && !r.is_active) return <Badge label="Pending"   variant="warning" />;
    if (r.is_approved  &&  r.is_active) return <Badge label="Active"    variant="success" />;
    return                                     <Badge label="Suspended" variant="error"   />;
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl border ${toast.ok ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-300" : "bg-red-900/80 border-red-500/30 text-red-300"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
          <input
            className="w-full bg-slate-800/60 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
            placeholder="Search by name, email, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 border border-white/5">
          {(["all", "pending", "active", "suspended"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${filter === f ? "bg-primary/20 text-primary" : "text-slate-400 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 transition-colors">
          <span className="material-symbols-outlined text-slate-400 text-sm">refresh</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/60">
                {["Recruiter", "Company", "Email", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-sm">No recruiters found</td></tr>
              ) : filtered.map((r) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {(r.first_name?.[0] ?? r.username?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{r.first_name} {r.last_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">@{r.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.company_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{r.email}</td>
                  <td className="px-4 py-3">{statusBadge(r)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {/* Approve — only if not already approved */}
                      {!r.is_approved && (
                        <button onClick={() => act(r.id, "approve")}
                          disabled={!!acting}
                          title="Approve"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-40">
                          {acting === r.id + "approve" ? <Spinner /> : <span className="material-symbols-outlined text-base">check_circle</span>}
                        </button>
                      )}
                      {/* Suspend — only if currently active */}
                      {r.is_active && r.is_approved && (
                        <button onClick={() => act(r.id, "reject")}
                          disabled={!!acting}
                          title="Suspend"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors disabled:opacity-40">
                          {acting === r.id + "reject" ? <Spinner /> : <span className="material-symbols-outlined text-base">block</span>}
                        </button>
                      )}
                      {/* Reinstate — if suspended */}
                      {!r.is_active && r.is_approved && (
                        <button onClick={() => act(r.id, "approve")}
                          disabled={!!acting}
                          title="Reinstate"
                          className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors disabled:opacity-40">
                          <span className="material-symbols-outlined text-base">restart_alt</span>
                        </button>
                      )}
                      {/* Delete */}
                      <button onClick={() => { if (window.confirm(`Delete ${r.first_name ?? r.username}? This cannot be undone.`)) act(r.id, "delete"); }}
                        disabled={!!acting}
                        title="Delete permanently"
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-40">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-white/5 bg-slate-900/40 text-xs text-slate-500 font-mono">
          {filtered.length} / {recruiters.length} recruiters
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Users
// ---------------------------------------------------------------------------

function UsersTab() {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [acting, setActing]   = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await AdminService.listAllUsers()); }
    catch { showToast("Failed to load users", false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) =>
    search === "" ||
    `${u.first_name} ${u.last_name} ${u.email} ${u.username}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = async (u: User) => {
    setActing(u.id);
    try {
      if (u.is_active) { await AdminService.deactivateUser(u.id); showToast(`Deactivated ${u.username}`); }
      else             { await AdminService.activateUser(u.id);   showToast(`Activated ${u.username}`);   }
      await load();
    } catch { showToast("Action failed", false); }
    finally { setActing(null); }
  };

  const roleLabel = (u: User) => {
    const r = u.roles?.[0]?.toLowerCase?.() ?? "candidate";
    if (r.includes("admin"))     return <Badge label="Admin"     variant="neutral" />;
    if (r.includes("recruiter")) return <Badge label="Recruiter" variant="warning" />;
    return                              <Badge label="Candidate" variant="neutral" />;
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl border ${toast.ok ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-300" : "bg-red-900/80 border-red-500/30 text-red-300"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
          <input
            className="w-full bg-slate-800/60 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
            placeholder="Search users by name, email, username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700">
          <span className="material-symbols-outlined text-slate-400 text-sm">refresh</span>
        </button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/60">
                {["User", "Email", "Role", "Status", "Last Login", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Spinner /></td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
                        {(u.first_name?.[0] ?? u.username?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.first_name} {u.last_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">{roleLabel(u)}</td>
                  <td className="px-4 py-3">
                    {u.is_active ? <Badge label="Active" variant="success" /> : <Badge label="Inactive" variant="error" />}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(u)} disabled={acting === u.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${u.is_active ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
                      {acting === u.id ? "…" : u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-white/5 bg-slate-900/40 text-xs text-slate-500 font-mono">
          {filtered.length} users
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: System Health
// ---------------------------------------------------------------------------

function HealthDot({ status }: { status: "ok" | "degraded" | "unconfigured" }) {
  const cls = { ok: "bg-emerald-400", degraded: "bg-red-400 animate-pulse", unconfigured: "bg-amber-400" }[status];
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />;
}

function SystemHealthTab() {
  const [health, setHealth]   = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const h = await AdminService.getSystemHealth();
      setHealth(h);
      setLastChecked(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const statusBadge = (s: "ok" | "degraded" | "unconfigured") => ({
    ok:            <Badge label="Operational"   variant="success" />,
    degraded:      <Badge label="Degraded"      variant="error"   />,
    unconfigured:  <Badge label="Unconfigured"  variant="warning" />,
  }[s]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">Live System Status</h3>
          {lastChecked && (
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={check} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-50">
          {loading ? <Spinner /> : <span className="material-symbols-outlined text-sm">refresh</span>}
          Re-check
        </motion.button>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {health ? [
          { label: "PostgreSQL Database",  data: health.database },
          { label: health.gemini.service || "Gemini 3.1 Flash-Lite", data: health.gemini },
          { label: "Groq llama-3.3-70b",   data: health.groq     },
        ].map(({ label, data }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-5 rounded-xl border ${data.status === "ok" ? "border-emerald-500/20" : data.status === "degraded" ? "border-red-500/20" : "border-amber-500/20"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HealthDot status={data.status} />
                <span className="text-white font-bold text-sm">{label}</span>
              </div>
              {statusBadge(data.status)}
            </div>
            <div className="space-y-2">
              {data.latency_ms !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Latency</span>
                  <span className={`font-mono font-bold ${data.latency_ms < 500 ? "text-emerald-400" : data.latency_ms < 1500 ? "text-amber-400" : "text-red-400"}`}>
                    {data.latency_ms.toFixed(0)} ms
                  </span>
                </div>
              )}
              {data.detail && (
                <p className="text-[11px] text-slate-500 font-mono leading-relaxed break-all">{data.detail}</p>
              )}
              {data.status === "unconfigured" && (
                <p className="text-[11px] text-amber-400/80 leading-relaxed">
                  Add the API key to <code className="font-mono bg-white/5 px-1 rounded">backend/.env</code>
                </p>
              )}
            </div>
          </motion.div>
        )) : (
          <div className="md:col-span-3 py-12 text-center">
            {loading ? <Spinner /> : <p className="text-slate-500">Click Re-check to probe services</p>}
          </div>
        )}
      </div>

      {/* Config reference */}
      <div className="glass-card p-5 rounded-xl border border-white/5">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">settings</span>
          Environment Variables Reference
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: "GOOGLE_API_KEY",  svc: "Gemini 3.1 Flash-Lite",   url: "https://aistudio.google.com/app/apikey" },
            { key: "GROQ_API_KEY",    svc: "Groq llama-3.3-70b", url: "https://console.groq.com/keys" },
            { key: "DATABASE_*",      svc: "PostgreSQL",          url: "" },
          ].map(({ key, svc, url }) => (
            <div key={key} className="p-3 rounded-lg bg-slate-800/60 border border-white/5">
              <code className="text-primary text-xs font-mono block mb-1">{key}</code>
              <p className="text-slate-400 text-xs">{svc}</p>
              {url && <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-primary/60 hover:text-primary font-mono">Get key →</a>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: API Keys
// ---------------------------------------------------------------------------

function ApiKeysTab() {
  const [keys, setKeys]       = useState<ApiKeyStatusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [form, setForm]       = useState<UpdateApiKeysRequest>({ google_api_key: "", groq_api_key: "" });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    AdminService.getApiKeys()
      .then((res) => setKeys(res.keys))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.google_api_key?.trim() && !form.groq_api_key?.trim()) {
      showToast("Enter at least one key to update.");
      return;
    }
    setSaving(true);
    try {
      const payload: UpdateApiKeysRequest = {};
      if (form.google_api_key?.trim()) payload.google_api_key = form.google_api_key.trim();
      if (form.groq_api_key?.trim())   payload.groq_api_key   = form.groq_api_key.trim();
      const res = await AdminService.updateApiKeys(payload);
      showToast("✓ " + res.message);
      setForm({ google_api_key: "", groq_api_key: "" });
      // Refresh key statuses
      const fresh = await AdminService.getApiKeys();
      setKeys(fresh.keys);
    } catch {
      showToast("✗ Failed to update API keys.");
    } finally {
      setSaving(false);
    }
  };

  const KEY_META: Record<string, { label: string; icon: string; color: string; placeholder: string }> = {
    GOOGLE_API_KEY: { label: "Google Gemini API Key", icon: "psychology", color: "bg-blue-500/20 border-blue-500/30", placeholder: "AIzaSy..." },
    GROQ_API_KEY:   { label: "Groq API Key",          icon: "bolt",       color: "bg-orange-500/20 border-orange-500/30", placeholder: "gsk_..." },
  };

  return (
    <motion.div initial="hidden" animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium border ${
              toast.startsWith("✓") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current key status */}
      <motion.div variants={fade} className="glass-card rounded-xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Current API Key Status</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Masked previews — values are never transmitted in full</p>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.map((key) => {
              const meta = KEY_META[key.name] ?? { label: key.name, icon: "key", color: "bg-white/5 border-white/10", placeholder: "" };
              return (
                <div key={key.name} className="p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center border shrink-0`}>
                    <span className="material-symbols-outlined text-white text-base">{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{meta.label}</p>
                    <p className="text-xs text-slate-500 font-mono">{key.service}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {key.is_set ? (
                      <>
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                          {showKey[key.name] ? key.masked_value : "•••• •••• " + key.masked_value.slice(-4)}
                        </span>
                        <button onClick={() => setShowKey((p) => ({ ...p, [key.name]: !p[key.name] }))}
                          className="text-slate-500 hover:text-slate-300 transition-colors">
                          <span className="material-symbols-outlined text-base">
                            {showKey[key.name] ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">SET</span>
                      </>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded font-mono">NOT SET</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Update form */}
      <motion.div variants={fade} className="glass-card p-6 rounded-xl border border-white/5">
        <h3 className="text-sm font-bold text-white mb-1">Update API Keys</h3>
        <p className="text-xs text-on-surface-variant mb-5">Changes take effect immediately and are persisted to the .env file. Leave a field blank to keep the existing key.</p>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Google API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400 text-sm">psychology</span>
              GOOGLE_API_KEY — Gemini 3.1 Flash-Lite
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={form.google_api_key ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, google_api_key: e.target.value }))}
                placeholder="AIzaSy..."
                autoComplete="off"
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Groq API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400 text-sm">bolt</span>
              GROQ_API_KEY — llama-3.3-70b-versatile
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={form.groq_api_key ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, groq_api_key: e.target.value }))}
                placeholder="gsk_..."
                autoComplete="off"
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={saving}
              className="px-6 py-2.5 bg-primary text-slate-900 text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {saving ? <><div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> Saving…</> : <><span className="material-symbols-outlined text-base">save</span>Update Keys</>}
            </motion.button>
            <p className="text-[10px] text-slate-600 font-mono">Keys are encrypted at rest in .env</p>
          </div>
        </form>
      </motion.div>

      {/* Security note */}
      <motion.div variants={fade} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-400 text-base mt-0.5">security</span>
        <div>
          <p className="text-xs font-bold text-amber-400 mb-1">Security Notice</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            API keys grant access to paid AI services. Only update if your current keys have expired or been rotated.
            Never share keys in logs, screenshots, or bug reports. If a key is compromised, rotate it immediately on the provider's dashboard.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const TABS = [
  { id: 0, label: "Overview",      icon: "dashboard"       },
  { id: 1, label: "Recruiters",    icon: "badge"           },
  { id: 2, label: "All Users",     icon: "group"           },
  { id: 3, label: "System Health", icon: "monitor_heart"   },
  { id: 4, label: "API Keys",      icon: "key"             },
];

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats]         = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setStats(await AdminService.getPlatformStats()); }
      catch { /* stats are supplemental — fail silently */ }
      finally { setStatsLoading(false); }
    })();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-6 text-[#dae2fd]">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest font-mono">Admin Control Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SmartHire AI Administration</h1>
          <p className="text-sm text-slate-400 mt-0.5">Full platform control — manage users, monitor APIs, oversee recruiters</p>
        </div>
        <div className="flex items-center gap-2">
          {stats && stats.pending_recruiters > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(1)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-all">
              <span className="w-5 h-5 bg-amber-500 text-slate-900 text-xs font-black rounded-full flex items-center justify-center">
                {stats.pending_recruiters}
              </span>
              Pending Approvals
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 bg-slate-900/60 border border-white/5 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.id
                ? "bg-primary/15 text-primary border border-primary/20 shadow"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}>
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
            {t.id === 1 && stats && stats.pending_recruiters > 0 && (
              <span className="w-4 h-4 bg-amber-500 text-slate-900 text-[9px] font-black rounded-full flex items-center justify-center">
                {stats.pending_recruiters}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}>
          {activeTab === 0 && <OverviewTab stats={stats} loading={statsLoading} />}
          {activeTab === 1 && <RecruitersTab />}
          {activeTab === 2 && <UsersTab />}
          {activeTab === 3 && <SystemHealthTab />}
          {activeTab === 4 && <ApiKeysTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
