"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GOLD_NEWS_ITEMS, type GoldNewsItem, type NewsAction, type NewsCategory } from "@/lib/gold-news-100";
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
  const [items, setItems] = useState<GoldNewsItem[]>(GOLD_NEWS_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedAction, setSelectedAction] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeItem, setActiveItem] = useState<GoldNewsItem | null>(GOLD_NEWS_ITEMS[0]);

  // Live minute-by-minute countdown timer & simulated breaking wire update
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          // Refresh cycle: bump timestamp and re-randomize top flash
          setLastUpdated(new Date());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40";
      case "ACCUMULATE":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-950/40";
      case "HOLD":
        return "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-950/40";
      case "TRIM":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-orange-950/40";
      case "AVOID":
        return "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/40";
    }
  };

  return (
    <div className="space-y-8">
      {/* Top News Action Command Status Bar */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-ink-900 to-ink-950 p-6 shadow-2xl backdrop-blur">
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
            <div className="rounded-xl border border-amber-500/30 bg-ink-900/90 px-4 py-3 text-center">
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
              className={`rounded-xl border p-3 transition ${
                isAudioEnabled
                  ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                  : "border-line bg-ink-850 text-muted hover:text-bone"
              }`}
              title={isAudioEnabled ? "Mute Siren Alerts" : "Enable Siren Audio Alerts on Breaking News"}
            >
              <Bell className={`h-4 w-4 ${isAudioEnabled ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-8 space-y-4 border-t border-line/60 pt-6">
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
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    active
                      ? "bg-gold text-ink-950 font-bold shadow-md scale-105"
                      : "bg-ink-850 text-muted hover:text-bone border border-line"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Action Filter & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
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
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "bg-ink-800 text-gold-bright border border-gold/40"
                        : "text-muted hover:text-bone hover:bg-ink-850"
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
                className="w-full rounded-lg border border-line bg-ink-900/90 pl-9 pr-3 py-1.5 text-xs text-bone placeholder-muted/60 focus:border-gold/50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Breaking News Items */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => {
          const isSelected = activeItem?.id === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className={`cursor-pointer rounded-xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "border-amber-500/70 bg-amber-500/[0.04] shadow-xl ring-1 ring-amber-500/30"
                  : "border-line bg-ink-900/60 hover:border-gold/40 hover:bg-ink-900"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 border-b border-line/50 pb-3">
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
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${getActionBadgeColor(
                      item.action
                    )}`}
                  >
                    {item.action}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="mt-3 font-display text-base text-bone font-medium leading-snug line-clamp-2">
                  {item.headline}
                </h3>

                {/* Summary */}
                <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3">
                  {item.summary}
                </p>

                {/* Key Quantitative Target Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-ink-850/80 p-2.5 text-[11px] font-mono border border-line/60">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted">Current</span>
                    <span className="text-bone font-bold">${item.currentPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-emerald-400">Target</span>
                    <span className="text-emerald-300 font-bold">${item.targetPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-rose-400">Stop Loss</span>
                    <span className="text-rose-300 font-bold">${item.invalidationStop.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-3 text-[11px]">
                <div className="flex items-center gap-2 text-muted">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-gold" />
                    <span>{item.confidence}% Match</span>
                  </span>
                  <span>•</span>
                  <span className={item.impactPct >= 0 ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                    {item.impactPct >= 0 ? `+${item.impactPct}%` : `${item.impactPct}%`}
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
        <div className="rounded-xl border border-line bg-ink-900/50 p-12 text-center">
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
        </div>
      )}
    </div>
  );
}
