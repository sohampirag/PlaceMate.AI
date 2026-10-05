"use client";
import { useState, useRef, useEffect, use, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Activity, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Bot, 
  Radio, 
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// AudioWorklet processor code as a string — captures raw 16-bit PCM at 16kHz
const PCM_WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this._inSampleRate = options.processorOptions?.sampleRate || 48000;
    this._outSampleRate = 16000;
    
    // Calculate how many input samples make up 150ms at 16kHz
    this._outBufferSize = 2400; // 150ms at 16kHz
    this._outBuffer = new Float32Array(this._outBufferSize);
    this._outOffset = 0;
    
    this._ratio = this._inSampleRate / this._outSampleRate;
    this._lastPos = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channelData = input[0];

    for (let i = 0; i < channelData.length; i++) {
      this._lastPos++;
      if (this._lastPos >= this._ratio) {
        this._lastPos -= this._ratio;
        
        this._outBuffer[this._outOffset++] = channelData[i];
        
        if (this._outOffset >= this._outBufferSize) {
          const pcm16 = new Int16Array(this._outBufferSize);
          for (let j = 0; j < this._outBufferSize; j++) {
            const s = Math.max(-1, Math.min(1, this._outBuffer[j]));
            pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
          this._outBuffer = new Float32Array(this._outBufferSize);
          this._outOffset = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export default function InterviewPage({ params }: { params: Promise<{ type: string }> }) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [userName, setUserName] = useState("Candidate");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const nextPlayTimeRef = useRef(0);
  const leftoverBytesRef = useRef<Uint8Array | null>(null);
  const lastUserInterimRef = useRef(false);
  
  const [bytesSent, setBytesSent] = useState(0);
  const [bytesReceived, setBytesReceived] = useState(0);

  const { type } = use(params);
  const interviewType = type === "hr" ? "HR" : "Technical";

  useEffect(() => {
    const role = localStorage.getItem("targetRole") || "Software Engineer";
    setTargetRole(role);

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const namePart = user.email.split('@')[0];
        const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        setUserName(capitalized);
      }
    };
    fetchUser();
  }, []);

  // Timer logic for interview duration
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  /**
   * Play raw 16-bit PCM audio at 16kHz using the Web Audio API.
   */
  const playRawPCM = useCallback((pcmData: ArrayBuffer) => {
    const ctx = playbackContextRef.current;
    if (!ctx) return;

    let combined: Uint8Array;
    const newData = new Uint8Array(pcmData);
    if (leftoverBytesRef.current) {
      combined = new Uint8Array(leftoverBytesRef.current.length + newData.length);
      combined.set(leftoverBytesRef.current);
      combined.set(newData, leftoverBytesRef.current.length);
      leftoverBytesRef.current = null;
    } else {
      combined = newData;
    }

    if (combined.length % 2 !== 0) {
      leftoverBytesRef.current = new Uint8Array([combined[combined.length - 1]]);
      combined = combined.slice(0, combined.length - 1);
    }

    if (combined.length === 0) return;

    const int16 = new Int16Array(combined.buffer, combined.byteOffset, combined.length / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 16000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;
  }, []);

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const startInterview = async () => {
    try {
      if (!playbackContextRef.current) {
        playbackContextRef.current = new AudioContext({ sampleRate: 16000 });
      }
      if (playbackContextRef.current.state === "suspended") {
        await playbackContextRef.current.resume();
      }
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
      leftoverBytesRef.current = null;
      setBytesSent(0);
      setBytesReceived(0);

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Create AudioContext for capturing raw PCM
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Register the PCM worklet processor
      const blob = new Blob([PCM_WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor", {
        processorOptions: {
          sampleRate: audioContext.sampleRate
        }
      });
      workletNodeRef.current = workletNode;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Mute so we don't hear our own echo
      
      sourceNode.connect(workletNode);
      workletNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Connect WebSocket
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      if (baseUrl.startsWith("http://")) baseUrl = "ws://" + baseUrl.substring(7);
      else if (baseUrl.startsWith("https://")) baseUrl = "wss://" + baseUrl.substring(8);
      
      const wsUrl = baseUrl + "/ws/interview?type=" + interviewType + "&role=" + encodeURIComponent(targetRole) + "&name=" + encodeURIComponent(userName);

      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = "arraybuffer";

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setIsMuted(false);
        setTranscript((prev) => [...prev, "System: AI Interview Studio session initialized."]);

        // Start sending raw PCM to websocket
        workletNode.port.onmessage = (event: MessageEvent) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const data = event.data as ArrayBuffer;
            wsRef.current.send(data);
            setBytesSent((prev) => prev + data.byteLength);
          }
        };

        setIsRecording(true);
      };

      wsRef.current.onmessage = (event: MessageEvent) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "transcript") {
              const replaceLast = msg.speaker === "User" && lastUserInterimRef.current;
              lastUserInterimRef.current = msg.speaker === "User" && msg.is_final === false;
              setTranscript((prev) => {
                if (replaceLast && prev.length > 0 && prev[prev.length - 1].startsWith("User: ")) {
                  const newTranscript = [...prev];
                  newTranscript[newTranscript.length - 1] = `User: ${msg.text}`;
                  return newTranscript;
                }
                return [...prev, `${msg.speaker}: ${msg.text}`];
              });
            } else if (msg.type === "error") {
              setTranscript((prev) => [...prev, `Server Error: ${msg.message}`]);
            }
          } catch (e) {
            console.error("Failed to parse message", e);
          }
        } else if (event.data instanceof ArrayBuffer) {
          setBytesReceived((prev) => prev + event.data.byteLength);
          playRawPCM(event.data);
        }
      };

      wsRef.current.onclose = (e) => {
        setIsConnected(false);
        setTranscript((prev) => [...prev, `System: Connection closed (${e.code === 1000 ? "Normal End" : `Code ${e.code}`}).`]);
        cleanupAudio();
      };

      wsRef.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        setTranscript((prev) => [...prev, "System: Voice server connection error."]);
      };
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Microphone access is required for the voice interview.");
    }
  };

  const cleanupAudio = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const stopInterview = useCallback(() => {
    cleanupAudio();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [cleanupAudio]);

  const endSession = () => {
    stopInterview();
    router.push("/rounds");
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (playbackContextRef.current && playbackContextRef.current.state !== "closed") {
        playbackContextRef.current.close();
      }
    };
  }, [cleanupAudio]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Studio Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/rounds")}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Studio</span>
          </button>
          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
                {interviewType} ROUND
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {targetRole} Interview
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live indicator & Timer */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3.5 py-1.5 rounded-full">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500"}`}></div>
            <span className="text-xs font-mono font-medium text-slate-300">
              {isConnected ? formatTime(elapsedSeconds) : "00:00"}
            </span>
          </div>


        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: AI Interviewer Stage & Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* AI Interviewer Card */}
          <div className="relative overflow-hidden bg-slate-900/80 rounded-2xl border border-slate-800/90 p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center text-center group">
            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${isConnected ? "bg-cyan-500/20" : "bg-blue-600/10"}`}></div>
            <div className={`absolute -bottom-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${isConnected ? "bg-indigo-500/20" : "bg-purple-600/10"}`}></div>

            {/* AI Avatar Visualizer Container */}
            <div className="relative my-4">
              {/* Pulsing visualizer rings */}
              {isConnected && (
                <>
                  <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping duration-1000 scale-125"></div>
                  <div className="absolute -inset-4 rounded-full border border-cyan-500/30 animate-spin duration-[10s]"></div>
                </>
              )}

              <div
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  isConnected
                    ? "bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 border-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.3)]"
                    : "bg-slate-800/90 border-slate-700 shadow-inner"
                }`}
              >
                {isConnected ? (
                  <Bot className="w-14 h-14 sm:w-16 sm:h-16 text-cyan-400 animate-pulse" />
                ) : (
                  <Bot className="w-14 h-14 sm:w-16 sm:h-16 text-slate-500" />
                )}
              </div>

              {/* Status Badge Tag */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300 shadow-md flex items-center gap-1.5 whitespace-nowrap">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyan-400 animate-pulse" : "bg-slate-500"}`}></span>
                {isConnected ? "PlaceMate AI Lead" : "AI Offline"}
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-4 mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                <span>AI Technical Evaluator</span>
                <Sparkles className="w-4 h-4 text-cyan-400 inline" />
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {isConnected 
                  ? `Conducting real-time evaluation with candidate ${userName}.`
                  : "Click 'Start Voice Interview' below to initiate real-time voice interaction."}
              </p>
            </div>

            {/* Audio Waveform Equalizer simulation when active */}
            {isConnected && (
              <div className="flex items-center justify-center gap-1.5 h-8 my-2">
                {[40, 70, 30, 90, 50, 80, 40, 60, 100, 40].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: "600ms",
                    }}
                  ></span>
                ))}
              </div>
            )}


          </div>

          {/* Candidate Control Console */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800/90 p-5 shadow-xl backdrop-blur-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  {userName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{userName}</h3>
                  <p className="text-xs text-slate-400">Candidate · Microphone Access Granted</p>
                </div>
              </div>

              {/* Mute Toggle Button */}
              {isConnected && (
                <button
                  onClick={toggleMute}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isMuted
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750"
                  }`}
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-1">
              {!isConnected ? (
                <button
                  onClick={startInterview}
                  className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white py-3.5 px-6 rounded-xl font-semibold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.99]"
                >
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>Start Voice Interview</span>
                </button>
              ) : (
                <button
                  onClick={endSession}
                  className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white py-3.5 px-6 rounded-xl font-semibold shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.99]"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Complete & End Session</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Live Transcript Feed Studio */}
        <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800/90 shadow-2xl backdrop-blur-xl flex flex-col h-[620px] overflow-hidden">
          
          {/* Transcript Header Bar */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <FileText className="w-5 h-5 text-cyan-400" />
                {isConnected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                )}
              </div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Live Conversation Stream
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {transcript.length} lines captured
              </span>
            </div>
          </div>

          {/* Transcript Feed Scroll Box */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-sm scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4 border border-slate-700/50">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-slate-300 font-medium text-base mb-1">
                  Ready to Start Interview
                </h3>
                <p className="text-slate-500 text-xs max-w-sm">
                  Click the <span className="text-cyan-400 font-semibold">Start Voice Interview</span> button to connect with your AI Interviewer. The live dialogue will be displayed here in real time.
                </p>
              </div>
            ) : (
              transcript.map((line, i) => {
                const isUser = line.startsWith("User:");
                const isSystem = line.startsWith("System:") || line.startsWith("Server Error:");
                const content = isUser
                  ? line.replace(/^User:\s*/, "")
                  : isSystem
                  ? line
                  : line.replace(/^(Assistant|Agent|Interviewer):\s*/, "");

                if (isSystem) {
                  return (
                    <div key={i} className="flex justify-center my-3">
                      <span className="px-3.5 py-1 rounded-full text-xs font-mono bg-slate-800/90 text-slate-300 border border-slate-700/60 shadow-sm">
                        {content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Speaker Avatar Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                        isUser
                          ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                          : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Speech Bubble */}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-md break-words whitespace-pre-wrap ${
                        isUser
                          ? "bg-gradient-to-r from-indigo-600/90 to-blue-600/90 text-white border border-indigo-500/30 rounded-tr-none"
                          : "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className={`text-[11px] font-semibold tracking-wide ${isUser ? "text-indigo-200" : "text-cyan-300 font-mono"}`}>
                          {isUser ? userName : "AI Evaluator"}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Real-time Speech Evaluation Active
            </span>
          </div>

        </div>

      </main>
    </div>
  );
}
