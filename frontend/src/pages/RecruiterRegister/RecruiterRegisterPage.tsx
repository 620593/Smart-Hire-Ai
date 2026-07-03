import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthService } from "@/services/auth";
import { PublicNavbar } from "@/components/layout/PublicNavbar";


export function RecruiterRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    company_name: "",
    password: "",
    username: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agree) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await AuthService.registerRecruiter({
        full_name: form.full_name,
        email: form.email,
        username: form.username || form.email.split("@")[0],
        company_name: form.company_name,
        password: form.password,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#131c30] border border-white/10 rounded-2xl p-10 text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-emerald-400 text-3xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Application Submitted!</h2>
          <p className="text-[#8b9ec7] text-sm leading-relaxed mb-6">
            Your recruiter account request has been received. An admin will review and approve your
            account. You will be able to log in once approved.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3 bg-[#5b5cf6] hover:bg-[#4a4ae8] text-white font-semibold rounded-xl transition-colors text-center"
          >
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] flex overflow-hidden pt-14">
      <PublicNavbar />
      {/* Left Panel — Marketing */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#0f1a2e] to-[#0b1220]" />
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-[#5b5cf6]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-60 h-60 bg-purple-500/8 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-[#5b5cf6] rounded-xl flex items-center justify-center shadow-lg shadow-[#5b5cf6]/30">
              <span className="material-symbols-outlined text-white text-xl">bolt</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SmartHire AI</span>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Hire smarter,<br />
            <span className="text-[#5b5cf6]">not harder.</span>
          </h1>
          <p className="text-[#8b9ec7] text-base leading-relaxed mb-10 max-w-xs">
            The next generation of talent acquisition powered by sophisticated intelligence.
          </p>

          {/* Feature cards */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#131c30]/80 border border-white/8 rounded-xl p-5 flex gap-4 items-start"
            >
              <div className="w-10 h-10 bg-[#5b5cf6]/15 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#5b5cf6] text-[18px]">psychology</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">AI-driven candidate screening</h3>
                <p className="text-[#8b9ec7] text-xs leading-relaxed">
                  Our neural engine ranks candidates based on skill-match and potential with 98% accuracy.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-[#131c30]/80 border border-white/8 rounded-xl p-5 flex gap-4 items-start"
            >
              <div className="w-10 h-10 bg-[#5b5cf6]/15 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#5b5cf6] text-[18px]">calendar_today</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Automated scheduling</h3>
                <p className="text-[#8b9ec7] text-xs leading-relaxed">
                  Sync your calendar and let our AI handle the back-and-forth for every interview stage.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Status badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#131c30]/80 border border-white/8 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[#8b9ec7] text-[10px] font-bold uppercase tracking-widest font-mono">
              System Operational: Enterprise Tier
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[480px] bg-[#131c30] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Create your recruiter account</h2>
            <p className="text-[#8b9ec7] text-sm">Get started with a 14-day free trial. No credit card required.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"
            >
              <span className="material-symbols-outlined text-red-400 text-[16px] mt-0.5 shrink-0">error</span>
              <p className="text-red-400 text-xs">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6fa8] text-[18px]">person</span>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  placeholder="E.g. Sarah Jenkins"
                  className="w-full bg-[#0f1829] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5b6fa8] focus:outline-none focus:border-[#5b5cf6]/60 focus:ring-1 focus:ring-[#5b5cf6]/30 transition-all"
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Work Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6fa8] text-[18px]">mail</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="sarah@company.com"
                  className="w-full bg-[#0f1829] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5b6fa8] focus:outline-none focus:border-[#5b5cf6]/60 focus:ring-1 focus:ring-[#5b5cf6]/30 transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Username</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6fa8] text-[18px]">alternate_email</span>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  placeholder="sarah_jenkins"
                  className="w-full bg-[#0f1829] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5b6fa8] focus:outline-none focus:border-[#5b5cf6]/60 focus:ring-1 focus:ring-[#5b5cf6]/30 transition-all"
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-[#dae2fd] text-sm font-medium mb-1.5">Company Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6fa8] text-[18px]">apartment</span>
                <input
                  type="text"
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  required
                  placeholder="Acme Inc."
                  className="w-full bg-[#0f1829] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5b6fa8] focus:outline-none focus:border-[#5b5cf6]/60 focus:ring-1 focus:ring-[#5b5cf6]/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[#dae2fd] text-sm font-medium">Password</label>
                <span className="text-[#5b6fa8] text-[10px] font-mono">Min. 8 characters</span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6fa8] text-[18px]">lock</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-[#0f1829] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5b6fa8] focus:outline-none focus:border-[#5b5cf6]/60 focus:ring-1 focus:ring-[#5b5cf6]/30 transition-all"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border transition-all ${
                    form.agree
                      ? "bg-[#5b5cf6] border-[#5b5cf6]"
                      : "border-white/20 bg-[#0f1829]"
                  } flex items-center justify-center`}
                >
                  {form.agree && (
                    <span className="material-symbols-outlined text-white text-[11px]">check</span>
                  )}
                </div>
              </div>
              <span className="text-[#8b9ec7] text-xs">
                I agree to the{" "}
                <span className="text-[#5b5cf6] underline cursor-pointer">Terms</span>
                {" "}and{" "}
                <span className="text-[#5b5cf6] underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-3.5 bg-[#5b5cf6] hover:bg-[#4a4ae8] disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#5b5cf6]/25 mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account…
                </>
              ) : (
                <>
                  Create Account
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-[#8b9ec7] text-xs mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-white font-semibold hover:text-[#5b5cf6] transition-colors">
              Sign in
            </Link>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[#5b6fa8] text-[10px] font-bold uppercase tracking-widest font-mono">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 bg-[#0f1829] border border-white/10 rounded-xl text-[#dae2fd] text-sm font-medium hover:bg-white/5 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 bg-[#0f1829] border border-white/10 rounded-xl text-[#dae2fd] text-sm font-medium hover:bg-white/5 transition-colors">
              <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
