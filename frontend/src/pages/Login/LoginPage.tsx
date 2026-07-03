import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useLogin } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export function LoginPage() {
  const navigate = useNavigate();
  const { error, clearError } = useAuth();
  const loginMutation = useLogin();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!identifier.trim()) { setValidationError("Please enter your email or username."); return; }
    if (!password.trim()) { setValidationError("Please enter your password."); return; }

    try {
      await loginMutation.mutateAsync({ username_or_email: identifier.trim(), password: password.trim() });
      navigate("/dashboard");
    } catch {
      // error handled by auth context
    }
  };

  const displayedError = validationError || error;

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex overflow-hidden relative pt-14">
      <PublicNavbar />
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#5b5cf6]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-600/6 rounded-full blur-[100px]" />
        {/* Sparkles — bottom-right of page like in the design */}
        <div className="absolute bottom-12 right-8 opacity-40">
          <svg width="80" height="70" viewBox="0 0 80 70" fill="none">
            <path d="M58 10 L60 18 L68 20 L60 22 L58 30 L56 22 L48 20 L56 18 Z" fill="#5b5cf6" opacity="0.7"/>
            <path d="M72 28 L73 32 L77 33 L73 34 L72 38 L71 34 L67 33 L71 32 Z" fill="#a78bfa" opacity="0.9"/>
            <path d="M46 38 L47 41 L50 42 L47 43 L46 46 L45 43 L42 42 L45 41 Z" fill="#818cf8" opacity="0.6"/>
          </svg>
        </div>
      </div>

      {/* ─── LEFT BRANDING PANEL ─── */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] p-14 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#1e2340] rounded-xl flex items-center justify-center border border-white/10">
            {/* Robot icon matching the design */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="8" width="18" height="11" rx="3" fill="#dae2fd" opacity="0.9"/>
              <rect x="9" y="4" width="6" height="5" rx="2" fill="#dae2fd" opacity="0.7"/>
              <circle cx="8.5" cy="13" r="1.5" fill="#0a0f1e"/>
              <circle cx="15.5" cy="13" r="1.5" fill="#0a0f1e"/>
              <rect x="9" y="16" width="6" height="1.5" rx="0.75" fill="#0a0f1e"/>
              <rect x="1" y="11" width="2.5" height="5" rx="1.25" fill="#dae2fd" opacity="0.5"/>
              <rect x="20.5" y="11" width="2.5" height="5" rx="1.25" fill="#dae2fd" opacity="0.5"/>
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">SmartHire AI</span>
        </div>

        {/* Main content — vertically centered */}
        <div className="flex-1 flex flex-col justify-center -mt-16">
          {/* Testimonial card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 24 }}
            className="bg-[#111827]/70 border border-white/8 rounded-2xl p-6 max-w-sm backdrop-blur-md"
          >
            {/* Avatar + Name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-sm font-bold text-white">
                SJ
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Sarah Jenkins</p>
                <p className="text-[#8b9ec7] text-xs">Director of Talent, InnovateCorp</p>
              </div>
            </div>

            {/* Quote */}
            <div className="border-l-2 border-[#5b5cf6] pl-4 mb-4">
              <p className="text-[#dae2fd] text-sm italic leading-relaxed">
                "The AI-driven assessments provided insights we previously took weeks to gather.
                It has completely transformed our technical hiring funnel with unparalleled precision."
              </p>
            </div>

            {/* Tags */}
            <div className="flex gap-2">
              <span className="text-[10px] font-mono font-bold bg-[#1a2540] border border-white/10 text-[#8b9ec7] px-2.5 py-1 rounded-full">
                High Accuracy
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#1a2540] border border-white/10 text-[#8b9ec7] px-2.5 py-1 rounded-full">
                Real-time Analysis
              </span>
            </div>
          </motion.div>

          {/* Feature badges */}
          <div className="flex gap-3 mt-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-2 bg-[#111827]/70 border border-white/8 rounded-xl px-4 py-2.5"
            >
              <span className="material-symbols-outlined text-[#5b5cf6] text-[16px]">verified</span>
              <span className="text-[#dae2fd] text-xs font-mono font-bold">Bias-Free Screening</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex items-center gap-2 bg-[#111827]/70 border border-white/8 rounded-xl px-4 py-2.5"
            >
              <span className="material-symbols-outlined text-[#5b5cf6] text-[16px]">timer</span>
              <span className="text-[#dae2fd] text-xs font-mono font-bold">Instant Feedback</span>
            </motion.div>
          </div>
        </div>

        {/* Empty bottom space for design balance */}
        <div />
      </div>

      {/* ─── RIGHT FORM PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-[#1e2340] rounded-xl flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-white text-[18px]">bolt</span>
            </div>
            <span className="text-white font-bold text-lg">SmartHire AI</span>
          </div>

          {/* Heading */}
          <h1 className="text-[2rem] font-bold text-white mb-1.5 leading-tight">Welcome back</h1>
          <p className="text-[#8b9ec7] text-sm mb-8">Log in to your SmartHire AI account</p>

          {/* Error */}
          <AnimatePresence>
            {displayedError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">error</span>
                {displayedError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username */}
            <div>
              <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Email address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5b6fa8] text-[18px] pointer-events-none">
                  mail
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setValidationError(null); clearError(); }}
                  placeholder="name@company.com"
                  disabled={loginMutation.isPending}
                  className="w-full bg-[#111827] border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-[#4b5a7a] focus:outline-none focus:border-[#5b5cf6]/50 focus:ring-1 focus:ring-[#5b5cf6]/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[#dae2fd] text-sm font-medium">Password</label>
                <button type="button" className="text-[#8b9ec7] text-xs hover:text-white transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5b6fa8] text-[18px] pointer-events-none">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setValidationError(null); clearError(); }}
                  placeholder="••••••••"
                  disabled={loginMutation.isPending}
                  className="w-full bg-[#111827] border border-white/8 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-[#4b5a7a] focus:outline-none focus:border-[#5b5cf6]/50 focus:ring-1 focus:ring-[#5b5cf6]/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5b6fa8] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loginMutation.isPending}
              whileHover={{ scale: loginMutation.isPending ? 1 : 1.01 }}
              whileTap={{ scale: loginMutation.isPending ? 1 : 0.99 }}
              className="w-full py-3.5 bg-[#5b5cf6] hover:bg-[#4a4ae8] disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#5b5cf6]/25 mt-2"
            >
              {loginMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[#4b5a7a] text-[10px] font-bold uppercase tracking-[0.15em] font-mono">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Social — Google only (GitHub removed per user request) */}
          <button className="w-full flex items-center justify-center gap-3 py-3 bg-[#111827] border border-white/8 rounded-xl text-[#dae2fd] text-sm font-medium hover:bg-white/5 hover:border-white/12 transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Sign up link */}
          <p className="text-center text-[#8b9ec7] text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/get-started" onClick={clearError} className="text-white font-semibold hover:text-[#5b5cf6] transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
