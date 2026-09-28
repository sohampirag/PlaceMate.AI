"use client";

import { useState, useRef, useEffect, use, useCallback } from "react";
import { Mic, MicOff, PhoneOff, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

// AudioWorklet processor code as a string — captures raw 16-bit PCM at 16kHz
const PCM_WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2400; // 150ms at 16kHz
    this._buffer = new Float32Array(this._bufferSize);
    this._offset = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channelData = input[0];

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._offset++] = channelData[i];
      if (this._offset >= this._bufferSize) {
        // Convert float32 to int16 PCM
        const pcm16 = new Int16Array(this._bufferSize);
        for (let j = 0; j < this._bufferSize; j++) {
          const s = Math.max(-1, Math.min(1, this._buffer[j]));
          pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
        this._buffer = new Float32Array(this._bufferSize);
        this._offset = 0;
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
  const [transcript, setTranscript] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const { type } = use(params);
  const interviewType = type === "hr" ? "HR" : "Technical";

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  /**
   * Play raw 16-bit PCM audio at 16kHz using the Web Audio API.
   */
  const playRawPCM = useCallback((pcmData: ArrayBuffer) => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: 16000 });
    }
    const ctx = playbackContextRef.current;
    const int16 = new Int16Array(pcmData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    const audioBuffer = ctx.createBuffer(1, float32.length, 16000);
    audioBuffer.getChannelData(0).set(float32);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  }, []);

  const startInterview = async () => {
    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Create AudioContext for capturing raw PCM
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Register the PCM worklet processor
      const blob = new Blob([PCM_WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
      workletNodeRef.current = workletNode;

      sourceNode.connect(workletNode);
      workletNode.connect(audioContext.destination); // needed to keep processor alive

      // Connect WebSocket
      const targetRole = localStorage.getItem("targetRole") || "Software Engineer";
      const wsUrl = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL.replace("http", "ws")}/ws/interview?type=${interviewType}&role=${encodeURIComponent(targetRole)}`
        : `ws://localhost:8000/ws/interview?type=${interviewType}&role=${encodeURIComponent(targetRole)}`;

      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = "arraybuffer";

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setTranscript((prev) => [...prev, "System: Connected to voice agent."]);

        // Start sending raw PCM to websocket
        workletNode.port.onmessage = (event: MessageEvent) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(event.data as ArrayBuffer);
          }
        };

        setIsRecording(true);
      };

      wsRef.current.onmessage = (event: MessageEvent) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "transcript") {
              setTranscript((prev) => [...prev, `${msg.speaker}: ${msg.text}`]);
            }
          } catch (e) {
            console.error("Failed to parse message", e);
          }
        } else if (event.data instanceof ArrayBuffer) {
          // Play raw PCM audio from the server
          playRawPCM(event.data);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        cleanupAudio();
      };

      wsRef.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        setTranscript((prev) => [...prev, "System: Connection error."]);
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

  // Cleanup on unmount
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
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{interviewType} Mock Interview</h1>
        <p className="text-gray-500 mt-2">Real-time voice AI assistant</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
              isConnected ? "bg-blue-100 shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "bg-gray-100"
            }`}
          >
            <Activity
              className={`w-16 h-16 ${isConnected ? "text-blue-500 animate-pulse" : "text-gray-400"}`}
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-lg font-bold">{isConnected ? "Agent Active" : "Agent Offline"}</h2>
            <p className="text-sm text-gray-500">
              {isConnected ? "Listening and responding..." : "Click start to begin"}
            </p>
          </div>

          <div className="flex gap-4 w-full">
            {!isConnected ? (
              <button
                onClick={startInterview}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Mic className="w-5 h-5" /> Start
              </button>
            ) : (
              <button
                onClick={endSession}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneOff className="w-5 h-5" /> End Call
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-gray-900 rounded-xl p-6 h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-gray-400 border-b border-gray-800 pb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-mono tracking-widest uppercase">Live Transcript</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {transcript.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600 font-mono text-sm">
                Transcript will appear here...
              </div>
            ) : (
              transcript.map((line, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm ${
                    line.startsWith("User")
                      ? "bg-blue-900/40 text-blue-100 ml-8"
                      : "bg-gray-800 text-gray-200 mr-8"
                  }`}
                >
                  {line}
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
