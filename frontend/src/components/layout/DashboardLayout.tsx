import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const EXPANDED = 260;
const COLLAPSED = 72;

export function DashboardLayout() {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
  };

  const isActive = (path: string) => location.pathname === path;

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const isRecruiter = roles.includes("recruiter");

  const menuItems = isAdmin
    ? [
        { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { to: "/interviews", label: "Interviews", icon: "videocam" },
        { to: "/candidates", label: "Candidates", icon: "group" },
        { to: "/reports", label: "Reports", icon: "analytics" },
        { to: "/ai-config", label: "AI Config", icon: "tune" },
        { to: "/audit-logs", label: "Audit Logs", icon: "history" },
      ]
    : isRecruiter
    ? [
        { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { to: "/interviews", label: "Interviews", icon: "videocam" },
        { to: "/candidates", label: "Candidates", icon: "group" },
        { to: "/reports", label: "Reports", icon: "analytics" },
        { to: "/library", label: "Library", icon: "folder" },
        { to: "/team", label: "Team", icon: "people" },
      ]
    : [
        { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { to: "/resume", label: "Resume", icon: "description" },
        { to: "/interviews", label: "Mock Interviews", icon: "videocam" },
        { to: "/reports", label: "AI Feedback", icon: "analytics" },
      ];

  const roleLabel = isAdmin
    ? "Enterprise Admin"
    : isRecruiter
    ? `Recruiter · ${user?.company_name ?? ""}`
    : "Candidate";

  const displayName = user?.first_name ?? user?.username ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const navItemClass = (to: string) =>
    `flex items-center rounded-xl transition-all duration-150 relative
    ${isCollapsed ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3 py-2.5 w-full"}
    ${isActive(to)
      ? "bg-[#5b5cf6]/15 text-[#5b5cf6] shadow-[inset_0_0_0_1px_rgba(91,92,246,0.25)]"
      : "text-[#8b9ec7] hover:bg-white/5 hover:text-white"
    }`;

  const iconClass = (to: string) =>
    `material-symbols-outlined shrink-0 transition-colors
    ${isCollapsed ? "text-[22px]" : "text-[20px]"}
    ${isActive(to) ? "text-[#5b5cf6]" : "text-inherit"}`;

  const showTooltip = (e: React.MouseEvent<HTMLElement>, label: string) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, y: rect.top + rect.height / 2 });
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#dae2fd] flex overflow-hidden">

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0e1628]/90 backdrop-blur-md border-b border-white/8 z-40 flex items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#5b5cf6] flex items-center justify-center shadow-lg shadow-[#5b5cf6]/30">
            <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
          </div>
          <span className="font-bold text-base text-white tracking-tight">SmartHire AI</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-[#0e1628] border-r border-white/8 z-50 flex flex-col p-5 gap-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#5b5cf6] flex items-center justify-center shadow-lg shadow-[#5b5cf6]/30">
                    <span className="material-symbols-outlined text-white text-[18px]">bolt</span>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">SmartHire AI</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest font-mono text-[#5b6fa8]">{roleLabel}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[#8b9ec7]"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.to)
                        ? "bg-[#5b5cf6]/15 text-[#5b5cf6]"
                        : "text-[#8b9ec7] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-1 pt-4 border-t border-white/8">
                <Link
                  to="/help"
                  className="flex items-center gap-3 px-3 py-2.5 text-[#8b9ec7] hover:bg-white/5 hover:text-white rounded-xl text-sm font-medium transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">help</span>
                  Help Center
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 text-[#8b9ec7] hover:bg-white/5 hover:text-white rounded-xl text-sm font-medium transition-all text-left w-full"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Log Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: isCollapsed ? COLLAPSED : EXPANDED }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="hidden lg:flex h-screen fixed left-0 top-0 bg-[#0e1628] border-r border-white/8 flex-col z-30 overflow-hidden"
      >
        {/* Header */}
        <div
          className={`flex items-center shrink-0 h-16 border-b border-white/8 ${
            isCollapsed ? "justify-center px-0" : "justify-between px-4"
          }`}
        >
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              title="Expand sidebar"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#5b5cf6] shadow-lg shadow-[#5b5cf6]/30 hover:bg-[#4a4ae8] transition-colors"
            >
              <span className="material-symbols-outlined text-white text-[18px]">bolt</span>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[#5b5cf6] flex items-center justify-center shrink-0 shadow-lg shadow-[#5b5cf6]/30">
                  <span className="material-symbols-outlined text-white text-[18px]">bolt</span>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <span className="font-bold text-sm text-white whitespace-nowrap block">SmartHire AI</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest font-mono text-[#5b6fa8] whitespace-nowrap">
                    {roleLabel}
                  </span>
                </motion.div>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                title="Collapse sidebar"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-[#5b6fa8] hover:text-white transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav
          className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden py-4 ${
            isCollapsed ? "items-center gap-1 px-0" : "gap-1 px-3"
          }`}
        >
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={navItemClass(item.to)}
              onMouseEnter={(e) => showTooltip(e, item.label)}
              onMouseLeave={() => setTooltip(null)}
            >
              <span className={iconClass(item.to)}>{item.icon}</span>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive(item.to) && !isCollapsed && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#5b5cf6] rounded-full"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={`flex flex-col shrink-0 pb-4 pt-3 border-t border-white/8 ${
            isCollapsed ? "items-center gap-1 px-0" : "gap-1 px-3"
          }`}
        >
          {/* User info (expanded only) */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-3 py-2.5 mb-1"
            >
              <div className="w-8 h-8 rounded-full bg-[#5b5cf6]/20 border border-[#5b5cf6]/30 flex items-center justify-center text-[11px] font-bold text-[#5b5cf6] shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-[#5b6fa8] truncate">{user?.email}</p>
              </div>
            </motion.div>
          )}

          <Link
            to="/help"
            className={`flex items-center rounded-xl transition-all text-[#8b9ec7] hover:bg-white/5 hover:text-white ${
              isCollapsed ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3 py-2.5"
            }`}
            onMouseEnter={(e) => showTooltip(e, "Help Center")}
            onMouseLeave={() => setTooltip(null)}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">help</span>
            {!isCollapsed && <span className="text-sm font-medium">Help Center</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl transition-all text-[#8b9ec7] hover:bg-red-500/10 hover:text-red-400 text-left w-full ${
              isCollapsed ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3 py-2.5"
            }`}
            onMouseEnter={(e) => showTooltip(e, "Log Out")}
            onMouseLeave={() => setTooltip(null)}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            {!isCollapsed && <span className="text-sm font-medium">Log Out</span>}
          </button>

          {/* Expand button (collapsed only) */}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl text-[#5b6fa8] hover:bg-white/5 hover:text-white transition-all"
              onMouseEnter={(e) => showTooltip(e, "Expand")}
              onMouseLeave={() => setTooltip(null)}
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          )}
        </div>
      </motion.aside>

      {/* Tooltip for collapsed state */}
      {isCollapsed && tooltip && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ left: COLLAPSED + 10, top: tooltip.y - 16 }}
        >
          <div className="bg-[#1a2540] border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            {tooltip.label}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <motion.div
        animate={{ paddingLeft: isCollapsed ? COLLAPSED : EXPANDED }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="flex-1 w-full min-h-screen flex flex-col pt-14 lg:pt-0"
      >
        <main className="flex-grow w-full flex flex-col">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
