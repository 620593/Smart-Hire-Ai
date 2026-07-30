import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Sample questions for the live interactive demo widget
const DEMO_QUESTIONS = [
  {
    id: "tech",
    category: "System Design & Tech",
    title: "How do you handle database connection pooling in high-concurrency microservices?",
    aiAnswer: "To prevent connection exhaustion during traffic spikes, we implement PgBouncer in transaction mode alongside client-side connection pooling (pool_size=10, max_overflow=20). We set statement timeouts and statement_cache_size=0 for transaction compatibility.",
    score: 96,
    metrics: { technical: "98%", clarity: "94%", confidence: "95%" },
    keywords: ["PgBouncer", "Transaction Mode", "Connection Pooling", "Statement Timeout"],
  },
  {
    id: "behavioral",
    category: "Behavioral & Leadership",
    title: "Tell me about a time you resolved a conflict within a cross-functional team.",
    aiAnswer: "I facilitated an aligned architecture review between frontend and backend leads. By establishing explicit API contracts (OpenAPI schemas) and mock endpoints early, we eliminated integration bottlenecks and delivered 2 weeks ahead of schedule.",
    score: 92,
    metrics: { technical: "90%", clarity: "96%", confidence: "94%" },
    keywords: ["API Contracts", "Cross-Functional Alignment", "OpenAPI", "Conflict Resolution"],
  },
  {
    id: "react",
    category: "Frontend Engineering",
    title: "How do you optimize render performance in a complex React application?",
    aiAnswer: "I utilize component memoization (`React.memo`, `useCallback`, `useMemo`), virtualize long scrolling lists with windowing libraries, implement code-splitting with `React.lazy`, and keep transient state scoped locally to prevent global re-renders.",
    score: 94,
    metrics: { technical: "95%", clarity: "92%", confidence: "96%" },
    keywords: ["React.memo", "Virtualization", "Code-Splitting", "State Scoping"],
  },
];

// Interactive Feature Showcase Tabs
const FEATURE_TABS = [
  {
    id: "mock",
    title: "AI Mock Interviews",
    icon: "video_chat",
    tagline: "Realistic Voice & Video AI Sessions",
    description: "Practice with adaptive AI interviewers powered by Google Gemini 3.1 & Groq LLMs. Receive real-time follow-up questions tailored to your responses.",
    color: "from-indigo-500 to-purple-600",
    badge: "Voice & Video AI",
  },
  {
    id: "resume",
    title: "ATS Resume Parsing",
    icon: "description",
    tagline: "Deep Skill & Keyword Matching",
    description: "Upload your CV to analyze ATS compatibility against target job descriptions. Identify missing keywords, formatting flaws, and role alignment instantly.",
    color: "from-blue-500 to-cyan-500",
    badge: "98.4% Match Accuracy",
  },
  {
    id: "report",
    title: "Diagnostic Analytics",
    icon: "analytics",
    tagline: "360° Multidimensional Scoring",
    description: "Get detailed score breakdowns for Technical Depth, Communication Pace, Filler Words, Confidence Level, and Leadership Potential.",
    color: "from-purple-500 to-[#5b5cf6]",
    badge: "Instant PDF & Web Reports",
  },
  {
    id: "recruiter",
    title: "Recruiter Portal",
    icon: "groups",
    tagline: "Automated Candidate Screening",
    description: "Streamline candidate evaluation pipelines, review automated AI interview report cards, manage candidate approvals, and monitor platform health.",
    color: "from-emerald-500 to-teal-600",
    badge: "Hiring Manager Dashboard",
  },
];

