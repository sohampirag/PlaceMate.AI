"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Briefcase, MapPin, ExternalLink, Award, FileText, CheckCircle2, FileSearch, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const role = localStorage.getItem("targetRole") || "Software Engineer";
        const res = await api.get(`/api/jobs/match?target_role=${encodeURIComponent(role)}`);
        setJobs(res.data);
      } catch (error) {
        console.error("Failed to load jobs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Your Placement Report</h1>
        <p className="text-gray-400 mt-3 text-lg font-light">Comprehensive breakdown of your performance across all rounds.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Performance & Resume */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-gray-900/60 backdrop-blur-md p-6 rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <Award className="text-blue-500 w-6 h-6" /> Score Breakdown
            </h2>
            <div className="space-y-5">
              {[
                { name: "Technical Interview", score: 85, color: "bg-blue-500", glow: "shadow-[0_0_10px_rgba(59,130,246,0.5)]" },
                { name: "HR Interview", score: 92, color: "bg-purple-500", glow: "shadow-[0_0_10px_rgba(168,85,247,0.5)]" },
                { name: "Aptitude Assessment", score: 70, color: "bg-amber-500", glow: "shadow-[0_0_10px_rgba(251,191,36,0.5)]" },
                { name: "Coding Practice", score: 100, color: "bg-emerald-500", glow: "shadow-[0_0_10px_rgba(16,185,129,0.5)]" },
              ].map((round) => (
                <div key={round.name}>
                  <div className="flex justify-between text-sm font-medium mb-2 text-gray-300">
                    <span>{round.name}</span>
                    <span className="text-white">{round.score}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className={`h-2 rounded-full ${round.color} ${round.glow}`} style={{ width: `${round.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>



          <div className="bg-gray-900/60 backdrop-blur-md p-6 rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <FileText className="text-amber-500 w-6 h-6" /> Interview Areas for Improvement
            </h2>
            <ul className="space-y-3">
              <li className="flex gap-3 text-gray-300 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                <CheckCircle2 className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white mb-1">System Design (Technical)</strong>
                  <span className="font-light">Your answers lacked specific architectural patterns. Review microservices vs monolith trade-offs.</span>
                </div>
              </li>
              <li className="flex gap-3 text-gray-300 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                <CheckCircle2 className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white mb-1">Quantitative (Aptitude)</strong>
                  <span className="font-light">Speed needs improvement on algebra questions. Practice timed sections.</span>
                </div>
              </li>
            </ul>
          </div>
          
        </div>

        {/* Right Column - Job Matches */}
        <div className="md:col-span-1">
          <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-6 rounded-2xl border border-gray-800 text-white shadow-xl sticky top-6">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Briefcase className="text-blue-400 w-6 h-6" /> Matched Jobs
            </h2>
            <p className="text-gray-400 text-sm mb-6 font-light">Based on your resume and interview performance.</p>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-28 bg-gray-800/50 rounded-xl"></div>
                <div className="h-28 bg-gray-800/50 rounded-xl"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, idx) => (
                  <div key={idx} className="group bg-gray-800/40 p-5 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all hover:bg-gray-800/80 hover:shadow-lg">
                    <h3 className="font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">{job.title}</h3>
                    <div className="text-sm text-gray-400 mt-1.5">{job.company}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 mb-4">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </div>
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 bg-blue-500/10 w-fit px-3 py-1.5 rounded-lg border border-blue-500/20 group-hover:bg-blue-500/20 transition-all"
                    >
                      View Role <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>
        
      </div>
      
      <div className="mt-10">
        <Link href="/dashboard" className="text-gray-400 font-medium hover:text-white transition-colors flex items-center gap-2 w-fit">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
