import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-[#dae2fd] font-sans selection:bg-primary-container selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-background/80 backdrop-blur-xl border-b border-white/10 w-full sticky top-0 z-50 shadow-sm">
        <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-on-surface">SmartHire AI</span>
            <div className="hidden md:flex gap-6">
              <a className="text-sm font-medium text-primary" href="#features">Features</a>
              <a className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-200" href="#pricing">Pricing</a>
              <a className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-200" href="#footer">About</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-all active:scale-95">
              Login
            </Link>
            <Link to="/register" className="bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-[0_0_25px_rgba(96,165,250,0.4)] active:scale-95 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 md:px-12 max-w-[1280px] mx-auto overflow-hidden">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-primary-container/10 border border-primary/20 mb-4">
            <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
            <span className="text-xs font-semibold tracking-widest uppercase text-primary font-mono">AI-Powered Success</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-display tracking-tight text-slate-50 leading-tight mb-6">
            Master your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-electric-blue">interview</span> with AI.
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-8 leading-relaxed">
            Practice with realistic AI avatars, get instant behavioral feedback, and analyze your communication metrics to land your dream role at top tech companies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-primary-container text-white px-8 py-3 rounded-xl text-lg font-bold shadow-[0_0_40px_-10px_rgba(79,70,229,0.6)] hover:shadow-[0_0_25px_rgba(96,165,250,0.4)] active:scale-95 transition-all">
              Start Free Trial
            </Link>
            <a href="#features" className="bg-slate-800/40 backdrop-blur border border-white/10 hover:bg-white/10 text-white px-8 py-3 rounded-xl text-lg font-semibold flex items-center gap-2 justify-center active:scale-95 transition-all">
              <span className="material-symbols-outlined">play_circle</span> View Demo
            </a>
          </div>
        </div>

        {/* Hero Graphic */}
        <div className="relative group mt-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-45 transition duration-1000"></div>
          <div className="relative bg-slate-900/40 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden">
            <div className="bg-slate-800/50 rounded-lg h-[300px] md:h-[500px] relative overflow-hidden">
              <img 
                className="w-full h-full object-cover opacity-80" 
                alt="SmartHire AI Dashboard Preview" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnwVj_3PMRC9nU3FJ9ju80G7Oi-wz6iDrIGsVAREB5woTMwGwZRuV8pBAojgx0LySOR2_NB9ESL0K0KFtm6cFJzDhhKVI9xLwtLBCZABZpwXrmenIcQcVRnxMiV2niNMYJlvHnryCZb2ZU292T8a1BBhHnkmhFQYltvzkAt7-woKzEcdWKnei-8cpSc1PamOmgx1OY1zKzZi6xQjbluVLIkGr6mt2Zl_2mcLei1P4bSlUekO5s1dd3Rw"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <div className="bg-slate-900/80 backdrop-blur p-3 rounded-lg border-l-2 border-primary">
                  <p className="text-[10px] font-bold text-primary mb-1 uppercase font-mono">Confidence Score</p>
                  <p className="text-lg font-bold text-white">92%</p>
                </div>
                <div className="bg-slate-900/80 backdrop-blur p-3 rounded-lg border-l-2 border-success">
                  <p className="text-[10px] font-bold text-success mb-1 uppercase font-mono">Keyword Match</p>
                  <p className="text-lg font-bold text-white">High</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-white/5 bg-[#060e20]/50">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-center">
          <p className="text-xs font-semibold text-on-surface-variant mb-6 tracking-widest uppercase opacity-60 font-mono">TRUSTED BY 10,000+ ENGINEERS FROM THE WORLD'S BEST COMPANIES</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 grayscale opacity-40 hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-bold tracking-tight">Google</span>
            <span className="text-2xl font-bold tracking-tight">Amazon</span>
            <span className="text-2xl font-bold tracking-tight">Stripe</span>
            <span className="text-2xl font-bold tracking-tight">Netflix</span>
            <span className="text-2xl font-bold tracking-tight">Meta</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-4 md:px-12 max-w-[1280px] mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">Precision-engineered for <span className="text-primary">high-stakes</span> interviews.</h2>
          <p className="text-base md:text-lg text-on-surface-variant max-w-xl">Our suite of tools uses proprietary LLMs trained on 50k+ successful technical and behavioral interviews.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Feature 1 */}
          <div className="md:col-span-8 bg-slate-900/40 backdrop-blur border border-white/10 p-8 rounded-2xl group hover:border-primary/40 transition-colors flex flex-col min-h-[400px]">
            <div className="flex flex-col h-full">
              <span className="material-symbols-outlined text-primary text-4xl mb-4">video_chat</span>
              <h3 className="text-xl font-bold text-white mb-2">Live Mock Interviews</h3>
              <p className="text-sm text-on-surface-variant mb-6 max-w-md">Practice with hyper-realistic AI avatars that respond to your body language and follow up on your answers like a real hiring manager.</p>
              <div className="mt-auto bg-slate-800 rounded-lg h-44 overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-102 transition-transform duration-700" 
                  alt="Live Mock Interview Preview" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXu05b7KPd9fexzmW-UYQw_3Q-7H9z2xgj9FsUTxam8E7kZRt1HlL1_msylcTlTuLLinGTb1JV1BWL_opAAjmWbMwFph55FOLGNQcEnyQ9Pjai1KQxtMzE7fl4rnA2pwrbv01VV-dsP0SnXhtSkEvHwWI4PLdOYZGo7A7GRBJkfnRR0GCoVmc4MsKERU7QXq9gEyt-hbfjIzBTnPJaiM528qmFD4_ZbD5kGz5IxH38I-BPJgnZpV_UAvkg"
                />
              </div>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="md:col-span-4 bg-slate-900/40 backdrop-blur border-l-2 border-l-purple-500 border-y border-white/10 border-r p-8 rounded-2xl flex flex-col min-h-[400px]">
            <span className="material-symbols-outlined text-purple-500 text-4xl mb-4">analytics</span>
            <h3 className="text-xl font-bold text-white mb-2">Resume Analysis</h3>
            <p className="text-sm text-on-surface-variant">Our AI cross-references your CV with thousands of job descriptions to pinpoint exactly where you stand and what to improve.</p>
            <div className="mt-auto space-y-2">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-4/5"></div>
              </div>
              <p className="text-xs font-bold text-primary font-mono">Matching: 82%</p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="md:col-span-4 bg-slate-900/40 backdrop-blur border border-white/10 p-8 rounded-2xl flex flex-col min-h-[300px]">
            <span className="material-symbols-outlined text-electric-blue text-4xl mb-4">monitoring</span>
            <h3 className="text-xl font-bold text-white mb-2">Communication Tracking</h3>
            <p className="text-sm text-on-surface-variant">Track your pace, filler words, and sentiment in real-time. Learn to speak with authority and clarity.</p>
          </div>
          {/* Feature 4 */}
          <div className="md:col-span-8 bg-slate-900/40 backdrop-blur border border-white/10 p-8 rounded-2xl flex flex-col md:flex-row gap-6 min-h-[300px]">
            <div className="md:w-1/2">
              <span className="material-symbols-outlined text-success text-4xl mb-4">groups</span>
              <h3 className="text-xl font-bold text-white mb-2">Recruiter Analytics</h3>
              <p className="text-sm text-on-surface-variant">Get the exact data hiring managers look for. We provide a score breakdown for technical depth, culture fit, and soft skills.</p>
            </div>
            <div className="md:w-1/2 bg-slate-800/30 rounded-lg p-4 flex flex-col justify-center gap-2 border border-white/5">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs font-medium font-mono text-on-surface-variant">Leadership</span>
                <span className="text-xs font-bold text-success font-mono">9.4/10</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs font-medium font-mono text-on-surface-variant">Technicality</span>
                <span className="text-xs font-bold text-primary font-mono">8.2/10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium font-mono text-on-surface-variant">Communication</span>
                <span className="text-xs font-bold text-electric-blue font-mono">8.9/10</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-950/20 border-t border-white/5 relative">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">Invest in your <span className="text-primary">career</span>.</h2>
            <p className="text-base md:text-lg text-on-surface-variant">Plans that scale with your job search needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="bg-slate-900/40 backdrop-blur border border-white/10 p-8 rounded-2xl flex flex-col">
              <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase font-mono tracking-widest">Free Tier</p>
              <h3 className="text-3xl font-bold text-white mb-4">$0<span className="text-sm font-normal text-on-surface-variant">/mo</span></h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-success text-sm">check_circle</span> 1 Mock Interview / mo</li>
                <li className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-success text-sm">check_circle</span> Basic Resume Scoring</li>
                <li className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-success text-sm">check_circle</span> Community Access</li>
              </ul>
              <Link to="/register" className="w-full py-2.5 rounded-lg border border-white/10 text-center text-sm font-semibold hover:bg-white/5 transition-colors mt-auto">Get Started</Link>
            </div>
            {/* Pro Plan */}
            <div className="bg-slate-900/60 backdrop-blur border-2 border-primary p-8 rounded-2xl flex flex-col relative overflow-hidden transform scale-102 shadow-2xl shadow-primary/20">
              <div className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-1 rounded-bl-lg text-[9px] font-bold uppercase tracking-widest font-mono">Most Popular</div>
              <p className="text-xs font-bold text-primary mb-2 uppercase font-mono tracking-widest">Pro Tier</p>
              <h3 className="text-3xl font-bold text-white mb-4">$19<span className="text-sm font-normal text-on-surface-variant">/mo</span></h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-white"><span className="material-symbols-outlined text-primary text-sm">check_circle</span> Unlimited AI Interviews</li>
                <li className="flex items-center gap-2 text-sm text-white"><span className="material-symbols-outlined text-primary text-sm">check_circle</span> Advanced Sentiment Analysis</li>
                <li className="flex items-center gap-2 text-sm text-white"><span className="material-symbols-outlined text-primary text-sm">check_circle</span> Custom Feedback Reports</li>
                <li className="flex items-center gap-2 text-sm text-white"><span className="material-symbols-outlined text-primary text-sm">check_circle</span> Technical Question Banks</li>
              </ul>
              <Link to="/register" className="w-full py-3 rounded-lg bg-primary-container text-white text-center text-sm font-bold hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-colors mt-auto">Go Pro</Link>
            </div>
            {/* Enterprise Plan */}
            <div className="bg-slate-900/40 backdrop-blur border border-white/10 p-8 rounded-2xl flex flex-col">
              <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase font-mono tracking-widest">Enterprise</p>
              <h3 className="text-3xl font-bold text-white mb-4">Custom</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-success text-sm">check_circle</span> Bulk Licensing for Schools</li>
                <li className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-success text-sm">check_circle</span> API Access for ATS</li>
                <li className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-success text-sm">check_circle</span> Dedicated Success Manager</li>
              </ul>
              <a href="mailto:sales@smarthire.ai" className="w-full py-2.5 rounded-lg bg-white/5 border border-white/20 text-center text-sm font-bold hover:bg-white/10 active:scale-95 transition-all mt-auto">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-[#060e20] py-16 border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <span className="text-xl font-bold text-on-surface block mb-4">SmartHire AI</span>
              <p className="text-sm text-on-surface-variant mb-4 leading-relaxed max-w-sm">Precision intelligence for the modern professional. Mock interviews, resume parsing, and communication analytics.</p>
              <p className="text-xs text-on-surface-variant/40 font-mono">© {new Date().getFullYear()} SmartHire AI. All rights reserved.</p>
            </div>
            <div className="flex md:justify-end items-start">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-widest">Connect</h4>
                <a href="#" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">language</span> Website
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
