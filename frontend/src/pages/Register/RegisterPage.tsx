import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useRegister } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export function RegisterPage() {
  const navigate = useNavigate();
  const { error, clearError } = useAuth();
  const registerMutation = useRegister();

  const [form, setForm] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setValidationError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!form.email.trim()) { setValidationError("Email is required."); return; }
    if (!form.username.trim() || form.username.length < 3) { setValidationError("Username must be at least 3 characters."); return; }
    if (form.password.length < 8) { setValidationError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setValidationError("Passwords do not match."); return; }
    if (!form.agree) { setValidationError("Please agree to the Terms and Privacy Policy."); return; }

    try {
      await registerMutation.mutateAsync({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
      });
      navigate("/dashboard");
    } catch {
      // handled by auth context
    }
  };

  const displayedError = validationError || error;

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex overflow-hidden relative pt-14">
      <PublicNavbar />
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-24 w-80 h-80 bg-[#5b5cf6]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-purple-600/6 rounded-full blur-3xl" />
      </div>

      {/* ─── LEFT BRANDING PANEL ─── */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-14 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5b5cf6] rounded-xl flex items-center justify-center shadow-lg shadow-[#5b5cf6]/30">
            <span className="material-symbols-outlined text-white text-[20px]">bolt</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">SmartHire AI</span>
        </div>

        {/* Headline */}
        <div className="flex-1 flex flex-col justify-center -mt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Launch your<br />
              <span className="text-[#5b5cf6]">career faster.</span>
            </h1>
            <p className="text-[#8b9ec7] text-sm leading-relaxed mb-10 max-w-xs">
              AI-powered mock interviews, instant feedback, and smart resume analysis — all in one place.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#111827]/80 border border-white/8 rounded-xl p-4 flex gap-3 items-start"
            >
              <div className="w-9 h-9 bg-[#5b5cf6]/15 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#5b5cf6] text-[17px]">psychology</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-0.5">AI Mock Interviews</h3>
                <p className="text-[#8b9ec7] text-xs leading-relaxed">
                  Practice with a realistic AI interviewer trained on thousands of real interview patterns.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#111827]/80 border border-white/8 rounded-xl p-4 flex gap-3 items-start"
            >
              <div className="w-9 h-9 bg-[#5b5cf6]/15 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#5b5cf6] text-[17px]">analytics</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-0.5">Instant AI Feedback</h3>
                <p className="text-[#8b9ec7] text-xs leading-relaxed">
                  Get detailed performance reports and improvement tips after every session.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Status badge */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#111827]/80 border border-white/8 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[#8b9ec7] text-[10px] font-bold uppercase tracking-widest font-mono">
              Free to get started
            </span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[460px] bg-[#111827] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/40"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-[#5b5cf6] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
            </div>
            <span className="text-white font-bold">SmartHire AI</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
            <p className="text-[#8b9ec7] text-sm">Get started for free. No credit card required.</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {displayedError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2 items-start"
              >
                <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">error</span>
                {displayedError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">First Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5a7a] text-[17px]">person</span>
                  <input
                    type="text" name="first_name" value={form.first_name}
                    onChange={handleChange} placeholder="John"
                    className="w-full bg-[#0d1424] border border-white/8 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-[#4b5a7a] focus:outline-none focus:border-[#5b5cf6]/50 focus:ring-1 focus:ring-[#5b5cf6]/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Last Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5a7a] text-[17px]">person</span>
                  <input
                    type="text" name="last_name" value={form.last_name}
                    onChange={handleChange} placeholder="Doe"
                    className="w-full bg-[#0d1424] border border-white/8 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-[#4b5a7a] focus:outline-none focus:border-[#5b5cf6]/50 focus:ring-1 focus:ring-[#5b5cf6]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5a7a] text-[17px]">mail</span>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required placeholder="john@example.com"
                  className="w-full bg-[#0d1424] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4b5a7a] focus:outline-none focus:border-[#5b5cf6]/50 focus:ring-1 focus:ring-[#5b5cf6]/20 transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Username</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5a7a] text-[17px]">alternate_email</span>
                <input
                  type="text" name="username" value={form.username}
                  onChange={handleChange} required placeholder="john_doe"
                  className="w-full bg-[#0d1424] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4b5a7a] focus:outline-none focus:border-[#5b5cf6]/50 focus:ring-1 focus:ring-[#5b5cf6]/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[#dae2fd] text-sm font-medium">Password</label>
                <span className="text-[#4b5a7a] text-[10px] font-mono">Min. 8 characters</span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5a7a] text-[17px]">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" value={form.password}
                  onChange={handleChange} required minLength={8} placeholder="••••••••"
                  className="w-full bg-[#0d1424] border border-white/8 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-[#4b5a7a] focus:outline-none focus:border-[#5b5cf6]/50 focus:ring-1 focus:ring-[#5b5cf6]/20 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4b5a7a] hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[17px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5a7a] text-[17px]">lock</span>
                <input
                  type="password" name="confirmPassword" value={form.confirmPassword}
                  onChange={handleChange} required placeholder="••••••••"
                  className="w-full bg-[#0d1424] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4b5a7a] focus:outline-none focus:border-[#5b5cf6]/50 focus:ring-1 focus:ring-[#5b5cf6]/20 transition-all"
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} className="sr-only" />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${form.agree ? "bg-[#5b5cf6] border-[#5b5cf6]" : "border-white/20 bg-[#0d1424]"}`}>
                  {form.agree && <span className="material-symbols-outlined text-white text-[11px]">check</span>}
                </div>
              </div>
              <span className="text-[#8b9ec7] text-xs">
                I agree to the{" "}
                <span className="text-[#5b5cf6] hover:underline cursor-pointer">Terms</span>
                {" "}and{" "}
                <span className="text-[#5b5cf6] hover:underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={registerMutation.isPending}
              whileHover={{ scale: registerMutation.isPending ? 1 : 1.01 }}
              whileTap={{ scale: registerMutation.isPending ? 1 : 0.99 }}
              className="w-full py-3.5 bg-[#5b5cf6] hover:bg-[#4a4ae8] disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#5b5cf6]/25"
            >
              {registerMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-[#8b9ec7] text-xs mt-5">
            Already have an account?{" "}
            <Link to="/login" onClick={clearError} className="text-white font-semibold hover:text-[#5b5cf6] transition-colors">
              Sign in
            </Link>
          </p>

          {/* Divider + Google */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[#4b5a7a] text-[10px] font-bold uppercase tracking-widest font-mono">Or continue with</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <button className="w-full flex items-center justify-center gap-3 py-3 bg-[#0d1424] border border-white/8 rounded-xl text-[#dae2fd] text-sm font-medium hover:bg-white/5 transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </motion.div>
      </div>
    </div>
  );
}
