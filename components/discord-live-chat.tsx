"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  Hash,
  Send,
  Zap,
  Bot,
  Clock,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  Radio,
  PlusCircle,
  X,
  UserPen,
  RotateCcw,
  Volume2,
  VolumeX,
  Users,
  Compass,
  MessageSquare,
  ChevronDown,
  Shield,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Info,
  Calendar,
  AlertTriangle,
  Flame,
  Search,
  Download,
  Share2,
  AtSign,
  Settings,
  Trash2,
  Bell,
  Sliders,
} from "lucide-react";
import {
  formatTimeZones,
  generateMinutePrediction,
  generateHourlyMarketSynthesis,
  generateContinuousFloorHistory,
  handleAIModeratorQuery,
  type MinutePrediction,
  type ChatMessage,
} from "@/lib/ai-moderator";
import { ASSETS } from "@/lib/market-assets";
import { ASSET_BY_SYMBOL, fmtPrice, metricsFor } from "@/lib/market";
import { useQuotes } from "@/components/live-prices";
import { useAuth } from "@/lib/auth-context";
import { useWhop } from "@/lib/whop-context";
import WhopBadge from "@/components/whop-badge";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, onSnapshot, query, limit } from "firebase/firestore";

export type { ChatMessage };

const CHANNELS = [
  { id: "general-trading", name: "general-trading", topic: "Live multi-asset floor tape: Equities, Binance Crypto & Pump.fun Memes", category: "TRADING DESKS" },
  { id: "ai-minute-predictions", name: "ai-minute-predictions", topic: "Automated 60-second quantitative predictions across 2,038 assets", category: "ANNOUNCEMENTS" },
  { id: "hourly-macro-desk", name: "hourly-macro-desk", topic: "Continuous hourly liquidity regime & sector rotation reports 24/7", category: "ANNOUNCEMENTS" },
  { id: "sp500-nasdaq-flow", name: "sp500-nasdaq-flow", topic: "Institutional order block mitigation, gamma flips, and earnings setups", category: "TRADING DESKS" },
  { id: "crypto-signals", name: "crypto-signals", topic: "Binance spot/perp momentum, funding rates, and liquidity sweeps", category: "TRADING DESKS" },
  { id: "meme-pump-fun", name: "meme-pump-fun", topic: "Pump.fun bonding curve breakouts, viral meta, and 2% risk sizing", category: "TRADING DESKS" },
  { id: "breakout-radar", name: "breakout-radar", topic: "Quantitative 20-EMA / VWAP momentum expansion alerts", category: "QUANT ALERTS" },
];

function playChatChime(type: "send" | "receive" = "send", enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = type === "send" ? 540 : 720;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(type === "send" ? 680 : 880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // ignore
  }
}

