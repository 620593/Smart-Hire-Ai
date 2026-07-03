import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const card = {
  hidden: { y: 32, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 240, damping: 22 } },
};

export function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#0b1220] flex flex-col items-center justify-center p-6 pt-20 relative overflow-hidden">
      <PublicNavbar />
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#5b5cf6]/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/8 blur-3xl pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-3"
      >
        <div className="w-10 h-10 bg-[#5b5cf6] rounded-xl flex items-center justify-center shadow-lg shadow-[#5b5cf6]/30">
          <span className="material-symbols-outlined text-white text-xl">bolt</span>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">SmartHire AI</span>
      </motion.div>

      {/* Labels */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-center mb-10"
      >
        <p className="text-[#5b5cf6] text-xs font-bold uppercase tracking-[0.2em] font-mono mb-3">
          Get Started
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
          How will you use SmartHire AI?
        </h1>
        <p className="text-[#8b9ec7] text-sm max-w-sm mx-auto">
          Choose your role to get the right experience for your needs.
        </p>
      </motion.div>

      {/* Role Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl"
      >
        {/* Candidate */}
        <motion.div
          variants={card}
          whileHover={{ y: -4, boxShadow: "0 20px 50px rgba(91,92,246,0.18)" }}
          className="group bg-[#131c30] border border-white/8 hover:border-[#5b5cf6]/40 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-colors relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#5b5cf6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 bg-[#5b5cf6]/15 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#5b5cf6]/25 transition-colors">
            <span className="material-symbols-outlined text-[#5b5cf6] text-[32px]">school</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Candidate</h2>
          <p className="text-[#8b9ec7] text-xs leading-relaxed mb-7">
            Practice AI mock interviews, get feedback, improve your resume, and track your readiness score.
          </p>
          <Link
            to="/register"
            className="w-full py-3 bg-[#5b5cf6] hover:bg-[#4a4ae8] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 relative z-10"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Create Account
          </Link>
          <p className="text-[#8b9ec7] text-[11px] mt-3">
            Already have an account?{" "}
            <Link to="/login" className="text-[#5b5cf6] hover:underline">Log in</Link>
          </p>
        </motion.div>

        {/* Recruiter */}
        <motion.div
          variants={card}
          whileHover={{ y: -4, boxShadow: "0 20px 50px rgba(168,85,247,0.18)" }}
          className="group bg-[#131c30] border border-white/8 hover:border-purple-500/40 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-colors relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-4 right-4">
            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded-full">
              Approval Required
            </span>
          </div>
          <div className="w-16 h-16 bg-purple-500/15 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-500/25 transition-colors">
            <span className="material-symbols-outlined text-purple-400 text-[32px]">work</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Recruiter</h2>
          <p className="text-[#8b9ec7] text-xs leading-relaxed mb-7">
            Screen candidates with AI, schedule interviews, view analytics, and manage your talent pipeline.
          </p>
          <Link
            to="/recruiter-register"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 relative z-10"
          >
            <span className="material-symbols-outlined text-[16px]">business_center</span>
            Apply for Access
          </Link>
          <p className="text-[#8b9ec7] text-[11px] mt-3">
            Account requires admin approval.
          </p>
        </motion.div>

        {/* Admin */}
        <motion.div
          variants={card}
          whileHover={{ y: -4, boxShadow: "0 20px 50px rgba(16,185,129,0.1)" }}
          className="group bg-[#131c30] border border-white/8 hover:border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-colors relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-4 right-4">
            <span className="bg-slate-500/15 text-slate-400 border border-slate-500/20 text-[9px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded-full">
              Invite Only
            </span>
          </div>
          <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors">
            <span className="material-symbols-outlined text-emerald-400 text-[32px]">admin_panel_settings</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Administrator</h2>
          <p className="text-[#8b9ec7] text-xs leading-relaxed mb-7">
            Manage the platform, approve recruiter accounts, monitor AI usage, and view system audit logs.
          </p>
          <Link
            to="/login"
            className="w-full py-3 bg-[#0f1829] border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 relative z-10"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            Admin Sign In
          </Link>
          <p className="text-[#8b9ec7] text-[11px] mt-3">
            Contact your organization to get access.
          </p>
        </motion.div>
      </motion.div>

      {/* Bottom link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 text-[#8b9ec7] text-xs"
      >
        Already have an account?{" "}
        <Link to="/login" className="text-[#5b5cf6] hover:underline font-semibold">
          Sign in here
        </Link>
      </motion.p>
    </div>
  );
}
