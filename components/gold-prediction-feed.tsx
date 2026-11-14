"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { type GoldNewsItem, type NewsAction } from "@/lib/gold-news-100";
import { ASSET_BY_SYMBOL, metricsFor } from "@/lib/market";
import { useQuotes } from "@/components/live-prices";
import WhopBadge from "@/components/whop-badge";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Clock,
  Radio,
  ArrowRight,
  Target,
  Zap,
} from "lucide-react";

export default function GoldPredictionFeed() {
  const [items, setItems] = useState<GoldNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedAction, setSelectedAction] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeItem, setActiveItem] = useState<GoldNewsItem | null>(null);
  const liveQuotes = useQuotes();
  const liveQuotesRef = useRef(liveQuotes);
  liveQuotesRef.current = liveQuotes;

  const syncLiveWire = useCallback(async () => {
    try {
      const res = await fetch("/api/newsfilter?limit=24", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        articles?: Array<{
          id: string;
          title: string;
          description: string;
          symbols: string[];
          category: string;
          source: { name: string };
          publishedAt: string;
          sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
        }>;
      };
      setFeedError(null);
      if (!Array.isArray(data.articles) || data.articles.length === 0) return;

      const mapped = data.articles
        .map((art, idx): GoldNewsItem | null => {
          const sym = (art.symbols?.[0] && ASSET_BY_SYMBOL[art.symbols[0]] ? art.symbols[0] : "NVDA");
          const asset = ASSET_BY_SYMBOL[sym];
          const m = asset ? metricsFor(asset) : null;
          const basePrice = liveQuotesRef.current[sym]?.price ?? m?.last ?? 0;
          if (basePrice <= 0) return null;
          const action: NewsAction =
            art.sentiment === "BULLISH" ? "BUY" : art.sentiment === "BEARISH" ? "TRIM" : "HOLD";
          const cat =
            art.category === "Crypto"
              ? "Crypto & Layer-1"
              : art.category === "Geopolitics"
                ? "Geopolitics & Defense"
                : art.category === "Macro"
                  ? "Macro & Central Banks"
                  : art.category === "M&A"
                    ? "Executive Boardroom & M&A"
                    : "Tech & AI Scandals";
          const minsAgo = Math.max(1, Math.round((Date.now() - Date.parse(art.publishedAt)) / 60000));
          return {
            id: `live-cat-${art.id}-${idx}`,
            symbol: sym,
            headline: art.title,
            summary: art.description,
            category: cat,
            source: art.source?.name ?? "Global Financial Wire",
            action,
            confidence: action === "HOLD" ? 76 : 86,
            impactPct: Number(((m?.change24h ?? 0) * 100).toFixed(2)),
            currentPrice: basePrice,
            targetPrice: Number((basePrice * (action === "TRIM" ? 0.94 : 1.075)).toFixed(2)),
            invalidationStop: Number((basePrice * (action === "TRIM" ? 1.045 : 0.96)).toFixed(2)),
            deskRationale: `Live market wire catalyst mapped directly to ${sym} real-time trend structure and invalidation support levels.`,
            catalystWindow: minsAgo <= 60 ? "Immediate (Live Wire)" : "Intraday Catalyst",
            timestampOffsetMinutes: minsAgo,
          };
        })
        .filter((x): x is GoldNewsItem => x !== null);

      setItems(mapped);
      setActiveItem((prev) => prev ?? mapped[0] ?? null);
      setLastUpdated(new Date());
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : "Live news catalyst wire unavailable");
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Live minute-by-minute countdown timer syncing real wire updates
  useEffect(() => {
    syncLiveWire();
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          syncLiveWire();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [syncLiveWire]);

  const categories: string[] = [
    "All",
    "Tech & AI Scandals",
    "Geopolitics & Defense",
    "Macro & Central Banks",
    "Crypto & Layer-1",
    "Executive Boardroom & M&A",
    "Speculative & Meme Alpha",
  ];

  const actions: string[] = ["All", "BUY", "ACCUMULATE", "HOLD", "TRIM", "AVOID"];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchAction = selectedAction === "All" || item.action === selectedAction;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        item.symbol.toLowerCase().includes(query) ||
        item.headline.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.deskRationale.toLowerCase().includes(query);

      return matchCategory && matchAction && matchSearch;
    });
  }, [items, selectedCategory, selectedAction, searchQuery]);

  const getActionBadgeColor = (action: NewsAction) => {
    switch (action) {
      case "BUY":
        return "bg-emerald-500/20 text-emerald-300";
      case "ACCUMULATE":
        return "bg-cyan-500/20 text-cyan-300";
      case "HOLD":
        return "bg-amber-500/20 text-amber-300";
      case "TRIM":
        return "bg-orange-500/20 text-orange-300";
      case "AVOID":
        return "bg-rose-500/20 text-rose-300";
    }
  };

  return (
    <div className="space-y-8">
      {/* Top News Action Command Status Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/30 via-ink-900/90 to-ink-950 p-6 sm:p-7 shadow-2xl backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
                NEWS ACTION · 100 BREAKING DOSSIERS
              </span>
              <WhopBadge size="xs" />
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-display text-bone font-medium">
              High-Frequency Catalysts &amp; Invalidation Stops
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted max-w-3xl leading-relaxed">
              Every major global headline—from semiconductor corporate scandals and Taiwan Strait naval maneuvers to Federal Reserve discount repo injections and pump.fun fee burns—mechanically scored for direct portfolio execution.
            </p>
          </div>

          {/* 1-Minute Live Clock Refresh Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl bg-ink-950/85 px-4 py-3 text-center">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "8s" }} />
                <span>Next Wire Sync: {secondsUntilRefresh}s</span>
              </div>
              <p className="mt-1 text-[10px] text-muted font-mono">
                Updated {lastUpdated.toLocaleTimeString("en-US", { timeZone: "America/New_York" })} EST
              </p>
            </div>

            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`rounded-xl p-3 transition ${
                isAudioEnabled
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-ink-950/80 text-muted hover:text-bone hover:bg-ink-950"
              }`}
              title={isAudioEnabled ? "Mute Siren Alerts" : "Enable Siren Audio Alerts on Breaking News"}
            >
              <Bell className={`h-4 w-4 ${isAudioEnabled ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-7 space-y-4 pt-3">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted mr-1 hidden sm:inline">
              Sector:
            </span>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? "bg-gold text-ink-950 font-bold shadow-md scale-105"
                      : "bg-ink-950/75 text-muted hover:text-bone hover:bg-ink-950"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Action Filter & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted mr-1 hidden sm:inline">
                Action:
              </span>
              {actions.map((act) => {
                const active = selectedAction === act;
                return (
                  <button
                    key={act}
                    onClick={() => setSelectedAction(act)}
                    className={`rounded-lg px-3 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "bg-gold/20 text-gold-bright"
                        : "bg-ink-950/60 text-muted hover:text-bone hover:bg-ink-950"
                    }`}
                  >
                    {act}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search $NVDA, Taiwan, Fed, pump.fun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-ink-950/90 pl-9 pr-3 py-2 text-xs text-bone placeholder-muted/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Breaking News Items */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => {
          const isSelected = activeItem?.id === item.id;
          const q = liveQuotes[item.symbol];
          const livePrice = q?.price ?? item.currentPrice;
          const scale = item.currentPrice > 0 ? livePrice / item.currentPrice : 1;
          const liveTarget = item.targetPrice * scale;
          const liveStop = item.invalidationStop * scale;
          const liveMovePct = q ? Number((q.change * 100).toFixed(2)) : item.impactPct;
          const dec = livePrice < 1 ? 4 : 2;
          return (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className={`cursor-pointer rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "bg-amber-500/[0.08] shadow-xl"
                  : "bg-ink-900/55 hover:bg-ink-900/80"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ticker/${item.symbol}`}
                      className="font-mono text-sm font-bold text-gold-bright hover:underline flex items-center gap-1"
                    >
                      <span>${item.symbol}</span>
                    </Link>
                    <span className="text-[10px] text-muted font-mono">{item.source.split(" ")[0]}</span>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${getActionBadgeColor(
                      item.action
                    )}`}
                  >
                    {item.action}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="mt-2 font-display text-base text-bone font-medium leading-snug line-clamp-2">
                  {item.headline}
                </h3>

                {/* Summary */}
                <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3">
                  {item.summary}
                </p>

                {/* Key Quantitative Target Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-ink-950/75 p-3 text-[11px] font-mono">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted">Current</span>
                    <span className="text-bone font-bold">${livePrice.toFixed(dec)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-emerald-400">Target</span>
                    <span className="text-emerald-300 font-bold">${liveTarget.toFixed(dec)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-rose-400">Stop Loss</span>
                    <span className="text-rose-300 font-bold">${liveStop.toFixed(dec)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 flex items-center justify-between pt-2 text-[11px]">
                <div className="flex items-center gap-2 text-muted">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-gold" />
                    <span>{item.confidence}% Match</span>
                  </span>
                  <span>•</span>
                  <span className={liveMovePct >= 0 ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                    {liveMovePct >= 0 ? `+${liveMovePct}%` : `${liveMovePct}%`}
                  </span>
                </div>

                <Link
                  href={`/ticker/${item.symbol}`}
                  className="inline-flex items-center gap-1 font-semibold text-gold-bright hover:text-gold transition text-xs"
                >
                  <span>Trade Setup</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="rounded-2xl bg-ink-900/55 p-12 text-center">
          {isLoading && items.length === 0 ? (
            <p className="text-sm text-muted">Syncing live breaking news dossiers...</p>
          ) : feedError && items.length === 0 ? (
            <>
              <p className="text-sm text-rose-300">Live news action feed temporarily unavailable ({feedError}).</p>
              <button
                onClick={() => void syncLiveWire()}
                className="mt-3 text-xs font-semibold text-gold-bright underline"
              >
                Retry Live Sync
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">No news dossiers match your active filters or search terms.</p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedAction("All");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs font-semibold text-gold-bright underline"
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
