"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-800">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 mb-6 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 mt-3 font-light">Log in to your PlaceMate.AI account</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20 flex items-center gap-3">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder-gray-500"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder-gray-500"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:from-blue-500 hover:to-indigo-500 focus:ring-4 focus:ring-blue-500/30 transition-all disabled:opacity-50 shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 group"
          >
            {loading ? "Signing in..." : (
              <>Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-400 font-light">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