export default function DiscordLiveChat() {
  const liveQuotes = useQuotes();
  const liveQuotesRef = useRef(liveQuotes);
  liveQuotesRef.current = liveQuotes;
  const deskUpdateSeqRef = useRef(0);

  const [activeChannelId, setActiveChannelId] = useState("general-trading");
  const [messages, setMessages] = useState<ChatMessage[]>(() => generateContinuousFloorHistory());
  const [inputText, setInputText] = useState("");
  const [isTypingAI, setIsTypingAI] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showMemberList, setShowMemberList] = useState(true);

  const { user } = useAuth();

  // User Profile
  const [userName, setUserName] = useState("Trader (You)");
  const [userAvatar, setUserAvatar] = useState("👤");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileInputName, setProfileInputName] = useState("");

  useEffect(() => {
    if (user) {
      setUserName(user.displayName || user.email?.split("@")[0] || "Trader");
      if (user.photoURL) setUserAvatar(user.photoURL);
    }
  }, [user]);

  // Post Signal Modal
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [sigSymbol, setSigSymbol] = useState("NVDA");
  const [sigStance, setSigStance] = useState<MinutePrediction["stance"]>("STRONG BUY / LONG");
  const [sigPrice, setSigPrice] = useState("");
  const [sigTarget, setSigTarget] = useState("");
  const [sigStop, setSigStop] = useState("");
  const [sigNotes, setSigNotes] = useState("Breaking above 20-EMA on 15m volume expansion.");

  useEffect(() => {
    if (!showSignalModal) return;
    const sym = sigSymbol.trim().toUpperCase();
    const asset = ASSET_BY_SYMBOL[sym];
    const livePx = liveQuotes[sym]?.price ?? (asset ? metricsFor(asset).last : 0);
    if (livePx > 0) {
      const dec = livePx < 1 ? 6 : 2;
      const isShort = sigStance.includes("AVOID") || sigStance.includes("TRIM");
      setSigPrice(livePx.toFixed(dec));
      setSigTarget((livePx * (isShort ? 0.94 : 1.06)).toFixed(dec));
      setSigStop((livePx * (isShort ? 1.035 : 0.965)).toFixed(dec));
    } else {
      setSigPrice("");
      setSigTarget("");
      setSigStop("");
    }
  }, [showSignalModal, sigSymbol, sigStance, liveQuotes]);

  // Clocks and countdown
  const [timeData, setTimeData] = useState(() => formatTimeZones());
  const [countdown, setCountdown] = useState(60);
  const [aiPredictionsCount, setAiPredictionsCount] = useState(1);

  // Interactive buttons and modals
  const [showServerModal, setShowServerModal] = useState(false);
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    name: string;
    avatar: string;
    role: string;
    roleLabel: string;
    bio: string;
    accuracy: string;
    recentCalls: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedServerLink, setCopiedServerLink] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyServerLink = () => {
    try {
      const url = typeof window !== "undefined" ? window.location.origin + "/chat" : "https://nextwallstreet.com/chat";
      navigator.clipboard.writeText(url);
      setCopiedServerLink(true);
      playChatChime("send", soundEnabled);
      setTimeout(() => setCopiedServerLink(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleExportTranscript = () => {
    try {
      const transcript = messages
        .map((m) => `[${m.timeLabel}] ${m.author.name} (${m.author.roleLabel}): ${m.content}`)
        .join("\n\n");
      navigator.clipboard.writeText(transcript);
      setCopiedTranscript(true);
      playChatChime("send", soundEnabled);
      setTimeout(() => setCopiedTranscript(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleResetChatView = () => {
    const fresh = generateContinuousFloorHistory();
    setMessages(fresh);
    try {
      localStorage.removeItem("nws_discord_messages_v4");
    } catch {}
    setShowServerDropdown(false);
    playChatChime("send", soundEnabled);
  };

  const handleMentionMember = (name: string) => {
    setInputText((prev) => `${prev ? prev + " " : ""}@${name} `);
    setSelectedMember(null);
    chatInputRef.current?.focus();
  };

  const handleAskMember = (name: string) => {
    setInputText(`@${name} What is your quantitative outlook and invalidation stop on `);
    setSelectedMember(null);
    chatInputRef.current?.focus();
  };

  // Restore messages and profile from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("nws_discord_messages_v4");
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
      const savedProfile = localStorage.getItem("nws_user_profile");
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.name && !user) setUserName(p.name);
        if (p.avatar && !user) setUserAvatar(p.avatar);
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Listen for real-time trade ideas stored in Firestore
  useEffect(() => {
    const q = query(collection(db, "trade_ideas"), limit(25));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const firestoreId = `firestore-${change.doc.id}`;
            setMessages((prev) => {
              if (prev.some((m) => m.id === firestoreId)) return prev;
              const ideaMsg: ChatMessage = {
                id: firestoreId,
                channelId: "general-trading",
                author: {
                  name: data.userName || "Verified Desk Trader",
                  avatar: data.userAvatar || "👤",
                  role: "pro-trader",
                  roleLabel: "FIRESTORE VERIFIED",
                  roleColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                  isVerified: true,
                },
                content: `🎯 **COMMUNITY SETUP: $${data.symbol} (${data.stance})**\n${data.content}\nTarget: ${data.target} | Stop: ${data.invalidation}`,
                timestamp: data.createdAt || new Date().toISOString(),
                timeLabel: `${formatTimeZones(new Date(data.createdAt || Date.now())).wibTime} WIB`,
                reactions: { "🚀": 3, "🔥": 2 },
                userReactions: {},
              };
              return [...prev, ideaMsg];
            });
          }
        });
      },
      (error) => {
        console.warn("Firestore trade ideas live subscription fallback:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nws_discord_messages_v4", JSON.stringify(messages.slice(-80)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Real-time ticking clocks (WIB, UTC, EST) & automated minute scheduler
  useEffect(() => {
    let secondsCounter = 0;

    const clockInterval = setInterval(() => {
      setTimeData(formatTimeZones());
      secondsCounter++;

      // Countdown to next minute prediction
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerAutomatedMinutePrediction();
          return 60;
        }
        return prev - 1;
      });

      // Periodically post deterministic desk commentary grounded in live market quotes every 80s
      if (secondsCounter % 80 === 0) {
        triggerLiveDeskUpdate();
      }

      // Automatically generate hourly macro update every 3600 seconds (or when minute is 0)
      const now = new Date();
      if (now.getMinutes() === 0 && now.getSeconds() === 0) {
        setMessages((prev) => [...prev, generateHourlyMarketSynthesis(0)]);
        playChatChime("receive", soundEnabled);
      }
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [activeChannelId, soundEnabled]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTypingAI]);

  // Automated 60-Second Minute Prediction Generator
  const triggerAutomatedMinutePrediction = (forceSymbol?: string) => {
    const basePrediction = generateMinutePrediction(forceSymbol, aiPredictionsCount);
    const livePx = liveQuotesRef.current[basePrediction.symbol]?.price;
    const scale =
      livePx && livePx > 0 && basePrediction.currentPrice > 0
        ? livePx / basePrediction.currentPrice
        : 1;
    const prediction: MinutePrediction =
      scale === 1
        ? basePrediction
        : {
            ...basePrediction,
            currentPrice: livePx!,
            target1: Number((basePrediction.target1 * scale).toFixed(livePx! < 1 ? 5 : 2)),
            target2: Number((basePrediction.target2 * scale).toFixed(livePx! < 1 ? 5 : 2)),
            invalidationLevel: Number((basePrediction.invalidationLevel * scale).toFixed(livePx! < 1 ? 5 : 2)),
          };
    const date = new Date();
    const { utcTime, estTime } = formatTimeZones(date);

    const newAlert: ChatMessage = {
      id: `quant-minute-${Date.now()}`,
      channelId: activeChannelId === "ai-minute-predictions" ? "ai-minute-predictions" : activeChannelId,
      author: {
        name: "Quant Strategy Desk",
        avatar: "🏛️",
        role: "ai-mod",
        roleLabel: "QUANT DESK",
        roleColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        isBot: true,
        isVerified: true,
      },
      content: `⚡ **QUANTITATIVE MINUTE SIGNAL: $${prediction.symbol} (${prediction.name})**\nReal-time model prediction generated at ${utcTime} UTC (${estTime} EST). Confidence: ${prediction.confidence}%.`,
      prediction,
      timestamp: date.toISOString(),
      timeLabel: `${estTime} EST`,
      reactions: { "🚀": 2, "💎": 2, "🧠": 3 },
      userReactions: {},
    };

    setMessages((prev) => [...prev, newAlert]);
    setAiPredictionsCount((c) => c + 1);
    playChatChime("receive", soundEnabled);
  };

  // Live Desk Floor Telemetry Update (grounded in real-time quote tape)
  const triggerLiveDeskUpdate = () => {
    const quotes = liveQuotesRef.current;
    const fmtSym = (sym: string) => (quotes[sym]?.price ? fmtPrice(quotes[sym].price) : "live tape");
    const floorReplies = [
      {
        name: "Daniel Okafor",
        avatar: "👨🏾‍💼",
        role: "head-desk" as const,
        roleLabel: "HEAD OF STRATEGY",
        roleColor: "bg-gold/20 text-gold-bright border-gold/40",
        text: `Semiconductor breadth tracking above key moving averages. Institutional bid depth active around $NVDA (${fmtSym("NVDA")}) and $TSM (${fmtSym("TSM")}).`,
      },
      {
        name: "Mara Lindqvist",
        avatar: "👩🏼‍💻",
        role: "quant" as const,
        roleLabel: "CRYPTO LEAD",
        roleColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
        text: `Solana spot order flow absorbing liquidity near ${fmtSym("SOL")}. Perpetual funding remains balanced relative to $BTC (${fmtSym("BTC")}).`,
      },
      {
        name: "Priya Raghunathan",
        avatar: "👩🏽‍💼",
        role: "quant" as const,
        roleLabel: "QUANT RESEARCH",
        roleColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
        text: "Cross-asset breadth scan across the 2,038 tracked instruments is updated continuously from live exchange tapes and Treasury curve feeds.",
      },
      {
        name: "ScalpMaster_NY",
        avatar: "⚡",
        role: "pro-trader" as const,
        roleLabel: "SCALPER",
        roleColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        text: `Monitoring $BTC basis structure around ${fmtSym("BTC")} with invalidation stop strictly anchored to the Quant Desk model.`,
      },
      {
        name: "Vance_Capital",
        avatar: "🏛️",
        role: "pro-trader" as const,
        roleLabel: "PRO TRADER",
        roleColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        text: `Tracking $NVDA live print at ${fmtSym("NVDA")} alongside $AAPL (${fmtSym("AAPL")}) while maintaining strict invalidation stop discipline.`,
      },
    ];

    const entry = floorReplies[deskUpdateSeqRef.current % floorReplies.length];
    deskUpdateSeqRef.current += 1;
    const date = new Date();
    const { estTime } = formatTimeZones(date);

    const deskMsg: ChatMessage = {
      id: `desk-auto-${Date.now()}`,
      channelId: activeChannelId,
      author: {
        name: entry.name,
        avatar: entry.avatar,
        role: entry.role,
        roleLabel: entry.roleLabel,
        roleColor: entry.roleColor,
        isVerified: true,
      },
      content: entry.text,
      timestamp: date.toISOString(),
      timeLabel: `${estTime} EST`,
      reactions: { "👍": 3, "🔥": 2 },
      userReactions: {},
    };

    setMessages((prev) => [...prev, deskMsg]);
    playChatChime("receive", soundEnabled);
  };

  const handleSendMessageWithText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    setInputText("");
    playChatChime("send", soundEnabled);

    const date = new Date();
    const { wibTime } = formatTimeZones(date);

    // 1. Add User Message Immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      channelId: activeChannelId,
      author: {
        name: userName,
        avatar: userAvatar,
        role: "pro-trader",
        roleLabel: "ACTIVE TRADER",
        roleColor: "bg-gold/20 text-gold-bright border-gold/40",
      },
      content: trimmed,
      timestamp: date.toISOString(),
      timeLabel: `${wibTime} WIB`,
      reactions: { "👍": 1 },
      userReactions: { "👍": true },
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTypingAI(true);

    // 2. Fetch Quant Strategy Desk Response from /api/ai-chat
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      setIsTypingAI(false);
      playChatChime("receive", soundEnabled);

      const aiReplyMsg: ChatMessage = {
        id: `ai-reply-${Date.now()}`,
        channelId: activeChannelId,
        author: {
          name: "Quant Strategy Desk",
          avatar: "🏛️",
          role: "ai-mod",
          roleLabel: "QUANT DESK",
          roleColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          isBot: true,
          isVerified: true,
        },
        content: data.reply || `Confirmed technical scan for "${trimmed}". Order flow monitored on the live tape.`,
        prediction: data.prediction,
        timestamp: new Date().toISOString(),
        timeLabel: `${formatTimeZones().estTime} EST`,
        reactions: { "🧠": 6, "🚀": 4 },
        userReactions: {},
      };

      setMessages((prev) => [...prev, aiReplyMsg]);
    } catch {
      setIsTypingAI(false);
      playChatChime("receive", soundEnabled);
      const fallback = handleAIModeratorQuery(trimmed);
      const aiReplyMsg: ChatMessage = {
        id: `ai-reply-${Date.now()}`,
        channelId: activeChannelId,
        author: {
          name: "Quant Strategy Desk",
          avatar: "🏛️",
          role: "ai-mod",
          roleLabel: "QUANT DESK",
          roleColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          isBot: true,
          isVerified: true,
        },
        content: fallback.reply,
        prediction: fallback.prediction,
        timestamp: new Date().toISOString(),
        timeLabel: `${formatTimeZones().estTime} EST`,
        reactions: { "🧠": 4, "🚀": 3 },
        userReactions: {},
      };
      setMessages((prev) => [...prev, aiReplyMsg]);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await handleSendMessageWithText(inputText);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = { ...msg.reactions };
        const userReactions = { ...msg.userReactions };
        const isReacted = userReactions[emoji];

        if (isReacted) {
          currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
          delete userReactions[emoji];
        } else {
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          userReactions[emoji] = true;
          playChatChime("send", soundEnabled);
        }

        return { ...msg, reactions: currentReactions, userReactions };
      })
    );
  };

  const handlePostSignal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(sigPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return;
    const parsedTarget = Number(sigTarget);
    const parsedStop = Number(sigStop);
    const date = new Date();
    const { wibTime, utcTime } = formatTimeZones(date);

    const customPrediction: MinutePrediction = {
      id: `usr-sig-${Date.now()}`,
      symbol: sigSymbol.toUpperCase(),
      name: ASSETS.find((a) => a.symbol === sigSymbol.toUpperCase())?.name || sigSymbol.toUpperCase(),
      kind: ASSETS.find((a) => a.symbol === sigSymbol.toUpperCase())?.kind || "stock",
      group: ASSETS.find((a) => a.symbol === sigSymbol.toUpperCase())?.group || "Equities / Crypto",
      currentPrice: parsedPrice,
      stance: sigStance,
      confidence: 88,
      target1: Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : parsedPrice * 1.05,
      target2: Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget * 1.05 : parsedPrice * 1.1,
      invalidationLevel: Number.isFinite(parsedStop) && parsedStop > 0 ? parsedStop : parsedPrice * 0.95,
      technicalMechanism: sigNotes || "User member setup: technical consolidation breakout with defined risk-reward.",
      timeHorizon: "1h Momentum",
      catalystAlert: "Technical order flow breakout",
      timestamp: date.toISOString(),
      wibTime,
      utcTime,
      estTime: timeData.estTime,
    };

    const userSignalMsg: ChatMessage = {
      id: `user-sig-${Date.now()}`,
      channelId: activeChannelId,
      author: {
        name: userName,
        avatar: userAvatar,
        role: "pro-trader",
        roleLabel: "COMMUNITY SIGNAL",
        roleColor: "bg-gold/25 text-gold-bright border-gold/50",
      },
      content: `🎯 **COMMUNITY TRADE SIGNAL: $${customPrediction.symbol} (${sigStance})**\nEntry: $${sigPrice} | Target: $${sigTarget} | Stop: $${sigStop}`,
      prediction: customPrediction,
      timestamp: date.toISOString(),
      timeLabel: `${wibTime} WIB`,
      reactions: { "🚀": 5, "💎": 3, "🔥": 4 },
      userReactions: { "🚀": true },
    };

    setMessages((prev) => [...prev, userSignalMsg]);
    setShowSignalModal(false);

    if (user) {
      try {
        const ideaId = `idea-${Date.now()}`;
        setDoc(doc(db, "trade_ideas", ideaId), {
          symbol: customPrediction.symbol,
          stance: customPrediction.stance,
          content: customPrediction.technicalMechanism,
          target: `$${customPrediction.target1}`,
          invalidation: `$${customPrediction.invalidationLevel}`,
          userName,
          userAvatar,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Could not save trade idea to Firestore:", err);
      }
    }
  };

  const handleSaveProfile = () => {
    if (!profileInputName.trim()) return;
    setUserName(profileInputName.trim());
    setIsEditingProfile(false);
    try {
      localStorage.setItem("nws_user_profile", JSON.stringify({ name: profileInputName.trim(), avatar: userAvatar }));
    } catch {
      // ignore
    }
  };

  const activeChannel = CHANNELS.find((c) => c.id === activeChannelId) || CHANNELS[0];
  const displayedMessages = useMemo(() => {
    let list =
      activeChannelId === "general-trading"
        ? messages
        : messages.filter((m) => m.channelId === activeChannelId || m.channelId === "general-trading");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.author.name.toLowerCase().includes(q) ||
          (m.prediction && m.prediction.symbol.toLowerCase().includes(q))
      );
    }
    return list;
  }, [messages, activeChannelId, searchQuery]);

  return (
    <div className="flex h-[820px] max-h-[85vh] w-full overflow-hidden rounded-2xl border border-line bg-ink-950 shadow-2xl">
      {/* 1. DISCORD SERVER ICON RAIL (Leftmost column, ~68px) */}
      <div className="hidden sm:flex w-[68px] flex-col items-center justify-between border-r border-line/60 bg-ink-950 py-3 shrink-0">
        <div className="flex flex-col items-center gap-3">
          {/* Main Server Pill Indicator & Gold Shield Icon */}
          <div className="relative group">
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r bg-gold" />
            <button
              type="button"
              onClick={() => setShowServerModal(true)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-gold/30 via-gold to-bone p-[1.5px] shadow-lg transition-transform hover:scale-105 active:scale-95"
              title="NextWallStreet Institutional Server — Click for Analytics & Settings"
            >
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-ink-900 font-display text-sm font-bold text-gold-bright">
                NWS
              </div>
            </button>
          </div>

          <div className="h-px w-8 bg-line/60" />

          {/* DM / Explorer Icons */}
          <button
            type="button"
            onClick={() => {
              setActiveChannelId("general-trading");
              setIsSearching(false);
              setSearchQuery("");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-muted hover:text-bone hover:bg-ink-850 transition"
            title="Trading Desks Floor"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveChannelId("ai-minute-predictions");
              setIsSearching(false);
              setSearchQuery("");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-emerald-400 hover:text-emerald-300 hover:bg-ink-850 transition relative"
            title="AI Minute Predictions Stream"
          >
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveChannelId("hourly-macro-desk");
              setIsSearching(false);
              setSearchQuery("");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-gold-bright hover:bg-ink-850 transition"
            title="Hourly Macro & Liquidity Reports"
          >
            <Calendar className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom Audio & Status Controls */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled((s) => !s);
              playChatChime("receive", !soundEnabled);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:text-bone hover:bg-ink-900 transition"
            title={soundEnabled ? "Audio chimes: ON (Click to mute)" : "Audio chimes: MUTED (Click to enable)"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-gold-bright" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* 2. CHANNELS & CLOCKS SIDEBAR (~230px) */}
      <div className="flex w-56 sm:w-64 flex-col justify-between border-r border-line/60 bg-ink-900/90 shrink-0">
        <div>
          {/* Server Title Header with Interactive Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowServerDropdown((v) => !v)}
              className="flex items-center justify-between w-full border-b border-line/60 px-4 py-3.5 shadow-sm hover:bg-ink-850/80 transition text-left"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold" />
                <span className="font-display text-sm font-bold text-bone">NextWallStreet</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${showServerDropdown ? "rotate-180 text-gold" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {showServerDropdown && (
              <div className="absolute left-2 right-2 top-12 z-50 rounded-xl border border-line bg-ink-950 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowServerModal(true);
                    setShowServerDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-bone hover:bg-ink-850 transition"
                >
                  <Activity className="h-3.5 w-3.5 text-gold" />
                  <span>Server Analytics &amp; Models</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyServerLink}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-bone hover:bg-ink-850 transition"
                >
                  {copiedServerLink ? <Check className="h-3.5 w-3.5 text-up" /> : <Share2 className="h-3.5 w-3.5 text-emerald-400" />}
                  <span>{copiedServerLink ? "Link Copied!" : "Copy Server Invite Link"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSoundEnabled((s) => !s);
                    setShowServerDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-bone hover:bg-ink-850 transition"
                >
                  {soundEnabled ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-gold-bright" />}
                  <span>{soundEnabled ? "Mute Floor Chimes" : "Enable Floor Audio"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportTranscript}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-bone hover:bg-ink-850 transition"
                >
                  {copiedTranscript ? <Check className="h-3.5 w-3.5 text-up" /> : <Download className="h-3.5 w-3.5 text-blue-400" />}
                  <span>{copiedTranscript ? "Transcript Copied!" : "Export Floor Transcript"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetChatView}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset / Reload Floor History</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Real-Time Clocks Pill in Sidebar */}
          <div className="mx-3 mt-3 rounded-lg border border-line/80 bg-ink-950 p-2.5 text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-[10px] text-muted uppercase">
              <span className="flex items-center gap-1 text-gold">
                <Clock className="h-3 w-3" /> Clocks
              </span>
              <span className="text-emerald-400 font-bold">{timeData.sessionStatus.split(" ")[0]}</span>
            </div>
            <div className="flex justify-between text-bone text-[11px]">
              <span className="text-muted">🇮🇩 WIB:</span>
              <span className="font-bold text-gold-bright">{timeData.wibTime}</span>
            </div>
            <div className="flex justify-between text-muted text-[10px]">
              <span>🌐 UTC:</span>
              <span>{timeData.utcTime}</span>
            </div>
            <div className="flex justify-between text-muted text-[10px]">
              <span>🇺🇸 EST:</span>
              <span>{timeData.estTime}</span>
            </div>
            {/* Auto Prediction Countdown */}
            <div className="border-t border-line/60 pt-1 flex items-center justify-between text-[10px] text-muted">
              <span>Next AI Alert:</span>
              <span className="text-emerald-400 font-bold">{countdown}s</span>
            </div>
          </div>

          {/* Channel Groups */}
          <div className="mt-3 px-2 space-y-4 overflow-y-auto max-h-[500px] scrollbar-thin">
            {["ANNOUNCEMENTS", "TRADING DESKS", "QUANT ALERTS"].map((category) => (
              <div key={category} className="space-y-1">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted/70">
                  {category}
                </span>
                {CHANNELS.filter((c) => c.category === category).map((ch) => {
                  const isActive = activeChannelId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition ${
                        isActive
                          ? "bg-gold/20 text-gold-bright font-semibold shadow-sm"
                          : "text-muted hover:bg-ink-850 hover:text-bone"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Hash className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-gold" : "text-muted"}`} />
                        <span className="truncate">{ch.name}</span>
                        {ch.id !== "general-trading" && <WhopBadge className="ml-1 text-[11px]" />}
                      </div>
                      {ch.id === "ai-minute-predictions" && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono text-emerald-300 font-bold">
                          60s
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* User Presence Bar at bottom of sidebar */}
        <div className="flex items-center justify-between border-t border-line/60 bg-ink-950 p-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{userAvatar}</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-bone">{userName}</p>
              <p className="font-mono text-[10px] text-muted">#1337 · Online</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingProfile((p) => !p)}
            className="text-muted hover:text-bone p-1"
            title="Edit chat nickname"
          >
            <UserPen className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3. MAIN CHAT AREA (Center) */}
      <div className="flex flex-1 flex-col justify-between overflow-hidden bg-ink-950">
        {/* Channel Header + Top Global Clocks Banner */}
        <div className="border-b border-line/60 bg-ink-900/95 px-4 py-3 shadow-md space-y-2">
          {/* Top Row: Channel title & action buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="h-4 w-4 text-gold shrink-0" />
              <h3 className="font-display text-sm sm:text-base font-bold text-bone truncate flex items-center">
                <span>{activeChannel.name}</span>
                <WhopBadge className="ml-1.5 text-xs" />
              </h3>
              <span className="hidden md:inline h-3.5 w-px bg-line/80 mx-1" />
              <p className="hidden md:inline text-xs text-muted truncate max-w-md">
                {activeChannel.topic}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSearching((s) => !s);
                  if (isSearching) setSearchQuery("");
                }}
                className={`rounded-lg p-1.5 transition ${
                  isSearching || searchQuery ? "text-gold bg-ink-850" : "text-muted hover:text-bone"
                }`}
                title="Search / filter channel messages"
              >
                <Search className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleExportTranscript}
                className="rounded-lg p-1.5 text-muted hover:text-bone hover:bg-ink-850 transition"
                title="Copy / export channel transcript"
              >
                {copiedTranscript ? <Check className="h-4 w-4 text-up" /> : <Download className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => triggerAutomatedMinutePrediction()}
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                title="Force generate real-time AI prediction"
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Run Prediction</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMemberList((m) => !m)}
                className={`rounded-lg p-1.5 transition ${
                  showMemberList ? "text-gold bg-ink-850" : "text-muted hover:text-bone"
                }`}
                title="Toggle Online Members Sidebar"
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* SEARCH BAR (When search button is active) */}
          {isSearching && (
            <div className="flex items-center gap-2 rounded-lg border border-gold/40 bg-ink-950 px-3 py-1.5 animate-in fade-in">
              <Search className="h-3.5 w-3.5 text-gold shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages by ticker (e.g. NVDA, BTC) or content..."
                className="flex-1 bg-transparent text-xs text-bone placeholder:text-muted/60 focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-muted hover:text-bone px-1"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* DEDICATED PROMINENT GLOBAL TRADING CLOCKS STRIP */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-ink-950 px-3 py-1.5 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-bone">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <strong className="text-gold-bright">{timeData.wibTime}</strong>
                <span className="text-muted text-[10px]">WIB</span>
              </span>
              <span className="text-line hidden sm:inline">|</span>
              <span className="text-muted text-[11px] hidden sm:inline">
                {timeData.utcTime} <span className="text-[10px]">UTC</span>
              </span>
              <span className="text-line hidden sm:inline">|</span>
              <span className="text-muted text-[11px]">
                {timeData.estTime} <span className="text-[10px]">EST</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="rounded bg-line/60 px-2 py-0.5 text-bone font-semibold">
                {timeData.sessionStatus}
              </span>
              <span className="text-emerald-400 font-bold hidden sm:inline">
                ⏱️ Next Alert: {countdown}s
              </span>
            </div>
          </div>
        </div>

        {/* Messages Feed Viewport */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
        >
          {displayedMessages.map((msg, index) => {
            const isBot = msg.author.isBot;
            const pred = msg.prediction;

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-ink-900/60 ${
                  isBot ? "border-l-2 border-emerald-500/80 bg-emerald-500/[0.02]" : ""
                }`}
              >
                {/* User / Bot Avatar */}
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 border border-line text-lg font-bold shadow-sm">
                  {msg.author.avatar}
                  {isBot && (
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 text-[8px] flex items-center justify-center text-ink-950 font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Header: Name, Role Badge, Time */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-bone">
                      {msg.author.name}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.2 font-mono text-[9px] font-bold ${msg.author.roleColor}`}
                    >
                      {msg.author.roleLabel}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      {msg.timeLabel}
                    </span>
                  </div>

                  {/* Message Body Content */}
                  <div className="mt-1 text-xs sm:text-sm leading-relaxed text-bone/90 whitespace-pre-line">
                    {msg.content}
                  </div>

                  {/* DISCORD-STYLE EMBED CARD FOR MINUTE PREDICTIONS */}
                  {pred && (
                    <div
                      className={`mt-2.5 rounded-xl border p-3.5 backdrop-blur-sm max-w-2xl shadow-xl ${
                        pred.stance.includes("BUY")
                          ? "border-emerald-500/50 bg-emerald-500/[0.06]"
                          : pred.stance.includes("ACCUMULATE")
                          ? "border-teal-500/50 bg-teal-500/[0.06]"
                          : pred.stance.includes("TRIM")
                          ? "border-amber-500/50 bg-amber-500/[0.06]"
                          : "border-rose-500/50 bg-rose-500/[0.06]"
                      }`}
                    >
                      {/* Embed Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2.5">
                        <div className="flex items-center gap-2 font-mono">
                          <Link
                            href={`/ticker/${pred.symbol}`}
                            className="font-bold text-sm sm:text-base text-bone hover:text-gold-bright transition"
                          >
                            ${pred.symbol}
                          </Link>
                          <span className="text-xs text-muted">({pred.name})</span>
                          <span className="rounded bg-line/60 px-1.5 py-0.2 text-[9px] uppercase text-muted">
                            {pred.kind}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-gold/20 border border-gold/40 px-2.5 py-0.5 font-mono text-[10px] font-bold text-gold-bright">
                            {pred.stance}
                          </span>
                          <span className="font-mono text-xs text-emerald-400 font-bold">
                            {pred.confidence}% Conviction
                          </span>
                        </div>
                      </div>

                      {/* Embed Technical Levels Grid */}
                      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
                        <div className="rounded-lg bg-ink-950/70 p-2 border border-line/60">
                          <span className="text-[10px] text-muted uppercase">Spot Price</span>
                          <p className="font-bold text-bone">
                            {Number.isFinite(pred.currentPrice)
                              ? `$${pred.currentPrice >= 1 ? pred.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : pred.currentPrice.toFixed(5)}`
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-ink-950/70 p-2 border border-line/60">
                          <span className="text-[10px] text-muted uppercase">Target 1</span>
                          <p className="font-bold text-emerald-400">
                            {Number.isFinite(pred.target1)
                              ? `$${pred.target1 >= 1 ? pred.target1.toLocaleString(undefined, { maximumFractionDigits: 2 }) : pred.target1.toFixed(5)}`
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-ink-950/70 p-2 border border-line/60">
                          <span className="text-[10px] text-muted uppercase">Target 2</span>
                          <p className="font-bold text-emerald-300">
                            {Number.isFinite(pred.target2)
                              ? `$${pred.target2 >= 1 ? pred.target2.toLocaleString(undefined, { maximumFractionDigits: 2 }) : pred.target2.toFixed(5)}`
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-ink-950/70 p-2 border border-line/60">
                          <span className="text-[10px] text-rose-400 uppercase font-semibold">Invalidation Stop</span>
                          <p className="font-bold text-rose-400">
                            {Number.isFinite(pred.invalidationLevel)
                              ? `$${pred.invalidationLevel >= 1 ? pred.invalidationLevel.toLocaleString(undefined, { maximumFractionDigits: 2 }) : pred.invalidationLevel.toFixed(5)}`
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Technical Mechanism & Rationale */}
                      <div className="mt-2.5 rounded-lg bg-ink-950/80 p-2.5 text-xs text-bone/90 border border-line/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-bright block mb-1">
                          Quantitative Mechanism &amp; Tape Structure:
                        </span>
                        <p className="leading-relaxed">{pred.technicalMechanism}</p>
                      </div>

                      {/* Horizon and Catalyst Footer */}
                      <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-muted pt-1">
                        <span>Horizon: <strong className="text-bone">{pred.timeHorizon}</strong> · Catalyst: <strong className="text-bone">{pred.catalystAlert}</strong></span>
                        <Link
                          href={`/ticker/${pred.symbol}`}
                          className="flex items-center gap-1 text-gold-bright hover:underline font-semibold"
                        >
                          View Full Chart &amp; Math <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Reaction Buttons */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {["🚀", "💎", "📈", "🔥", "🧠"].map((emoji) => {
                      const count = msg.reactions[emoji] || 0;
                      const hasReacted = msg.userReactions[emoji];
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition ${
                            hasReacted
                              ? "bg-gold/20 border border-gold/50 text-gold-bright font-bold"
                              : "bg-ink-900 border border-line text-muted hover:text-bone hover:border-line/80"
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="font-mono text-[10px]">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTypingAI && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Quant Strategy Desk is compiling technical analysis...</span>
            </div>
          )}
        </div>

        {/* Message Input Bar & Quick Action Pills */}
        <div className="border-t border-line/60 bg-ink-900/95 p-3 sm:p-4 space-y-2">
          {/* Quick Action Command Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 scrollbar-none">
            <span className="text-muted shrink-0 text-[10px] uppercase font-bold">Quick:</span>
            {["/predict NVDA", "/predict BTC", "/predict SOL", "/predict FARTCOIN", "Market Clocks 🕒"].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleSendMessageWithText(cmd.includes("Clocks") ? "Market Clocks" : cmd)}
                className="whitespace-nowrap rounded-full bg-ink-950 border border-line px-2.5 py-0.5 font-mono text-muted hover:text-gold-bright hover:border-gold/40 transition shrink-0"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const sym = sigSymbol.toUpperCase();
                const livePx = liveQuotes[sym]?.price;
                if (livePx && livePx > 0) {
                  setSigPrice(livePx.toFixed(livePx < 1 ? 5 : 2));
                  setSigTarget((livePx * 1.055).toFixed(livePx < 1 ? 5 : 2));
                  setSigStop((livePx * 0.97).toFixed(livePx < 1 ? 5 : 2));
                }
                setShowSignalModal(true);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-950 border border-line text-muted hover:text-gold-bright hover:border-gold/40 transition"
              title="Post custom trade setup"
            >
              <PlusCircle className="h-4 w-4" />
            </button>

            <input
              ref={chatInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message #${activeChannel.name} (Inquire on symbols or type /predict [symbol])...`}
              className="flex-1 rounded-xl border border-line bg-ink-950 px-4 py-2.5 text-xs sm:text-sm text-bone placeholder:text-muted/60 focus:border-gold focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-ink-950 hover:bg-gold-bright transition disabled:opacity-40 shadow"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 4. ONLINE MEMBERS SIDEBAR (~220px, Discord style) */}
      {showMemberList && (
        <div className="hidden lg:flex w-56 flex-col border-l border-line/60 bg-ink-900/80 p-3 shrink-0 overflow-y-auto scrollbar-thin">
          <div className="space-y-4 text-xs">
            {/* Core Quant Desk */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Core Quant Desk — 2
              </span>
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMember({
                      name: "Quant Strategy Desk",
                      avatar: "🏛️",
                      role: "Core Quant Engine",
                      roleLabel: "QUANT DESK",
                      bio: "Continuously monitoring order-flow imbalances and calculating 5-factor mathematical trend scores across 2,038 assets every 60 seconds.",
                      accuracy: "79.2% historical trend persistence",
                      recentCalls: `$NVDA (${liveQuotes["NVDA"]?.price ? fmtPrice(liveQuotes["NVDA"].price) : "Live"}), $BTC (${liveQuotes["BTC"]?.price ? fmtPrice(liveQuotes["BTC"].price) : "Live"}), $SOL (${liveQuotes["SOL"]?.price ? fmtPrice(liveQuotes["SOL"].price) : "Live"})`,
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-lg p-1.5 hover:bg-ink-850 transition text-left group"
                  title="Click to view analyst profile or @mention"
                >
                  <span className="text-lg">🏛️</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-emerald-300 group-hover:text-emerald-200">
                      Quant Strategy Desk
                    </p>
                    <p className="text-[10px] text-muted truncate">Analyzing 2,038 assets</p>
                  </div>
                  <AtSign className="h-3 w-3 text-muted/60 opacity-0 group-hover:opacity-100 transition shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedMember({
                      name: "Daniel Okafor",
                      avatar: "👨🏾‍💼",
                      role: "Head of Strategy",
                      roleLabel: "SENIOR STRATEGIST",
                      bio: "Oversees macro equity models and invalidation stop levels for large-cap technology and growth names.",
                      accuracy: "14 years institutional macro experience",
                      recentCalls: "$AAPL range consolidation, $MSFT cloud expansion",
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-lg p-1.5 hover:bg-ink-850 transition text-left group"
                  title="Click to view analyst profile or @mention"
                >
                  <span className="text-lg">👨🏾‍💼</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gold-bright group-hover:text-gold">
                      Daniel Okafor
                    </p>
                    <p className="text-[10px] text-muted truncate">Head of Strategy</p>
                  </div>
                  <AtSign className="h-3 w-3 text-muted/60 opacity-0 group-hover:opacity-100 transition shrink-0" />
                </button>
              </div>
            </div>

            {/* Strategists & Mods */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Strategists &amp; Mods — 2
              </span>
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMember({
                      name: "Mara Lindqvist",
                      avatar: "👩🏼‍💻",
                      role: "Digital Assets Lead",
                      roleLabel: "CRYPTO DESK",
                      bio: "Tracks Binance spot order book depth, pump.fun bonding curve liquidity, and meme-coin decay risk metrics.",
                      accuracy: "73.8% on major L1/L2 structural entries",
                      recentCalls: "$BTC liquidity delta, $FARTCOIN float risk cap",
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-lg p-1.5 hover:bg-ink-850 transition text-left group"
                  title="Click to view analyst profile or @mention"
                >
                  <span className="text-lg">👩🏼‍💻</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-purple-300 group-hover:text-purple-200">
                      Mara Lindqvist
                    </p>
                    <p className="text-[10px] text-muted truncate">Digital Assets Lead</p>
                  </div>
                  <AtSign className="h-3 w-3 text-muted/60 opacity-0 group-hover:opacity-100 transition shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedMember({
                      name: "Priya Raghunathan",
                      avatar: "👩🏽‍💼",
                      role: "Quant Analyst",
                      roleLabel: "QUANT RESEARCH",
                      bio: "Mathematical model auditor specializing in Gaussian distribution of scores and 60-day realized volatility damping.",
                      accuracy: "PhD Financial Mathematics",
                      recentCalls: "Volatility parity sizing models across 800 equities",
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-lg p-1.5 hover:bg-ink-850 transition text-left group"
                  title="Click to view analyst profile or @mention"
                >
                  <span className="text-lg">👩🏽‍💼</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-blue-300 group-hover:text-blue-200">
                      Priya Raghunathan
                    </p>
                    <p className="text-[10px] text-muted truncate">Quant Analyst</p>
                  </div>
                  <AtSign className="h-3 w-3 text-muted/60 opacity-0 group-hover:opacity-100 transition shrink-0" />
                </button>
              </div>
            </div>

            {/* Verified Pro Traders */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Active Desk Traders — 12
              </span>
              <div className="mt-2 space-y-1">
                {[
                  {
                    name: "Vance_Capital",
                    icon: "🏛️",
                    role: "Macro Trader",
                    bio: "Cross-asset quantitative execution focusing on tech mega-caps and index momentum.",
                  },
                  {
                    name: "ScalpMaster_NY",
                    icon: "⚡",
                    role: "Order Flow",
                    bio: "NYSE open absorption specialist, trading institutional delta divergences.",
                  },
                  {
                    name: "CryptoWhale_SG",
                    icon: "🐋",
                    role: "Binance Spot",
                    bio: "High net worth liquidity provider on top 50 digital asset pairs.",
                  },
                  {
                    name: "AlphaSeeker_Lon",
                    icon: "🇬🇧",
                    role: "Derivatives",
                    bio: "European session macro flow analyst, sizing according to volatility parity.",
                  },
                ].map((trader) => (
                  <button
                    key={trader.name}
                    type="button"
                    onClick={() =>
                      setSelectedMember({
                        name: trader.name,
                        avatar: trader.icon,
                        role: trader.role,
                        roleLabel: "DESK TRADER",
                        bio: trader.bio,
                        accuracy: "Verified community trade record",
                        recentCalls: "Active participant on #general-trading",
                      })
                    }
                    className="flex w-full items-center gap-2 rounded-lg p-1.5 hover:bg-ink-850 transition text-left group"
                    title={`Click to view ${trader.name}'s profile or @mention`}
                  >
                    <span className="text-sm">{trader.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-bone group-hover:text-gold-bright">{trader.name}</p>
                      <p className="text-[9px] text-muted">{trader.role}</p>
                    </div>
                    <AtSign className="h-2.5 w-2.5 text-muted/50 opacity-0 group-hover:opacity-100 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Community stats */}
            <div className="border-t border-line/60 pt-3 text-[10px] text-muted space-y-1">
              <p className="flex items-center justify-between">
                <span>🌐 Online Traders:</span>
                <strong className="text-bone font-mono">1,100+</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>⚡ AI Latency:</span>
                <span className="text-emerald-400 font-mono font-bold">24ms</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POST TRADE SETUP */}
      {showSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowSignalModal(false)}
              className="absolute right-4 top-4 text-muted hover:text-bone text-lg"
            >
              ✕
            </button>

            <h3 className="font-display text-xl text-bone">Post Custom Trade Setup</h3>
            <p className="text-xs text-muted mt-1">
              Share your institutional setup to the live trading floor with defined risk parameters.
            </p>

            <form onSubmit={handlePostSignal} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Asset Symbol</label>
                <input
                  type="text"
                  value={sigSymbol}
                  onChange={(e) => setSigSymbol(e.target.value)}
                  className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-bone font-mono focus:border-gold focus:outline-none"
                  placeholder="NVDA, BTC, SOL..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Stance</label>
                  <select
                    value={sigStance}
                    onChange={(e: any) => setSigStance(e.target.value)}
                    className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-bone focus:border-gold focus:outline-none"
                  >
                    <option value="STRONG BUY / LONG">STRONG BUY / LONG</option>
                    <option value="ACCUMULATE / DIP">ACCUMULATE / DIP</option>
                    <option value="TRIM / PROFIT">TRIM / PROFIT</option>
                    <option value="AVOID / SHORT">AVOID / SHORT</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1">Entry Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={sigPrice}
                    onChange={(e) => setSigPrice(e.target.value)}
                    className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-bone font-mono focus:border-gold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Target Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={sigTarget}
                    onChange={(e) => setSigTarget(e.target.value)}
                    className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-emerald-400 font-mono focus:border-gold focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Invalidation Stop ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={sigStop}
                    onChange={(e) => setSigStop(e.target.value)}
                    className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-rose-400 font-mono focus:border-gold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Technical Rationale</label>
                <textarea
                  value={sigNotes}
                  onChange={(e) => setSigNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-bone placeholder:text-muted/60 focus:border-gold focus:outline-none"
                  placeholder="e.g. Breaking above 20-EMA on 15m volume expansion..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignalModal(false)}
                  className="rounded-full border border-line px-4 py-2 text-xs text-muted hover:text-bone"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition shadow"
                >
                  Broadcast to Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT NICKNAME */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-ink-900 p-5 shadow-2xl">
            <h3 className="font-display text-lg text-bone">Change Floor Nickname</h3>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={profileInputName}
                onChange={(e) => setProfileInputName(e.target.value)}
                placeholder="Enter trader handle..."
                className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-xs text-bone focus:border-gold focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-bone"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-bright"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MEMBER PROFILE & INTERACTION */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              className="absolute right-4 top-4 text-muted hover:text-bone text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedMember.avatar}</span>
              <div className="min-w-0">
                <span className="rounded-full bg-gold/15 border border-gold/40 px-2 py-0.5 font-mono text-[9px] uppercase font-bold text-gold-bright">
                  {selectedMember.roleLabel}
                </span>
                <h3 className="font-display text-lg text-bone truncate mt-0.5">
                  {selectedMember.name}
                </h3>
                <p className="text-xs text-muted truncate">{selectedMember.role}</p>
              </div>
            </div>

            <p className="text-xs text-bone/90 leading-relaxed border-t border-line/60 pt-3">
              {selectedMember.bio}
            </p>

            <div className="rounded-xl border border-line bg-ink-950 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Track Record / Stat:</span>
                <span className="text-emerald-400 font-mono font-semibold">{selectedMember.accuracy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Specialization:</span>
                <span className="text-gold-bright font-mono">{selectedMember.recentCalls}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleMentionMember(selectedMember.name)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow"
              >
                <AtSign className="h-3.5 w-3.5" />
                <span>Mention @{selectedMember.name} in Chat</span>
              </button>

              <button
                type="button"
                onClick={() => handleAskMember(selectedMember.name)}
                className="flex items-center justify-center gap-2 rounded-xl border border-line bg-ink-850 px-4 py-2 text-xs font-semibold text-bone hover:border-gold/50 transition"
              >
                <Bot className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ask Quantitative Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SERVER OVERVIEW & TELEMETRY */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setShowServerModal(false)}
              className="absolute right-4 top-4 text-muted hover:text-bone text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-gold/30 via-gold to-bone p-[1.5px] shadow">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-ink-950 font-display text-base font-bold text-gold-bright">
                  NWS
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Institutional Node Verified
                </span>
                <h3 className="font-display text-xl text-bone">NextWallStreet Guild Floor</h3>
                <p className="text-xs text-muted">24/7 Algorithmic Trading &amp; Minute Signals Desk</p>
              </div>
            </div>

            {/* Server KPIs */}
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl border border-line bg-ink-950 p-3 text-center">
                <span className="text-[10px] text-muted uppercase">Universe Scored</span>
                <p className="font-mono text-base font-bold text-bone mt-0.5">2,038</p>
                <span className="text-[9px] text-muted/70">Nasdaq, Coinbase, pump.fun</span>
              </div>
              <div className="rounded-xl border border-line bg-ink-950 p-3 text-center">
                <span className="text-[10px] text-muted uppercase">Engine Latency</span>
                <p className="font-mono text-base font-bold text-emerald-400 mt-0.5">24ms</p>
                <span className="text-[9px] text-muted/70">Edge compute network</span>
              </div>
              <div className="rounded-xl border border-line bg-ink-950 p-3 text-center">
                <span className="text-[10px] text-muted uppercase">Online Traders</span>
                <p className="font-mono text-base font-bold text-gold-bright mt-0.5">1,100+</p>
                <span className="text-[9px] text-muted/70">Global desk presence</span>
              </div>
            </div>

            {/* Active Math Models */}
            <div className="rounded-xl border border-line bg-ink-950 p-4 space-y-2 text-xs">
              <h4 className="font-semibold text-bone flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-gold" />
                Active Quantitative Models ($c_1 - c_5$)
              </h4>
              <p className="text-muted text-[11px] leading-relaxed">
                Scores combine 20/50/200 DMA structural slopes, 30-day rate of change, RSI momentum, realized 60-day volatility damping, and order-book delta volume absorption.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                  DMA Structure (40%)
                </span>
                <span className="rounded bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10px] font-mono text-gold-bright">
                  Rate of Change (25%)
                </span>
                <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-mono text-blue-300">
                  RSI Trend (15%)
                </span>
                <span className="rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono text-purple-300">
                  Vol Damping (20%)
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSoundEnabled((s) => !s);
                    playChatChime("receive", !soundEnabled);
                  }}
                  className="rounded-full border border-line bg-ink-850 px-3 py-1.5 text-xs text-muted hover:text-bone transition"
                >
                  Audio Chimes: {soundEnabled ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={handleExportTranscript}
                  className="rounded-full border border-line bg-ink-850 px-3 py-1.5 text-xs text-muted hover:text-bone transition"
                >
                  Export Log
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyServerLink}
                className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow"
              >
                {copiedServerLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copiedServerLink ? "Server Link Copied!" : "Share / Copy Server URL"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
