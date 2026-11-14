"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  WSJ_HEARD_STORIES,
  type WSJEarningsEvent,
  type WSJInsiderTrade,
  type WSJMarketLeader,
  type WSJHeardStory,
  type WSJSectorPerformance,
} from "@/lib/wsj-data";
import { useQuotes } from "@/components/live-prices";
import WhopBadge from "@/components/whop-badge";
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  Volume2,
  Pause,
  Play,
  FileText,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Search,
} from "lucide-react";

export default function WSJMarketCenter() {
  const [activeTab, setActiveTab] = useState<"market-center" | "heard-street" | "insiders" | "earnings">("market-center");
  const [boardType, setBoardType] = useState<"active" | "gainers" | "losers">("active");
  const [selectedStory, setSelectedStory] = useState<WSJHeardStory | null>(WSJ_HEARD_STORIES[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(38);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveMostActive, setLiveMostActive] = useState<WSJMarketLeader[]>([]);
  const [liveGainers, setLiveGainers] = useState<WSJMarketLeader[]>([]);
  const [liveLosers, setLiveLosers] = useState<WSJMarketLeader[]>([]);
  const [liveSectors, setLiveSectors] = useState<WSJSectorPerformance[]>([]);
  const [liveInsiders, setLiveInsiders] = useState<WSJInsiderTrade[]>([]);
  const [liveEarnings, setLiveEarnings] = useState<WSJEarningsEvent[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const liveQuotes = useQuotes();

  useEffect(() => {
    let cancelled = false;
    const loadLive = async () => {
      try {
        const res = await fetch("/api/live-terminal-data?view=market-center", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          mostActive?: WSJMarketLeader[];
          topGainers?: WSJMarketLeader[];
          topLosers?: WSJMarketLeader[];
          sectors?: WSJSectorPerformance[];
          insiderTrades?: WSJInsiderTrade[];
          earningsEvents?: WSJEarningsEvent[];
        };
        if (cancelled) return;
        if (Array.isArray(data.mostActive) && data.mostActive.length > 0) setLiveMostActive(data.mostActive);
        if (Array.isArray(data.topGainers) && data.topGainers.length > 0) setLiveGainers(data.topGainers);
        if (Array.isArray(data.topLosers) && data.topLosers.length > 0) setLiveLosers(data.topLosers);
        if (Array.isArray(data.sectors) && data.sectors.length > 0) setLiveSectors(data.sectors);
        if (Array.isArray(data.insiderTrades) && data.insiderTrades.length > 0) setLiveInsiders(data.insiderTrades);
        if (Array.isArray(data.earningsEvents) && data.earningsEvents.length > 0) setLiveEarnings(data.earningsEvents);
      } catch {
        // retain current live tables
      } finally {
        if (!cancelled) setIsLoadingLive(false);
      }
    };
    loadLive();
    const id = setInterval(loadLive, 25_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const getTableRows = (): WSJMarketLeader[] => {
    const raw =
      boardType === "gainers" ? liveGainers : boardType === "losers" ? liveLosers : liveMostActive;
    return raw.map((r) => {
      const q = liveQuotes[r.symbol];
      if (!q) return r;
      const pct = q.change * 100;
      const absChg = q.price - q.open;
      return { ...r, price: q.price, changePct: pct, change: absChg };
    });
  };

  const filteredRows = getTableRows().filter(
    (r) =>
      r.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <div className="space-y-10">
      {/* WSJ Top Executive Bar */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-6 shadow-2xl backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-stone-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-serif font-black tracking-widest text-xs uppercase px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
                MARKET DATA CENTER
              </span>
              <span className="text-xs text-stone-400 font-mono">Institutional Breadth · Desk Intelligence</span>
              <WhopBadge size="xs" />
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-serif text-stone-100 font-normal tracking-tight">
              Institutional Market Data &amp; C-Suite Intelligence
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-400 max-w-3xl leading-relaxed">
              Real-time New York equity market breadth, sector rotation heatmaps, SEC Form 4 insider transactions, and proprietary &ldquo;Heard on the Street&rdquo; strategic columns.
            </p>
          </div>

          {/* WSJ Audio Executive Briefing Player */}
          <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4 max-w-md w-full shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  What&apos;s News: 3-Min Morning Audio
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400">Recorded 08:30 AM EST</span>
            </div>
            <p className="mt-1.5 text-xs text-stone-300 line-clamp-1">
              Big Tech capex discipline, nuclear reactor off-take deals, and Fed liquidity repos.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={toggleAudio}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 transition shrink-0"
                title={isPlayingAudio ? "Pause" : "Play Executive Audio"}
              >
                {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-stone-950 ml-0.5" />}
              </button>
              <div className="flex-1">
                <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${isPlayingAudio ? (audioProgress + 15) % 100 : audioProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-stone-500 font-mono">
                  <span>{isPlayingAudio ? "01:24" : "00:48"}</span>
                  <span>03:15</span>
                </div>
              </div>
              <Volume2 className="h-4 w-4 text-stone-400" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: "market-center", label: "Market Data Center", icon: BarChart2 },
            { id: "heard-street", label: "Heard on the Street Column", icon: FileText },
            { id: "insiders", label: "Form 4 Insider Trades Tracker", icon: UserCheck },
            { id: "earnings", label: "Earnings Whisper Radar", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-900 border border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-amber-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: WSJ MARKET DATA CENTER */}
      {activeTab === "market-center" && (
        <div className="space-y-8">
          {/* Controls & Sub-boards */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="inline-flex rounded-lg border border-stone-800 bg-stone-950 p-1">
              <button
                onClick={() => setBoardType("active")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                  boardType === "active" ? "bg-stone-800 text-amber-300 shadow" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Most Active by Volume
              </button>
              <button
                onClick={() => setBoardType("gainers")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                  boardType === "gainers" ? "bg-stone-800 text-emerald-400 shadow" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Top S&amp;P / Nasdaq Gainers
              </button>
              <button
                onClick={() => setBoardType("losers")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                  boardType === "losers" ? "bg-stone-800 text-rose-400 shadow" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Top Decliners
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
              <input
                type="text"
                placeholder="Filter by ticker or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-stone-800 bg-stone-900/80 pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-950/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/80 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">Security &amp; Symbol</th>
                  <th className="px-4 py-3 text-right">Last Price</th>
                  <th className="px-4 py-3 text-right">Net Change</th>
                  <th className="px-4 py-3 text-right">Today %</th>
                  <th className="px-4 py-3 text-right">Volume</th>
                  <th className="px-4 py-3 text-right">Notional Value</th>
                  <th className="px-4 py-3 text-right">P/E Ratio</th>
                  <th className="px-4 py-3 text-right">Market Cap</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center font-mono text-xs text-stone-400">
                      {isLoadingLive
                        ? "Syncing real-time market center leaders..."
                        : searchQuery.trim()
                          ? "No matching securities in live feed."
                          : "Live market leaders feed temporarily unavailable."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const positive = row.changePct >= 0;
                    return (
                      <tr key={row.symbol} className="hover:bg-stone-900/50 transition">
                        <td className="px-4 py-3.5">
                          <Link href={`/ticker/${row.symbol}`} className="flex items-center gap-2 group">
                            <span className="font-mono font-bold text-stone-100 group-hover:text-amber-400 text-sm">
                              {row.symbol}
                            </span>
                            <span className="text-[11px] text-stone-400 truncate max-w-[140px] sm:max-w-none">
                              {row.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-stone-100">
                          ${row.price.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3.5 text-right font-mono font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                          {positive ? `+${row.change.toFixed(2)}` : row.change.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono">
                          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                          }`}>
                            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {positive ? `+${row.changePct.toFixed(2)}%` : `${row.changePct.toFixed(2)}%`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-stone-300">{row.volume}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-stone-300">{row.notional}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-stone-400">{row.peRatio ? `${row.peRatio}x` : "N/A"}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-stone-300">{row.marketCap}</td>
                        <td className="px-4 py-3.5 text-center">
                          <Link
                            href={`/ticker/${row.symbol}`}
                            className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                          >
                            Desk Model →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* S&P 500 / NASDAQ SECTOR HEATMAP */}
          <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Sector Performance Radar</p>
                <h3 className="text-xl font-serif text-stone-100">S&amp;P 500 &amp; Nasdaq Sector Allocation Barometer</h3>
              </div>
              <span className="text-xs text-stone-400 font-mono">11 GICS Sectors</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              {liveSectors.length === 0 ? (
                <div className="col-span-full rounded-lg border border-stone-800/80 bg-stone-900/60 p-6 text-center font-mono text-xs text-stone-400">
                  {isLoadingLive ? "Syncing live sector performance..." : "Live sector allocation feed unavailable."}
                </div>
              ) : (
                liveSectors.map((sector) => {
                  const positive = sector.change1d >= 0;
                  return (
                    <div
                      key={sector.name}
                      className="rounded-lg border border-stone-800/80 bg-stone-900/60 p-4 hover:border-amber-500/40 transition"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-stone-200">{sector.name}</span>
                        <span className={`font-mono text-xs font-bold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                          {positive ? `+${sector.change1d.toFixed(2)}%` : `${sector.change1d.toFixed(2)}%`}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-stone-800/60 pt-2 text-[10px] text-stone-400 font-mono">
                        <div>
                          <span className="block text-stone-500">1W</span>
                          <span className={sector.change1w >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {sector.change1w >= 0 ? `+${sector.change1w}%` : `${sector.change1w}%`}
                          </span>
                        </div>
                        <div>
                          <span className="block text-stone-500">1M</span>
                          <span className={sector.change1m >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {sector.change1m >= 0 ? `+${sector.change1m}%` : `${sector.change1m}%`}
                          </span>
                        </div>
                        <div>
                          <span className="block text-stone-500">YTD</span>
                          <span className={sector.changeYTD >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {sector.changeYTD >= 0 ? `+${sector.changeYTD}%` : `${sector.changeYTD}%`}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-800/40 pt-1.5">
                        <span>Leader: <strong className="text-emerald-300">{sector.leader}</strong></span>
                        <span>P/E: <strong className="text-stone-300 font-mono">{sector.peAverage}x</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HEARD ON THE STREET */}
      {activeTab === "heard-street" && (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {WSJ_HEARD_STORIES.map((story) => (
              <article
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className={`cursor-pointer rounded-xl border p-6 transition ${
                  selectedStory?.id === story.id
                    ? "border-amber-500/60 bg-amber-500/[0.04]"
                    : "border-stone-800 bg-stone-950/60 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  <span>{story.category}</span>
                  <span>•</span>
                  <span>{story.timestamp}</span>
                  <span>•</span>
                  <span>{story.readTime}</span>
                </div>
                <h3 className="mt-2 font-serif text-xl sm:text-2xl text-stone-100 font-normal leading-snug">
                  {story.headline}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
                  {story.subhead}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-stone-800/80 pt-3 text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-200">{story.columnist}</span>
                    <span className="text-stone-500">| {story.columnistRole}</span>
                  </div>
                  <span className="font-mono text-amber-400 font-bold flex items-center gap-2">
                    <span>${story.primarySymbol}</span>
                    {liveQuotes[story.primarySymbol]?.price ? (
                      <span className="text-[11px] text-stone-300">
                        ${liveQuotes[story.primarySymbol].price.toFixed(2)}{" "}
                        <span className={liveQuotes[story.primarySymbol].change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          ({liveQuotes[story.primarySymbol].change >= 0 ? "+" : ""}
                          {(liveQuotes[story.primarySymbol].change * 100).toFixed(2)}%)
                        </span>
                      </span>
                    ) : null}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {/* Detailed Reading Pane */}
          {selectedStory && (
            <div className="sticky top-24 rounded-xl border border-stone-800 bg-stone-950/90 p-6 h-fit space-y-6 shadow-2xl">
              <div className="border-b border-stone-800 pb-4">
                <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {selectedStory.category}
                </span>
                <h4 className="mt-3 font-serif text-xl text-stone-100 leading-snug">
                  {selectedStory.headline}
                </h4>
                <p className="mt-2 text-xs text-stone-400 font-mono">
                  By {selectedStory.columnist} · {selectedStory.columnistRole}
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed">
                {selectedStory.fullAnalysis.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Institutional Takeaways
                </p>
                <ul className="mt-2 space-y-2 text-xs text-stone-200">
                  {selectedStory.takeaways.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={`/ticker/${selectedStory.primarySymbol}`}
                className="block text-center rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-stone-950 transition"
              >
                Inspect ${selectedStory.primarySymbol} Quantitative Model →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSIDER TRADES TRACKER */}
      {activeTab === "insiders" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">SEC Form 4 Radar</p>
              <h3 className="text-xl font-serif text-stone-100">Live Executive &amp; Director Trading Ledger</h3>
              <p className="text-xs text-stone-400 mt-0.5">Automated ingestion of C-Suite officer open-market transactions exceeding $1,000,000.</p>
            </div>
            <span className="text-xs text-stone-400 font-mono">SEC EDGAR Direct Ingestion</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-950/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/80 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Reporting Insider</th>
                  <th className="px-4 py-3">Executive Title</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3 text-right">Shares</th>
                  <th className="px-4 py-3 text-right">Execution Price</th>
                  <th className="px-4 py-3 text-right">Notional Value</th>
                  <th className="px-4 py-3">Filing Time</th>
                  <th className="px-4 py-3">Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {liveInsiders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center font-mono text-xs text-stone-400">
                      {isLoadingLive ? "Syncing live SEC Form 4 insider filings..." : "Live SEC Form 4 feed unavailable."}
                    </td>
                  </tr>
                ) : (
                  liveInsiders.map((trade) => {
                    const isBuy = trade.type === "BUY";
                    return (
                      <tr key={trade.id} className="hover:bg-stone-900/50 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-stone-100">
                          <Link href={`/ticker/${trade.symbol}`} className="hover:text-amber-400">
                            {trade.symbol}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-stone-200">{trade.insiderName}</td>
                        <td className="px-4 py-3.5 text-stone-400">{trade.title}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            isBuy ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-stone-800 text-stone-300"
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-stone-200">{trade.shares}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-stone-200">${trade.price.toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-stone-100">{trade.totalValue}</td>
                        <td className="px-4 py-3.5 text-stone-400 font-mono text-[11px]">{trade.filingDate}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                            trade.significance.startsWith("High")
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "text-stone-400"
                          }`}>
                            {trade.significance}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EARNINGS RADAR */}
      {activeTab === "earnings" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Consensus vs Whisper</p>
              <h3 className="text-xl font-serif text-stone-100">Earnings Release Calendar &amp; Implied Volatility</h3>
              <p className="text-xs text-stone-400 mt-0.5">Comparison between Wall Street official consensus estimates and buy-side whisper numbers.</p>
            </div>
            <span className="text-xs text-stone-400 font-mono">Options Market Implied Straddle</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveEarnings.length === 0 ? (
              <div className="col-span-full rounded-xl border border-stone-800 bg-stone-950/70 p-8 text-center font-mono text-xs text-stone-400">
                {isLoadingLive ? "Syncing live corporate earnings calendar..." : "Live earnings calendar feed unavailable."}
              </div>
            ) : (
              liveEarnings.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-stone-800 bg-stone-950/70 p-5 hover:border-amber-500/40 transition space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/ticker/${event.symbol}`} className="font-mono text-lg font-bold text-stone-100 hover:text-amber-400">
                        ${event.symbol}
                      </Link>
                      <p className="text-xs text-stone-400">{event.company}</p>
                    </div>
                    <span className="rounded bg-stone-800 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-semibold">
                      {event.reportDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-stone-900/60 p-3 text-xs border border-stone-800/80">
                    <div>
                      <span className="block text-[10px] uppercase text-stone-500">Consensus EPS</span>
                      <span className="font-mono font-bold text-stone-200">{event.consensusEPS}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-stone-500">Whisper EPS</span>
                      <span className="font-mono font-bold text-amber-300">{event.whisperEPS}</span>
                    </div>
                    <div className="mt-2">
                      <span className="block text-[10px] uppercase text-stone-500">Implied Move</span>
                      <span className="font-mono font-bold text-stone-200">{event.impliedMove}</span>
                    </div>
                    <div className="mt-2">
                      <span className="block text-[10px] uppercase text-stone-500">Last Surprise</span>
                      <span className="font-mono font-bold text-emerald-400">{event.lastQuarterSurprise}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-400 text-[11px]">{event.timing}</span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {event.sentiment}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
