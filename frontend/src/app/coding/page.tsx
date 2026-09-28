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
        content: `Hi! I'm your AI DSA Mentor for the ${role} position. Instead of a coding compiler, we will discuss Data Structures and Algorithms here. You can ask me what the most common DSA questions are, how to approach them, or request pseudocode for specific patterns. What would you like to practice today?`
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
    <div className="max-w-5xl mx-auto p-4 md:p-6 mt-6 md:mt-10 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Code2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">DSA Technical Discussion</h1>
            <p className="text-gray-400 text-sm">Conversational algorithm practice</p>
          </div>
        </div>
        <Link href="/rounds" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800">
          <ArrowLeft className="w-4 h-4" /> Back to Rounds
        </Link>
      </div>

      <div className="flex-1 bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === "assistant" ? "bg-blue-600/20 border border-blue-500/30 text-blue-400" : "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400"}`}>
                {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-5 ${msg.role === "user" ? "bg-emerald-600/10 border border-emerald-500/20 text-emerald-50" : "bg-gray-800/60 border border-gray-700/50 text-gray-200"}`}>
                <p className="whitespace-pre-wrap leading-relaxed font-light">{msg.content}</p>
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
        <div className="p-4 bg-gray-800/40 border-t border-gray-800">
          <div className="relative flex items-end gap-3 max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about graph algorithms, dynamic programming, or optimal time complexities..."
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-2xl p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all custom-scrollbar h-[60px] min-h-[60px] max-h-[150px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3 font-light">
            AI can make mistakes. Verify critical technical details.
          </p>
        </div>
        
      </div>
    </div>
  );
}
