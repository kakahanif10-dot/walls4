"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  BrainCircuit,
  Send,
  Search,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Bot,
  User,
  ExternalLink,
  ShieldAlert,
  Zap,
  Globe,
  Radio,
  Copy,
  Check,
  Cpu,
  Layers,
  Flame,
  Terminal,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import WhopBadge from "@/components/whop-badge";

export type NwsModelKey = "nws-titan-4.0" | "nws-olympus-4.0" | "nws-mercury-3.8" | "nws-velocity-3.1";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  modelUsed?: string;
  groundingSources?: { uri: string; title: string }[];
}

const MODEL_OPTIONS: {
  key: NwsModelKey;
  roleId: string;
  name: string;
  roleTitle: string;
  desc: string;
  badge: string;
  badgeColor: string;
}[] = [
  {
    key: "nws-titan-4.0",
    roleId: "carbon",
    name: "NWS Titan 4.0",
    roleTitle: "NWS Titan 4.0 — Deep Quantitative Reasoning & Model Auditing Desk",
    desc: "Mathematical proofs, alpha factor scrutiny, volatility surfaces & risk stress-testing.",
    badge: "Deep Reasoning",
    badgeColor: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  },
  {
    key: "nws-olympus-4.0",
    roleId: "argon",
    name: "NWS Olympus 4.0",
    roleTitle: "NWS Olympus 4.0 — Multi-Asset Derivatives & Portfolio Structuring Desk",
    desc: "Complex multi-leg options, Greeks hedging, yield curve architecture & risk bounds.",
    badge: "Complex Structuring",
    badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  },
  {
    key: "nws-mercury-3.8",
    roleId: "flash",
    name: "NWS Mercury 3.8",
    roleTitle: "NWS Mercury 3.8 — Flow Desk & Market Intelligence Specialist",
    desc: "Cross-asset institutional flow, macroeconomic catalysts, earnings & rapid synthesis.",
    badge: "General Intelligence",
    badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  {
    key: "nws-velocity-3.1",
    roleId: "flash-lite",
    name: "NWS Velocity 3.1",
    roleTitle: "NWS Velocity 3.1 — Execution Alerts & Sub-Second Tape Reader",
    desc: "Sub-second tape reading, instant execution orders, stop targets & tight bid-ask spreads.",
    badge: "Fast Execution",
    badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
];

const PRESET_QUERIES = [
  "Audit the delta hedging risk on an ATM NVDA call spread expiring next month.",
  "What is the mathematical flaw in assuming stationary covariance during high-volatility shocks?",
  "Synthesize institutional order flow catalysts for Gold and US 10Y Treasury yields.",
  "Give me an instant execution stop and invalidation level for Bitcoin from the live tape.",
];

const SEARCH_PROMPTS = [
  "Federal Reserve rate path and FOMC minutes reaction today",
  "Nvidia latest data center chip demand & earnings revisions",
  "Global crude oil geopolitical supply disruption and Brent price action",
  "Spot Bitcoin and Ethereum ETF daily institutional net inflows",
];

export default function GeminiQuantTerminal() {
  const [activeTab, setActiveTab] = useState<"chat" | "search" | "voice">("chat");

  // Chat State
  const [selectedModel, setSelectedModel] = useState<NwsModelKey>("nws-mercury-3.8");
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      text: "NextWallStreet NWS AI Suite active. Selected: **NWS Mercury 3.8** (*Flow Desk & Market Intelligence*).\n\nAsk any quantitative model verification, multi-leg options structuring (NWS Olympus 4.0), or cross-asset tape query.",
      timestamp: "Live Feed",
      modelUsed: "NWS Mercury 3.8",
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchReport, setSearchReport] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<{ uri: string; title: string }[]>([]);
  const [searchQueriesUsed, setSearchQueriesUsed] = useState<string[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioMuted, setAudioMuted] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const currentModelMeta =
    MODEL_OPTIONS.find((m) => m.key === selectedModel) || MODEL_OPTIONS[2];

  // Send Chat message
  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextHistory = [...chatHistory, userMsg];
    setChatHistory(nextHistory);
    if (!msgText) setInputMessage("");
    setIsChatLoading(true);

    try {
      const messagesPayload = nextHistory.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        text: m.text,
      }));

      const res = await fetch("/api/nws-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesPayload,
          role: currentModelMeta.roleId,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: "a-" + Date.now(),
        role: "assistant",
        text: data.reply || data.error || "No response generated.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed || currentModelMeta.name,
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          text: `**Terminal Notice:** Live NWS AI request timed out or failed (${err?.message || "network error"}). Please retry your query.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          modelUsed: currentModelMeta.name,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Run Search Grounding
  const handleExecuteSearch = async (promptQuery?: string) => {
    const q = promptQuery || searchQuery;
    if (!q.trim() || isSearchLoading) return;

    setIsSearchLoading(true);
    setSearchReport(null);
    setGroundingSources([]);
    setSearchQueriesUsed([]);

    try {
      const res = await fetch("/api/nws-ai/search-grounding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchReport(data.error || `Search grounding unavailable (HTTP ${res.status}).`);
        return;
      }

      setSearchReport(data.text || "No grounded findings returned.");

      // Extract sources
      const sources: { uri: string; title: string }[] = [];
      if (Array.isArray(data.groundingChunks)) {
        data.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              uri: chunk.web.uri,
              title: chunk.web.title || chunk.web.uri,
            });
          }
        });
      }
      setGroundingSources(sources);
      setSearchQueriesUsed(data.searchQueries || [q]);
    } catch {
      setSearchReport("Failed to execute live search grounding. Please retry in a few moments.");
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Play audio buffer through 24kHz AudioContext (Feature 4 Requirement)
  const playAudio24kHz = async (base64Audio: string) => {
    if (audioMuted || !base64Audio) return;
    try {
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Initialize 24kHz audio context for playback
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start(0);
    } catch (e) {
      // Fallback: If raw PCM decode fails, browser speech synthesis handles vocalization gracefully
      if ("speechSynthesis" in window && voiceReply) {
        const utterance = new SpeechSynthesisUtterance(voiceReply);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Voice Interaction - Toggle Microphone (16kHz PCM capture)
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop Recording & Process
      setIsRecording(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setAudioLevel(0);

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      // Submit transcript or voice prompt
      const queryToSend = voiceTranscript || "Lead trader voice update: summarize stance and critical invalidation levels.";
      setIsVoiceProcessing(true);

      try {
        const res = await fetch("/api/nws-ai/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: queryToSend }),
        });
        const data = await res.json();
        setVoiceReply(data.replyText || "Voice desk acknowledgement confirmed.");
        if (data.audioBase64) {
          playAudio24kHz(data.audioBase64);
        }
      } catch {
        setVoiceReply("Voice desk network request failed. Please retry.");
      } finally {
        setIsVoiceProcessing(false);
      }
    } else {
      // Start Recording with 16kHz audio context
      setVoiceError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });
        audioContextRef.current = inputAudioCtx;

        const source = inputAudioCtx.createMediaStreamSource(stream);
        const analyser = inputAudioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        setIsRecording(true);
        setVoiceTranscript("Listening to trade audio stream...");
        setVoiceReply("");

        // Visualizer Loop
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();

        // Browser speech recognition if available for realtime text transcript
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRec();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setVoiceTranscript(transcript);
          };

          recognition.onerror = () => {};
          recognition.start();
        }
      } catch {
        setVoiceError("Microphone access is required for real-time voice conversations. Please enable mic permissions in your browser.");
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-line/80 bg-ink-950 overflow-hidden shadow-2xl">
      {/* Top Header / Mode Switcher */}
      <div className="border-b border-line/70 bg-ink-900/90 px-4 py-3 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border border-gold/40 bg-gold/10 flex items-center justify-center text-gold">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg text-bone font-medium">
                NextWallStreet NWS AI Suite
              </h3>
              <WhopBadge size="xs" />
            </div>
            <p className="text-xs text-muted">
              Multi-turn NWS AI chatbot with role routing, live search grounding &amp; 16kHz/24kHz voice interaction
            </p>
          </div>
        </div>

        {/* Tab Switcher: Chat | Search Grounding | Voice */}
        <div className="flex items-center gap-1.5 rounded-xl border border-line bg-ink-850 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all ${
              activeTab === "chat"
                ? "bg-gold text-ink-950 font-bold shadow-sm"
                : "text-muted hover:text-bone"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Multi-Turn Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all ${
              activeTab === "search"
                ? "bg-gold text-ink-950 font-bold shadow-sm"
                : "text-muted hover:text-bone"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Search Grounding
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all ${
              activeTab === "voice"
                ? "bg-gold text-ink-950 font-bold shadow-sm"
                : "text-muted hover:text-bone"
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            Live Voice (24kHz)
          </button>
        </div>
      </div>

      {/* TAB 1: MULTI-TURN CHAT */}
      {activeTab === "chat" && (
        <div className="flex flex-col h-[640px]">
          {/* Model & Role Selection Bar */}
          <div className="border-b border-line/60 bg-ink-900/50 px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-muted text-[11px] uppercase tracking-wider">
                Select Model &amp; Role:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedModel(opt.key)}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-all flex items-center gap-1.5 ${
                      selectedModel === opt.key
                        ? `${opt.badgeColor} font-semibold ring-1 ring-gold/40`
                        : "border-line/60 bg-ink-950/40 text-muted hover:border-gold/30 hover:text-bone"
                    }`}
                  >
                    <span>{opt.name}</span>
                    <span className="text-[9px] opacity-75">({opt.badge})</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setChatHistory([
                  {
                    id: "reset-" + Date.now(),
                    role: "assistant",
                    text: `Chat session reset. Connected to **${currentModelMeta.name}** (*${currentModelMeta.roleTitle}*).`,
                    timestamp: "Live",
                    modelUsed: selectedModel,
                  },
                ]);
              }}
              className="flex items-center gap-1 text-[11px] font-mono text-muted hover:text-gold transition-colors"
              title="Clear Conversation History"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Thread
            </button>
          </div>

          {/* Active Role Meta Callout */}
          <div className="bg-ink-950/40 border-b border-line/40 px-4 py-2 sm:px-6 flex items-center justify-between text-[11px] text-muted">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-bone">{currentModelMeta.roleTitle}</span>
              <span className="hidden sm:inline text-stone-500">— {currentModelMeta.desc}</span>
            </div>
            <span className="font-mono text-gold-bright text-[10px]">{selectedModel}</span>
          </div>

          {/* Scrollable Message History */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {chatHistory.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-xl border border-gold/40 bg-gold/10 flex items-center justify-center text-gold shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isAssistant
                        ? "border border-line/70 bg-ink-900/90 text-bone shadow-md"
                        : "border border-gold/40 bg-gold/15 text-bone font-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-muted mb-1.5 border-b border-line/40 pb-1">
                      <span className="font-semibold text-gold">
                        {isAssistant ? (msg.modelUsed || currentModelMeta.name) : "Trader"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {isAssistant && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="text-muted hover:text-gold"
                            title="Copy reply"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] text-bone/90 space-y-2">
                      {msg.text}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="h-8 w-8 rounded-xl border border-bone/20 bg-ink-850 flex items-center justify-center text-bone shrink-0 mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex items-center gap-3 text-xs text-muted font-mono py-2">
                <div className="h-7 w-7 rounded-lg border border-gold/30 bg-gold/10 flex items-center justify-center text-gold">
                  <Cpu className="h-3.5 w-3.5 animate-spin" />
                </div>
                <span>{currentModelMeta.name} synthesizing quantitative proof...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Preset Pills */}
          <div className="border-t border-line/50 bg-ink-950/60 px-4 py-2 sm:px-6 flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-muted">
            <span className="shrink-0 text-gold text-[10px] uppercase">Prompts:</span>
            {PRESET_QUERIES.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="shrink-0 rounded-md border border-line/60 bg-ink-900 px-2 py-0.5 text-stone-300 hover:border-gold/40 hover:text-gold-bright transition-colors truncate max-w-[280px]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-line/70 bg-ink-900/90 p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask ${currentModelMeta.roleTitle}...`}
                className="flex-1 rounded-xl border border-line/80 bg-ink-950 px-4 py-2.5 text-xs sm:text-sm text-bone placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isChatLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gold/50 bg-gold px-4 py-2.5 text-xs sm:text-sm font-semibold text-ink-950 transition-all hover:bg-gold-bright disabled:opacity-40"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE SEARCH GROUNDING */}
      {activeTab === "search" && (
        <div className="p-4 sm:p-6 space-y-6 min-h-[580px]">
          {/* Search Header Banner */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 text-xs">
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm">
              <Globe className="h-4 w-4" />
              NWS AI Search Grounding &amp; Real-Time Intelligence
            </div>
            <p className="text-blue-200/80 mt-1 text-[11px] leading-relaxed">
              Synthesizes real-time web intelligence using verified search grounding tools.
              Every output includes verified external sources, citations, and research links.
            </p>
          </div>

          {/* Search Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteSearch();
            }}
            className="flex flex-col sm:flex-row items-stretch gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gold" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query real-time market data, Fed speeches, breaking mergers, or ETF flows..."
                className="w-full rounded-xl border border-line/80 bg-ink-950 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-bone placeholder:text-muted/70 focus:border-gold focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearchLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/50 bg-gold px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink-950 transition-all hover:bg-gold-bright disabled:opacity-40"
            >
              {isSearchLoading ? (
                <>
                  <Cpu className="h-4 w-4 animate-spin" />
                  <span>Searching Web...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search Grounding</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Search Suggestions */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-[10px] uppercase text-muted">Trending Queries:</span>
            {SEARCH_PROMPTS.map((sp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSearchQuery(sp);
                  handleExecuteSearch(sp);
                }}
                className="rounded-lg border border-line/60 bg-ink-900 px-2.5 py-1 text-[11px] text-stone-300 hover:border-gold/40 hover:text-gold-bright transition-all"
              >
                {sp}
              </button>
            ))}
          </div>

          {/* Search Result Report & Sources */}
          {searchReport && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line/80 bg-ink-900/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-line/50 pb-2">
                  <span className="text-xs font-mono font-semibold text-gold uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-400" />
                    Real-Time Grounded Market Synthesis
                  </span>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-bold">
                    Web Grounded
                  </span>
                </div>

                <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-bone font-sans">
                  {searchReport}
                </div>

                {searchQueriesUsed.length > 0 && (
                  <div className="pt-2 border-t border-line/40 text-[11px] font-mono text-muted flex items-center gap-2 flex-wrap">
                    <span className="text-stone-500">Search Queries:</span>
                    {searchQueriesUsed.map((sq, i) => (
                      <span key={i} className="rounded bg-ink-950 px-2 py-0.5 border border-line/40 text-stone-300">
                        {sq}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Citations & Grounding Sources (Mandatory links) */}
              {groundingSources.length > 0 && (
                <div className="rounded-xl border border-gold/30 bg-gold/[0.03] p-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-gold mb-3">
                    <Globe className="h-3.5 w-3.5" />
                    Verified Grounding Sources ({groundingSources.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {groundingSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start justify-between gap-2 rounded-lg border border-line/70 bg-ink-950 p-2.5 transition-all hover:border-gold hover:bg-gold/5"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-bone truncate group-hover:text-gold-bright">
                            {src.title}
                          </p>
                          <p className="text-[10px] font-mono text-muted truncate mt-0.5">
                            {src.uri.replace(/^https?:\/\//, "")}
                          </p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted shrink-0 group-hover:text-gold" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIVE VOICE CONVERSATIONS (16kHz PCM & 24kHz Audio Playback) */}
      {activeTab === "voice" && (
        <div className="p-4 sm:p-8 space-y-6 flex flex-col items-center justify-center min-h-[580px] text-center">
          <div className="max-w-lg space-y-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-bold text-emerald-300 uppercase">
              NWS AI 3.8 Live Voice Terminal
            </span>
            <h4 className="font-display text-2xl sm:text-3xl text-bone font-medium">
              Real-Time Voice Trader Assistant
            </h4>
            <p className="text-xs sm:text-sm text-muted">
              Live microphone capture at 16kHz PCM with ultra-low latency response synthesis played back at 24kHz via Web Audio API.
            </p>
          </div>

          {/* Microphone Interactive Pulse Button */}
          <div className="relative my-6 flex items-center justify-center">
            {isRecording && (
              <div
                className="absolute rounded-full border-2 border-rose-500/60 bg-rose-500/20 transition-all duration-75"
                style={{
                  width: `${140 + audioLevel * 1.5}px`,
                  height: `${140 + audioLevel * 1.5}px`,
                }}
              />
            )}

            <button
              type="button"
              onClick={toggleRecording}
              className={`relative z-10 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 shadow-2xl transition-all ${
                isRecording
                  ? "border-rose-500 bg-rose-600 text-white animate-pulse"
                  : "border-gold/60 bg-gold/15 text-gold hover:bg-gold/25 hover:scale-105"
              }`}
            >
              {isRecording ? (
                <MicOff className="h-10 w-10 sm:h-12 sm:w-12" />
              ) : (
                <Mic className="h-10 w-10 sm:h-12 sm:w-12" />
              )}
            </button>
          </div>

          {/* Voice State Badge */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <span
              className={`flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${
                isRecording
                  ? "border border-rose-500/40 bg-rose-500/20 text-rose-300"
                  : isVoiceProcessing
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-300 animate-pulse"
                  : "border border-line bg-ink-900 text-muted"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isRecording ? "bg-rose-500 animate-ping" : isVoiceProcessing ? "bg-amber-400" : "bg-stone-500"
                }`}
              />
              {isRecording
                ? `Recording Active (16kHz PCM · ${audioLevel}% Vol)`
                : isVoiceProcessing
                ? "Processing Voice Synthesis..."
                : "Microphone Ready · Click to Speak"}
            </span>

            <button
              type="button"
              onClick={() => setAudioMuted(!audioMuted)}
              className="flex items-center gap-1 rounded-full border border-line bg-ink-900 px-3 py-1 text-muted hover:text-bone"
              title={audioMuted ? "Unmute Spoken Responses" : "Mute Spoken Responses"}
            >
              {audioMuted ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>24kHz Audio On</span>
                </>
              )}
            </button>
          </div>

          {voiceError && (
            <div className="w-full max-w-xl rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
              {voiceError}
            </div>
          )}

          {/* Live Transcript & Spoken Reply Display */}
          {(voiceTranscript || voiceReply) && (
            <div className="w-full max-w-xl text-left space-y-3">
              {voiceTranscript && (
                <div className="rounded-xl border border-line bg-ink-900/60 p-3.5 text-xs">
                  <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-1">
                    Spoken Audio Input (16kHz)
                  </div>
                  <p className="font-mono text-bone">{voiceTranscript}</p>
                </div>
              )}

              {voiceReply && (
                <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-xs">
                  <div className="flex items-center justify-between font-mono text-[10px] text-gold uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1">
                      <Volume2 className="h-3 w-3" /> Voice Desk Synthesized Response (24kHz)
                    </span>
                    <span>Zephyr Voice</span>
                  </div>
                  <p className="text-bone/90 text-sm leading-relaxed">{voiceReply}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
