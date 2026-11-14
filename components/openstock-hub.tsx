"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Globe,
  Clock,
  Bell,
  Search,
  X,
  BarChart3,
  MessageSquare,
  Share2,
  Vote,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  OPENSTOCK_GLOBAL_MARKETS,
  OPENSTOCK_SECTORS,
  INITIAL_OPENSTOCK_ALERTS,
  getSocialSentimentFor,
  type OpenStockAlert,
  type GlobalMarketRegion as OpenStockMarketRegion,
  type SocialSentimentRadar,
} from "@/lib/openstock-platform";
import { ASSETS, ASSET_BY_SYMBOL, fmtPrice, fmtPct, metricsFor, series, stanceColor } from "@/lib/market";
import { useQuotes } from "@/components/live-prices";
import WhopBadge from "@/components/whop-badge";
import TrendChart from "@/components/trend-chart";

function getAssetPrice(symbol: string): number {
  const asset = ASSET_BY_SYMBOL[symbol] || ASSETS[0];
  return metricsFor(asset).last;
}

export default function OpenStockHub() {
  const liveQuotes = useQuotes();
  const livePriceOf = (symbol: string): number =>
    liveQuotes[symbol]?.price ?? getAssetPrice(symbol);

  const [globalMarkets, setGlobalMarkets] = useState<OpenStockMarketRegion[]>(OPENSTOCK_GLOBAL_MARKETS);
  const [marketsLiveSynced, setMarketsLiveSynced] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("us");
  const currentRegion =
    globalMarkets.find((r) => r.id === selectedRegionId) || globalMarkets[0];

  // Multi-Tab Stock Browser
  const [openTabs, setOpenTabs] = useState<string[]>(["NVDA", "AAPL", "BTC", "SOL"]);
  const [activeTabSymbol, setActiveTabSymbol] = useState<string>("NVDA");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Technical Indicators on Chart
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);

  // Live SPDR sector performance overlay
  const [liveSectors, setLiveSectors] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/live-terminal-data?view=market-center", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !Array.isArray(data?.sectors)) return;
        const map: Record<string, number> = {};
        for (const s of data.sectors as Array<{ name: string; change1d: number }>) {
          map[s.name] = s.change1d;
        }
        setLiveSectors(map);
      })
      .catch(() => {});

    fetch("/api/live-terminal-data?view=openstock-markets", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !Array.isArray(data?.markets) || data.markets.length === 0) return;
        const incoming = data.markets as Array<{
          id: string;
          indexValue: number;
          indexChangePct: number;
          status: OpenStockMarketRegion["status"];
        }>;
        setGlobalMarkets((prev) =>
          prev.map((region) => {
            const match = incoming.find((m) => m.id === region.id);
            return match
              ? {
                  ...region,
                  indexValue: match.indexValue,
                  indexChangePct: match.indexChangePct,
                  status: match.status,
                }
              : region;
          })
        );
        setMarketsLiveSynced(true);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Price Alerts Manager
  const [alerts, setAlerts] = useState<OpenStockAlert[]>(INITIAL_OPENSTOCK_ALERTS);
  const [newAlertSymbol, setNewAlertSymbol] = useState("NVDA");
  const [newAlertTarget, setNewAlertTarget] = useState<string>(() =>
    Math.round(getAssetPrice("NVDA") * 1.05).toString()
  );
  const [alertTargetEdited, setAlertTargetEdited] = useState(false);
  const [newAlertDirection, setNewAlertDirection] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (alertTargetEdited) return;
    const livePx = liveQuotes[newAlertSymbol]?.price;
    if (livePx && livePx > 0) {
      setNewAlertTarget((livePx * 1.05).toFixed(2));
    }
  }, [liveQuotes, newAlertSymbol, alertTargetEdited]);

  const activeAsset = ASSET_BY_SYMBOL[activeTabSymbol] || ASSETS[0];
  const activeMetrics = metricsFor(activeAsset);
  const activeLive = liveQuotes[activeAsset.symbol];
  const activeSpotPrice = activeLive?.price ?? activeMetrics.last;
  const activeChange24h = activeLive?.change ?? activeMetrics.change24h;
  const activeSentiment: SocialSentimentRadar = getSocialSentimentFor(activeTabSymbol);
  const activeSeries = series(activeAsset);

  const mergedSectors = useMemo(
    () =>
      OPENSTOCK_SECTORS.map((sec) => {
        const liveMatch = Object.entries(liveSectors).find(([name]) =>
          name.toLowerCase().includes(sec.sector.toLowerCase().split(" ")[0]),
        );
        return {
          ...sec,
          changePct: liveMatch ? liveMatch[1] : null,
        };
      }),
    [liveSectors]
  );

  const handleAddTab = (symbol: string) => {
    const sym = symbol.toUpperCase().trim();
    if (!openTabs.includes(sym)) {
      setOpenTabs((prev) => [...prev, sym]);
    }
    setActiveTabSymbol(sym);
    setSearchQuery("");
  };

  const handleCloseTab = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (openTabs.length <= 1) return;
    const filtered = openTabs.filter((t) => t !== symbol);
    setOpenTabs(filtered);
    if (activeTabSymbol === symbol) {
      setActiveTabSymbol(filtered[0]);
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newAlertTarget);
    if (!target || isNaN(target)) return;

    const cur = livePriceOf(newAlertSymbol);
    const newAlert: OpenStockAlert = {
      id: `alt-${Date.now()}`,
      symbol: newAlertSymbol,
      targetPrice: target,
      direction: newAlertDirection,
      currentPrice: cur,
      triggered: newAlertDirection === "ABOVE" ? cur >= target : cur <= target,
      createdAt: "Just now",
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setAlertSuccess(`Alert armed for $${newAlertSymbol} ${newAlertDirection} $${target}`);
    setTimeout(() => setAlertSuccess(null), 3000);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Top Global Markets & Sentiment Hero Card */}
      <div className="rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-br from-[#0c1210] via-[#090c12] to-[#06080d] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-300">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                9 GLOBAL EXCHANGE HUBS
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-[#f0c979]">
                Multi-Tab Charts · Sentiment Radar
              </span>
              <WhopBadge size="xs" />
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-display font-medium text-[#f2efe8] tracking-tight">
              Global Markets &amp; Sentiment Hub
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-400 max-w-3xl leading-relaxed">
              Coverage across 9 international hubs (US, India, Germany, Canada, Australia, Saudi Arabia, Poland, Crypto 24/7, and Global FX) with browser-style multi-tab charting, crowd sentiment scoring, sector heatmaps, and custom price triggers.
            </p>
          </div>

          {/* Quick World Market Hours Dial */}
          <div className="rounded-xl border border-[#d8ab5a]/25 bg-[#080a0f]/90 p-4 max-w-md w-full shrink-0 font-mono text-xs tabular-nums">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#d8ab5a]" />
                Active Region:
              </span>
              <span className="text-[#f0c979] font-semibold flex items-center gap-1">
                <span>{currentRegion.flag}</span>
                <span>{currentRegion.name}</span>
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-stone-400">Market Status:</span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  !marketsLiveSynced
                    ? "bg-white/[0.05] text-stone-400"
                    : currentRegion.status === "OPEN"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/25"
                    : "bg-white/[0.05] text-stone-400"
                }`}
              >
                {marketsLiveSynced ? currentRegion.status : "SYNCING"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-stone-400">Primary Index:</span>
              <span className="text-[#f2efe8] font-bold">
                {currentRegion.primaryIndex}{" "}
                {marketsLiveSynced && currentRegion.indexValue > 0
                  ? `(${currentRegion.indexValue.toLocaleString()})`
                  : "(Syncing...)"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-stone-400">Session Hours:</span>
              <span className="text-emerald-300">
                {currentRegion.openTimeUTC} &ndash; {currentRegion.closeTimeUTC} UTC
              </span>
            </div>
          </div>
        </div>

        {/* 9 Global Markets Selector Bar */}
        <div className="mt-6 flex flex-wrap gap-2">
          {globalMarkets.map((region) => {
            const isSelected = region.id === selectedRegionId;
            return (
              <button
                key={region.id}
                onClick={() => setSelectedRegionId(region.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono transition-all tabular-nums ${
                  isSelected
                    ? "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609] font-semibold shadow-[0_4px_18px_rgba(216,171,90,0.22)]"
                    : "bg-[#080a0f] text-stone-300 hover:bg-white/[0.06] hover:text-white border border-white/[0.07]"
                }`}
              >
                <span className="text-base">{region.flag}</span>
                <span>{region.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    !marketsLiveSynced
                      ? "text-stone-400"
                      : region.indexChangePct >= 0
                      ? isSelected
                        ? "bg-[#050609]/20 text-[#050609]"
                        : "text-emerald-400"
                      : isSelected
                      ? "bg-[#050609]/20 text-[#050609]"
                      : "text-rose-400"
                  }`}
                >
                  {marketsLiveSynced
                    ? `${region.indexChangePct >= 0 ? "+" : ""}${region.indexChangePct}%`
                    : "Sync"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MULTI-TAB STOCK WORKSPACE */}
      <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-5 shadow-2xl space-y-6">
        {/* Browser-style Tab Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {openTabs.map((sym) => {
              const isActive = sym === activeTabSymbol;
              const p = livePriceOf(sym);
              return (
                <div
                  key={sym}
                  onClick={() => setActiveTabSymbol(sym)}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs cursor-pointer transition tabular-nums ${
                    isActive
                      ? "bg-[#d8ab5a]/15 text-[#f0c979] border border-[#d8ab5a]/45 shadow-sm"
                      : "bg-[#050609] text-stone-400 hover:text-stone-200 border border-white/[0.07]"
                  }`}
                >
                  <span className="font-bold">${sym}</span>
                  <span className="text-[11px] text-stone-400">{fmtPrice(p)}</span>
                  {openTabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(e, sym)}
                      className="opacity-60 hover:opacity-100 hover:text-rose-400 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#d8ab5a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  handleAddTab(searchQuery);
                }
              }}
              placeholder="Search ticker (e.g. TSLA, MSFT, GOOGL)..."
              className="w-full rounded-xl border border-white/10 bg-[#050609] py-1.5 pl-9 pr-8 text-xs text-[#f2efe8] placeholder-stone-500 focus:border-[#d8ab5a]/60 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => handleAddTab(searchQuery)}
                className="absolute right-2.5 top-1.5 text-[#f0c979] hover:text-white text-xs font-mono font-bold"
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* Active Stock Overview Panel */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-3xl font-medium text-[#f2efe8]">${activeAsset.symbol}</h3>
              <span className="text-lg text-stone-300 font-medium">{activeAsset.name}</span>
              <span
                className={`rounded-md border px-2.5 py-0.5 text-[11px] font-mono ${stanceColor(
                  activeMetrics.stance
                )}`}
              >
                {activeMetrics.stance}
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-stone-300 font-mono">
                {activeAsset.group}
              </span>
            </div>
            <p className="mt-2 text-xs text-stone-400 max-w-2xl leading-relaxed">
              {activeAsset.blurb}
            </p>
          </div>

          <div className="text-left lg:text-right font-mono tabular-nums">
            <div className="text-3xl font-bold text-[#f2efe8]">{fmtPrice(activeSpotPrice)}</div>
            <div
              className={`mt-1 text-sm font-bold flex items-center gap-1 lg:justify-end ${
                activeChange24h >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {activeChange24h >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{fmtPct(activeChange24h)} today</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-500">
              52W Range: {fmtPrice(activeMetrics.low52)} &ndash; {fmtPrice(activeMetrics.high52)}
            </div>
          </div>
        </div>

        {/* Technical Indicators Toggle Strip & Chart */}
        <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-stone-400">
              <span>Technical Overlays:</span>
              <button
                onClick={() => setShowSMA20(!showSMA20)}
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold transition tabular-nums ${
                  showSMA20
                    ? "bg-[#d8ab5a]/15 text-[#f0c979] border border-[#d8ab5a]/35"
                    : "bg-white/[0.04] text-stone-500"
                }`}
              >
                20-SMA (${activeMetrics.sma20.toFixed(2)})
              </button>
              <button
                onClick={() => setShowSMA50(!showSMA50)}
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold transition tabular-nums ${
                  showSMA50
                    ? "bg-sky-500/15 text-sky-300 border border-sky-400/35"
                    : "bg-white/[0.04] text-stone-500"
                }`}
              >
                50-SMA (${activeMetrics.sma50.toFixed(2)})
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-stone-400 tabular-nums">
              <span>
                RSI (14D):{" "}
                <strong
                  className={
                    activeMetrics.rsi > 70
                      ? "text-rose-400"
                      : activeMetrics.rsi < 30
                      ? "text-emerald-400"
                      : "text-[#f0c979]"
                  }
                >
                  {activeMetrics.rsi.toFixed(1)}
                </strong>
              </span>
              <span>&middot;</span>
              <span>
                Realized Vol:{" "}
                <strong className="text-[#f2efe8]">{(activeMetrics.vol * 100).toFixed(1)}%</strong>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <TrendChart
              values={activeSeries.map((s) => s.close)}
              label={`${activeAsset.symbol} · Daily Close History`}
            />
          </div>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
          <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5">
            <span className="text-stone-400 text-[10px] uppercase tracking-wider">Trend Score</span>
            <p className="mt-1 text-xl font-bold text-emerald-400">{activeMetrics.score} / 100</p>
            <span className="text-[10px] text-stone-500">Quantitative composite</span>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5">
            <span className="text-stone-400 text-[10px] uppercase tracking-wider">Technical Invalidation</span>
            <p className="mt-1 text-xl font-bold text-[#f0c979]">
              ${(Math.min(activeMetrics.sma20, activeMetrics.sma50) * 0.975).toFixed(2)}
            </p>
            <span className="text-[10px] text-stone-500">Thesis stop-loss</span>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5">
            <span className="text-stone-400 text-[10px] uppercase tracking-wider">Risk Grade</span>
            <p className="mt-1 text-xl font-bold text-stone-200">{activeMetrics.riskGrade}</p>
            <span className="text-[10px] text-stone-500">Vol-scaled sizing</span>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5">
            <span className="text-stone-400 text-[10px] uppercase tracking-wider">200-Day Structural SMA</span>
            <p className="mt-1 text-xl font-bold text-[#f2efe8]">${activeMetrics.sma200.toFixed(2)}</p>
            <span className="text-[10px] text-stone-500">
              {activeSpotPrice > activeMetrics.sma200 ? "Above 200-SMA" : "Below 200-SMA"}
            </span>
          </div>
        </div>
      </div>

      {/* SOCIAL SENTIMENT RADAR & SECTOR HEATMAP */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1.6fr]">
        <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-6 space-y-5 shadow-xl">
          <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#d8ab5a]" />
                Social Sentiment Radar: ${activeAsset.symbol}
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                Real-time crowd telemetry across Reddit, X, News &amp; Event Markets
              </p>
            </div>
            <span
              className={`rounded-md px-2.5 py-0.5 text-[10px] font-mono font-semibold ${
                activeSentiment.sentimentBand === "Very Bullish" ||
                activeSentiment.sentimentBand === "Bullish"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/25"
                  : "bg-[#d8ab5a]/15 text-[#f0c979] border border-[#d8ab5a]/30"
              }`}
            >
              {activeSentiment.sentimentBand}
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs tabular-nums">
            <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#d8ab5a]" />
                  Reddit (r/WallStreetBets &amp; r/Stocks)
                </span>
                <span className="text-emerald-400 font-bold">
                  {activeSentiment.redditBullishPct}% Bullish
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-[#d8ab5a]"
                  style={{ width: `${activeSentiment.redditBullishPct}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-400">
                {activeSentiment.redditMentions24h.toLocaleString()} mentions indexed in the past 24 hours
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-sky-400" />
                  X (FinTwit Order Flow)
                </span>
                <span className="text-emerald-400 font-bold">
                  {activeSentiment.xBullishPct}% Bullish
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-sky-400"
                  style={{ width: `${activeSentiment.xBullishPct}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-400">
                {activeSentiment.xPosts24h.toLocaleString()} posts parsed across retail &amp; prop desks
              </span>
            </div>

            <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/15 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Vote className="h-3.5 w-3.5 text-emerald-400" />
                  Event Market Crowd Probability
                </span>
                <span className="text-emerald-400 font-bold text-sm">
                  {activeSentiment.polymarketProbabilityPct}% YES
                </span>
              </div>
              <p className="text-stone-300 text-xs italic font-sans">
                &ldquo;{activeSentiment.polymarketQuestion}&rdquo;
              </p>
              <span className="text-[10px] text-stone-400 block pt-1">
                Implied probability derived from staked prediction market volume
              </span>
            </div>
          </div>
        </div>

        {/* Sector Performance Heatmap */}
        <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-6 space-y-4 shadow-xl">
          <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Sector Rotation Heatmap
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                Performance across 11 key industry verticals
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#f0c979]">Real-Time Breadth</span>
          </div>

          <div className="space-y-2 font-mono text-xs tabular-nums">
            {mergedSectors.map((sec) => (
              <div
                key={sec.sector}
                className="flex items-center justify-between rounded-lg bg-[#050609] px-3 py-2 border border-white/[0.06] hover:border-[#d8ab5a]/35 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-200">{sec.sector}</span>
                  <span className="text-[10px] text-stone-500">
                    Leader: <strong className="text-[#f0c979]">${sec.leadingSymbol}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-stone-500">{sec.weightPct}% Weight</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      sec.changePct === null
                        ? "bg-white/[0.05] text-stone-400"
                        : sec.changePct >= 0
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    {sec.changePct === null
                      ? "Sync..."
                      : `${sec.changePct >= 0 ? "+" : ""}${sec.changePct.toFixed(2)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICE ALERTS MANAGER */}
      <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-6 space-y-6 shadow-xl">
        <div className="border-b border-white/[0.07] pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-medium text-[#f2efe8] flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#d8ab5a]" />
              Personalized Price Alerts Engine
            </h3>
            <p className="text-xs text-stone-400 font-mono">
              Set target triggers above or below key technical levels with instant alerts
            </p>
          </div>
          <span className="rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 px-2.5 py-0.5 text-[10px] font-mono text-[#f0c979] tabular-nums">
            {alerts.length} Active Triggers
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1.7fr]">
          <form
            onSubmit={handleCreateAlert}
            className="rounded-xl border border-white/[0.07] bg-[#050609] p-5 space-y-4 font-mono text-xs"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#d8ab5a]">
              Configure New Trigger
            </span>

            <div>
              <label className="text-stone-300 block mb-1">Target Symbol</label>
                <select
                  value={newAlertSymbol}
                  onChange={(e) => {
                    setNewAlertSymbol(e.target.value);
                    setAlertTargetEdited(false);
                    setNewAlertTarget(livePriceOf(e.target.value).toString());
                  }}
                  className="w-full rounded-lg border border-white/15 bg-[#090c12] px-3 py-2 text-[#f2efe8]"
                >
                  {ASSETS.slice(0, 16).map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      ${a.symbol} ({a.name}) &mdash; {fmtPrice(livePriceOf(a.symbol))}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1">Condition</label>
                  <select
                    value={newAlertDirection}
                    onChange={(e) => setNewAlertDirection(e.target.value as "ABOVE" | "BELOW")}
                    className="w-full rounded-lg border border-white/15 bg-[#090c12] px-3 py-2 text-[#f2efe8]"
                  >
                    <option value="ABOVE">&ge; Price Rises Above</option>
                    <option value="BELOW">&le; Price Drops Below</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-300 block mb-1">Target Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAlertTarget}
                    onChange={(e) => {
                      setAlertTargetEdited(true);
                      setNewAlertTarget(e.target.value);
                    }}
                    className="w-full rounded-lg border border-white/15 bg-[#090c12] px-3 py-2 text-[#f2efe8] tabular-nums"
                  />
                </div>
              </div>

            {alertSuccess && (
              <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/35 p-2 text-emerald-300 text-[11px]">
                {alertSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] py-2.5 font-bold text-[#050609] hover:brightness-105 transition"
            >
              Arm Price Alert &lt;GO&gt;
            </button>
          </form>

          <div className="space-y-3 font-mono text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Live Monitored Triggers
            </span>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {alerts.map((alt) => {
                const cur = livePriceOf(alt.symbol);
                const isTriggered = alt.direction === "ABOVE" ? cur >= alt.targetPrice : cur <= alt.targetPrice;
                return (
                  <div
                    key={alt.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#050609] p-3.5 tabular-nums"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f2efe8] text-sm">${alt.symbol}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                            alt.direction === "ABOVE"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {alt.direction === "ABOVE" ? "Rises Above" : "Drops Below"}
                        </span>
                        <span className="text-[#f0c979] font-bold">${alt.targetPrice.toFixed(2)}</span>
                      </div>
                      <span className="text-[11px] text-stone-400 mt-0.5 block">
                        Current: {fmtPrice(cur)} &middot; Created: {alt.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isTriggered ? (
                        <span className="rounded bg-emerald-500/15 text-emerald-400 border border-emerald-400/35 px-2 py-0.5 text-[10px] font-bold">
                          TRIGGERED
                        </span>
                      ) : (
                        <span className="rounded bg-white/[0.05] text-stone-400 px-2 py-0.5 text-[10px]">
                          WATCHING
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteAlert(alt.id)}
                        className="text-stone-500 hover:text-rose-400 transition"
                        title="Delete alert"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