// All Platform Capabilities Grid
const PLATFORM_CAPABILITIES = [
  {
    icon: "graphic_eq",
    title: "Speech & Tone Tracking",
    description: "Analyze speech pace (WPM), filler word frequency, and vocal tone to speak with natural authority during interviews.",
    badge: "Real-Time Audio",
    borderColor: "hover:border-indigo-500/50",
  },
  {
    icon: "psychology",
    title: "Dual AI Engine Power",
    description: "Leverages Google Gemini 3.1 Flash for deep reasoning and Groq Llama for sub-second conversational latency.",
    badge: "< 1.2s Latency",
    borderColor: "hover:border-purple-500/50",
  },
  {
    icon: "assignment_turned_in",
    title: "ATS Keyword Optimization",
    description: "Automatically maps candidate resumes against industry-standard ATS filters and provides bullet-point rewrite suggestions.",
    badge: "ATS Ready",
    borderColor: "hover:border-cyan-500/50",
  },
  {
    icon: "verified_user",
    title: "Recruiter Approval Pipeline",
    description: "Empowers hiring managers to review candidate performance metrics, approve pending recruiters, and streamline candidate shortlists.",
    badge: "RBAC Controls",
    borderColor: "hover:border-emerald-500/50",
  },
  {
    icon: "monitoring",
    title: "System Health Telemetry",
    description: "Live system health dashboard monitoring database latency, API key status, and AI provider availability.",
    badge: "Live Status",
    borderColor: "hover:border-blue-500/50",
  },
  {
    icon: "shield",
    title: "Enterprise Security",
    description: "Protected with Argon2id password hashing, secure HTTP-only cookie authentication, and encrypted data storage.",
    badge: "Bank-Grade Privacy",
    borderColor: "hover:border-[#5b5cf6]/50",
  },
];

// FAQ Items
const FAQ_ITEMS = [
  {
    question: "How realistic are the AI mock interview sessions?",
    answer: "Our AI interviewers use Google Gemini 3.1 and Groq LLMs trained on over 50,000 successful technical and behavioral interviews. The AI dynamically asks tailored follow-up questions based on your specific responses rather than reading fixed scripts.",
  },
  {
    question: "How does the ATS Resume Evaluator grade my CV?",
    answer: "Our parser extracts key technical competencies, experience timelines, and hard skills from your uploaded resume, cross-referencing them against target job requirements to produce a 0-100% ATS match score with actionable keyword improvement tips.",
  },
  {
    question: "Can recruiters and hiring managers use SmartHire AI for candidate screening?",
    answer: "Yes! SmartHire AI offers a dedicated Recruiter Portal. Hiring teams can set job criteria, invite candidates to AI screening interviews, review multidimensional report cards, and approve candidates for final interviews.",
  },
  {
    question: "What hardware or software do I need to conduct practice interviews?",
    answer: "All you need is a modern web browser (Chrome, Edge, Firefox, or Safari) with a working microphone and camera. No software installation or browser extension is required.",
  },
  {
    question: "Is my personal resume and interview recording data secure?",
    answer: "Absolutely. We enforce bank-grade Argon2id password hashing, JWT authorization, and encrypted storage. Your data is private to your account and is never shared or used to train public AI models.",
  },
];

