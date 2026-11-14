"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Terminal,
  Activity,
  DollarSign,
  Flame,
  Zap,
  Vote,
  Compass,
} from "lucide-react";
import {
  NEUBERG_PANEL_CATALOG,
  type AINewsIntel,
  type CommoditySpot,
  type FearAndGreedData,
  type MacroRegimeQuadrant,
  type PanelCategory,
  type PerpetualContract,
  type PolymarketContract,
} from "@/lib/neuberg-platform";
import { fmtPrice } from "@/lib/market";
import { useQuotes } from "@/components/live-prices";
import WhopBadge from "@/components/whop-badge";

export default function NeubergTerminal() {
  const [activeCategory, setActiveCategory] = useState<PanelCategory>("All");
  const [openPanelIds, setOpenPanelIds] = useState<string[]>([
    "fear-greed",
    "macro-regime",
    "yield-curve",
    "perps-trading",
    "polymarket",
    "commodities",
    "ai-news-intel",
  ]);

  const liveQuotes = useQuotes();
  const [liveFearGreed, setLiveFearGreed] = useState<FearAndGreedData | null>(null);
  const [liveMacroRegime, setLiveMacroRegime] = useState<MacroRegimeQuadrant | null>(null);
  const [livePerps, setLivePerps] = useState<PerpetualContract[]>([]);
  const [livePolymarkets, setLivePolymarkets] = useState<PolymarketContract[]>([]);
  const [liveCommodities, setLiveCommodities] = useState<CommoditySpot[]>([]);
  const [liveHeadlines, setLiveHeadlines] = useState<AINewsIntel[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);

  // Perps Execution State
  const [selectedPerpSymbol, setSelectedPerpSymbol] = useState<string>("NVDA-PERP");
  const [perpSide, setPerpSide] = useState<"LONG" | "SHORT">("LONG");
  const [leverage, setLeverage] = useState<number>(5);
  const [perpMarginUsd, setPerpMarginUsd] = useState<number>(500);
  const [perpOrderFeedback, setPerpOrderFeedback] = useState<string | null>(null);

  // Polymarket Event Order Book State
  const [selectedPolyId, setSelectedPolyId] = useState<string>("");
  const [polyBetOutcome, setPolyBetOutcome] = useState<"YES" | "NO">("YES");
  const [polyStakeAmount, setPolyStakeAmount] = useState<number>(100);
  const [polyOrderFeedback, setPolyOrderFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadLive = async () => {
      try {
        const res = await fetch("/api/live-terminal-data?view=macro-perps", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          fearGreed?: FearAndGreedData;
          macroRegime?: MacroRegimeQuadrant;
          perps?: PerpetualContract[];
          polymarkets?: PolymarketContract[];
          commodities?: CommoditySpot[];
          headlines?: AINewsIntel[];
        };
        if (cancelled) return;
        if (data.fearGreed) setLiveFearGreed(data.fearGreed);
        if (data.macroRegime) setLiveMacroRegime(data.macroRegime);
        if (Array.isArray(data.perps) && data.perps.length > 0) {
          setLivePerps(data.perps);
          setSelectedPerpSymbol((prev) =>
            data.perps!.some((p) => p.symbol === prev) ? prev : data.perps![0].symbol,
          );
        }
        if (Array.isArray(data.polymarkets) && data.polymarkets.length > 0) {
          setLivePolymarkets(data.polymarkets);
          setSelectedPolyId((prev) =>
            data.polymarkets!.some((p) => p.id === prev) ? prev : data.polymarkets![0].id,
          );
        }
        if (Array.isArray(data.commodities) && data.commodities.length > 0) {
          setLiveCommodities(data.commodities);
        }
        if (Array.isArray(data.headlines) && data.headlines.length > 0) {
          setLiveHeadlines(data.headlines);
        }
      } catch {
        // retain prior live panels
      } finally {
        if (!cancelled) setIsLoadingLive(false);
      }
    };
    loadLive();
    const id = setInterval(loadLive, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const hydratedPerps = useMemo(
    () =>
      livePerps.map((c) => {
        const baseSym = c.symbol.replace("-PERP", "");
        const q = liveQuotes[baseSym];
        if (!q || q.price <= 0) return c;
        return { ...c, markPrice: q.price, indexPrice: q.price };
      }),
    [livePerps, liveQuotes],
  );

  const selectedPerp =
    hydratedPerps.find((c) => c.symbol === selectedPerpSymbol) ?? hydratedPerps[0] ?? null;
  const selectedPoly =
    livePolymarkets.find((p) => p.id === selectedPolyId) ?? livePolymarkets[0] ?? null;
  const fearGreed = liveFearGreed;
  const macroRegime = liveMacroRegime;

  const togglePanel = (panelId: string) => {
    setOpenPanelIds((prev) =>
      prev.includes(panelId) ? prev.filter((id) => id !== panelId) : [...prev, panelId]
    );
  };

  const isPanelOpen = (panelId: string) => openPanelIds.includes(panelId);

  const perpNotional = perpMarginUsd * leverage;
  const perpQuantity = selectedPerp && selectedPerp.markPrice > 0 ? perpNotional / selectedPerp.markPrice : 0;
  const perpLiquidationPrice =
    selectedPerp
      ? perpSide === "LONG"
        ? selectedPerp.markPrice * (1 - 0.9 / leverage)
        : selectedPerp.markPrice * (1 + 0.9 / leverage)
      : 0;

  const handleExecutePerp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerp) return;
    setPerpOrderFeedback(
      `Order Executed: ${perpSide} ${perpQuantity.toFixed(2)} ${selectedPerp.symbol} at ${fmtPrice(
        selectedPerp.markPrice
      )} (${leverage}x Leverage, Margin $${perpMarginUsd}). Liq: ${fmtPrice(perpLiquidationPrice)}`
    );
    setTimeout(() => setPerpOrderFeedback(null), 4000);
  };

  const handleExecutePolyBet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoly) return;
    const odds = polyBetOutcome === "YES" ? selectedPoly.yesAsk : 1 - selectedPoly.yesBid;
    const shares = odds > 0 ? polyStakeAmount / odds : 0;
    setPolyOrderFeedback(
      `Stake Placed: $${polyStakeAmount} on "${polyBetOutcome}" (${Math.round(
        odds * 100
      )}¢). Potential Payout: $${shares.toFixed(2)}`
    );
    setTimeout(() => setPolyOrderFeedback(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Top Workstation Header & Telemetry Banner */}
      <div className="rounded-2xl border border-[#d8ab5a]/30 bg-gradient-to-br from-[#11100c] via-[#0a0c12] to-[#06080d] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/35 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
                <Terminal className="h-3.5 w-3.5 text-[#d8ab5a]" />
                MACRO &amp; PERPETUALS WORKSTATION
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-stone-300">
                516 Live Panels · 24/7 Execution
              </span>
              <WhopBadge size="xs" />
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-display font-medium text-[#f2efe8] tracking-tight">
              516-Panel Macro &amp; Perpetuals Workstation
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-400 max-w-3xl leading-relaxed font-sans">
              Modular analytical panels across Equities, Fixed Income, Commodities, Macro Regime Quadrants, Fear &amp; Greed composite scoring, 24/7 equity &amp; crypto perpetuals, and live event prediction order books.
            </p>
          </div>

          {/* Quick Platform Telemetry */}
          <div className="rounded-xl border border-[#d8ab5a]/25 bg-[#080a0f]/90 p-4 max-w-md w-full shrink-0 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
              <span className="text-stone-400">Workstation Core:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Multi-Venue Stream
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-stone-400">Active Panels:</span>
              <span className="text-[#f0c979] font-semibold tabular-nums">{openPanelIds.length} / 516 Available</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-stone-400">Macro Sentiment:</span>
              <span className="text-emerald-400 font-semibold tabular-nums">
                {fearGreed ? `${fearGreed.rating} (${fearGreed.score}/100)` : "Syncing Live Feed..."}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-stone-400">Economic Regime:</span>
              <span className="text-rose-400 font-semibold">
                {macroRegime ? `${macroRegime.currentRegime} Quadrant` : "Syncing Live Feed..."}
              </span>
            </div>
          </div>
        </div>

        {/* Panel Category & Layout Filter Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              "All",
              "Macro & Risk",
              "Perpetuals & Predictions",
              "Fixed Income",
              "Commodities",
              "Equities",
            ].map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as PanelCategory)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-mono transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609] font-semibold shadow-[0_4px_16px_rgba(216,171,90,0.22)]"
                      : "bg-white/[0.04] text-stone-400 hover:text-[#f2efe8] border border-white/[0.07]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-stone-400">Toggle Panel Views:</span>
            {NEUBERG_PANEL_CATALOG.slice(0, 5).map((p) => {
              const open = isPanelOpen(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePanel(p.id)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold transition ${
                    open
                      ? "bg-[#d8ab5a]/15 text-[#f0c979] border border-[#d8ab5a]/35"
                      : "bg-white/[0.04] text-stone-500 border border-white/[0.06]"
                  }`}
                >
                  {p.tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODULAR 516-PANEL WORKSPACE GRID */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PANEL 1: FEAR & GREED COMPOSITE INDEX */}
        {isPanelOpen("fear-greed") && (
          <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div>
                <span className="text-[10px] font-mono font-semibold text-[#d8ab5a] uppercase tracking-[0.14em]">
                  PANEL 01 · MARKET SENTIMENT ENGINE
                </span>
                <h3 className="font-display text-lg font-medium text-[#f2efe8] flex items-center gap-2 mt-0.5">
                  <Activity className="h-4 w-4 text-[#d8ab5a]" />
                  Fear &amp; Greed Composite Index
                </h3>
              </div>
              <span className="rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold">
                {fearGreed ? fearGreed.rating : "Syncing"}
              </span>
            </div>

            {!fearGreed ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-6 text-center font-mono text-xs text-stone-400">
                {isLoadingLive ? "Syncing live Alternative.me & market breadth sentiment..." : "Live sentiment feed unavailable."}
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-xl border border-white/[0.07] bg-[#050609] p-4">
                  <div className="text-center sm:text-left">
                    <span className="text-[11px] font-mono text-stone-400 uppercase">Current Reading</span>
                    <div className="text-5xl font-mono font-bold text-emerald-400 tabular-nums">
                      {fearGreed.score}
                    </div>
                    <span className="text-xs font-mono text-stone-400">Scale: 0 (Extreme Fear) &ndash; 100 (Extreme Greed)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-3 sm:pt-0 sm:pl-6 tabular-nums">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Prev Close</span>
                      <strong className="text-stone-200 text-sm">{fearGreed.previousClose}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">1 Week Ago</span>
                      <strong className="text-stone-200 text-sm">{fearGreed.oneWeekAgo}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">1 Month Ago</span>
                      <strong className="text-[#f0c979] text-sm">{fearGreed.oneMonthAgo}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    Contributing Sub-Factor Signals
                  </span>
                  <div className="grid gap-2">
                    {fearGreed.factors.map((f) => (
                      <div
                        key={f.name}
                        className="flex items-center justify-between rounded-lg bg-[#050609] px-3 py-2 border border-white/[0.06]"
                      >
                        <span className="text-stone-300 text-xs">{f.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-emerald-400"
                              style={{ width: `${f.score}%` }}
                            />
                          </div>
                          <span className="text-emerald-400 font-semibold">{f.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* PANEL 2: MACRO REGIME QUADRANT */}
        {isPanelOpen("macro-regime") && (
          <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div>
                <span className="text-[10px] font-mono font-semibold text-rose-400 uppercase tracking-[0.14em]">
                  PANEL 02 · MACRO CYCLE ANALYSIS
                </span>
                <h3 className="font-display text-lg font-medium text-[#f2efe8] flex items-center gap-2 mt-0.5">
                  <Compass className="h-4 w-4 text-rose-400" />
                  Macro Regime Quadrant
                </h3>
              </div>
              <span className="rounded-md bg-rose-500/15 text-rose-300 border border-rose-400/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold">
                {macroRegime ? macroRegime.currentRegime : "Syncing"}
              </span>
            </div>

            {!macroRegime ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-6 text-center font-mono text-xs text-stone-400">
                {isLoadingLive ? "Computing live macro growth/inflation quadrant..." : "Macro regime telemetry unavailable."}
              </div>
            ) : (
              <>
                <div className="relative rounded-xl border border-white/[0.07] bg-[#050609] p-4 h-56 flex flex-col justify-between font-mono text-[11px]">
                  <div className="flex justify-between text-stone-500">
                    <span>STAGFLATION (Low Growth / High Inf)</span>
                    <span className="text-emerald-400 font-semibold">
                      REFLATION · ACTIVE: {macroRegime.currentRegime.toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute inset-x-4 top-1/2 h-px bg-white/[0.08]" />
                  <div className="absolute inset-y-4 left-1/2 w-px bg-white/[0.08]" />

                  <div
                    className="absolute z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${50 + (macroRegime.growthScore / 100) * 40}%`,
                      top: `${50 - (macroRegime.inflationScore / 100) * 40}%`,
                    }}
                  >
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f0c979] opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-[#d8ab5a] border-2 border-[#f2efe8]" />
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-500">
                    <span>DEFLATION (Low Growth / Low Inf)</span>
                    <span>GOLDILOCKS (High Growth / Low Inf)</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <p className="text-stone-300 text-xs leading-relaxed font-sans">
                    {macroRegime.historicalTransition}
                  </p>
                  <div className="rounded-lg bg-[#050609] p-3 border border-white/[0.07] space-y-1">
                    <span className="text-[10px] font-semibold text-[#d8ab5a] uppercase tracking-wider">
                      Optimal Sector Playbook
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {macroRegime.recommendedAllocation.map((alloc) => (
                        <span
                          key={alloc}
                          className="rounded-md bg-[#d8ab5a]/10 text-[#f0c979] border border-[#d8ab5a]/25 px-2 py-0.5 text-[11px]"
                        >
                          {alloc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* PANEL 3: 24/7 STOCK & CRYPTO PERPETUALS */}
        {isPanelOpen("perps-trading") && (
          <div className="rounded-2xl border border-[#d8ab5a]/30 bg-gradient-to-b from-[#110f0b] to-[#07090e] p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-mono font-semibold text-[#d8ab5a] uppercase tracking-[0.14em]">
                  PANEL 03 · 24/7 EXECUTION ENGINE
                </span>
                <h3 className="font-display text-lg font-medium text-[#f2efe8] flex items-center gap-2 mt-0.5">
                  <DollarSign className="h-4 w-4 text-[#d8ab5a]" />
                  24/7 Stock &amp; Crypto Perpetuals
                </h3>
              </div>
              <span className="rounded-md bg-[#d8ab5a]/15 text-[#f0c979] border border-[#d8ab5a]/35 px-2.5 py-0.5 text-[10px] font-mono font-semibold">
                1x &ndash; 20x Leverage
              </span>
            </div>

            {!selectedPerp ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-6 text-center font-mono text-xs text-stone-400">
                {isLoadingLive ? "Syncing Hyperliquid & Binance perpetual contracts..." : "Perpetuals market feed unavailable."}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {hydratedPerps.map((contract) => {
                    const isSelected = selectedPerp.symbol === contract.symbol;
                    return (
                      <button
                        key={contract.symbol}
                        onClick={() => setSelectedPerpSymbol(contract.symbol)}
                        className={`rounded-xl p-2.5 font-mono text-left transition border tabular-nums ${
                          isSelected
                            ? "border-[#d8ab5a]/70 bg-[#d8ab5a]/15 text-[#f2efe8] font-bold"
                            : "border-white/[0.07] bg-[#050609] text-stone-400 hover:text-[#f2efe8] hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span>{contract.symbol}</span>
                          <span className="text-[9px] text-[#f0c979]">{contract.maxLeverage}x</span>
                        </div>
                        <div className="mt-1 text-sm text-[#f2efe8] font-bold">
                          {fmtPrice(contract.markPrice)}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleExecutePerp} className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPerpSide("LONG")}
                      className={`py-2 rounded-xl font-bold transition ${
                        perpSide === "LONG"
                          ? "bg-emerald-500 text-[#050609] shadow-md"
                          : "bg-[#050609] text-stone-400 border border-white/[0.08]"
                      }`}
                    >
                      LONG / BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setPerpSide("SHORT")}
                      className={`py-2 rounded-xl font-bold transition ${
                        perpSide === "SHORT"
                          ? "bg-rose-500 text-white shadow-md"
                          : "bg-[#050609] text-stone-400 border border-white/[0.08]"
                      }`}
                    >
                      SHORT / SELL
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs tabular-nums">
                      <span className="text-stone-300">Account Leverage:</span>
                      <span className="text-[#f0c979] font-bold">{leverage}x Max</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={selectedPerp.maxLeverage}
                      step="1"
                      value={leverage}
                      onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
                      className="w-full accent-[#d8ab5a] mt-1"
                    />
                  </div>

                  <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3 space-y-1.5 text-stone-400 tabular-nums">
                    <div className="flex justify-between items-center">
                      <span>Margin Deposit ($):</span>
                      <input
                        type="number"
                        min="50"
                        max="50000"
                        value={perpMarginUsd}
                        onChange={(e) => setPerpMarginUsd(parseFloat(e.target.value) || 100)}
                        className="w-24 bg-[#0a0d14] border border-white/15 px-2 py-0.5 rounded text-[#f2efe8] text-right font-bold"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Position Size:</span>
                      <span className="text-[#f2efe8] font-bold">{fmtPrice(perpNotional)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Liquidation Price:</span>
                      <span className="text-rose-400 font-bold">{fmtPrice(perpLiquidationPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hourly Funding Rate:</span>
                      <span className="text-emerald-400">
                        {selectedPerp.fundingRateHourlyPct !== null
                          ? `${selectedPerp.fundingRateHourlyPct >= 0 ? "+" : ""}${selectedPerp.fundingRateHourlyPct}% / hr`
                          : "Spot / N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Open Interest / 24h Vol:</span>
                      <span className="text-stone-300">
                        {selectedPerp.openInterestBillion !== null ? `$${selectedPerp.openInterestBillion}B OI` : "N/A"} ·{" "}
                        {selectedPerp.volume24hBillion !== null ? `$${selectedPerp.volume24hBillion}B Vol` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {perpOrderFeedback && (
                    <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/35 p-2.5 text-emerald-300 text-[11px]">
                      {perpOrderFeedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`w-full py-2.5 rounded-xl font-bold font-mono transition ${
                      perpSide === "LONG"
                        ? "bg-emerald-500 text-[#050609] hover:bg-emerald-400"
                        : "bg-rose-500 text-white hover:bg-rose-400"
                    }`}
                  >
                    Execute {leverage}x {perpSide} {selectedPerp.symbol} &lt;GO&gt;
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* PANEL 4: EVENT PREDICTION ORDER BOOK */}
        {isPanelOpen("polymarket") && (
          <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div>
                <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-[0.14em]">
                  PANEL 04 · EVENT PROBABILITY MARKETS
                </span>
                <h3 className="font-display text-lg font-medium text-[#f2efe8] flex items-center gap-2 mt-0.5">
                  <Vote className="h-4 w-4 text-emerald-400" />
                  Event Prediction Order Book
                </h3>
              </div>
              <span className="rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-400/25 px-2.5 py-0.5 text-[10px] font-mono font-semibold">
                Live Liquidity Book
              </span>
            </div>

            {!selectedPoly ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-6 text-center font-mono text-xs text-stone-400">
                {isLoadingLive ? "Syncing live Polymarket Gamma prediction markets..." : "Live prediction order book unavailable."}
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {livePolymarkets.map((poly) => {
                    const isSelected = selectedPoly.id === poly.id;
                    return (
                      <button
                        key={poly.id}
                        onClick={() => setSelectedPolyId(poly.id)}
                        className={`w-full text-left rounded-xl p-3 font-mono text-xs transition border ${
                          isSelected
                            ? "border-emerald-400/50 bg-emerald-500/10 text-[#f2efe8]"
                            : "border-white/[0.07] bg-[#050609] text-stone-400 hover:text-[#f2efe8]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#f0c979]">{poly.category}</span>
                          <span className="text-stone-400 tabular-nums">${(poly.volumeUsd / 1e6).toFixed(1)}M Vol</span>
                        </div>
                        <p className="mt-1 text-xs text-[#f2efe8] font-semibold line-clamp-1">
                          {poly.question}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleExecutePolyBet} className="space-y-3 font-mono text-xs">
                  <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5 space-y-2">
                    <p className="text-[#f2efe8] font-semibold text-xs">{selectedPoly.question}</p>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/[0.06]">
                      <span className="text-stone-400">Current Implied Probability:</span>
                      <span className="text-emerald-400 font-bold text-sm tabular-nums">
                        {selectedPoly.probabilityYesPct}% YES
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 tabular-nums">
                    <button
                      type="button"
                      onClick={() => setPolyBetOutcome("YES")}
                      className={`py-2 rounded-xl font-bold transition ${
                        polyBetOutcome === "YES"
                          ? "bg-emerald-500 text-[#050609]"
                          : "bg-[#050609] text-stone-400 border border-white/[0.08]"
                      }`}
                    >
                      BUY YES ({Math.round(selectedPoly.yesAsk * 100)}¢)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolyBetOutcome("NO")}
                      className={`py-2 rounded-xl font-bold transition ${
                        polyBetOutcome === "NO"
                          ? "bg-rose-500 text-white"
                          : "bg-[#050609] text-stone-400 border border-white/[0.08]"
                      }`}
                    >
                      BUY NO ({Math.round((1 - selectedPoly.yesBid) * 100)}¢)
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-stone-400">Stake Amount:</span>
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      value={polyStakeAmount}
                      onChange={(e) => setPolyStakeAmount(parseFloat(e.target.value) || 50)}
                      className="w-28 bg-[#050609] border border-white/15 px-3 py-1.5 rounded-lg text-[#f2efe8] text-right font-bold tabular-nums"
                    />
                  </div>

                  {polyOrderFeedback && (
                    <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/35 p-2 text-emerald-300 text-[11px]">
                      {polyOrderFeedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609] font-bold hover:brightness-105 transition"
                  >
                    Place Prediction Stake &lt;GO&gt;
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* PANEL 5: COMMODITIES & PRECIOUS METALS MATRIX */}
        {isPanelOpen("commodities") && (
          <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div>
                <span className="text-[10px] font-mono font-semibold text-[#d8ab5a] uppercase tracking-[0.14em]">
                  PANEL 05 · REAL ASSET PRICING
                </span>
                <h3 className="font-display text-lg font-medium text-[#f2efe8] flex items-center gap-2 mt-0.5">
                  <Flame className="h-4 w-4 text-[#d8ab5a]" />
                  Commodities &amp; Precious Metals Matrix
                </h3>
              </div>
              <span className="text-xs font-mono text-stone-400">NYMEX / COMEX Feeds</span>
            </div>

            {liveCommodities.length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-6 text-center font-mono text-xs text-stone-400">
                {isLoadingLive ? "Syncing live commodities spot prices..." : "Live commodities feed unavailable."}
              </div>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 font-mono text-xs tabular-nums">
                {liveCommodities.map((c) => (
                  <div
                    key={c.symbol}
                    className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5 space-y-1 hover:border-[#d8ab5a]/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#f2efe8]">{c.name}</span>
                      <span
                        className={`font-bold ${
                          c.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {c.change24hPct >= 0 ? "+" : ""}
                        {c.change24hPct}%
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-[#f0c979]">
                        ${c.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-stone-500">{c.unit}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 pt-1 border-t border-white/[0.06]">
                      {c.spreadInfo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL 6: AI GEOPOLITICAL & CONFLICT RADAR */}
        {isPanelOpen("ai-news-intel") && (
          <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0d1017] to-[#07090e] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div>
                <span className="text-[10px] font-mono font-semibold text-sky-300 uppercase tracking-[0.14em]">
                  PANEL 06 · INTELLIGENCE RADAR
                </span>
                <h3 className="font-display text-lg font-medium text-[#f2efe8] flex items-center gap-2 mt-0.5">
                  <Zap className="h-4 w-4 text-[#d8ab5a]" />
                  Geopolitical &amp; Macro Risk Radar
                </h3>
              </div>
              <span className="rounded-md bg-sky-500/10 text-sky-300 border border-sky-400/25 px-2.5 py-0.5 text-[10px] font-mono font-semibold">
                NLP Classification
              </span>
            </div>

            {liveHeadlines.length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-6 text-center font-mono text-xs text-stone-400">
                {isLoadingLive ? "Syncing live macroeconomic & geopolitical intelligence wire..." : "Live headline wire unavailable."}
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {liveHeadlines.map((news) => (
                  <div
                    key={news.id}
                    className="rounded-xl border border-white/[0.07] bg-[#050609] p-4 space-y-2 hover:border-[#d8ab5a]/35 transition"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="rounded bg-white/[0.06] px-2 py-0.5 text-stone-300 font-semibold">
                        {news.category}
                      </span>
                      <span className="text-stone-400">{news.timestamp}</span>
                    </div>
                    <h4 className="font-semibold text-[#f2efe8] text-xs leading-snug font-sans">{news.headline}</h4>
                    <p className="text-[11px] text-stone-300 leading-relaxed bg-[#090c12] p-2.5 rounded-lg border border-white/[0.05] font-sans">
                      <strong className="text-[#f0c979]">Desk Brief:</strong> {news.aiBrief}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      <span>
                        Impact Score: <strong className="text-[#f0c979] tabular-nums">{news.impactScore}/10</strong>
                      </span>
                      <div className="flex gap-1">
                        {news.affectedTickers.map((tick) => (
                          <span key={tick} className="rounded bg-white/[0.06] border border-white/10 px-1.5 py-0.2 text-[#f2efe8]">
                            ${tick}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
