"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Layers,
  Clock,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Search,
  BookOpen,
  GraduationCap,
  Activity,
  BarChart2,
  Tv,
  Check,
  Share2,
  Radio,
  FileText,
  Sliders,
  Shield,
  Award,
  Video,
} from "lucide-react";
import {
  VIDEO_LESSONS_20,
  ACADEMY_MODULES,
  type VideoLesson,
  type VideoChapter,
  type VideoVisualType,
} from "@/lib/academy-videos";
import { useAuth } from "@/lib/auth-context";
import WhopBadge from "@/components/whop-badge";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, collection } from "firebase/firestore";

export type { VideoLesson, VideoChapter };
export const SAMPLE_VIDEO_LESSONS = VIDEO_LESSONS_20;

export default function WatchableVideoPlayer({
  initialLessonId,
  courseTitle = "NextWallStreet 20-Lesson Trading Academy",
}: {
  initialLessonId?: string;
  courseTitle?: string;
}) {
  const [selectedModule, setSelectedModule] = useState<string>("All Modules");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  const { user } = useAuth();
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  // Sync completion with Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "progress"), (snap) => {
      const completed: Record<string, boolean> = {};
      snap.forEach((d) => {
        if (d.data().completed) completed[d.id] = true;
      });
      setCompletedLessons(completed);
    });
    return () => unsub();
  }, [user]);

  const toggleCompleteLesson = async (lessonId: string) => {
    const isDone = !!completedLessons[lessonId];
    setCompletedLessons((prev) => ({ ...prev, [lessonId]: !isDone }));
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "progress", lessonId), {
          lessonId,
          completed: !isDone,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Could not save lesson progress to Firestore:", err);
      }
    }
  };

  // Playback modes: "masterclass" (Studio Tutor PiP + Chart + Subtitles), "chart" (Full technical chart desk), "slides" (Curriculum lecture slides)
  const [viewMode, setViewMode] = useState<"masterclass" | "chart" | "slides">("masterclass");

  const filteredLessons = useMemo(() => {
    return VIDEO_LESSONS_20.filter((lesson) => {
      const matchesModule = selectedModule === "All Modules" || lesson.module === selectedModule;
      const matchesSearch =
        !searchQuery.trim() ||
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesModule && matchesSearch;
    });
  }, [selectedModule, searchQuery]);

  const lesson = VIDEO_LESSONS_20[activeLessonIndex] || VIDEO_LESSONS_20[0];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = lesson.durationSeconds || 600;
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceNarration, setVoiceNarration] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  const [bookmarks, setBookmarks] = useState<{ id: string; time: number; note: string }[]>([]);
  const [bookmarkInput, setBookmarkInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chapters" | "takeaways" | "quiz" | "bookmarks" | "transcript">("chapters");
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Audio waveform animation tick
  const [audioWave, setAudioWave] = useState([0.3, 0.7, 0.4, 0.8, 0.5, 0.9, 0.6]);

  // Read URL query parameter "?lesson=..." on mount or change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryLesson = params.get("lesson") || initialLessonId;
      if (queryLesson) {
        const idx = VIDEO_LESSONS_20.findIndex((l) => l.id === queryLesson);
        if (idx !== -1) setActiveLessonIndex(idx);
      }
    }
  }, [initialLessonId]);

  // Load saved bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`video-bookmarks-${lesson.id}`);
      if (saved) setBookmarks(JSON.parse(saved));
      else setBookmarks([]);
    } catch {
      // ignore
    }
    setSelectedQuizAnswer(null);
    setShowQuizResult(false);
    setCurrentTime(0);
    setIsPlaying(false);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("lesson", lesson.id);
      window.history.replaceState({}, "", url.toString());
    }
  }, [lesson.id]);

  // Animation frame ticker for video playback & audio waveform
  useEffect(() => {
    let animId: number;
    let lastStamp = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastStamp) / 1000;
      lastStamp = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta * speed;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });

        // Animate audio waveform bars when playing
        setAudioWave([
          0.2 + Math.abs(Math.sin(now * 0.008)) * 0.7,
          0.2 + Math.abs(Math.sin(now * 0.012 + 1)) * 0.8,
          0.2 + Math.abs(Math.sin(now * 0.009 + 2)) * 0.75,
          0.2 + Math.abs(Math.sin(now * 0.015 + 3)) * 0.85,
          0.2 + Math.abs(Math.sin(now * 0.011 + 4)) * 0.7,
          0.2 + Math.abs(Math.sin(now * 0.013 + 5)) * 0.8,
          0.2 + Math.abs(Math.sin(now * 0.007 + 6)) * 0.65,
        ]);
      } else {
        setAudioWave([0.15, 0.2, 0.15, 0.25, 0.15, 0.2, 0.15]);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speed, duration]);

  // Determine active chapter based on currentTime
  const activeChapter = useMemo(() => {
    const list = [...lesson.chapters].sort((a, b) => a.time - b.time);
    let current = list[0];
    for (const ch of list) {
      if (currentTime >= ch.time) current = ch;
      else break;
    }
    return current;
  }, [lesson.chapters, currentTime]);

  // Real voice narration support via SpeechSynthesis API
  useEffect(() => {
    if (!voiceNarration || !isPlaying || typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const utteranceText = `${activeChapter.title}. ${activeChapter.description}. In this module, remember: ${lesson.takeaways[0] || ""}`;
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.rate = Math.min(1.4, Math.max(0.8, speed));
    utterance.volume = isMuted ? 0 : volume;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [activeChapter, voiceNarration, isPlaying, isMuted, volume, speed, lesson.takeaways]);

  // Drawing Engine: Proprietary NextWallStreet 60FPS Video Screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth || 960;
    const height = canvas.clientHeight || 540;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Dark terminal canvas background
    ctx.fillStyle = "#07090e";
    ctx.fillRect(0, 0, width, height);

    // Subtle technical grid
    ctx.strokeStyle = "rgba(36, 42, 53, 0.4)";
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 35);
      ctx.stroke();
    }
    for (let y = 30; y < height - 35; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const progress = Math.min(1, currentTime / Math.max(duration, 1));
    const seed = activeLessonIndex * 13 + 37;

    /* -------------------------------------------------------------
       CUSTOM VISUAL RENDERING PER LESSON TYPE
       ------------------------------------------------------------- */
    if (lesson.visualType === "order_book" || lesson.visualType === "tape_reading") {
      // Level 2 Depth & Tape Reading Display
      const splitX = width * 0.65;

      // Draw Candlestick Chart on Left (65%)
      drawCandles(ctx, 40, splitX - 20, height * 0.55, 30, progress, seed);

      // Draw Live Order Book Ladder on Right (35%)
      ctx.fillStyle = "rgba(11, 13, 18, 0.9)";
      ctx.fillRect(splitX, 15, width - splitX - 15, height - 55);
      ctx.strokeStyle = "rgba(45, 52, 65, 0.8)";
      ctx.strokeRect(splitX, 15, width - splitX - 15, height - 55);

      ctx.fillStyle = "#d8ab5a";
      ctx.font = "bold 11px monospace";
      ctx.fillText("LIVE DEPTH OF MARKET (DOM)", splitX + 12, 35);

      // Asks (Red)
      const askBase = 96420;
      for (let i = 0; i < 5; i++) {
        const y = 55 + i * 22;
        const p = askBase + (5 - i) * 15;
        const size = (0.8 + Math.sin(seed + i * 2 + progress * 8) * 0.5).toFixed(2);
        ctx.fillStyle = "rgba(240, 100, 95, 0.15)";
        ctx.fillRect(splitX + 6, y - 12, (width - splitX - 28) * (0.3 + i * 0.12), 18);
        ctx.fillStyle = "#f0645f";
        ctx.font = "10px monospace";
        ctx.fillText(`$${p.toLocaleString()}`, splitX + 12, y);
        ctx.fillText(`${size} BTC`, splitX + 110, y);
      }

      // Mid Spread
      ctx.fillStyle = "#3ecf8e";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`SPREAD: $96,420.50 [BEST BID/ASK]`, splitX + 12, 185);

      // Bids (Green)
      for (let i = 0; i < 5; i++) {
        const y = 205 + i * 22;
        const p = askBase - i * 15;
        const size = (1.2 + Math.cos(seed + i * 3 + progress * 6) * 0.6).toFixed(2);
        ctx.fillStyle = "rgba(62, 207, 142, 0.15)";
        ctx.fillRect(splitX + 6, y - 12, (width - splitX - 28) * (0.7 - i * 0.1), 18);
        ctx.fillStyle = "#3ecf8e";
        ctx.font = "10px monospace";
        ctx.fillText(`$${p.toLocaleString()}`, splitX + 12, y);
        ctx.fillText(`${size} BTC`, splitX + 110, y);
      }
    } else if (lesson.visualType === "volume_profile") {
      // Volume Profile & Point of Control (POC)
      drawCandles(ctx, 60, width - 60, height * 0.55, 36, progress, seed);

      // Draw Horizontal Volume Profile Bars on Left
      for (let i = 0; i < 12; i++) {
        const y = 60 + i * 25;
        const isPOC = i === 5;
        const barW = isPOC ? 160 : 40 + Math.sin(i * 1.4 + seed) * 70;
        ctx.fillStyle = isPOC ? "rgba(216, 171, 90, 0.35)" : "rgba(56, 189, 248, 0.2)";
        ctx.fillRect(50, y - 8, barW, 16);

        if (isPOC) {
          ctx.strokeStyle = "#d8ab5a";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(50, y);
          ctx.lineTo(width - 50, y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#d8ab5a";
          ctx.font = "bold 10px monospace";
          ctx.fillText("POINT OF CONTROL (POC) - INSTITUTIONAL MAGNET", width - 330, y - 4);
        }
      }
    } else if (lesson.visualType === "bonding_curve" || lesson.visualType === "wallet_clustering") {
      // Pump.fun Bonding Curve & On-Chain Forensics
      drawCandles(ctx, 40, width - 40, height * 0.6, 32, progress, seed);

      // Gauge Overlay Card
      ctx.fillStyle = "rgba(11, 13, 18, 0.88)";
      ctx.strokeStyle = "rgba(216, 171, 90, 0.6)";
      ctx.lineWidth = 1;
      ctx.fillRect(width * 0.08, 30, 320, 105);
      ctx.strokeRect(width * 0.08, 30, 320, 105);

      ctx.fillStyle = "#d8ab5a";
      ctx.font = "bold 11px monospace";
      ctx.fillText("PUMP.FUN BONDING CURVE GRADUATION", width * 0.08 + 15, 52);

      const curvePct = Math.min(100, Math.round(52 + progress * 46));
      ctx.fillStyle = "#f2efe8";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`${curvePct}% TO RAYDIUM DEX`, width * 0.08 + 15, 78);

      // Progress bar
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(width * 0.08 + 15, 88, 290, 8);
      ctx.fillStyle = curvePct >= 85 ? "#3ecf8e" : "#d8ab5a";
      ctx.fillRect(width * 0.08 + 15, 88, 290 * (curvePct / 100), 8);

      ctx.fillStyle = "#f0645f";
      ctx.font = "10px monospace";
      ctx.fillText("Top-100 Wallet Concentration: 48.2% (HIGH RISK)", width * 0.08 + 15, 118);
    } else if (lesson.visualType === "position_sizing" || lesson.visualType === "drawdown_math") {
      // Quantitative Math & Position Sizing Architecture
      drawCandles(ctx, 40, width - 40, height * 0.58, 30, progress, seed);

      // Math Formula Card
      ctx.fillStyle = "rgba(11, 13, 18, 0.92)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 1;
      ctx.fillRect(width * 0.06, 25, 360, 115);
      ctx.strokeRect(width * 0.06, 25, 360, 115);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px monospace";
      ctx.fillText("VOLATILITY-ADJUSTED POSITION SIZING", width * 0.06 + 15, 48);

      ctx.fillStyle = "#f2efe8";
      ctx.font = "bold 13px monospace";
      ctx.fillText("Shares = (Account * Risk%) / Invalidation Dist", width * 0.06 + 15, 72);

      ctx.fillStyle = "#d8ab5a";
      ctx.font = "11px monospace";
      ctx.fillText("Account: $50,000 | Risk: 1% ($500) | Dist: $5.00", width * 0.06 + 15, 95);
      ctx.fillStyle = "#3ecf8e";
      ctx.font = "bold 13px monospace";
      ctx.fillText("Calculated Max Allocation: 100 Shares", width * 0.06 + 15, 120);
    } else {
      // Standard Technical Structure: Swing Pivots, MAs, and Invalidation
      const totalCandles = 38;
      const visibleCandles = Math.max(10, Math.floor(progress * totalCandles) + 6);
      drawCandles(ctx, 50, width - 50, height * 0.55, visibleCandles, progress, seed);

      // Overlay Moving Averages
      drawMovingAverages(ctx, 50, width - 50, height * 0.55, visibleCandles, seed);
    }

    // Top-Left Live On-Air Badge
    ctx.fillStyle = "rgba(11, 13, 18, 0.85)";
    ctx.strokeStyle = "rgba(36, 42, 53, 0.8)";
    ctx.lineWidth = 1;
    ctx.fillRect(15, 15, 230, 42);
    ctx.strokeRect(15, 15, 230, 42);

    ctx.fillStyle = isPlaying ? "#3ecf8e" : "#d8ab5a";
    ctx.beginPath();
    ctx.arc(28, 36, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f2efe8";
    ctx.font = "bold 10px monospace";
    ctx.fillText(isPlaying ? "STUDIO ON AIR · PLAYING" : "STUDIO PAUSED", 40, 33);
    ctx.fillStyle = "#8a95a5";
    ctx.font = "9px monospace";
    ctx.fillText(`LESSON ${activeLessonIndex + 1} / 20 MASTERCLASS`, 40, 47);

    // Active Chapter HUD Indicator
    ctx.fillStyle = "rgba(11, 13, 18, 0.85)";
    ctx.strokeStyle = "rgba(36, 42, 53, 0.8)";
    ctx.fillRect(width - 250, height - 60, 235, 45);
    ctx.strokeRect(width - 250, height - 60, 235, 45);

    ctx.fillStyle = "#d8ab5a";
    ctx.font = "bold 10px monospace";
    ctx.fillText("ACTIVE CHAPTER", width - 240, height - 44);
    ctx.fillStyle = "#f2efe8";
    ctx.font = "9px monospace";
    const truncChapter = activeChapter.title.length > 32 ? activeChapter.title.slice(0, 30) + "..." : activeChapter.title;
    ctx.fillText(truncChapter, width - 240, height - 28);
  }, [currentTime, duration, activeLessonIndex, lesson, activeChapter, isPlaying]);

  // Helper to draw realistic financial market candles
  function drawCandles(
    ctx: CanvasRenderingContext2D,
    startX: number,
    endX: number,
    baselineY: number,
    numCandles: number,
    progress: number,
    seed: number
  ) {
    const totalWidth = endX - startX;
    const candleWidth = Math.max(5, (totalWidth / 40) - 3);

    let prevClose = baselineY;
    for (let i = 0; i < numCandles; i++) {
      const x = startX + i * (candleWidth + 3);
      const wave = Math.sin((i + seed) * 0.38) * 32;
      const trend = -((i / 40) * 55) * (activeLessonIndex % 2 === 0 ? 1 : 0.7);
      const noise = ((Math.sin(i * 3.4 + seed) * 0.5 + Math.cos(i * 1.7) * 0.5) * 20);
      const targetY = baselineY + wave + trend + noise;

      const open = prevClose;
      const close = targetY;
      const isGreen = close <= open;

      const high = Math.min(open, close) - Math.abs(Math.sin(i + seed)) * 14 - 4;
      const low = Math.max(open, close) + Math.abs(Math.cos(i + seed)) * 14 + 4;

      prevClose = close;

      // Wick
      ctx.strokeStyle = isGreen ? "#3ecf8e" : "#f0645f";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, high);
      ctx.lineTo(x + candleWidth / 2, low);
      ctx.stroke();

      // Body
      ctx.fillStyle = isGreen ? "#3ecf8e" : "#f0645f";
      const bodyTop = Math.min(open, close);
      const bodyHeight = Math.max(2, Math.abs(close - open));
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
    }
  }

  // Helper to draw dynamic moving averages
  function drawMovingAverages(
    ctx: CanvasRenderingContext2D,
    startX: number,
    endX: number,
    baselineY: number,
    numCandles: number,
    seed: number
  ) {
    const totalWidth = endX - startX;
    const candleWidth = Math.max(5, (totalWidth / 40) - 3);

    // 20-EMA (Gold)
    ctx.strokeStyle = "#d8ab5a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < numCandles; i++) {
      const x = startX + i * (candleWidth + 3) + candleWidth / 2;
      const y = baselineY + Math.sin((i + seed) * 0.35) * 24 - (i * 1.3) + 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 50-SMA (Cyan)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < numCandles; i++) {
      const x = startX + i * (candleWidth + 3) + candleWidth / 2;
      const y = baselineY + 18 + Math.cos((i + seed) * 0.25) * 16 - (i * 0.9);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Red Invalidation Stop
    const stopY = baselineY + 58;
    ctx.strokeStyle = "rgba(240, 100, 95, 0.75)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, stopY);
    ctx.lineTo(endX, stopY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f0645f";
    ctx.font = "bold 10px monospace";
    ctx.fillText("MODEL INVALIDATION STOP LEVEL", endX - 220, stopY - 5);
  }

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(clamped);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const addBookmark = () => {
    if (!bookmarkInput.trim()) return;
    const newBookmark = {
      id: String(Date.now()),
      time: Math.floor(currentTime),
      note: bookmarkInput.trim(),
    };
    const updated = [...bookmarks, newBookmark];
    setBookmarks(updated);
    setBookmarkInput("");
    try {
      localStorage.setItem(`video-bookmarks-${lesson.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    try {
      localStorage.setItem(`video-bookmarks-${lesson.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const copyLessonShareLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/academy/watch?lesson=${lesson.id}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIndex > 0) setActiveLessonIndex((i) => i - 1);
  };

  const handleNextLesson = () => {
    if (activeLessonIndex < VIDEO_LESSONS_20.length - 1) setActiveLessonIndex((i) => i + 1);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  return (
    <div className="space-y-6" id="video-studio-player">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-bright">
              <GraduationCap className="h-3.5 w-3.5 text-gold" />
              <span>Watchable Video Academy (20 Masterclasses)</span>
              <WhopBadge className="ml-1" />
            </span>
            <span className="rounded bg-ink-850 px-2 py-0.5 text-[10px] font-mono text-muted">
              {lesson.module}
            </span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              {lesson.level}
            </span>
          </div>
          <h2 className="mt-1 font-display text-xl text-bone sm:text-2xl">{lesson.title}</h2>
          <p className="mt-0.5 text-xs text-muted">
            Instructor: <span className="text-bone font-medium">{lesson.instructor}</span> ({lesson.instructorRole}) · Curriculum:{" "}
            <span className="text-gold-bright">{courseTitle}</span>
          </p>
        </div>

        {/* Action Buttons: Prev / Counter / Next / Share / Complete */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activeLessonIndex <= 0}
            onClick={handlePrevLesson}
            className="flex items-center gap-1 rounded-full bg-ink-900/80 px-3.5 py-1.5 text-xs text-bone transition hover:bg-ink-900 disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <span className="font-mono text-xs text-muted px-1">
            <span className="text-gold-bright font-bold">{activeLessonIndex + 1}</span> / 20
          </span>
          <button
            type="button"
            disabled={activeLessonIndex >= VIDEO_LESSONS_20.length - 1}
            onClick={handleNextLesson}
            className="flex items-center gap-1 rounded-full bg-ink-900/80 px-3.5 py-1.5 text-xs text-bone transition hover:bg-ink-900 disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={copyLessonShareLink}
            className="flex items-center gap-1 rounded-full bg-ink-900/80 px-3.5 py-1.5 text-xs text-muted hover:text-bone hover:bg-ink-900 transition ml-1"
            title="Copy share link for this masterclass"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-up" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleCompleteLesson(lesson.id)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              completedLessons[lesson.id]
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-ink-900/80 text-muted hover:text-bone hover:bg-ink-900"
            }`}
            title="Track completion in your account"
          >
            <CheckCircle className={`h-3.5 w-3.5 ${completedLessons[lesson.id] ? "text-emerald-400" : "text-muted"}`} />
            <span>{completedLessons[lesson.id] ? "Completed" : "Mark Done"}</span>
          </button>
        </div>
      </div>

      {/* Module Filter Pills & Lesson Search */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          {ACADEMY_MODULES.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1 transition-all ${
                selectedModule === mod
                  ? "bg-gold/20 text-gold-bright font-semibold shadow-sm"
                  : "bg-ink-900/75 text-muted hover:text-bone hover:bg-ink-900"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all 20 video lessons..."
            className="w-full rounded-full bg-ink-900/90 py-1.5 pl-8 pr-3 text-xs text-bone placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
        </div>
      </div>

      {/* 20-Lesson Horizontal Strip / Carousel */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {filteredLessons.map((l) => {
          const globalIdx = VIDEO_LESSONS_20.findIndex((item) => item.id === l.id);
          const isActive = globalIdx === activeLessonIndex;
          const isDone = completedLessons[l.id];

          return (
            <button
              key={l.id}
              onClick={() => setActiveLessonIndex(globalIdx)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl p-2.5 text-left transition-all max-w-[260px] ${
                isActive
                  ? "bg-gold/20 text-bone shadow-md"
                  : "bg-ink-900/55 text-muted hover:text-bone hover:bg-ink-900"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                  isActive ? "bg-gold text-ink-950" : isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-ink-850 text-muted"
                }`}
              >
                {isDone ? "✓" : globalIdx + 1 < 10 ? `0${globalIdx + 1}` : globalIdx + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-bone flex items-center">
                  <span className="truncate">{l.title.replace(/^Lesson \d+:\s*/, "")}</span>
                  {globalIdx > 0 && <WhopBadge className="ml-1 text-[10px]" />}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <span className="font-mono text-gold">{l.durationLabel}</span>
                  <span>·</span>
                  <span className="truncate">{l.instructor.split(" ")[0]}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Controls: Masterclass Video vs Full Chart vs Slide Deck */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Screen Mode:</span>
          <button
            type="button"
            onClick={() => setViewMode("masterclass")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all ${
              viewMode === "masterclass"
                ? "bg-gold text-ink-950 font-bold shadow"
                : "bg-ink-900/80 text-muted hover:text-bone hover:bg-ink-900"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Tutor Masterclass</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("chart")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all ${
              viewMode === "chart"
                ? "bg-gold text-ink-950 font-bold shadow"
                : "bg-ink-900/80 text-muted hover:text-bone hover:bg-ink-900"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Chart Desk</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("slides")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all ${
              viewMode === "slides"
                ? "bg-gold text-ink-950 font-bold shadow"
                : "bg-ink-900/80 text-muted hover:text-bone hover:bg-ink-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Curriculum Slides</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCaptions((c) => !c)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] transition ${
              showCaptions
                ? "bg-gold/15 text-gold-bright"
                : "bg-ink-900/75 text-muted hover:text-bone"
            }`}
            title="Toggle closed captions / subtitles"
          >
            CC: {showCaptions ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() => setVoiceNarration((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all ${
              voiceNarration
                ? "bg-emerald-500/20 text-emerald-400 font-semibold"
                : "bg-ink-900/80 text-muted hover:text-bone"
            }`}
            title="Toggle automated speech narration for tutor explanation"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Voice: {voiceNarration ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* PROPRIETARY VIDEO SCREEN VIEWPORT (100% OWNED, NO YOUTUBE) */}
      <div
        ref={containerRef}
        className="group relative overflow-hidden rounded-2xl bg-[#07090e] shadow-2xl aspect-video max-h-[580px] w-full select-none"
      >
        {/* Render Mode: Slide Deck View vs Dynamic Chart Video View */}
        {viewMode === "slides" ? (
          <div className="flex h-full w-full flex-col justify-between bg-ink-950 p-6 sm:p-10">
            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="font-mono text-xs uppercase tracking-widest text-gold font-bold">
                  NextWallStreet Academy · Masterclass Slide Deck
                </span>
                <span className="font-mono text-xs text-muted">
                  Slide {Math.min(5, Math.floor((currentTime / duration) * 5) + 1)} / 5
                </span>
              </div>
              <h3 className="mt-4 font-display text-2xl sm:text-3xl text-bone">
                {activeChapter.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-bone/90 max-w-3xl">
                {activeChapter.description}
              </p>
            </div>

            <div className="rounded-xl bg-gold/[0.08] p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                Key Lesson Principle
              </span>
              <p className="mt-1 text-xs sm:text-sm text-bone/90">
                {lesson.takeaways[0]}
              </p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onClick={togglePlay}
            className="h-full w-full object-contain cursor-pointer"
          />
        )}

        {/* TUTOR PICTURE-IN-PICTURE (PiP) STUDIO FEED (Top-Right) */}
        {viewMode === "masterclass" && (
          <div className="absolute top-4 right-4 pointer-events-none rounded-xl bg-ink-950/95 p-3 backdrop-blur-md shadow-2xl max-w-[210px] sm:max-w-[240px] transition-all">
            <div className="flex items-center justify-between pb-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                TUTOR STUDIO
              </span>
              <span className="rounded bg-ink-850 px-1.5 py-0.5 font-mono text-[9px] text-muted">
                1080p
              </span>
            </div>

            {/* Presenter Profile & Talking Waveform */}
            <div className="mt-2 flex items-center gap-2.5">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-gold/30 via-gold to-bone p-[1.5px] shadow-lg">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-ink-900 font-display text-xs font-bold text-gold-bright">
                  {lesson.instructorInitials || "NW"}
                </div>
                {isPlaying && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-ink-950 font-bold">
                    ●
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-bone">{lesson.instructor}</p>
                <p className="truncate text-[10px] text-muted">{lesson.instructorRole}</p>
              </div>
            </div>

            {/* Live Audio Equalizer Waveform */}
            <div className="mt-2.5 flex items-center justify-between gap-1 rounded-lg bg-ink-900/90 px-2.5 py-1.5">
              <span className="font-mono text-[9px] text-muted">VOICE FEED</span>
              <div className="flex items-end gap-1 h-3">
                {audioWave.map((h, idx) => (
                  <span
                    key={idx}
                    style={{ height: `${Math.round(h * 12)}px` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isPlaying ? "bg-gold-bright" : "bg-muted/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LIVE SYNCHRONIZED CLOSED-CAPTIONS (Subtitles) */}
        {showCaptions && (
          <div className="absolute bottom-16 inset-x-6 sm:inset-x-12 pointer-events-none flex justify-center">
            <div className="rounded-xl bg-ink-950/90 px-4 py-2 backdrop-blur-md shadow-2xl text-center max-w-2xl">
              <span className="font-mono text-[9px] uppercase tracking-wider text-gold-bright block font-bold mb-0.5">
                Instructor Commentary · {lesson.instructor}
              </span>
              <p className="text-xs sm:text-sm font-medium text-bone leading-relaxed">
                &ldquo;{activeChapter.description}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Centered Big Play Button when Paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] transition-all cursor-pointer"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-900/90 text-gold-bright shadow-2xl transition-transform hover:scale-110">
              <Play className="ml-1.5 h-9 w-9 fill-current" />
            </div>
            <p className="mt-3 font-display text-base text-bone tracking-wide drop-shadow">
              Play Lesson {activeLessonIndex + 1}: {lesson.title.replace(/^Lesson \d+:\s*/, "")}
            </p>
            <p className="mt-1 text-xs text-muted/90 font-mono">
              Self-Owned Studio Stream · {lesson.durationLabel}
            </p>
          </div>
        )}

        {/* Video Scrubber & Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-3 sm:p-4 transition-opacity group-hover:opacity-100 opacity-95">
          {/* Progress Timeline Scrubber */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              handleSeek(pct * duration);
            }}
            className="relative h-2 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
          >
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
            />
            {/* Chapter Markers */}
            {lesson.chapters.map((ch) => (
              <div
                key={ch.time}
                title={ch.title}
                className="absolute top-0 h-full w-1 bg-white/60 hover:bg-gold-bright"
                style={{ left: `${(ch.time / Math.max(duration, 1)) * 100}%` }}
              />
            ))}
          </div>

          {/* Bottom Controls Strip */}
          <div className="mt-3 flex items-center justify-between text-bone text-xs">
            {/* Left Controls: Play/Pause, Rewind 10s, Forward 10s, Time */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-ink-950 transition hover:scale-105 shadow-md"
                aria-label={isPlaying ? "Pause lesson" : "Play lesson"}
              >
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => handleSeek(currentTime - 10)}
                className="text-xs text-muted hover:text-bone transition"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleSeek(currentTime + 10)}
                className="text-xs text-muted hover:text-bone transition font-mono"
                title="Fast forward 10 seconds"
              >
                +10s
              </button>

              <div className="flex items-center gap-1 font-mono text-xs text-muted">
                <span className="text-bone font-medium">{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Volume, Speed, Fullscreen */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <button type="button" onClick={toggleMute} className="text-muted hover:text-bone">
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="h-1 w-16 cursor-pointer accent-gold"
                />
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-1 rounded-lg bg-ink-900/90 px-2 py-0.5 text-[11px] font-mono">
                {[0.75, 1, 1.25, 1.5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeSpeed(s)}
                    className={`rounded px-1.5 py-0.5 transition ${
                      speed === s ? "bg-gold text-ink-950 font-bold" : "text-muted hover:text-bone"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="text-muted hover:text-bone transition"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Below Video: Chapters, Takeaways, Quiz, Notes, Transcript */}
      <div className="rounded-2xl bg-ink-900/55 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("chapters")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "chapters"
                  ? "bg-gold text-ink-950 font-bold shadow"
                  : "text-muted hover:text-bone hover:bg-ink-850"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Chapters ({lesson.chapters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("takeaways")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "takeaways"
                  ? "bg-gold text-ink-950 font-bold shadow"
                  : "text-muted hover:text-bone hover:bg-ink-850"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Key Takeaways</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "quiz"
                  ? "bg-gold text-ink-950 font-bold shadow"
                  : "text-muted hover:text-bone hover:bg-ink-850"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Interactive Quiz</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bookmarks")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "bookmarks"
                  ? "bg-gold text-ink-950 font-bold shadow"
                  : "text-muted hover:text-bone hover:bg-ink-850"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Notes ({bookmarks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("transcript")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "transcript"
                  ? "bg-gold text-ink-950 font-bold shadow"
                  : "text-muted hover:text-bone hover:bg-ink-850"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Full Transcript</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Chapters */}
        {activeTab === "chapters" && (
          <div className="mt-4 space-y-2">
            {lesson.chapters.map((ch, i) => {
              const isActive = activeChapter.time === ch.time;
              return (
                <div
                  key={ch.time}
                  onClick={() => handleSeek(ch.time)}
                  className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl p-3.5 transition ${
                    isActive
                      ? "bg-gold/15 text-bone shadow-sm"
                      : "bg-ink-950/65 text-muted hover:text-bone hover:bg-ink-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ink-850 font-mono text-[10px] text-gold font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-bone">{ch.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{ch.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-gold font-medium">
                    {formatTime(ch.time)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Takeaways */}
        {activeTab === "takeaways" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted">
              Core rules distilled from {lesson.title}. Incorporate these into your trading checklist:
            </p>
            <div className="space-y-2">
              {lesson.takeaways.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-ink-950/65 p-3.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-bright font-bold">
                    ✓
                  </span>
                  <span className="leading-relaxed text-bone/90">{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Quiz */}
        {activeTab === "quiz" && (
          <div className="mt-4 max-w-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">Mastery Check</span>
            </div>
            <p className="font-display text-base text-bone">{lesson.quiz.question}</p>
            <div className="space-y-2">
              {lesson.quiz.options.map((opt, idx) => {
                const isSelected = selectedQuizAnswer === idx;
                const isCorrect = idx === lesson.quiz.correctIndex;
                let btnStyle = "bg-ink-950/75 text-bone hover:bg-ink-950";
                if (showQuizResult) {
                  if (isCorrect) btnStyle = "bg-emerald-500/20 text-emerald-300 font-bold";
                  else if (isSelected) btnStyle = "bg-rose-500/20 text-rose-300";
                  else btnStyle = "bg-ink-950/40 text-muted opacity-60";
                } else if (isSelected) {
                  btnStyle = "bg-gold/20 text-gold-bright font-semibold";
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={showQuizResult}
                    onClick={() => setSelectedQuizAnswer(idx)}
                    className={`w-full rounded-xl p-3.5 text-left text-xs transition ${btnStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {showQuizResult && isCorrect && <span className="text-emerald-400 font-bold">Correct ✓</span>}
                      {showQuizResult && isSelected && !isCorrect && <span className="text-rose-400 font-bold">Incorrect ✗</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {!showQuizResult ? (
                <button
                  type="button"
                  disabled={selectedQuizAnswer === null}
                  onClick={() => setShowQuizResult(true)}
                  className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition disabled:opacity-40"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuizAnswer(null);
                    setShowQuizResult(false);
                  }}
                  className="rounded-full bg-ink-950/80 px-4 py-2 text-xs text-muted hover:text-bone hover:bg-ink-950 transition"
                >
                  Try Again
                </button>
              )}
            </div>

            {showQuizResult && (
              <div className="rounded-xl bg-ink-950/80 p-4 text-xs">
                <span className="font-semibold text-gold">Institutional Explanation:</span>
                <p className="mt-1 text-muted leading-relaxed">{lesson.quiz.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Bookmarks / User Notes */}
        {activeTab === "bookmarks" && (
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Add note at current time (${formatTime(currentTime)})...`}
                value={bookmarkInput}
                onChange={(e) => setBookmarkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBookmark()}
                className="flex-1 rounded-xl bg-ink-950/85 px-3.5 py-2 text-xs text-bone placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
              <button
                type="button"
                onClick={addBookmark}
                className="rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition shrink-0"
              >
                Save Note
              </button>
            </div>

            <div className="space-y-2">
              {bookmarks.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">
                  No notes saved for this lesson yet. Type above to bookmark a key moment.
                </p>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="flex items-center justify-between gap-4 rounded-xl bg-ink-950/75 p-3.5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSeek(bm.time)}
                        className="rounded bg-ink-900 px-2 py-0.5 font-mono text-[11px] text-gold-bright hover:bg-gold hover:text-ink-950 transition font-bold"
                      >
                        {formatTime(bm.time)}
                      </button>
                      <span className="text-bone">{bm.note}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBookmark(bm.id)}
                      className="text-muted hover:text-rose-400 text-xs px-2"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Full Transcript */}
        {activeTab === "transcript" && (
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin text-xs">
            <p className="text-muted text-[11px] italic">
              Click any timestamp to jump the video directly to that point in the lecture:
            </p>
            {lesson.chapters.map((ch) => (
              <div key={ch.time} className="rounded-xl bg-ink-950/70 p-4">
                <div className="flex items-center justify-between pb-1.5">
                  <span className="font-semibold text-gold-bright">{ch.title}</span>
                  <button
                    type="button"
                    onClick={() => handleSeek(ch.time)}
                    className="font-mono text-[10px] text-muted hover:text-bone hover:underline"
                  >
                    Jump to {formatTime(ch.time)} ▶
                  </button>
                </div>
                <p className="mt-1.5 text-bone/85 leading-relaxed">
                  {ch.description} In this section, instructor {lesson.instructor} outlines the exact structural criteria required before deploying institutional risk. Traders must verify market condition confluence rather than reacting to isolated tick fluctuations.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
