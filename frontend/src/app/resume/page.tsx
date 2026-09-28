"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_role", targetRole);
    
    try {
      const res = await api.post("/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAnalysis(res.data.analysis);
      localStorage.setItem("targetRole", targetRole);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to analyze resume. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20 mb-2">
          <Sparkles className="w-4 h-4" /> AI Resume Screen
        </div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Resume Analysis</h1>
        <p className="text-gray-400 text-lg font-light max-w-xl mx-auto">Upload your resume to get instant AI feedback and personalize your mock interviews.</p>
      </div>

      {!analysis ? (
        <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-800">
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Role</label>
            <input 
              type="text" 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-gray-800/50 text-white border-gray-700 rounded-xl p-4 border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="e.g. Frontend Developer"
            />
          </div>
          
          <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center hover:bg-gray-800/50 hover:border-blue-500/50 transition-all group">
            <div className="w-20 h-20 rounded-2xl bg-gray-800/80 mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-10 w-10 text-blue-400" />
            </div>
            
            <input 
              type="file" 
              accept=".pdf"
              className="hidden" 
              id="resume-upload"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <span className="bg-blue-600/10 text-blue-400 px-6 py-2.5 rounded-full font-medium border border-blue-500/20 hover:bg-blue-600/20 transition-colors inline-block mb-4 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                Select PDF File
              </span>
            </label>
            <p className="text-sm text-gray-500 font-light">{file ? file.name : "Supported format: PDF"}</p>
          </div>
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 rounded-xl hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] disabled:shadow-none"
            >
              {loading ? "Analyzing with AI..." : "Analyze Resume"}
            </button>
            <button 
              onClick={() => router.push('/rounds')}
              className="px-6 bg-gray-800 text-gray-300 font-semibold py-4 rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
            >
              Skip for now
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">ATS Compatibility Score</h2>
              <p className="text-gray-400 font-light">Based on {targetRole} requirements</p>
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)] bg-gray-800/50">
              <span className="text-3xl font-extrabold text-blue-400">{analysis.score}</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-800">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
                <AlertTriangle className="text-amber-500 h-6 w-6" /> 
                Suggested Fixes
              </h3>
              <ul className="space-y-4">
                {analysis.fixes?.map((fix: string, i: number) => (
                  <li key={i} className="flex gap-4 text-gray-300 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                    <div className="mt-0.5 min-w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] text-amber-400 font-bold">{i+1}</span>
                    </div>
                    <span className="font-light leading-relaxed">{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-800">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
                <FileText className="text-blue-500 h-6 w-6" /> 
                Weak Topics to Study
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {analysis.weak_topics?.map((topic: string, i: number) => (
                  <span key={i} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/rounds')}
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-5 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_-2px_rgba(16,185,129,0.6)] transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg group"
          >
            Continue to Mock Interviews <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
