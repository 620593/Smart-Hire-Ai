/**
 * Minimal public top navbar shown on standalone auth pages
 * (Get Started, Recruiter Register, Register, Login) that have no sidebar.
 */
import { Link, useLocation } from "react-router-dom";

export function PublicNavbar() {
  const { pathname } = useLocation();

  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";
  const isRecruiterRegister = pathname === "/recruiter-register";

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/8 z-50 flex items-center justify-between px-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#5b5cf6] flex items-center justify-center shadow-lg shadow-[#5b5cf6]/30">
          <span className="material-symbols-outlined text-white text-[17px]">bolt</span>
        </div>
        <span className="text-white font-bold text-base tracking-tight">SmartHire AI</span>
      </Link>

      {/* Right links */}
      <div className="flex items-center gap-2">
        {/* Candidate Sign Up — hidden on register page */}
        {!isRegister && (
          <Link
            to="/register"
            className="text-[#8b9ec7] text-sm font-medium hover:text-white transition-colors px-3 py-2"
          >
            Candidate Sign Up
          </Link>
        )}

        {/* Candidate Login — hidden on login page */}
        {!isLogin && (
          <Link
            to="/login"
            className="text-[#8b9ec7] text-sm font-medium hover:text-white transition-colors px-3 py-2 border border-white/10 rounded-lg hover:bg-white/5"
          >
            Candidate Login
          </Link>
        )}

        {/* Recruiter Login — hidden on recruiter-register page */}
        {!isRecruiterRegister && (
          <Link
            to="/recruiter-register"
            className="px-4 py-2 bg-[#5b5cf6] hover:bg-[#4a4ae8] text-white text-sm font-semibold rounded-lg transition-colors shadow-md shadow-[#5b5cf6]/20"
          >
            Recruiter Login
          </Link>
        )}
      </div>
    </header>
  );
}