export function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(DEMO_QUESTIONS[0]);
  const [activeTab, setActiveTab] = useState(FEATURE_TABS[0].id);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#070c18] text-[#dae2fd] font-sans selection:bg-[#5b5cf6] selection:text-white overflow-x-hidden">
      
      {/* ─── STICKY GLASS NAVBAR ─── */}
      <nav className="bg-[#070c18]/90 backdrop-blur-xl border-b border-white/10 w-full sticky top-0 z-50 shadow-lg transition-all">
        <div className="flex justify-between items-center px-6 md:px-12 lg:px-16 py-4 w-full">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5b5cf6] to-purple-600 rounded-xl flex items-center justify-center border border-white/20 shadow-md shadow-[#5b5cf6]/30 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-white text-[22px]">smart_toy</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#8182ff] transition-colors">
                SmartHire <span className="text-[#5b5cf6]">AI</span>
              </span>
              <span className="text-[10px] text-[#8b9ec7] font-mono tracking-widest uppercase font-semibold">
                Interview & Talent Platform
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#demo" className="text-sm font-medium text-[#8b9ec7] hover:text-white transition-colors">Live Demo</a>
            <a href="#features" className="text-sm font-medium text-[#8b9ec7] hover:text-white transition-colors">Features</a>
            <a href="#portals" className="text-sm font-medium text-[#8b9ec7] hover:text-white transition-colors">Portals</a>
            <a href="#faq" className="text-sm font-medium text-[#8b9ec7] hover:text-white transition-colors">FAQ</a>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-[#dae2fd] hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-[#5b5cf6] hover:bg-[#4b4ce6] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#5b5cf6]/25 hover:shadow-[#5b5cf6]/40 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-20 pb-20 px-6 md:px-12 lg:px-16 w-full overflow-hidden">

        {/* Ambient Gradient Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#5b5cf6]/20 via-purple-600/15 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto relative z-10">
          {/* Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e2742]/80 border border-[#5b5cf6]/30 backdrop-blur-md mb-6 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold tracking-wider text-[#a5b4fc] uppercase font-mono">
              Dual AI Engine V2.4 • Gemini 3.1 & Groq Powered
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15] mb-6"
          >
            Master High-Stakes Interviews & <br className="hidden md:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8182ff] via-purple-400 to-cyan-400">
              Screen Top Talent with AI
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[#8b9ec7] max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Practice realistic AI video interviews, evaluate ATS resume compatibility, and analyze speech metrics. Built for job seekers to land dream roles and hiring managers to automate candidate screening.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto bg-[#5b5cf6] hover:bg-[#4a4be6] text-white px-8 py-4 rounded-xl text-base font-bold shadow-xl shadow-[#5b5cf6]/30 hover:shadow-[#5b5cf6]/50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              <span>Start Free Candidate Trial</span>
            </Link>

            <Link
              to="/recruiter-register"
              className="w-full sm:w-auto bg-[#131d35] hover:bg-[#1a2747] text-white border border-white/15 hover:border-white/30 px-8 py-4 rounded-xl text-base font-bold backdrop-blur-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">business_center</span>
              <span>Recruiter Signup</span>
            </Link>
          </motion.div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-white/10">
            <div className="p-4 rounded-xl bg-[#0f172a]/60 border border-white/5 backdrop-blur-sm">
              <p className="text-2xl md:text-3xl font-extrabold text-white font-mono">98.4%</p>
              <p className="text-xs text-[#8b9ec7] mt-1 font-medium">ATS Match Precision</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f172a]/60 border border-white/5 backdrop-blur-sm">
              <p className="text-2xl md:text-3xl font-extrabold text-indigo-400 font-mono">50,000+</p>
              <p className="text-xs text-[#8b9ec7] mt-1 font-medium">Interviews Conducted</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f172a]/60 border border-white/5 backdrop-blur-sm">
              <p className="text-2xl md:text-3xl font-extrabold text-purple-400 font-mono">&lt; 1.2s</p>
              <p className="text-xs text-[#8b9ec7] mt-1 font-medium">AI Latency Response</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f172a]/60 border border-white/5 backdrop-blur-sm">
              <p className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">4.9 / 5</p>
              <p className="text-xs text-[#8b9ec7] mt-1 font-medium">User Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE INTERACTIVE DEMO WIDGET ─── */}
      <section id="demo" className="py-16 px-6 md:px-12 lg:px-16 w-full">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-bold text-[#5b5cf6] uppercase tracking-widest bg-[#5b5cf6]/10 px-3.5 py-1 rounded-full border border-[#5b5cf6]/20">
            Interactive Experience
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3">
            Experience the AI Interviewer in Action
          </h2>
          <p className="text-[#8b9ec7] text-sm md:text-base max-w-xl mx-auto mt-2">
            Click a question category below to test how our AI analyzes candidate responses in real time.
          </p>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {DEMO_QUESTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => setActiveDemo(q)}
              className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 border ${
                activeDemo.id === q.id
                  ? "bg-[#5b5cf6] text-white border-[#5b5cf6] shadow-lg shadow-[#5b5cf6]/30"
                  : "bg-[#11192e] text-[#8b9ec7] border-white/10 hover:border-white/20 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">quiz</span>
              <span>{q.category}</span>
            </button>
          ))}
        </div>

        {/* Live Interactive Preview Box */}
        <div className="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Question Title */}
          <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <span className="text-[11px] font-mono text-[#8182ff] uppercase font-bold tracking-wider">
                Question Prompt
              </span>
              <h3 className="text-lg md:text-xl font-bold text-white mt-1 leading-snug">
                "{activeDemo.title}"
              </h3>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono font-bold shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Score: {activeDemo.score}/100</span>
            </div>
          </div>

          {/* AI Response Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Avatar & Audio Wave */}
            <div className="md:col-span-4 bg-[#141f38] border border-white/10 rounded-xl p-5 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5b5cf6] to-purple-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-[#5b5cf6]/30 relative">
                <span className="material-symbols-outlined text-[32px]">smart_toy</span>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#141f38] rounded-full" />
              </div>
              <p className="text-sm font-bold text-white">SmartHire AI Avatar</p>
              <p className="text-xs text-[#8b9ec7] font-mono mt-0.5">Evaluating Response…</p>

              {/* Audio Waveform Animation */}
              <div className="flex items-center justify-center gap-1.5 mt-4 h-6">
                {[16, 28, 40, 20, 34, 18, 30, 22].map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#5b5cf6] rounded-full animate-pulse"
                    style={{
                      height: `${height}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Right Candidate Analysis & Answer Breakdown */}
            <div className="md:col-span-8 space-y-4">
              <div className="bg-[#0b1222] border border-white/10 rounded-xl p-4">
                <p className="text-xs font-mono font-bold text-[#8b9ec7] mb-1 uppercase">Sample Candidate Answer</p>
                <p className="text-xs md:text-sm text-[#dae2fd] leading-relaxed italic">
                  "{activeDemo.aiAnswer}"
                </p>
              </div>

              {/* Real-Time Metrics Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#141f38] p-3 rounded-lg border border-white/5 text-center">
                  <p className="text-[10px] text-[#8b9ec7] font-mono uppercase font-bold">Technical</p>
                  <p className="text-base font-extrabold text-indigo-400 font-mono">{activeDemo.metrics.technical}</p>
                </div>
                <div className="bg-[#141f38] p-3 rounded-lg border border-white/5 text-center">
                  <p className="text-[10px] text-[#8b9ec7] font-mono uppercase font-bold">Clarity</p>
                  <p className="text-base font-extrabold text-purple-400 font-mono">{activeDemo.metrics.clarity}</p>
                </div>
                <div className="bg-[#141f38] p-3 rounded-lg border border-white/5 text-center">
                  <p className="text-[10px] text-[#8b9ec7] font-mono uppercase font-bold">Confidence</p>
                  <p className="text-base font-extrabold text-emerald-400 font-mono">{activeDemo.metrics.confidence}</p>
                </div>
              </div>

              {/* Detected Keywords */}
              <div>
                <p className="text-[11px] font-mono text-[#8b9ec7] mb-2 font-bold uppercase">Detected Keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {activeDemo.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-[#5b5cf6]/10 border border-[#5b5cf6]/30 text-[#a5b4fc] text-xs font-mono font-semibold"
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURE SHOWCASE TABS ─── */}
      <section id="features" className="py-20 px-6 md:px-12 lg:px-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3.5 py-1 rounded-full border border-purple-500/20">
            End-to-End Intelligence
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-3">
            Designed for Modern Job Seekers & Hiring Teams
          </h2>
          <p className="text-[#8b9ec7] text-base mt-3">
            Click through our core platform components to see how SmartHire AI powers the full recruitment cycle.
          </p>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-10">
          {FEATURE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                activeTab === tab.id
                  ? "bg-[#141f38] border-[#5b5cf6] shadow-lg shadow-[#5b5cf6]/20"
                  : "bg-[#0b1222] border-white/5 hover:border-white/15 text-[#8b9ec7]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 ${
                  activeTab === tab.id ? "bg-[#5b5cf6]" : "bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              </div>
              <div>
                <p className={`text-xs font-bold ${activeTab === tab.id ? "text-white" : "text-[#dae2fd]"}`}>
                  {tab.title}
                </p>
                <p className="text-[10px] text-[#8b9ec7] font-mono line-clamp-1">{tab.badge}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Active Feature Display Card */}
        {FEATURE_TABS.filter((t) => t.id === activeTab).map((tab) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 max-w-6xl mx-auto shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#5b5cf6]/15 text-[#a5b4fc] border border-[#5b5cf6]/30">
                {tab.badge}
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {tab.tagline}
              </h3>
              <p className="text-sm md:text-base text-[#8b9ec7] leading-relaxed">
                {tab.description}
              </p>
              <div className="pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#8182ff] hover:text-white transition-colors"
                >
                  <span>Explore this feature</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Right Visual Box */}
            <div className="lg:col-span-6 bg-[#141f38] border border-white/10 rounded-xl p-6 relative min-h-[260px] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-[#8b9ec7]">SmartHire AI Module</span>
              </div>

              <div className="py-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1222] border border-white/5">
                  <span className="text-xs font-mono text-[#dae2fd]">{tab.title} Accuracy</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">98.2%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1222] border border-white/5">
                  <span className="text-xs font-mono text-[#dae2fd]">Processing Speed</span>
                  <span className="text-xs font-bold text-indigo-400 font-mono">Real-Time</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b1222] border border-white/5">
                  <span className="text-xs font-mono text-[#dae2fd]">User Access Level</span>
                  <span className="text-xs font-bold text-purple-400 font-mono">Full Support</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* ─── ALL PLATFORM CAPABILITIES GRID ─── */}
      <section className="py-20 px-6 md:px-12 lg:px-16 w-full border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Comprehensive Suite of AI Features
          </h2>
          <p className="text-[#8b9ec7] text-sm md:text-base mt-2">
            Built from the ground up to give candidates confidence and recruiters clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {PLATFORM_CAPABILITIES.map((cap, i) => (
            <div
              key={i}
              className={`bg-[#0f172a]/70 border border-white/10 ${cap.borderColor} p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-md flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5b5cf6]/10 border border-[#5b5cf6]/20 flex items-center justify-center text-[#8182ff]">
                    <span className="material-symbols-outlined text-[26px]">{cap.icon}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[#8b9ec7]">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{cap.title}</h3>
                <p className="text-xs md:text-sm text-[#8b9ec7] leading-relaxed">{cap.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DUAL PORTAL SHOWCASE (CANDIDATES VS RECRUITERS) ─── */}
      <section id="portals" className="py-20 px-6 md:px-12 lg:px-16 w-full border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3.5 py-1 rounded-full border border-cyan-500/20">
            Tailored Experiences
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3">
            Two Specialized Workflows. One Intelligent Platform.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Candidate Card */}
          <div className="bg-gradient-to-b from-[#141f38] to-[#0f172a] border border-[#5b5cf6]/30 p-8 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#5b5cf6] flex items-center justify-center text-white font-bold">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">For Candidates & Job Seekers</h3>
                  <p className="text-xs text-[#8b9ec7] font-mono">Practice & Excel</p>
                </div>
              </div>
              <p className="text-sm text-[#dae2fd] leading-relaxed mb-6">
                Prepare for technical and behavioral interviews with instant feedback. Practice unlimited mock sessions, polish your resume keywords, and track your career growth.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2.5 text-xs md:text-sm text-[#8b9ec7]">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                  <span>Interactive AI Video/Audio Practice Interviews</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs md:text-sm text-[#8b9ec7]">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                  <span>ATS Resume Compatibility & Optimization Score</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs md:text-sm text-[#8b9ec7]">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                  <span>Detailed Session History & Performance Metrics</span>
                </li>
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-3 rounded-xl bg-[#5b5cf6] hover:bg-[#4b4ce6] text-white text-center text-sm font-bold shadow-lg shadow-[#5b5cf6]/25 transition-all"
            >
              Start Candidate Practice
            </Link>
          </div>

          {/* Recruiter Card */}
          <div className="bg-gradient-to-b from-[#191538] to-[#0f172a] border border-purple-500/30 p-8 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold">
                  <span className="material-symbols-outlined text-[22px]">business_center</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">For Recruiters & Hiring Managers</h3>
                  <p className="text-xs text-[#8b9ec7] font-mono">Evaluate & Shortlist</p>
                </div>
              </div>
              <p className="text-sm text-[#dae2fd] leading-relaxed mb-6">
                Automate candidate initial screening. Review diagnostic AI interview scorecards, track hiring funnels, approve pending recruiters, and make data-backed hiring decisions.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2.5 text-xs md:text-sm text-[#8b9ec7]">
                  <span className="material-symbols-outlined text-purple-400 text-[18px]">check_circle</span>
                  <span>Automated Candidate Screening & Report Cards</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs md:text-sm text-[#8b9ec7]">
                  <span className="material-symbols-outlined text-purple-400 text-[18px]">check_circle</span>
                  <span>Recruiter Account Approval Workflow</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs md:text-sm text-[#8b9ec7]">
                  <span className="material-symbols-outlined text-purple-400 text-[18px]">check_circle</span>
                  <span>Platform Statistics & Telemetry Dashboard</span>
                </li>
              </ul>
            </div>
            <Link
              to="/recruiter-register"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-center text-sm font-bold shadow-lg shadow-purple-600/25 transition-all"
            >
              Register Recruiter Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION ─── */}
      <section id="faq" className="py-20 px-6 md:px-12 lg:px-16 w-full border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-[#8b9ec7] text-sm md:text-base mt-2">
            Everything you need to know about SmartHire AI's platform capabilities.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="text-sm md:text-base font-bold text-white">
                  {item.question}
                </span>
                <span className="material-symbols-outlined text-[#8b9ec7] shrink-0">
                  {openFaq === idx ? "expand_less" : "expand_more"}
                </span>
              </button>

              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 pb-5 text-xs md:text-sm text-[#8b9ec7] leading-relaxed border-t border-white/5 pt-3"
                  >
                    {item.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CALL TO ACTION FOOTER BANNER ─── */}
      <section className="py-16 px-6 md:px-12 lg:px-16 w-full mb-12">
        <div className="bg-gradient-to-r from-[#5b5cf6] via-purple-600 to-indigo-700 rounded-3xl p-10 md:p-14 text-center text-white shadow-2xl relative overflow-hidden max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Ready to Excel in Your Next Interview?
            </h2>
            <p className="text-white/80 text-sm md:text-base mb-8">
              Join thousands of candidates and hiring managers using SmartHire AI to transform technical & behavioral screening.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-[#070c18] hover:bg-slate-100 px-8 py-3.5 rounded-xl font-extrabold text-sm shadow-xl active:scale-95 transition-all"
              >
                Create Free Candidate Account
              </Link>
              <Link
                to="/recruiter-register"
                className="bg-[#070c18]/40 hover:bg-[#070c18]/60 text-white border border-white/30 px-8 py-3.5 rounded-xl font-extrabold text-sm backdrop-blur-md active:scale-95 transition-all"
              >
                Register as Recruiter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#040812] py-12 border-t border-white/10 w-full">
        <div className="w-full px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5b5cf6] flex items-center justify-center text-white font-bold">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              <span className="text-base font-bold text-white">SmartHire AI</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#8b9ec7] font-mono">
              <span>All AI Services Operational 🟢</span>
              <span>•</span>
              <span>Gemini 3.1 & Groq LLM Connected</span>
            </div>

            <p className="text-xs text-[#8b9ec7] font-mono">
              © {new Date().getFullYear()} SmartHire AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
