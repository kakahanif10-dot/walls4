"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calculator,
  Check,
  Copy,
  Download,
  Layers,
  Moon,
  RefreshCw,
  Search,
  Sun,
  TrendingUp,
} from "lucide-react";
import {
  DEFAULT_FX_RATES,
  QUICK_TICKERS,
  SUPPORTED_CURRENCIES,
  calculateDcaLadder,
  calculateKellyMetrics,
  calculatePrecisionPosition,
  formatCurrencyValue,
  formatPriceAdaptive,
  type CalcMode,
  type CurrencyCode,
  type LiveFeedTelemetry,
  type MarginMode,
  type WeightingScheme,
} from "@/lib/precision-calculator";

function roundAdaptive(value: number, refPrice: number): number {
  const decimals = refPrice >= 1 ? 2 : refPrice >= 0.01 ? 4 : 7;
  return Number(value.toFixed(decimals));
}

export default function PrecisionQuantCalculator() {
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [calcMode, setCalcMode] = useState<CalcMode>("atr-sizer");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  // Live API Feed State
  const [tickerInput, setTickerInput] = useState<string>("NVDA");
  const [activeSymbol, setActiveSymbol] = useState<string>("NVDA");
  const [feed, setFeed] = useState<LiveFeedTelemetry | null>(null);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Mode 1: ATR & Margin Precision Sizer Inputs
  const [accountEquityUsd, setAccountEquityUsd] = useState<number>(50000);
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [marginMode, setMarginMode] = useState<MarginMode>("spot");
  const [leverage, setLeverage] = useState<number>(5);
  const [atrMultiplier, setAtrMultiplier] = useState<number>(2.0);
  const [useAtrStop, setUseAtrStop] = useState<boolean>(true);
  const [entryPriceUsd, setEntryPriceUsd] = useState<number>(0);
  const [stopPriceUsd, setStopPriceUsd] = useState<number>(0);
  const [targetRMultiple, setTargetRMultiple] = useState<number>(2.5);
  const [feeRateBps, setFeeRateBps] = useState<number>(5);
  const [holdingDays, setHoldingDays] = useState<number>(3);
  const [fundingRate8hPct, setFundingRate8hPct] = useState<number>(0.01);

  // Mode 2: Kelly Criterion & Expectancy Inputs
  const [winRatePct, setWinRatePct] = useState<number>(56);
  const [avgWinR, setAvgWinR] = useState<number>(2.1);
  const [avgLossR, setAvgLossR] = useState<number>(1.0);
  const [kellyFraction, setKellyFraction] = useState<1 | 0.5 | 0.25>(0.25);

  // Mode 3: DCA Ladder Builder Inputs
  const [dcaBudgetUsd, setDcaBudgetUsd] = useState<number>(15000);
  const [dcaTopUsd, setDcaTopUsd] = useState<number>(0);
  const [dcaBottomUsd, setDcaBottomUsd] = useState<number>(0);
  const [dcaTranches, setDcaTranches] = useState<number>(4);
  const [dcaScheme, setDcaScheme] = useState<WeightingScheme>("scale-down");
  const [dcaTargetUsd, setDcaTargetUsd] = useState<number>(0);
  const [dcaStopUsd, setDcaStopUsd] = useState<number>(0);

  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const fetchTelemetry = useCallback(
    async (sym: string, syncInputs = true) => {
      setLoadingFeed(true);
      setFeedError(null);
      try {
        const res = await fetch(`/api/live-calc-feed?symbol=${encodeURIComponent(sym)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as LiveFeedTelemetry;
        setFeed(data);

        if (syncInputs) {
          setEntryPriceUsd(roundAdaptive(data.priceUsd, data.priceUsd));
          const stopDist = data.atr14Usd * atrMultiplier;
          const computedStop =
            direction === "long"
              ? Math.max(data.priceUsd * 0.1, data.priceUsd - stopDist)
              : data.priceUsd + stopDist;
          setStopPriceUsd(roundAdaptive(computedStop, data.priceUsd));

          if (data.assetClass === "equity") {
            setMarginMode("spot");
            setFeeRateBps(2);
          } else {
            setFundingRate8hPct(data.fundingRatePct ?? 0.01);
            setFeeRateBps(5);
          }

          setDcaTopUsd(roundAdaptive(data.priceUsd, data.priceUsd));
          setDcaBottomUsd(roundAdaptive(Math.max(data.priceUsd * 0.5, data.priceUsd - data.atr14Usd * 2.5), data.priceUsd));
          setDcaTargetUsd(roundAdaptive(data.priceUsd + data.atr14Usd * 3.5, data.priceUsd));
          setDcaStopUsd(roundAdaptive(Math.max(data.priceUsd * 0.4, data.priceUsd - data.atr14Usd * 3.5), data.priceUsd));
        }
      } catch (err) {
        setFeedError(err instanceof Error ? err.message : "Failed to load market feed");
      } finally {
        setLoadingFeed(false);
      }
    },
    [atrMultiplier, direction],
  );

  useEffect(() => {
    void fetchTelemetry("NVDA", true);
    // Initial mount load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadSymbol = (sym: string) => {
    const clean = sym.trim().toUpperCase();
    if (!clean) return;
    setActiveSymbol(clean);
    setTickerInput(clean);
    void fetchTelemetry(clean, true);
  };

  // Sync ATR stop automatically when ATR toggle or multiplier changes
  useEffect(() => {
    if (!useAtrStop || !feed) return;
    const dist = feed.atr14Usd * atrMultiplier;
    const nextStop =
      direction === "long" ? Math.max(entryPriceUsd * 0.05, entryPriceUsd - dist) : entryPriceUsd + dist;
    setStopPriceUsd(roundAdaptive(nextStop, entryPriceUsd));
  }, [atrMultiplier, direction, entryPriceUsd, feed, useAtrStop]);

  const fxRates = feed?.fxRates ?? DEFAULT_FX_RATES;

  const positionResult = useMemo(
    () =>
      calculatePrecisionPosition({
        accountEquityUsd,
        riskPct,
        entryPriceUsd,
        stopPriceUsd,
        targetRMultiple,
        leverage,
        marginMode,
        feeRateBps,
        holdingDays,
        fundingRate8hPct,
        direction,
      }),
    [
      accountEquityUsd,
      direction,
      entryPriceUsd,
      feeRateBps,
      fundingRate8hPct,
      holdingDays,
      leverage,
      marginMode,
      riskPct,
      stopPriceUsd,
      targetRMultiple,
    ],
  );

  const kellyResult = useMemo(
    () =>
      calculateKellyMetrics({
        winRatePct,
        avgWinR,
        avgLossR,
        fraction: kellyFraction,
        accountEquityUsd,
      }),
    [accountEquityUsd, avgLossR, avgWinR, kellyFraction, winRatePct],
  );

  const dcaResult = useMemo(
    () =>
      calculateDcaLadder({
        totalBudgetUsd: dcaBudgetUsd,
        topPriceUsd: dcaTopUsd,
        bottomPriceUsd: dcaBottomUsd,
        tranches: dcaTranches,
        scheme: dcaScheme,
        targetPriceUsd: dcaTargetUsd,
        stopPriceUsd: dcaStopUsd,
        feeRateBps,
      }),
    [dcaBottomUsd, dcaBudgetUsd, dcaScheme, dcaStopUsd, dcaTargetUsd, dcaTopUsd, dcaTranches, feeRateBps],
  );

  const handleCopySummary = async () => {
    const lines = [
      `NEXTWALLSTREET PRECISION QUANT CALCULATOR — ${activeSymbol}`,
      `Live Feed Spot: ${formatPriceAdaptive(feed?.priceUsd ?? entryPriceUsd)} | 14D ATR: ${formatPriceAdaptive(feed?.atr14Usd ?? 0)} (${(feed?.atr14Pct ?? 0).toFixed(2)}%) | 20D Vol: ${(feed?.realizedVol20dPct ?? 0).toFixed(1)}%`,
      `Direction: ${direction.toUpperCase()} (${marginMode.toUpperCase()} ${marginMode === "spot" ? "1x" : `${leverage}x`})`,
      `Entry: ${formatPriceAdaptive(entryPriceUsd)} | Stop: ${formatPriceAdaptive(stopPriceUsd)} (${positionResult.stopDistancePct.toFixed(2)}%)`,
      `Position Size: ${formatCurrencyValue(positionResult.notionalUsd, currency, fxRates)} (${positionResult.quantity.toFixed(4)} units)`,
      `Initial Margin: ${formatCurrencyValue(positionResult.initialMarginUsd, currency, fxRates)} | Break-Even: ${formatPriceAdaptive(positionResult.breakEvenPriceUsd)}`,
      `Target (${targetRMultiple}R): ${formatPriceAdaptive(positionResult.targetPriceUsd)} | Net PnL: ${formatCurrencyValue(positionResult.netProfitAtTargetUsd, currency, fxRates)}`,
      `Data Sources: ${(feed?.sources ?? []).join(" + ")}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      setCopiedSummary(false);
    }
  };

  const handleExportDcaCsv = () => {
    const header = ["Tranche", "Entry Price (USD)", "Weight (%)", "Allocation (USD)", "Units"];
    const rows = dcaResult.rows.map((r) => [
      `#${r.index}`,
      r.priceUsd.toFixed(6),
      `${r.weightPct.toFixed(2)}%`,
      r.allocationUsd.toFixed(2),
      r.units.toFixed(6),
    ]);
    const csv = [header, ...rows].map((cols) => cols.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nextwallstreet-${activeSymbol.toLowerCase()}-dca-ladder.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isDark = themeMode === "dark";
  const shellClass = isDark
    ? "bg-zinc-950 text-zinc-100 border-zinc-800"
    : "bg-slate-50 text-slate-950 border-slate-200";
  const panelClass = isDark
    ? "bg-zinc-900/85 text-zinc-100 border-zinc-800"
    : "bg-white text-slate-900 border-slate-200 shadow-xs";
  const insetClass = isDark
    ? "bg-zinc-950/75 border-zinc-800"
    : "bg-slate-50 border-slate-200";
  const inputClass = isDark
    ? "bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-[#10B981]"
    : "bg-white border-slate-300 text-slate-950 focus:border-[#10B981]";
  const hairline = isDark ? "border-zinc-800" : "border-slate-200";
  const muted = isDark ? "text-zinc-400" : "text-slate-600";

  return (
    <div
      data-testid="precision-quant-calculator"
      data-theme-mode={themeMode}
      className={`rounded-2xl border p-4 sm:p-6 transition-colors ${shellClass}`}
    >
      {/* Top Bar: Ticker Search, Live Free API Status, Currency Selector, Light/Dark Toggle */}
      <div className={`border-b pb-5 ${hairline}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-medium ${muted}`}>Free Multi-API Quant Feed</span>
              <span aria-hidden="true" className={muted}>·</span>
              <span data-testid="feed-sources-label" className="font-mono text-[#10B981]">
                {loadingFeed
                  ? "Syncing Binance / Yahoo / Frankfurter ECB..."
                  : feed?.sources?.join(" + ") ?? (feedError ? "Live Feed Unavailable" : "Awaiting Live Feed")}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Precision Quantitative Calculator
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ticker Fetch Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLoadSymbol(tickerInput);
              }}
              className="flex items-center gap-1.5"
            >
              <div className="relative">
                <Search className={`pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 ${muted}`} aria-hidden="true" />
                <input
                  type="text"
                  aria-label="Ticker symbol"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  placeholder="NVDA, BTC, SOL..."
                  className={`w-36 rounded-lg border py-1.5 pl-8 pr-2 font-mono text-xs font-semibold uppercase outline-none ${inputClass}`}
                />
              </div>
              <button
                type="submit"
                disabled={loadingFeed}
                className="rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
              >
                {loadingFeed ? "Loading..." : "Fetch Live"}
              </button>
            </form>

            {/* Currency Switcher (Frankfurter ECB FX) */}
            <select
              aria-label="Account display currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold outline-none ${inputClass}`}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol.trim()})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void fetchTelemetry(activeSymbol, true)}
              aria-label="Refresh live API telemetry"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${panelClass} hover:opacity-90`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingFeed ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode((m) => (m === "dark" ? "light" : "dark"))}
              aria-label={isDark ? "Switch calculator to light mode" : "Switch calculator to dark mode"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${panelClass} hover:opacity-90`}
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Asset Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {QUICK_TICKERS.map((q) => {
            const active = activeSymbol === q.symbol;
            return (
              <button
                key={q.symbol}
                type="button"
                onClick={() => handleLoadSymbol(q.symbol)}
                data-testid={`quick-ticker-${q.symbol}`}
                className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                    : `${insetClass} ${muted} hover:opacity-100`
                }`}
              >
                {q.symbol}
              </button>
            );
          })}
        </div>

        {/* Live Telemetry Ribbon */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <div className={`rounded-xl border p-3 ${insetClass}`}>
            <div className={`text-[11px] ${muted}`}>Live Spot ({activeSymbol})</div>
            <div data-testid="telemetry-spot" className="mt-0.5 font-mono text-base font-bold tabular-nums">
              {feed ? formatPriceAdaptive(feed.priceUsd) : "—"}
            </div>
            <div
              className={`font-mono text-[11px] tabular-nums ${
                (feed?.change24hPct ?? 0) >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {feed ? `${feed.change24hPct >= 0 ? "+" : ""}${feed.change24hPct.toFixed(2)}% (24h)` : "Loading"}
            </div>
          </div>

          <div className={`rounded-xl border p-3 ${insetClass}`}>
            <div className={`text-[11px] ${muted}`}>14-Day ATR</div>
            <div data-testid="telemetry-atr" className="mt-0.5 font-mono text-base font-bold text-[#F59E0B] tabular-nums">
              {feed ? formatPriceAdaptive(feed.atr14Usd) : "—"}
            </div>
            <div className={`font-mono text-[11px] tabular-nums ${muted}`}>
              {feed ? `${feed.atr14Pct.toFixed(2)}% of spot` : "—"}
            </div>
          </div>

          <div className={`rounded-xl border p-3 ${insetClass}`}>
            <div className={`text-[11px] ${muted}`}>20D Realized Vol</div>
            <div data-testid="telemetry-vol" className="mt-0.5 font-mono text-base font-bold tabular-nums">
              {feed ? `${feed.realizedVol20dPct.toFixed(1)}%` : "—"}
            </div>
            <div className={`font-mono text-[11px] ${muted}`}>Annualized log-ret</div>
          </div>

          <div className={`rounded-xl border p-3 ${insetClass}`}>
            <div className={`text-[11px] ${muted}`}>20D / 50D SMA</div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums">
              {feed ? `${formatPriceAdaptive(feed.sma20Usd)}` : "—"}
            </div>
            <div className={`font-mono text-[11px] tabular-nums ${muted}`}>
              50D: {feed ? formatPriceAdaptive(feed.sma50Usd) : "—"}
            </div>
          </div>

          <div className={`rounded-xl border p-3 ${insetClass}`}>
            <div className={`text-[11px] ${muted}`}>Order Book Spread</div>
            <div className="mt-0.5 font-mono text-base font-bold tabular-nums">
              {feed ? `${feed.spreadBps.toFixed(2)} bps` : "—"}
            </div>
            <div className={`font-mono text-[11px] truncate tabular-nums ${muted}`}>
              {feed?.fundingRatePct !== null && feed?.fundingRatePct !== undefined
                ? `Fund 8h: ${feed.fundingRatePct.toFixed(4)}%`
                : "Spot Equity"}
            </div>
          </div>

          <div className={`rounded-xl border p-3 ${insetClass}`}>
            <div className={`text-[11px] ${muted}`}>ECB FX ({currency}/USD)</div>
            <div data-testid="telemetry-fx" className="mt-0.5 font-mono text-base font-bold tabular-nums">
              {(fxRates[currency] ?? 1).toFixed(currency === "JPY" || currency === "IDR" ? 2 : 4)}
            </div>
            <div className={`font-mono text-[11px] ${muted}`}>Frankfurter Live</div>
          </div>
        </div>

        {feedError && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#EF4444]">
            <span>Live market feed temporarily unavailable ({feedError}). No synthetic prices used.</span>
            <button
              type="button"
              onClick={() => void fetchTelemetry(activeSymbol, true)}
              className="rounded border border-[#EF4444]/40 px-2.5 py-0.5 font-mono text-[11px] font-semibold hover:bg-[#EF4444]/15"
            >
              Retry Live Sync
            </button>
          </div>
        )}
      </div>

      {/* Sub-Mode Tabs */}
      <div role="tablist" aria-label="Calculator modes" className="mt-5 flex flex-wrap gap-2">
        {(
          [
            { id: "atr-sizer", label: "ATR & Leverage Position Sizer", icon: Calculator },
            { id: "kelly", label: "Kelly Criterion & Expectancy", icon: TrendingUp },
            { id: "dca-ladder", label: "DCA Scaling & Breakeven Ladder", icon: Layers },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = calcMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`calc-tab-${tab.id}`}
              onClick={() => setCalcMode(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                  : `${panelClass} ${muted} hover:opacity-100`
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODE 1: ATR & Leverage Precision Sizer */}
      {calcMode === "atr-sizer" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          {/* Left Inputs */}
          <div className={`lg:col-span-5 rounded-xl border p-4 sm:p-5 space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Execution Parameters</h3>
              <div className="flex rounded-lg border border-inherit p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDirection("long")}
                  className={`rounded-md px-3 py-1 font-mono font-semibold ${
                    direction === "long" ? "bg-[#10B981] text-zinc-950" : muted
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("short")}
                  className={`rounded-md px-3 py-1 font-mono font-semibold ${
                    direction === "short" ? "bg-[#EF4444] text-white" : muted
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="calc-equity" className={`block text-xs ${muted}`}>
                  Account Equity (USD)
                </label>
                <input
                  id="calc-equity"
                  type="number"
                  min={100}
                  step={500}
                  value={accountEquityUsd}
                  onChange={(e) => setAccountEquityUsd(Math.max(0, Number(e.target.value)))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>

              <div>
                <label htmlFor="calc-risk-pct" className={`block text-xs ${muted}`}>
                  Risk per Trade (%)
                </label>
                <input
                  id="calc-risk-pct"
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={riskPct}
                  onChange={(e) => setRiskPct(Math.max(0.1, Number(e.target.value)))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="calc-entry" className={`block text-xs ${muted}`}>
                  Entry Price (USD)
                </label>
                <input
                  id="calc-entry"
                  type="number"
                  step="any"
                  value={entryPriceUsd}
                  onChange={(e) => setEntryPriceUsd(Number(e.target.value))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="calc-stop" className={`text-xs ${muted}`}>
                    Stop Loss (USD)
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseAtrStop((v) => !v)}
                    className="font-mono text-[10px] font-semibold text-[#F59E0B] hover:underline"
                  >
                    {useAtrStop ? `ATR ×${atrMultiplier}` : "Manual"}
                  </button>
                </div>
                <input
                  id="calc-stop"
                  type="number"
                  step="any"
                  value={Number(stopPriceUsd.toFixed(6))}
                  onChange={(e) => {
                    setUseAtrStop(false);
                    setStopPriceUsd(Number(e.target.value));
                  }}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
            </div>

            {useAtrStop && (
              <div>
                <div className="flex justify-between text-xs">
                  <span className={muted}>ATR Stop Multiplier</span>
                  <span className="font-mono font-semibold text-[#F59E0B]">{atrMultiplier.toFixed(1)}× 14D ATR</span>
                </div>
                <input
                  aria-label="ATR Stop Multiplier"
                  type="range"
                  min={0.5}
                  max={4.0}
                  step={0.5}
                  value={atrMultiplier}
                  onChange={(e) => setAtrMultiplier(Number(e.target.value))}
                  className="mt-1.5 h-1.5 w-full cursor-pointer accent-[#F59E0B]"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="calc-margin-mode" className={`block text-[11px] ${muted}`}>
                  Margin Mode
                </label>
                <select
                  id="calc-margin-mode"
                  value={marginMode}
                  onChange={(e) => setMarginMode(e.target.value as MarginMode)}
                  className={`mt-1 w-full rounded-lg border px-2 py-2 font-mono text-xs font-semibold outline-none ${inputClass}`}
                >
                  <option value="spot">Spot (1×)</option>
                  <option value="isolated">Isolated</option>
                  <option value="cross">Cross</option>
                </select>
              </div>

              <div>
                <label htmlFor="calc-leverage" className={`block text-[11px] ${muted}`}>
                  Leverage (×)
                </label>
                <input
                  id="calc-leverage"
                  type="number"
                  min={1}
                  max={50}
                  disabled={marginMode === "spot"}
                  value={marginMode === "spot" ? 1 : leverage}
                  onChange={(e) => setLeverage(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className={`mt-1 w-full rounded-lg border px-2 py-2 font-mono text-xs font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>

              <div>
                <label htmlFor="calc-target-r" className={`block text-[11px] ${muted}`}>
                  Target (R)
                </label>
                <input
                  id="calc-target-r"
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={targetRMultiple}
                  onChange={(e) => setTargetRMultiple(Math.max(0.5, Number(e.target.value)))}
                  className={`mt-1 w-full rounded-lg border px-2 py-2 font-mono text-xs font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="calc-fees" className={`block text-[11px] ${muted}`}>
                  Fee (bps / side)
                </label>
                <input
                  id="calc-fees"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={feeRateBps}
                  onChange={(e) => setFeeRateBps(Math.max(0, Number(e.target.value)))}
                  className={`mt-1 w-full rounded-lg border px-2 py-2 font-mono text-xs font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>

              <div>
                <label htmlFor="calc-days" className={`block text-[11px] ${muted}`}>
                  Hold Days
                </label>
                <input
                  id="calc-days"
                  type="number"
                  min={0}
                  max={90}
                  value={holdingDays}
                  onChange={(e) => setHoldingDays(Math.max(0, Number(e.target.value)))}
                  className={`mt-1 w-full rounded-lg border px-2 py-2 font-mono text-xs font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>

              <div>
                <label htmlFor="calc-funding" className={`block text-[11px] ${muted}`}>
                  8h Funding (%)
                </label>
                <input
                  id="calc-funding"
                  type="number"
                  step={0.005}
                  disabled={marginMode === "spot"}
                  value={marginMode === "spot" ? 0 : fundingRate8hPct}
                  onChange={(e) => setFundingRate8hPct(Number(e.target.value))}
                  className={`mt-1 w-full rounded-lg border px-2 py-2 font-mono text-xs font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
            </div>

            {!positionResult.isValid && positionResult.error && (
              <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
                {positionResult.error}
              </div>
            )}
          </div>

          {/* Right Computed Outputs */}
          <div className={`lg:col-span-7 flex flex-col justify-between rounded-xl border p-4 sm:p-5 ${panelClass}`}>
            <div>
              <div className="flex items-center justify-between border-b border-inherit pb-3">
                <div>
                  <h3 className="text-sm font-semibold">Fee- &amp; Volatility-Adjusted Output ({currency})</h3>
                  <p className={`text-xs ${muted}`}>Converted automatically at live ECB spot exchange rates</p>
                </div>
                <Activity className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className={`rounded-xl border p-4 ${insetClass}`}>
                  <div className={`text-xs ${muted}`}>Notional Position Size</div>
                  <div
                    data-testid="precision-notional-output"
                    className="mt-1 font-mono text-2xl font-bold text-[#10B981] tabular-nums"
                  >
                    {formatCurrencyValue(positionResult.notionalUsd, currency, fxRates)}
                  </div>
                  <div className={`mt-0.5 font-mono text-xs tabular-nums ${muted}`}>
                    {positionResult.quantity.toLocaleString("en-US", { maximumFractionDigits: 4 })} {activeSymbol} · Effective {positionResult.effectiveLeverage.toFixed(2)}× acct
                  </div>
                </div>

                <div className={`rounded-xl border p-4 ${insetClass}`}>
                  <div className={`text-xs ${muted}`}>Initial Margin Required</div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums">
                    {formatCurrencyValue(positionResult.initialMarginUsd, currency, fxRates)}
                  </div>
                  <div className={`mt-0.5 font-mono text-xs tabular-nums ${muted}`}>
                    Mode: {marginMode.toUpperCase()} · Max Risk: {formatCurrencyValue(positionResult.riskBudgetUsd, currency, fxRates)}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Stop Distance</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#EF4444] tabular-nums">
                    -{positionResult.stopDistancePct.toFixed(2)}%
                  </div>
                  <div className={`font-mono text-[11px] tabular-nums ${muted}`}>
                    {formatPriceAdaptive(positionResult.stopDistanceUsd)}/unit
                  </div>
                </div>

                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Est. Liquidation Price</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#F59E0B] tabular-nums">
                    {positionResult.liquidationPriceUsd !== null
                      ? formatPriceAdaptive(positionResult.liquidationPriceUsd)
                      : "N/A (Spot)"}
                  </div>
                  <div className={`font-mono text-[11px] ${muted}`}>0.5% maint. margin</div>
                </div>

                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>True Break-Even</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums">
                    {formatPriceAdaptive(positionResult.breakEvenPriceUsd)}
                  </div>
                  <div className={`font-mono text-[11px] ${muted}`}>Incl. fees &amp; funding</div>
                </div>

                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Target Price ({targetRMultiple}R)</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#10B981] tabular-nums">
                    {formatPriceAdaptive(positionResult.targetPriceUsd)}
                  </div>
                  <div className={`font-mono text-[11px] ${muted}`}>
                    Net R:R {positionResult.netRewardRiskRatio.toFixed(2)}:1
                  </div>
                </div>

                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Est. Net Profit at Target</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#10B981] tabular-nums">
                    +{formatCurrencyValue(positionResult.netProfitAtTargetUsd, currency, fxRates)}
                  </div>
                  <div className={`font-mono text-[11px] ${muted}`}>After round-trip cost</div>
                </div>

                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Total Fees &amp; Carry</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#EF4444] tabular-nums">
                    -{formatCurrencyValue(positionResult.roundTripFeesUsd + positionResult.estimatedFundingUsd, currency, fxRates)}
                  </div>
                  <div className={`font-mono text-[11px] ${muted}`}>
                    Fees {formatCurrencyValue(positionResult.roundTripFeesUsd, currency, fxRates)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-inherit pt-4">
              <div className={`text-xs ${muted}`}>
                Verified live telemetry timestamp: <span className="font-mono">{feed?.asOf ? feed.asOf.slice(11, 19) + " UTC" : "—"}</span>
              </div>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-4 py-2 text-xs font-semibold text-zinc-950 hover:opacity-90 whitespace-nowrap"
              >
                {copiedSummary ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{copiedSummary ? "Copied Precision Plan" : "Copy Execution Plan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Kelly Criterion & Expectancy Modeler */}
      {calcMode === "kelly" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className={`lg:col-span-5 rounded-xl border p-4 sm:p-5 space-y-4 ${panelClass}`}>
            <h3 className="text-sm font-semibold">Statistical Edge Parameters</h3>
            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor="kelly-winrate" className={muted}>Historical Win Rate (%)</label>
                <span className="font-mono font-bold tabular-nums">{winRatePct}%</span>
              </div>
              <input
                id="kelly-winrate"
                type="range"
                min={20}
                max={85}
                step={1}
                value={winRatePct}
                onChange={(e) => setWinRatePct(Number(e.target.value))}
                className="mt-1.5 h-1.5 w-full cursor-pointer accent-[#10B981]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="kelly-avg-win" className={`block text-xs ${muted}`}>Avg Win (R)</label>
                <input
                  id="kelly-avg-win"
                  type="number"
                  min={0.2}
                  max={10}
                  step={0.1}
                  value={avgWinR}
                  onChange={(e) => setAvgWinR(Math.max(0.1, Number(e.target.value)))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="kelly-avg-loss" className={`block text-xs ${muted}`}>Avg Loss (R)</label>
                <input
                  id="kelly-avg-loss"
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={avgLossR}
                  onChange={(e) => setAvgLossR(Math.max(0.1, Number(e.target.value)))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <span className={`block text-xs ${muted}`}>Kelly Fractional Dampener</span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    { label: "Quarter (0.25×)", val: 0.25 },
                    { label: "Half (0.50×)", val: 0.5 },
                    { label: "Full (1.00×)", val: 1 },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setKellyFraction(item.val)}
                    className={`rounded-lg border px-2 py-2 font-mono text-xs font-semibold ${
                      kellyFraction === item.val
                        ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                        : `${insetClass} ${muted}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`lg:col-span-7 rounded-xl border p-4 sm:p-5 ${panelClass}`}>
            <h3 className="text-sm font-semibold">Optimal Capital Allocation &amp; Ruin Profile</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className={`rounded-xl border p-3.5 ${insetClass}`}>
                <div className={`text-[11px] ${muted}`}>Recommended Risk</div>
                <div data-testid="kelly-recommended-pct" className="mt-1 font-mono text-2xl font-bold text-[#10B981] tabular-nums">
                  {kellyResult.recommendedRiskPct.toFixed(2)}%
                </div>
                <div className={`font-mono text-xs ${muted}`}>
                  {formatCurrencyValue(kellyResult.recommendedRiskUsd, currency, fxRates)} / trade
                </div>
              </div>

              <div className={`rounded-xl border p-3.5 ${insetClass}`}>
                <div className={`text-[11px] ${muted}`}>Full Kelly Criterion</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums">
                  {kellyResult.fullKellyPct.toFixed(2)}%
                </div>
                <div className={`font-mono text-xs ${muted}`}>Payoff {kellyResult.payoffRatio.toFixed(2)} : 1</div>
              </div>

              <div className={`rounded-xl border p-3.5 ${insetClass}`}>
                <div className={`text-[11px] ${muted}`}>Trade Expectancy</div>
                <div
                  className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                    kellyResult.hasPositiveEdge ? "text-[#10B981]" : "text-[#EF4444]"
                  }`}
                >
                  {kellyResult.expectancyR >= 0 ? "+" : ""}
                  {kellyResult.expectancyR.toFixed(2)}R
                </div>
                <div className={`font-mono text-xs ${muted}`}>Profit Factor {kellyResult.profitFactor.toFixed(2)}</div>
              </div>
            </div>

            <div className={`mt-4 rounded-xl border p-4 ${insetClass}`}>
              <div className="flex items-center justify-between text-xs">
                <span>Estimated Risk of 20% Drawdown</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    kellyResult.riskOf20PctDrawdownPct < 10
                      ? "text-[#10B981]"
                      : kellyResult.riskOf20PctDrawdownPct < 30
                        ? "text-[#F59E0B]"
                        : "text-[#EF4444]"
                  }`}
                >
                  {kellyResult.riskOf20PctDrawdownPct.toFixed(1)}%
                </span>
              </div>
              <p className={`mt-2 text-xs ${muted}`}>
                {kellyResult.hasPositiveEdge
                  ? "Institutional desks typically execute at Quarter- or Half-Kelly to preserve geometric growth while avoiding parameter estimation drawdowns."
                  : "Negative mathematical expectancy detected. Do not deploy capital until Win Rate or Average Win/Loss ratio yields positive edge."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: DCA Scaling & Breakeven Ladder */}
      {calcMode === "dca-ladder" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className={`lg:col-span-5 rounded-xl border p-4 sm:p-5 space-y-4 ${panelClass}`}>
            <h3 className="text-sm font-semibold">Limit Order Ladder Setup</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dca-budget" className={`block text-xs ${muted}`}>Total Allocation (USD)</label>
                <input
                  id="dca-budget"
                  type="number"
                  min={100}
                  step={500}
                  value={dcaBudgetUsd}
                  onChange={(e) => setDcaBudgetUsd(Math.max(100, Number(e.target.value)))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>

              <div>
                <label htmlFor="dca-tranches" className={`block text-xs ${muted}`}>Order Tranches</label>
                <select
                  id="dca-tranches"
                  value={dcaTranches}
                  onChange={(e) => setDcaTranches(Number(e.target.value))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold outline-none ${inputClass}`}
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} Tranches
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dca-top" className={`block text-xs ${muted}`}>Top Entry (USD)</label>
                <input
                  id="dca-top"
                  type="number"
                  step="any"
                  value={Number(dcaTopUsd.toFixed(6))}
                  onChange={(e) => setDcaTopUsd(Number(e.target.value))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="dca-bottom" className={`block text-xs ${muted}`}>Bottom Entry (USD)</label>
                <input
                  id="dca-bottom"
                  type="number"
                  step="any"
                  value={Number(dcaBottomUsd.toFixed(6))}
                  onChange={(e) => setDcaBottomUsd(Number(e.target.value))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dca-target" className={`block text-xs ${muted}`}>Exit Target (USD)</label>
                <input
                  id="dca-target"
                  type="number"
                  step="any"
                  value={Number(dcaTargetUsd.toFixed(6))}
                  onChange={(e) => setDcaTargetUsd(Number(e.target.value))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="dca-stop" className={`block text-xs ${muted}`}>Hard Invalidation (USD)</label>
                <input
                  id="dca-stop"
                  type="number"
                  step="any"
                  value={Number(dcaStopUsd.toFixed(6))}
                  onChange={(e) => setDcaStopUsd(Number(e.target.value))}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <span className={`block text-xs ${muted}`}>Allocation Weighting Curve</span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "equal", label: "Equal" },
                    { id: "scale-down", label: "Scale-Down" },
                    { id: "front-loaded", label: "Front-Loaded" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDcaScheme(s.id)}
                    className={`rounded-lg border px-2 py-2 font-mono text-xs font-semibold ${
                      dcaScheme === s.id
                        ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                        : `${insetClass} ${muted}`
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`lg:col-span-7 flex flex-col justify-between rounded-xl border p-4 sm:p-5 ${panelClass}`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Blended Execution Schedule</h3>
                <button
                  type="button"
                  onClick={handleExportDcaCsv}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${insetClass} hover:opacity-90`}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Export Ladder CSV</span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Weighted Avg Entry</div>
                  <div data-testid="dca-avg-entry" className="mt-1 font-mono text-base font-bold tabular-nums">
                    {formatPriceAdaptive(dcaResult.weightedAvgEntryUsd)}
                  </div>
                </div>
                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Total Units</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums">
                    {dcaResult.totalUnits.toLocaleString("en-US", { maximumFractionDigits: 3 })}
                  </div>
                </div>
                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Net Target Profit</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#10B981] tabular-nums">
                    {formatCurrencyValue(dcaResult.projectedNetProfitUsd, currency, fxRates)}
                  </div>
                </div>
                <div className={`rounded-xl border p-3 ${insetClass}`}>
                  <div className={`text-[11px] ${muted}`}>Blended R:R</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#F59E0B] tabular-nums">
                    {dcaResult.blendedRr.toFixed(2)} : 1
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-inherit">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className={`border-b ${hairline} ${insetClass} text-[11px] ${muted}`}>
                      <th className="px-3 py-2 font-medium">Tranche</th>
                      <th className="px-3 py-2 font-medium text-right">Limit Price</th>
                      <th className="px-3 py-2 font-medium text-right">Weight</th>
                      <th className="px-3 py-2 font-medium text-right">Allocation ({currency})</th>
                      <th className="px-3 py-2 font-medium text-right">Units ({activeSymbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {dcaResult.rows.map((r) => (
                      <tr key={r.index}>
                        <td className="px-3 py-2 font-mono font-semibold">#{r.index}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {formatPriceAdaptive(r.priceUsd)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {r.weightPct.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                          {formatCurrencyValue(r.allocationUsd, currency, fxRates)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {r.units.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
