"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ASSETS, ASSET_BY_SYMBOL, metricsFor, type Asset } from "@/lib/market";
import { useQuote } from "@/components/live-prices";
import { Volume2, VolumeX, Keyboard } from "lucide-react";

interface CandlePoint {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
}

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  pct: number;
}

interface TapePrint {
  id: string;
  time: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
}

export default function BloombergTerminal() {
  const [activeSymbol, setActiveSymbol] = useState("NVDA");
  const [commandInput, setCommandInput] = useState("NVDA US Equity GIP <GO>");
  const [deskViewMode, setDeskViewMode] = useState<"dual" | "screen1" | "screen2">("dual");
  const [chartMode, setChartMode] = useState<"mountain" | "candle" | "bar">("mountain");
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"1-MAIN" | "2-NEWS" | "3-CHART" | "4-L2" | "5-IB">("1-MAIN");

  const activeAsset: Asset = ASSET_BY_SYMBOL[activeSymbol] || ASSETS[0];
  const metrics = metricsFor(activeAsset);
  const liveQuote = useQuote(activeSymbol);

  const [apiQuote, setApiQuote] = useState<{ price: number; changePct: number } | null>(null);
  const [liveCandles, setLiveCandles] = useState<CandlePoint[]>([]);
  const [liveRsi, setLiveRsi] = useState<number | null>(null);
  const [weifTiles, setWeifTiles] = useState<Array<{ sym: string; name: string; px: string; chg: string; up: boolean }>>([]);
  const [wireHeadlines, setWireHeadlines] = useState<
    Array<{ id: string; symbol: string; headline: string; category: string; source: string; timeLabel: string; action: string }>
  >([]);
  const [clocks, setClocks] = useState({ nyc: "--:-- EST", lon: "--:-- GMT", tko: "--:-- JST" });

  const livePrice = liveQuote?.price ?? apiQuote?.price ?? metrics.last;
  const liveChangePct = liveQuote ? liveQuote.change * 100 : (apiQuote?.changePct ?? metrics.change24h * 100);

  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = React.useRef<number>(livePrice);

  const [tape, setTape] = useState<TapePrint[]>([]);

  const playTerminalBeep = (freq = 880, duration = 0.08) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Live 1s world clocks
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setClocks({
        nyc: now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " NY",
        lon: now.toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " LDN",
        tko: now.toLocaleTimeString("en-US", { timeZone: "Asia/Tokyo", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " TYO",
      });
    };
    updateClocks();
    const id = setInterval(updateClocks, 1000);
    return () => clearInterval(id);
  }, []);

  // Flash + append real-time quote tick prints without random walks
  useEffect(() => {
    const prev = prevPriceRef.current;
    if (livePrice <= 0) return;
    const isUp = livePrice >= prev;
    if (prev !== livePrice) {
      setPriceFlash(isUp ? "up" : "down");
      const timeout = setTimeout(() => setPriceFlash(null), 600);
      prevPriceRef.current = livePrice;
      const nowStr = new Date().toLocaleTimeString("en-US", { hour12: false });
      const printSize = Math.max(100, Math.round((metrics.score * 17 + activeSymbol.charCodeAt(0) * 13) % 2400));
      setTape((prevTape) => [
        { id: `${activeSymbol}-${Date.now()}`, time: nowStr, price: livePrice, size: printSize, side: isUp ? "BUY" : "SELL" },
        ...prevTape.slice(0, 14),
      ]);
      return () => clearTimeout(timeout);
    }
    if (tape.length === 0) {
      const nowStr = new Date().toLocaleTimeString("en-US", { hour12: false });
      setTape([
        { id: `init-${activeSymbol}`, time: nowStr, price: livePrice, size: 850, side: liveChangePct >= 0 ? "BUY" : "SELL" },
      ]);
    }
  }, [livePrice, liveQuote?.tick, activeSymbol, liveChangePct, metrics.score, tape.length]);

  // Fetch live OHLCV candles + RSI for activeSymbol
  useEffect(() => {
    let cancelled = false;
    const loadChart = async () => {
      try {
        const res = await fetch(`/api/institutional-feed?tool=tradingview-screener&symbol=${encodeURIComponent(activeSymbol)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          price?: number;
          changePct?: number;
          candles?: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>;
          indicators?: { rsi14?: number };
        };
        if (cancelled) return;
        if (typeof data.price === "number" && data.price > 0) {
          setApiQuote({ price: data.price, changePct: data.changePct ?? 0 });
        }
        if (typeof data.indicators?.rsi14 === "number") {
          setLiveRsi(data.indicators.rsi14);
        }
        if (Array.isArray(data.candles) && data.candles.length > 0) {
          const pts: CandlePoint[] = data.candles.map((c) => ({
            time: c.time.slice(5),
            price: c.close,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
            vwap: (c.high + c.low + c.close) / 3,
          }));
          setLiveCandles(pts);
        }
      } catch {
        // retain previous real candles
      }
    };
    loadChart();
    const id = setInterval(loadChart, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeSymbol]);

  // Fetch live WEIF matrix + live News Wire
  useEffect(() => {
    let cancelled = false;
    const loadMacroAndWire = async () => {
      try {
        const [macroRes, newsRes] = await Promise.all([
          fetch("/api/live-terminal-data?view=macro-perps", { cache: "no-store" }),
          fetch("/api/newsfilter?limit=12", { cache: "no-store" }),
        ]);
        if (!cancelled && macroRes.ok) {
          const mData = (await macroRes.json()) as {
            weif?: Array<{ sym: string; name: string; px: string; chg: string; up: boolean }>;
          };
          if (Array.isArray(mData.weif) && mData.weif.length > 0) {
            setWeifTiles(mData.weif);
          }
        }
        if (!cancelled && newsRes.ok) {
          const nData = (await newsRes.json()) as {
            articles?: Array<{
              id: string;
              title: string;
              symbols: string[];
              category: string;
              source: { name: string };
              publishedAt: string;
              sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
            }>;
          };
          if (Array.isArray(nData.articles) && nData.articles.length > 0) {
            setWireHeadlines(
              nData.articles.map((a) => {
                const mins = Math.max(1, Math.round((Date.now() - Date.parse(a.publishedAt)) / 60000));
                return {
                  id: a.id,
                  symbol: a.symbols[0] ?? "SPY",
                  headline: a.title,
                  category: a.category,
                  source: a.source.name.split(" ")[0],
                  timeLabel: mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`,
                  action: a.sentiment === "BULLISH" ? "BUY" : a.sentiment === "BEARISH" ? "TRIM" : "HOLD",
                };
              }),
            );
          }
        }
      } catch {
        // retain prior live wire state
      }
    };
    loadMacroAndWire();
    const id = setInterval(loadMacroAndWire, 25_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const displayedNews = useMemo(() => {
    return wireHeadlines;
  }, [wireHeadlines]);

  // Real OHLCV curve with live last close
  const chartPoints: CandlePoint[] = useMemo(() => {
    if (liveCandles.length >= 2) {
      const copy = liveCandles.slice();
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = {
        ...last,
        price: livePrice,
        close: livePrice,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice),
      };
      return copy;
    }
    const base = livePrice;
    return [
      { time: "Open", price: base / (1 + liveChangePct / 100), open: base / (1 + liveChangePct / 100), high: base, low: base / (1 + liveChangePct / 100), close: base, volume: 0, vwap: base },
      { time: "Live", price: livePrice, open: base, high: livePrice, low: livePrice, close: livePrice, volume: 0, vwap: livePrice },
    ];
  }, [liveCandles, livePrice, liveChangePct]);

  // Level 2 Order Book Depth Ladder centered around live spot price
  const { bids, asks } = useMemo(() => {
    const cur = livePrice;
    const step = cur < 1 ? cur * 0.002 : cur < 20 ? 0.01 : 0.05;
    const bidList: OrderBookLevel[] = [];
    const askList: OrderBookLevel[] = [];
    let cumBid = 0;
    let cumAsk = 0;

    for (let i = 1; i <= 8; i++) {
      const bidP = Math.max(0, cur - i * step);
      const bidSz = Math.floor(1200 + ((i * 791) % 3800) * (10 - i) * 0.15);
      cumBid += bidSz;
      bidList.push({ price: bidP, size: bidSz, total: cumBid, pct: Math.min(100, (cumBid / 18000) * 100) });

      const askP = cur + i * step;
      const askSz = Math.floor(1100 + ((i * 631) % 3600) * (10 - i) * 0.15);
      cumAsk += askSz;
      askList.push({ price: askP, size: askSz, total: cumAsk, pct: Math.min(100, (cumAsk / 18000) * 100) });
    }

    return { bids: bidList, asks: askList };
  }, [livePrice]);

  const executeCommand = (cmd: string) => {
    playTerminalBeep(920, 0.07);
    const trimmed = cmd.toUpperCase().trim();
    setCommandInput(cmd);
    const parts = trimmed.split(/\s+/);
    const candidate = parts[0]?.replace("$", "");

    if (candidate && ASSET_BY_SYMBOL[candidate]) {
      setActiveSymbol(candidate);
    }

    if (trimmed.includes("GIP") || trimmed.includes("GP")) {
      setActiveTab("3-CHART");
    } else if (trimmed.includes("NEWS") || trimmed.includes("TOP") || trimmed.includes("N")) {
      setActiveTab("2-NEWS");
    } else if (trimmed.includes("L2") || trimmed.includes("DOM")) {
      setActiveTab("4-L2");
    } else if (trimmed.includes("IB") || trimmed.includes("CHAT")) {
      setActiveTab("5-IB");
    } else {
      setActiveTab("1-MAIN");
    }
  };

  const chartHeight = 270;
  const chartWidth = 540;
  const paddingY = 24;
  const paddingX = 36;

  const minPrice = Math.min(...chartPoints.map((c) => c.low)) * 0.996;
  const maxPrice = Math.max(...chartPoints.map((c) => c.high)) * 1.004;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (val: number) => {
    return chartHeight - paddingY - ((val - minPrice) / priceRange) * (chartHeight - paddingY * 2);
  };

  const getX = (index: number) => {
    return paddingX + (index / (chartPoints.length - 1)) * (chartWidth - paddingX * 2);
  };

  const mountainAreaPath = useMemo(() => {
    const coords = chartPoints.map((c, i) => `${getX(i)},${getY(c.price)}`).join(" L ");
    return `M ${getX(0)},${chartHeight - paddingY} L ${coords} L ${getX(chartPoints.length - 1)},${chartHeight - paddingY} Z`;
  }, [chartPoints]);

  const mountainLinePath = useMemo(() => {
    return `M ${chartPoints.map((c, i) => `${getX(i)},${getY(c.price)}`).join(" L ")}`;
  }, [chartPoints]);

  return (
    <div className="w-full bg-[#050609] text-[#f2efe8] font-mono select-none rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.75)]">
      {/* 1. TOP GLOBAL WORKSTATION STATUS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#090c12] px-5 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-[#f0c979] tracking-widest text-xs sm:text-sm">
              DUAL-SCREEN EXECUTION DESK
            </span>
          </div>
          <span className="text-stone-600 hidden sm:inline">·</span>
          <span className="text-[11px] text-sky-300 font-semibold hidden md:inline">
            METRO CORE [NY-DC04]
          </span>
          <span className="rounded-md bg-[#d8ab5a]/15 px-2.5 py-0.5 text-[10px] text-[#f0c979] font-semibold">
            DESK ID: 3824-INSTITUTIONAL · {activeTab}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden lg:flex items-center gap-3.5 text-stone-400 text-[11px] tabular-nums">
            <span>NYC: <strong className="text-[#f2efe8]">{clocks.nyc}</strong></span>
            <span>LON: <strong className="text-[#f2efe8]">{clocks.lon}</strong></span>
            <span>TKO: <strong className="text-[#f2efe8]">{clocks.tko}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-[#050609]/80 p-1">
            <button
              onClick={() => setDeskViewMode("dual")}
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                deskViewMode === "dual"
                  ? "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609]"
                  : "text-stone-400 hover:text-white bg-white/[0.04]"
              }`}
              title="Dual Screen Workstation"
            >
              DUAL MONITOR
            </button>
            <button
              onClick={() => setDeskViewMode("screen1")}
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                deskViewMode === "screen1"
                  ? "bg-emerald-500 text-[#050609]"
                  : "text-stone-400 hover:text-white bg-white/[0.04]"
              }`}
            >
              SCREEN 1
            </button>
            <button
              onClick={() => setDeskViewMode("screen2")}
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                deskViewMode === "screen2"
                  ? "bg-sky-400 text-[#050609]"
                  : "text-stone-400 hover:text-white bg-white/[0.04]"
              }`}
            >
              SCREEN 2
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-stone-400 hover:text-[#f0c979] ml-1 px-1"
              title={soundEnabled ? "Mute Terminal Beeps" : "Enable Terminal Audio Beeps"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. DUAL MONITOR CONTAINER */}
      <div className="p-4 sm:p-5 bg-[#050609]">
        <div className={`grid gap-5 ${deskViewMode === "dual" ? "xl:grid-cols-2" : "grid-cols-1"}`}>
          {/* MONITOR 1: NEWS WIRE & GIP TECHNICAL CHART */}
          {(deskViewMode === "dual" || deskViewMode === "screen1") && (
            <div className="rounded-2xl bg-[#080a0f] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.75)] flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between bg-[#0d1017] rounded-xl px-3.5 py-2 text-xs text-stone-300">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f0c979]" />
                  <span className="font-bold tracking-wider text-[#f0c979]">
                    Display 1 · Wire &amp; GIP Intraday Chart
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-400 font-bold">&lt;F8 EQUITY&gt;</span>
                  <span className="text-[#f0c979] font-bold">{activeSymbol} US Equity</span>
                </div>
              </div>

              {/* Monitor 1 Command Bar */}
              <div className="flex items-center gap-2 rounded-xl bg-[#050609] p-2.5">
                <span className="text-emerald-400 font-black text-xs">&lt;CMD&gt;</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") executeCommand(commandInput);
                  }}
                  className="flex-1 rounded-lg bg-[#0d1017] px-3 py-1.5 text-xs text-[#f0c979] font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
                />
                <button
                  onClick={() => executeCommand(commandInput)}
                  className="rounded-lg bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] hover:brightness-110 px-3.5 py-1.5 text-xs font-black text-[#050609] uppercase transition"
                >
                  &lt;GO&gt;
                </button>
              </div>

              {/* Screen 1 Inner Split */}
              <div className="grid lg:grid-cols-[1.05fr_1.15fr] gap-3 flex-1">
                {/* LEFT COLUMN: LIVE INSTITUTIONAL WIRE */}
                <div className="rounded-xl bg-[#0b0e16] p-3.5 flex flex-col justify-between overflow-hidden">
                  <div className="pb-2 mb-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#f0c979] uppercase tracking-wider">
                      TOP STORIES: GLOBAL MARKETS WIRE
                    </span>
                    <span className="text-[10px] text-rose-400 font-bold animate-pulse">● LIVE WIRE</span>
                  </div>

                  <div className="space-y-2.5 h-[340px] overflow-y-auto pr-1 text-xs font-mono">
                    {displayedNews.length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-xl bg-[#050609] p-4 text-center text-xs text-stone-400">
                        Syncing live institutional news wire...
                      </div>
                    ) : (
                      displayedNews.map((news) => (
                        <div
                          key={news.id}
                          onClick={() => {
                            setSelectedNewsId(news.id);
                            executeCommand(`${news.symbol} US Equity GIP <GO>`);
                          }}
                          className={`cursor-pointer rounded-xl p-2.5 transition ${
                            selectedNewsId === news.id
                              ? "bg-[#d8ab5a]/15 text-[#f2efe8]"
                              : "bg-[#050609]/85 hover:bg-[#10141f]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-stone-400">
                            <span className="text-sky-300 font-bold">${news.symbol}</span>
                            <span className="text-stone-500 font-mono">
                              {news.timeLabel} · {news.source}
                            </span>
                          </div>
                          <p className="mt-1 text-[#f2efe8] font-semibold text-[11px] leading-tight line-clamp-2">
                            {news.headline}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px]">
                            <span className="text-stone-400 text-[10px]">{news.category}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 font-bold ${
                                news.action === "BUY"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : news.action === "TRIM" || news.action === "AVOID"
                                  ? "bg-rose-500/15 text-rose-400"
                                  : "bg-[#d8ab5a]/15 text-[#f0c979]"
                              }`}
                            >
                              {news.action}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 mt-2.5 flex items-center justify-between text-[10px] text-stone-400">
                    <span>LIVE WIRE FEED ACTIVE</span>
                    <span className="text-emerald-400">TYPE &lt;NEWS&gt; FOR FEED</span>
                  </div>
                </div>

                {/* RIGHT COLUMN: GIP TECHNICAL INTRADAY CHART */}
                <div className="rounded-xl bg-[#0b0e16] p-3.5 flex flex-col justify-between tabular-nums">
                  <div className="pb-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#f0c979] text-sm tracking-wide">
                        {activeSymbol} US Equity GIP
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base font-black font-mono ${
                            priceFlash === "up"
                              ? "text-emerald-400"
                              : priceFlash === "down"
                              ? "text-rose-400"
                              : "text-[#f2efe8]"
                          }`}
                        >
                          {livePrice > 0 ? `$${livePrice.toFixed(livePrice < 1 ? 4 : 2)}` : "Syncing..."}
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            liveChangePct >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {liveChangePct >= 0 ? `+${liveChangePct.toFixed(2)}%` : `${liveChangePct.toFixed(2)}%`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-0.5">
                      <span>SESSION: LIVE MULTI-VENUE</span>
                      <span>SMA20: ${(metrics.sma20 || livePrice).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* SVG Chart Pane */}
                  <div className="relative my-2 select-none">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto cursor-crosshair">
                      <defs>
                        <linearGradient id="luxuryMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                          <stop offset="55%" stopColor="#d8ab5a" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#050609" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {[0.2, 0.4, 0.6, 0.8].map((pct) => {
                        const y = paddingY + pct * (chartHeight - paddingY * 2);
                        const val = maxPrice - pct * priceRange;
                        return (
                          <g key={pct}>
                            <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#1a202e" strokeDasharray="3 3" />
                            <text x={chartWidth - paddingX + 4} y={y + 3} fill="#94a3b8" fontSize="8" fontFamily="monospace">
                              ${val.toFixed(1)}
                            </text>
                          </g>
                        );
                      })}

                      {[0.25, 0.5, 0.75].map((pct) => {
                        const x = paddingX + pct * (chartWidth - paddingX * 2);
                        return <line key={pct} x1={x} y1={paddingY} x2={x} y2={chartHeight - paddingY} stroke="#1a202e" strokeDasharray="2 2" />;
                      })}

                      {chartMode === "mountain" ? (
                        <>
                          <path d={mountainAreaPath} fill="url(#luxuryMountainGrad)" />
                          <path d={mountainLinePath} fill="none" stroke="#38bdf8" strokeWidth="2.2" />
                        </>
                      ) : (
                        chartPoints.map((c, idx) => {
                          const x = getX(idx);
                          const yOpen = getY(c.open);
                          const yClose = getY(c.close);
                          const yHigh = getY(c.high);
                          const yLow = getY(c.low);
                          const isUp = c.close >= c.open;
                          const col = isUp ? "#34d399" : "#fb7185";
                          return (
                            <g key={idx}>
                              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={col} strokeWidth="1" />
                              <rect
                                x={x - 2.5}
                                y={Math.min(yOpen, yClose)}
                                width="5"
                                height={Math.max(2, Math.abs(yClose - yOpen))}
                                fill={col}
                              />
                            </g>
                          );
                        })
                      )}

                      <line
                        x1={paddingX}
                        y1={getY(Math.min(metrics.sma20, metrics.sma50) * 0.975)}
                        x2={chartWidth - paddingX}
                        y2={getY(Math.min(metrics.sma20, metrics.sma50) * 0.975)}
                        stroke="#d8ab5a"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                      <text
                        x={paddingX + 6}
                        y={getY(Math.min(metrics.sma20, metrics.sma50) * 0.975) - 4}
                        fill="#f0c979"
                        fontSize="8"
                        fontWeight="bold"
                      >
                        SUPPORT STOP: ${(Math.min(metrics.sma20, metrics.sma50) * 0.975).toFixed(2)}
                      </text>

                      <circle
                        cx={getX(chartPoints.length - 1)}
                        cy={getY(chartPoints[chartPoints.length - 1].price)}
                        r="4"
                        fill="#34d399"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </svg>

                    <div className="flex justify-between px-8 text-[9px] text-stone-400 font-mono">
                      <span>09:30</span>
                      <span>11:00</span>
                      <span>13:00</span>
                      <span>15:00</span>
                      <span>16:00</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChartMode("mountain")}
                        className={`rounded-md px-2.5 py-1 font-semibold transition ${
                          chartMode === "mountain" ? "bg-sky-400 text-[#050609]" : "bg-white/[0.04] text-stone-400 hover:text-white"
                        }`}
                      >
                        AREA CURVE
                      </button>
                      <button
                        onClick={() => setChartMode("candle")}
                        className={`rounded-md px-2.5 py-1 font-semibold transition ${
                          chartMode === "candle" ? "bg-emerald-400 text-[#050609]" : "bg-white/[0.04] text-stone-400 hover:text-white"
                        }`}
                      >
                        CANDLES
                      </button>
                    </div>
                    <span className="text-emerald-400 font-bold">
                      RSI: {(liveRsi ?? metrics.rsi).toFixed(1)} · SCORE: {metrics.score}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="py-2 text-center bg-[#0d1017] rounded-xl text-[10px] tracking-widest text-stone-500 font-semibold uppercase">
                NEXTWALL QUANTITATIVE · EXECUTION DISPLAY 1
              </div>
            </div>
          )}

          {/* MONITOR 2: WEIF MATRIX & LEVEL 2 ORDER DEPTH */}
          {(deskViewMode === "dual" || deskViewMode === "screen2") && (
            <div className="rounded-2xl bg-[#080a0f] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.75)] flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between bg-[#0d1017] rounded-xl px-3.5 py-2 text-xs text-stone-300">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-bold tracking-wider text-emerald-400">
                    Display 2 · WEIF Matrix &amp; Level 2 Order Book
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-[#f0c979] font-bold">&lt;DOM DEPTH&gt;</span>
                  <span className="text-sky-300 font-bold">L2 TICKER TAPE</span>
                </div>
              </div>

              <div className="grid grid-rows-[0.9fr_1.3fr] gap-3 flex-1 tabular-nums">
                {/* WEIF MATRIX */}
                <div className="rounded-xl bg-[#0b0e16] p-3.5 overflow-hidden">
                  <div className="flex items-center justify-between pb-1.5 mb-2.5">
                    <span className="text-[11px] font-bold text-[#f0c979] uppercase tracking-wider">
                      WEIF · WORLD EQUITY &amp; COMMODITY MATRIX
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">REAL-TIME GLOBAL FEED</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    {(weifTiles.length > 0
                      ? weifTiles
                      : [
                          { sym: "SPX", name: "S&P 500 IDX", px: "Syncing...", chg: "—", up: true },
                          { sym: "IXIC", name: "NASDAQ COMP", px: "Syncing...", chg: "—", up: true },
                          { sym: "TNX", name: "10Y YIELD", px: "Syncing...", chg: "—", up: true },
                          { sym: "BTC", name: "BITCOIN", px: "Syncing...", chg: "—", up: true },
                          { sym: "XAU", name: "GOLD BULLION", px: "Syncing...", chg: "—", up: true },
                          { sym: "WTI", name: "WTI CRUDE", px: "Syncing...", chg: "—", up: true },
                          { sym: "EUR", name: "EUR/USD", px: "Syncing...", chg: "—", up: true },
                          { sym: "DXY", name: "DOLLAR INDEX", px: "Syncing...", chg: "—", up: true },
                        ]
                    ).map((item) => (
                      <div
                        key={item.sym}
                        onClick={() => {
                          if (item.sym === "BTC" || item.sym === "XBT") setActiveSymbol("BTC");
                          else if (ASSET_BY_SYMBOL[item.sym]) setActiveSymbol(item.sym);
                          else setActiveSymbol("NVDA");
                        }}
                        className="cursor-pointer rounded-xl bg-[#050609]/85 p-2.5 hover:bg-[#10141f] transition"
                      >
                        <div className="flex items-center justify-between text-[10px] text-stone-400">
                          <span className="font-bold text-[#f2efe8]">{item.sym}</span>
                          <span className="text-[9px] text-stone-500">{item.name}</span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-stone-200 font-bold">{item.px}</span>
                          <span className={item.up ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {item.chg}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LEVEL 2 DEPTH & TAPE */}
                <div className="grid sm:grid-cols-[1.2fr_0.8fr] gap-3">
                  <div className="rounded-xl bg-[#0b0e16] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-1.5 mb-2 text-[10px]">
                      <span className="font-bold text-emerald-400">BID DEPTH (BUY ORDERS)</span>
                      <span className="font-bold text-rose-400">ASK DEPTH (SELL ORDERS)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <div className="space-y-1">
                        {bids.map((b, i) => (
                          <div key={i} className="relative rounded-md bg-emerald-950/20 px-2 py-0.5 flex justify-between overflow-hidden">
                            <div className="absolute inset-y-0 right-0 bg-emerald-500/20" style={{ width: `${b.pct}%` }} />
                            <span className="relative z-10 text-emerald-400 font-bold">${b.price.toFixed(2)}</span>
                            <span className="relative z-10 text-stone-300">{b.size.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        {asks.map((a, i) => (
                          <div key={i} className="relative rounded-md bg-rose-950/20 px-2 py-0.5 flex justify-between overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-rose-500/20" style={{ width: `${a.pct}%` }} />
                            <span className="relative z-10 text-stone-300">{a.size.toLocaleString()}</span>
                            <span className="relative z-10 text-rose-400 font-bold">${a.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 flex items-center justify-between text-[9px] text-stone-400">
                      <span>
                        SPREAD:{" "}
                        {asks[0] && bids[0]
                          ? `$${(asks[0].price - bids[0].price).toFixed(livePrice < 1 ? 4 : 2)}`
                          : "—"}
                      </span>
                      <span className="text-[#f0c979]">
                        TOTAL DEPTH: {((bids[bids.length - 1]?.total ?? 0) + (asks[asks.length - 1]?.total ?? 0)).toLocaleString()} SHARES
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#0b0e16] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-1.5 mb-2 text-[10px]">
                      <span className="font-bold text-sky-300">TIME &amp; SALES (TAPE)</span>
                      <span className="text-stone-500">EXCH: NMS</span>
                    </div>

                    <div className="space-y-1 text-[10px] font-mono h-[145px] overflow-y-auto pr-0.5">
                      {tape.map((t) => (
                        <div key={t.id} className="flex items-center justify-between rounded-md px-1.5 py-0.5 odd:bg-white/[0.02]">
                          <span className="text-stone-500">{t.time}</span>
                          <span className={t.side === "BUY" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            ${t.price.toFixed(2)}
                          </span>
                          <span className="text-stone-300 font-mono">{t.size}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 text-[9px] text-stone-400 text-center">
                      TAPE FEED: {tape.length} LIVE PRINTS
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-2 text-center bg-[#0d1017] rounded-xl text-[10px] tracking-widest text-stone-500 font-semibold uppercase">
                NEXTWALL QUANTITATIVE · EXECUTION DISPLAY 2
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SPECIALTY HARDWARE KEYBOARD DECK */}
      {showKeyboard && (
        <div className="bg-[#080a0f] px-5 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-[#d8ab5a]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#f0c979]">
                  EXECUTION SHORTCUT KEYBOARD DECK (CLICKABLE)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-500 hidden sm:inline">
                  Interactive hardware key simulation with instant command triggers
                </span>
                <button
                  onClick={() => setShowKeyboard(false)}
                  className="text-stone-400 hover:text-[#f2efe8] text-xs"
                >
                  [Hide]
                </button>
              </div>
            </div>

            <div className="grid gap-2 p-3 rounded-xl bg-[#050609]">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "HELP", style: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25" },
                  { key: "GOVT", style: "bg-[#d8ab5a]/15 text-[#f0c979] hover:bg-[#d8ab5a]/25" },
                  { key: "CORP", style: "bg-[#d8ab5a]/15 text-[#f0c979] hover:bg-[#d8ab5a]/25" },
                  { key: "MTGE", style: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" },
                  { key: "M-MKT", style: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" },
                  { key: "MUNI", style: "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25" },
                  { key: "PFD", style: "bg-pink-500/15 text-pink-300 hover:bg-pink-500/25" },
                  { key: "EQUITY", style: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" },
                  { key: "CMDTY", style: "bg-[#d8ab5a]/15 text-[#f0c979] hover:bg-[#d8ab5a]/25" },
                  { key: "INDEX", style: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25" },
                  { key: "CURNCY", style: "bg-[#d8ab5a]/15 text-[#f0c979] hover:bg-[#d8ab5a]/25" },
                  { key: "CLIENT", style: "bg-white/10 text-[#f2efe8] hover:bg-white/15" },
                ].map((k) => (
                  <button
                    key={k.key}
                    onClick={() => {
                      if (k.key === "EQUITY") executeCommand("NVDA US Equity GIP <GO>");
                      else if (k.key === "CURNCY") executeCommand("BTC <CURNCY> GIP <GO>");
                      else if (k.key === "CMDTY") executeCommand("XAU <CMDTY> GIP <GO>");
                      else executeCommand(`${k.key} <GO>`);
                    }}
                    className={`flex-1 min-w-[56px] sm:min-w-[72px] py-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider active:scale-95 transition ${k.style}`}
                  >
                    &lt;{k.key}&gt;
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "CANCEL", action: "CANCEL", style: "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30" },
                  { label: "NEWS", action: "NEWS <GO>", style: "bg-[#d8ab5a]/15 text-[#f0c979] hover:bg-[#d8ab5a]/25" },
                  { label: "TOP", action: "TOP <GO>", style: "bg-[#d8ab5a]/15 text-[#f0c979] hover:bg-[#d8ab5a]/25" },
                  { label: "GIP (CHART)", action: "GIP <GO>", style: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25" },
                  { label: "DES (FACTS)", action: "DES <GO>", style: "bg-[#d8ab5a]/15 text-[#f0c979] hover:bg-[#d8ab5a]/25" },
                  { label: "L2 (DEPTH)", action: "L2 <GO>", style: "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25" },
                  { label: "IB (CHAT)", action: "IB <GO>", style: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25" },
                  { label: "WEIF", action: "WEIF <GO>", style: "bg-[#d8ab5a]/15 text-[#f0c979] hover:bg-[#d8ab5a]/25" },
                  { label: "PRINT", action: "PRINT", style: "bg-white/[0.06] text-stone-300 hover:bg-white/10" },
                  { label: "MENU", action: "MENU", style: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" },
                  { label: "<GO>", action: "GO", style: "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609] font-black flex-[1.5] hover:brightness-110" },
                ].map((k) => (
                  <button
                    key={k.label}
                    onClick={() => {
                      if (k.action === "GO") executeCommand(commandInput);
                      else executeCommand(k.action);
                    }}
                    className={`flex-1 min-w-[64px] sm:min-w-[85px] py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider active:scale-95 transition ${k.style}`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!showKeyboard && (
        <div className="bg-[#080a0f] px-5 py-2.5 flex justify-end">
          <button
            onClick={() => setShowKeyboard(true)}
            className="text-[11px] font-bold text-[#f0c979] hover:underline flex items-center gap-1.5"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Open Execution Keyboard Deck</span>
          </button>
        </div>
      )}
    </div>
  );
}
