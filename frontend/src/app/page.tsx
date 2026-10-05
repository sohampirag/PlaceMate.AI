"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Bot, 
  Mic, 
  Code2, 
  BrainCircuit, 
  FileCheck, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Play
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  // Redirect unauthenticated users to login if they try to access protected modules
  const handleProtectedNavigation = async (targetPath: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push(targetPath);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 scroll-smooth">
      {/* Top Navbar Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl px-4 sm:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">PlaceMate<span className="text-cyan-400">.AI</span></span>
                <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase font-semibold">
                  HOMEPAGE
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <button 
              onClick={() => handleProtectedNavigation("/rounds")} 
              className="hover:text-cyan-400 transition-colors text-left font-medium"
            >
              Mock Rounds
            </button>
            <button 
              onClick={() => handleProtectedNavigation("/dashboard")} 
              className="hover:text-cyan-400 transition-colors text-left font-medium"
            >
              Dashboard
            </button>
          </nav>

          {/* Auth CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800">
                Log In
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-5 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98]">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-16 lg:pt-20 lg:pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        {/* Glow Effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-cyan-400 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Placement Assistant</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
            Ace Your Placement Interviews <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              With AI Voice Assistance
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 font-light">
            Practice voice mock interviews, coding challenges, and aptitude tests to build confidence and land your dream role.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12">
            <button 
              onClick={() => handleProtectedNavigation("/rounds")}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 rounded-xl transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Start Mock Rounds</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link href="/signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-850 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2">
                <span>Create Free Account</span>
              </button>
            </Link>
          </div>

          {/* Clean Hero Voice AI Preview Card */}
          <div className="relative max-w-xl mx-auto rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">PlaceMate AI Technical Evaluator</h4>
                  <p className="text-xs text-slate-400">Real-time Voice Mock Session</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Studio</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 mb-3">
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                <span className="text-cyan-400 font-semibold">AI Evaluator:</span> "Welcome to your Technical Mock Interview! Let's start with your approach to designing scalable API endpoints."
              </p>
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Mic className="w-3.5 h-3.5 text-cyan-400" /> Speech Evaluation
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Interactive Evaluation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-2 font-semibold">
            Key Modules
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Prepare for Every Placement Stage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Voice Mock Interviews */}
          <div 
            onClick={() => handleProtectedNavigation("/interview/technical")}
            className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Voice Mock Interviews</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Interactive real-time voice interviews for Technical and HR rounds with candidate name greeting and instant evaluation.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 border-t border-slate-800/80 pt-4">
              <span>Start Voice Interview</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Coding Practice */}
          <div 
            onClick={() => handleProtectedNavigation("/coding")}
            className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Coding Round</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Practice coding challenges with instant execution and automated test case evaluation.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 border-t border-slate-800/80 pt-4">
              <span>Open Coding IDE</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Aptitude */}
          <div 
            onClick={() => handleProtectedNavigation("/aptitude")}
            className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Aptitude Assessments</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Timed quantitative, logical, and verbal reasoning speed quizzes modeled after placement tests.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 border-t border-slate-800/80 pt-4">
              <span>Take Speed Test</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Performance Reports */}
          <div 
            onClick={() => handleProtectedNavigation("/report")}
            className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Detailed Reports</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Dynamic evaluation reports built from your exact answers, offering genuine scores and actionable tips.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 border-t border-slate-800/80 pt-4">
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Resume Optimizer */}
          <div 
            onClick={() => handleProtectedNavigation("/resume")}
            className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Resume Reviewer</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Upload your resume for ATS match scoring and key skill suggestions tailored to job postings.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 border-t border-slate-800/80 pt-4">
              <span>Audit Resume</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-2 font-semibold">
              Simple Workflow
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              3 Steps to Placement Readiness
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center mb-4 text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Choose Module</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select Technical Voice, HR Interview, Coding IDE, or Aptitude test.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center mb-4 text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">Practice Live</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interact with the AI evaluator through voice, code editor, or timed quizzes.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center mb-4 text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Review Feedback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get transcript breakdowns, score analysis, and personalized improvement tips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-semibold">PlaceMate.AI</span>
          </div>
          <div>
            © {new Date().getFullYear()} PlaceMate.AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
