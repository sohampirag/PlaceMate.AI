"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mic, Code, BrainCircuit, Users, Sparkles } from "lucide-react";

export default function RoundsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const rounds = [
    {
      title: "Technical Mock Interview",
      description: "Real-time voice conversation assessing your technical skills and problem-solving.",
      icon: <Mic className="w-7 h-7 text-blue-400" />,
      link: "/interview/technical",
      glow: "group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]",
      border: "border-blue-500/20 group-hover:border-blue-500/50",
      bg: "bg-blue-500/10",
    },
    {
      title: "HR / Behavioral Interview",
      description: "Real-time voice conversation assessing culture fit, strengths, and situational judgment.",
      icon: <Users className="w-7 h-7 text-purple-400" />,
      link: "/interview/hr",
      glow: "group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]",
      border: "border-purple-500/20 group-hover:border-purple-500/50",
      bg: "bg-purple-500/10",
    },
    {
      title: "Aptitude Assessment",
      description: "Timed multiple-choice test covering quantitative, logical, and verbal reasoning.",
      icon: <BrainCircuit className="w-7 h-7 text-amber-400" />,
      link: "/aptitude",
      glow: "group-hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)]",
      border: "border-amber-500/20 group-hover:border-amber-500/50",
      bg: "bg-amber-500/10",
    },
    {
      title: "Coding Practice",
      description: "Text-based coding challenges evaluated by AI.",
      icon: <Code className="w-7 h-7 text-emerald-400" />,
      link: "/coding",
      glow: "group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]",
      border: "border-emerald-500/20 group-hover:border-emerald-500/50",
      bg: "bg-emerald-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 mt-10">
      <div className="mb-14 text-center space-y-4">
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
            <Sparkles className="w-4 h-4" /> Practice Makes Perfect
          </div>
          <Link href="/resume" className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gray-800 text-gray-300 text-sm font-medium border border-gray-700 hover:bg-gray-700 transition-colors">
            Upload Resume
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
          Select Practice Round
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
          Choose a module to practice. Your performance in each will be tracked to build your final improvement report.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {rounds.map((round) => (
          <Link href={round.link} key={round.title} className="group outline-none">
            <div className={`p-8 rounded-3xl border bg-gray-900/40 backdrop-blur-sm cursor-pointer transition-all duration-300 h-full flex flex-col justify-center ${round.border} ${round.glow}`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-inner ${round.bg}`}>
                {round.icon}
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">{round.title}</h2>
              <p className="text-gray-400 leading-relaxed font-light">{round.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <Link href="/report">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_-2px_rgba(79,70,229,0.6)] transform hover:-translate-y-1">
            View Final Report & Job Matches
          </button>
        </Link>
      </div>
    </div>
  );
}
