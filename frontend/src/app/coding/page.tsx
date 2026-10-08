"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Code2, Send, Bot, User, ArrowLeft, Lightbulb, Paperclip } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const renderTextSegments = (text: string) => {
  const segments = text.split(/(\*\*.*?\*\*)/g);
  return segments.map((seg, j) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return <strong key={j} className="font-semibold text-blue-400">{seg.slice(2, -2)}</strong>;
    }
    return <span key={j}>{seg}</span>;
  });
};

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
    <div className="space-y-4 font-normal text-[15px] leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          if (part.content.includes('[LIGHTBULB]')) {
            const [before, after] = part.content.split('[LIGHTBULB]');
            return (
              <div key={i} className="space-y-6">
                <div className="whitespace-pre-wrap">{renderTextSegments(before)}</div>
                <div className="flex items-center gap-4 p-4 bg-[#0F172A]/50 border border-[#1E293B] rounded-xl">
                  <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg shadow-sm">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-white tracking-wide">{after.trim()}</span>
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="whitespace-pre-wrap">
              {renderTextSegments(part.content)}
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
        content: `Hi! I'm your AI DSA Mentor for the **${role}** position.\n\nInstead of a standard coding compiler, we will discuss Data Structures and Algorithms interactively here.\n\nYou can ask me what the most common DSA questions are, how to approach them, or request optimal pseudocode for specific patterns.\n\n[LIGHTBULB] What would you like to practice today?`
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 mt-2 h-[94vh] flex flex-col">
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

      <div className="flex-1 w-full max-w-5xl mx-auto bg-[#0B1121] border border-[#1E293B] rounded-[1.5rem] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 md:gap-6 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === "assistant" ? "bg-[#151C2C] border border-[#1E293B] text-gray-300" : "bg-blue-600 border border-blue-500 text-white"}`}>
                {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-6 py-5 ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-[#151C2C] border border-[#1E293B] text-gray-200 shadow-sm rounded-xl"}`}>
                {renderMessageContent(msg.content)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#151C2C] border border-[#1E293B] text-gray-300 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-[#151C2C] border border-[#1E293B] rounded-2xl px-5 py-4 flex items-center gap-2 rounded-xl">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-transparent border-t border-[#1E293B] z-10">
          <div className="relative flex items-end gap-3 max-w-3xl mx-auto bg-[#0F172A] rounded-2xl border border-[#1E293B] focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all p-2">
            <button className="p-2.5 mb-0.5 ml-1 bg-[#1E293B]/50 hover:bg-[#1E293B] text-gray-400 rounded-xl transition-all flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message your DSA Copilot..."
              className="w-full bg-transparent text-gray-100 p-2.5 resize-none focus:outline-none custom-scrollbar min-h-[44px] max-h-[200px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-2.5 mb-0.5 mr-1 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1E293B] text-white disabled:text-gray-500 rounded-xl transition-all flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
