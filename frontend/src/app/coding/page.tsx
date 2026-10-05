"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Code2, Send, Bot, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const renderMessageContent = (content: string) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: match[1] || 'text', content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.substring(lastIndex) });
  }

  return (
    <div className="space-y-4 font-light text-[15px] leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          // Parse basic bold markdown
          const textSegments = part.content.split(/(\*\*.*?\*\*)/g);
          return (
            <div key={i} className="whitespace-pre-wrap">
              {textSegments.map((seg, j) => {
                if (seg.startsWith('**') && seg.endsWith('**')) {
                  return <strong key={j} className="font-semibold text-white">{seg.slice(2, -2)}</strong>;
                }
                return <span key={j}>{seg}</span>;
              })}
            </div>
          );
        } else {
          return (
            <div key={i} className="my-4 rounded-xl overflow-hidden bg-[#0d1117] border border-gray-700/50 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700/50 text-xs text-gray-400 font-mono">
                <span className="uppercase tracking-wider">{part.language}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(part.content)} 
                  className="hover:text-white transition-colors flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-md"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy code
                </button>
              </div>
              <div className="p-5 overflow-x-auto text-sm font-mono text-[#a5d6ff] leading-relaxed custom-scrollbar">
                <pre><code>{part.content}</code></pre>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
};

export default function CodingChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const role = localStorage.getItem("targetRole") || "Software Engineer";
    setTargetRole(role);
    setMessages([
      {
        role: "assistant",
        content: `Hi! I'm your AI DSA Mentor for the **${role}** position. Instead of a standard coding compiler, we will discuss Data Structures and Algorithms interactively here.\n\nYou can ask me what the most common DSA questions are, how to approach them, or request optimal pseudocode for specific patterns. \n\n**What would you like to practice today?**`
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/api/practice/coding/chat", {
        messages: newMessages,
        target_role: targetRole
      });
      
      setMessages([...newMessages, res.data]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I am having trouble connecting to the server. Make sure your API keys are valid." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 mt-2 md:mt-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Code2 className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">DSA Interview Copilot</h1>
            <p className="text-gray-400 text-sm mt-1">Interactive algorithm practice & pseudocode generation</p>
          </div>
        </div>
        <Link href="/rounds" className="flex items-center gap-2 text-gray-400 hover:text-white transition-all bg-gray-900/80 hover:bg-gray-800 px-5 py-2.5 rounded-xl border border-gray-700/50 hover:border-gray-600 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Rounds
        </Link>
      </div>

      <div className="flex-1 bg-gradient-to-b from-gray-900/90 to-[#0a0a0a] backdrop-blur-2xl border border-gray-800/80 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 md:gap-6 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === "assistant" ? "bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400" : "bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-emerald-400"}`}>
                {msg.role === "assistant" ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-6 shadow-sm ${msg.role === "user" ? "bg-gradient-to-br from-emerald-600/10 to-teal-900/20 border border-emerald-500/20 text-emerald-50 rounded-tr-sm" : "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 text-gray-200 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)]"}`}>
                {renderMessageContent(msg.content)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 bg-[#0a0a0a]/80 backdrop-blur-md border-t border-gray-800/50 z-10">
          <div className="relative flex items-end gap-3 max-w-4xl mx-auto bg-gray-900 rounded-3xl border border-gray-700/50 shadow-inner focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about graph algorithms, dynamic programming, or request code..."
              className="w-full bg-transparent text-white p-3 px-4 resize-none focus:outline-none custom-scrollbar min-h-[50px] max-h-[200px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-3.5 mb-1 mr-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-2xl transition-all shadow-lg disabled:shadow-none flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-500 mt-4 font-medium tracking-wide uppercase">
            AI can make mistakes. Verify critical technical details.
          </p>
        </div>
        
      </div>
    </div>
  );
}
