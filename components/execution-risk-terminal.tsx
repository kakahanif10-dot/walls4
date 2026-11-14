"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Lock,
  Minus,
  Moon,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Unlock,
} from "lucide-react";
import {
  TERMINAL_ASSETS,
  type AuditSortField,
  type SortDirection,
  type TerminalAsset,
  type TerminalStance,
  buildAuditCsv,
  calculatePositionSizing,
  formatAssetPrice,
  formatQuantity,
  formatTradePlanText,
  formatUsd,
  simulateWhatIfScore,
  sortAuditRows,
} from "@/lib/execution-risk-terminal";
import { useQuotes } from "@/components/live-prices";

const CAPITAL_PRESETS = [
  { label: "$10k", value: 10000 },
  { label: "$50k", value: 50000 },
  { label: "$100k", value: 100000 },
  { label: "$250k", value: 250000 },
];

function withLiveTerminalMetrics(base: TerminalAsset, livePrice?: number): TerminalAsset {
  if (!livePrice || livePrice <= 0 || base.price <= 0) return base;
  const scale = livePrice / base.price;
  const round = (v: number) => Number(v.toFixed(base.priceDecimals));
  return {
    ...base,
    price: livePrice,
    invalidationPrice: round(base.invalidationPrice * scale),
    pillars: {
      ...base.pillars,
      structure: {
        ...base.pillars.structure,
        smas: base.pillars.structure.smas.map((s) => ({
          ...s,
          value: round(s.value * scale),
        })),
      },
      risk: {
        ...base.pillars.risk,
        low52w: round(base.pillars.risk.low52w * scale),
        high52w: round(base.pillars.risk.high52w * scale),
      },
    },
  };
}

export default function ExecutionRiskTerminal() {
  const liveQuotes = useQuotes();
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NVDA");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  // Panel 1: Position Sizer State
  const [portfolioCapital, setPortfolioCapital] = useState<number>(50000);
  const [maxRiskPct, setMaxRiskPct] = useState<number>(1.0);
  const [entryPriceInput, setEntryPriceInput] = useState<string>("");
  const [hasCustomEntry, setHasCustomEntry] = useState<boolean>(false);
  const [customStopEnabled, setCustomStopEnabled] = useState<boolean>(false);
  const [stopPriceInput, setStopPriceInput] = useState<string>("");

  // Panel 2: What-If Scenario State
  const [whatIfDeltaPct, setWhatIfDeltaPct] = useState<number>(0);

  // Panel 3: Audit Trail Sort & Export State
  const [sortField, setSortField] = useState<AuditSortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);
  const [exportedCsv, setExportedCsv] = useState<boolean>(false);

  const hasLiveSelectedQuote = Boolean(liveQuotes[selectedSymbol]?.price && liveQuotes[selectedSymbol].price > 0);

  const asset: TerminalAsset = useMemo(() => {
    const base = TERMINAL_ASSETS.find((item) => item.symbol === selectedSymbol) ?? TERMINAL_ASSETS[0];
    return withLiveTerminalMetrics(base, liveQuotes[base.symbol]?.price);
  }, [selectedSymbol, liveQuotes]);

  useEffect(() => {
    if (!hasLiveSelectedQuote) return;
    if (!hasCustomEntry) {
      setEntryPriceInput(asset.price.toFixed(asset.priceDecimals));
    }
    if (!customStopEnabled) {
      setStopPriceInput(asset.invalidationPrice.toFixed(asset.priceDecimals));
    }
  }, [hasLiveSelectedQuote, asset.price, asset.invalidationPrice, asset.priceDecimals, hasCustomEntry, customStopEnabled]);

  const handleSelectAsset = (next: TerminalAsset) => {
    const livePx = liveQuotes[next.symbol]?.price;
    const liveAsset = withLiveTerminalMetrics(next, livePx);
    setSelectedSymbol(liveAsset.symbol);
    setHasCustomEntry(false);
    setEntryPriceInput(livePx && livePx > 0 ? liveAsset.price.toFixed(liveAsset.priceDecimals) : "");
    setStopPriceInput(livePx && livePx > 0 ? liveAsset.invalidationPrice.toFixed(liveAsset.priceDecimals) : "");
    setCustomStopEnabled(false);
    setWhatIfDeltaPct(0);
    setCopiedPlan(false);
    setExportedCsv(false);
  };

  const parsedEntry = useMemo(() => {
    const val = Number.parseFloat(entryPriceInput);
    return Number.isFinite(val) ? val : 0;
  }, [entryPriceInput]);

  const activeInvalidation = useMemo(() => {
    if (!customStopEnabled) return asset.invalidationPrice;
    const val = Number.parseFloat(stopPriceInput);
    return Number.isFinite(val) ? val : 0;
  }, [asset.invalidationPrice, customStopEnabled, stopPriceInput]);

  const sizing = useMemo(
    () =>
      calculatePositionSizing({
        portfolioCapital,
        maxRiskPct,
        entryPrice: parsedEntry,
        invalidationPrice: activeInvalidation,
        asset,
      }),
    [activeInvalidation, asset, maxRiskPct, parsedEntry, portfolioCapital],
  );

  const whatIf = useMemo(
    () => simulateWhatIfScore(asset, whatIfDeltaPct),
    [asset, whatIfDeltaPct],
  );

  const sortedAudit = useMemo(
    () => sortAuditRows(asset.auditTrail, sortField, sortDirection),
    [asset.auditTrail, sortDirection, sortField],
  );

  const handleSort = (field: AuditSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "date" || field === "returnPct" ? "desc" : "asc");
    }
  };

  const handleCopyTradePlan = async () => {
    const planText = formatTradePlanText(
      asset,
      {
        portfolioCapital,
        maxRiskPct,
        entryPrice: parsedEntry,
        invalidationPrice: activeInvalidation,
      },
      sizing,
    );
    try {
      await navigator.clipboard.writeText(planText);
      setCopiedPlan(true);
      setTimeout(() => setCopiedPlan(false), 2200);
    } catch {
      // Fallback textarea copy if clipboard API is restricted
      const ta = document.createElement("textarea");
      ta.value = planText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedPlan(true);
      setTimeout(() => setCopiedPlan(false), 2200);
    }
  };

  const handleExportCsv = () => {
    const csv = buildAuditCsv(asset);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nextwallstreet-${asset.symbol.toLowerCase()}-audit-trail.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setExportedCsv(true);
    setTimeout(() => setExportedCsv(false), 2200);
  };

  const isDark = themeMode === "dark";

  // Explicit surface & text classes supporting clean Light / Dark contrast
  const shellBg = isDark
    ? "bg-zinc-950 text-zinc-100 border-zinc-800"
    : "bg-slate-50 text-slate-950 border-slate-200";
  const panelSurface = isDark
    ? "bg-zinc-900/85 border-zinc-800 text-zinc-100"
    : "bg-white border-slate-200 text-slate-900 shadow-xs";
  const insetSurface = isDark
    ? "bg-zinc-950/75 border-zinc-800"
    : "bg-slate-50/90 border-slate-200";
  const hairline = isDark ? "border-zinc-800" : "border-slate-200";
  const mutedText = isDark ? "text-zinc-400" : "text-slate-600";
  const labelText = isDark ? "text-zinc-300" : "text-slate-700";
  const inputSurface = isDark
    ? "bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-emerald-500"
    : "bg-white border-slate-300 text-slate-950 focus:border-emerald-600";

  const stanceTone = (stance: TerminalStance | string) => {
    if (stance === "INVALIDATED") {
      return isDark
        ? "text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10"
        : "text-red-700 border-red-300 bg-red-50";
    }
    if (stance === "NEUTRAL" || stance === "HOLD") {
      return isDark
        ? "text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10"
        : "text-amber-700 border-amber-300 bg-amber-50";
    }
    if (stance === "SPECULATIVE BUY") {
      return isDark
        ? "text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10"
        : "text-amber-700 border-amber-300 bg-amber-50";
    }
    return isDark
      ? "text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10"
      : "text-emerald-700 border-emerald-300 bg-emerald-50";
  };

  const riskGradeTone = (grade: TerminalAsset["riskGrade"]) => {
    if (grade === "Extreme - Hard Cap") {
      return isDark ? "text-[#EF4444]" : "text-red-700";
    }
    if (grade === "Elevated") {
      return isDark ? "text-[#F59E0B]" : "text-amber-700";
    }
    return isDark ? "text-[#10B981]" : "text-emerald-700";
  };

  // Position along 52-week range (0% - 100%)
  const range52wPct = useMemo(() => {
    const { low52w, high52w } = asset.pillars.risk;
    if (high52w <= low52w) return 50;
    return Math.max(0, Math.min(100, ((asset.price - low52w) / (high52w - low52w)) * 100));
  }, [asset]);

  return (
    <div
      data-testid="execution-risk-terminal"
      data-theme-mode={themeMode}
      className={`rounded-2xl border p-4 sm:p-6 transition-colors duration-150 ${shellBg}`}
    >
      {/* Top Terminal Header & Asset Selector Bar */}
      <div className={`border-b pb-5 ${hairline}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-medium ${mutedText}`}>NextWallStreet Quantitative Execution</span>
              <span aria-hidden="true" className={mutedText}>·</span>
              <span className={`font-mono tabular-nums ${mutedText}`}>
                3 Frameworks: Equity / Digital Asset / Speculative
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Trade Execution &amp; Risk Terminal
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setThemeMode((m) => (m === "dark" ? "light" : "dark"))}
              aria-label={isDark ? "Switch terminal to crisp light mode" : "Switch terminal to dark mode"}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${panelSurface} hover:opacity-90`}
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Asset Selector Bar across the 3 Frameworks */}
        <div
          role="tablist"
          aria-label="Live assets across frameworks"
          className="mt-4 grid gap-3 md:grid-cols-3"
        >
          {TERMINAL_ASSETS.map((baseItem) => {
            const livePx = liveQuotes[baseItem.symbol]?.price;
            const itemHasLive = Boolean(livePx && livePx > 0);
            const item = withLiveTerminalMetrics(baseItem, livePx);
            const active = item.symbol === asset.symbol;
            return (
              <button
                key={item.symbol}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`asset-selector-${item.symbol}`}
                onClick={() => handleSelectAsset(baseItem)}
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  active
                    ? isDark
                      ? "border-[#10B981] bg-zinc-900 ring-1 ring-[#10B981]/35"
                      : "border-slate-900 bg-white ring-1 ring-slate-900/15 shadow-sm"
                    : `${panelSurface} opacity-85 hover:opacity-100`
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-base font-bold tracking-tight tabular-nums">
                      {item.symbol}
                    </span>
                    <span className={`text-xs ${mutedText}`}>{item.framework}</span>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap ${stanceTone(
                      item.stance,
                    )}`}
                  >
                    {item.stance}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className={`text-[11px] ${mutedText}`}>Price</div>
                    <div className="font-mono font-semibold tabular-nums">
                      {itemHasLive ? formatAssetPrice(item.price, item.priceDecimals) : "Syncing..."}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[11px] ${mutedText}`}>Score</div>
                    <div className="font-mono font-semibold tabular-nums">
                      {item.trendScore}/100
                    </div>
                  </div>
                  <div>
                    <div className={`text-[11px] ${mutedText}`}>Invalidation</div>
                    <div className="font-mono font-semibold text-[#EF4444] tabular-nums">
                      {itemHasLive ? formatAssetPrice(item.invalidationPrice, item.priceDecimals) : "—"}
                    </div>
                  </div>
                </div>

                <div className={`mt-2 border-t pt-1.5 text-[11px] ${hairline} flex items-center justify-between`}>
                  <span className={mutedText}>Risk Grade</span>
                  <span className={`font-mono font-semibold ${riskGradeTone(item.riskGrade)}`}>
                    {item.riskGrade}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Asset Context Strip */}
        <div
          className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2 text-xs ${insetSurface}`}
        >
          <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
            <span className="font-bold">{asset.symbol}</span>
            <span className={mutedText}>{asset.name}</span>
            <span aria-hidden="true" className={mutedText}>|</span>
            <span>{asset.framework}</span>
            <span aria-hidden="true" className={mutedText}>|</span>
            <span>Price: {hasLiveSelectedQuote ? formatAssetPrice(asset.price, asset.priceDecimals) : "Syncing..."}</span>
            <span aria-hidden="true" className={mutedText}>|</span>
            <span>Trend Score: {asset.trendScore}/100</span>
            <span aria-hidden="true" className={mutedText}>|</span>
            <span>
              Invalidation:{" "}
              <span className="text-[#EF4444]">
                {hasLiveSelectedQuote ? formatAssetPrice(asset.invalidationPrice, asset.priceDecimals) : "—"}
              </span>
            </span>
          </div>
          <div className={`font-mono text-[11px] font-medium ${riskGradeTone(asset.riskGrade)}`}>
            Risk Grade: {asset.riskGrade} (Max {asset.maxRiskCapPct.toFixed(2)}% / trade)
          </div>
        </div>
      </div>

      {/* Core 3-Column Bento Grid Workspace */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)_minmax(0,1.35fr)]">
        {/* PANEL 1: Invalidation-Based Position Sizer */}
        <section
          aria-labelledby="panel-1-title"
          className={`flex flex-col justify-between rounded-xl border p-4 sm:p-5 ${panelSurface}`}
        >
          <div>
            <div className={`flex items-center justify-between border-b pb-3 ${hairline}`}>
              <div>
                <h3 id="panel-1-title" className="text-sm font-semibold">
                  01. Invalidation-Based Position Sizer
                </h3>
                <p className={`mt-0.5 text-xs ${mutedText}`}>
                  Risk-calibrated sizing anchored to model invalidation
                </p>
              </div>
              <ShieldCheck className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
            </div>

            {/* Inputs */}
            <div className="mt-4 space-y-4">
              {/* Total Portfolio Capital */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="portfolio-capital-input" className={`text-xs font-medium ${labelText}`}>
                    Total Portfolio Capital ($)
                  </label>
                  <div className="flex items-center gap-1">
                    {CAPITAL_PRESETS.map((preset) => {
                      const active = portfolioCapital === preset.value;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setPortfolioCapital(preset.value)}
                          className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap transition-colors ${
                            active
                              ? isDark
                                ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                                : "border-slate-900 bg-slate-900 text-white"
                              : `${insetSurface} ${mutedText} hover:opacity-100`
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input
                  id="portfolio-capital-input"
                  type="number"
                  min={100}
                  step={500}
                  value={portfolioCapital}
                  onChange={(e) => {
                    const val = Number.parseFloat(e.target.value);
                    setPortfolioCapital(Number.isFinite(val) ? Math.max(0, val) : 0);
                  }}
                  className={`mt-1.5 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none transition-colors ${inputSurface}`}
                />
              </div>

              {/* Max Risk Per Trade (%) */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="max-risk-slider" className={`text-xs font-medium ${labelText}`}>
                    Max Risk Per Trade (%)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      aria-label="Max Risk Per Trade numeric input"
                      type="number"
                      min={0.25}
                      max={3.0}
                      step={0.05}
                      value={maxRiskPct}
                      onChange={(e) => {
                        const val = Number.parseFloat(e.target.value);
                        if (Number.isFinite(val)) {
                          setMaxRiskPct(Math.max(0.25, Math.min(3.0, val)));
                        }
                      }}
                      className={`w-20 rounded-md border px-2 py-1 text-right font-mono text-xs font-semibold tabular-nums outline-none ${inputSurface}`}
                    />
                    <span className={`font-mono text-xs ${mutedText}`}>%</span>
                  </div>
                </div>
                <input
                  id="max-risk-slider"
                  type="range"
                  min={0.25}
                  max={3.0}
                  step={0.05}
                  value={maxRiskPct}
                  onChange={(e) => setMaxRiskPct(Number.parseFloat(e.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer accent-[#10B981]"
                />
                <div className={`mt-1 flex justify-between font-mono text-[10px] ${mutedText}`}>
                  <span>0.25%</span>
                  <span>Cap: {asset.maxRiskCapPct.toFixed(2)}% ({asset.riskGrade})</span>
                  <span>3.00%</span>
                </div>

                {sizing.exceedsRiskCap && (
                  <div
                    role="alert"
                    data-testid="risk-cap-warning"
                    className={`mt-2 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                      isDark
                        ? "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]"
                        : "border-amber-300 bg-amber-50 text-amber-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        Exceeds {asset.riskGrade} cap ({asset.maxRiskCapPct.toFixed(2)}% max)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setMaxRiskPct(asset.maxRiskCapPct)}
                      className={`rounded border px-2 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap ${
                        isDark
                          ? "border-[#F59E0B]/50 hover:bg-[#F59E0B]/20"
                          : "border-amber-400 hover:bg-amber-100"
                      }`}
                    >
                      Set {asset.maxRiskCapPct.toFixed(2)}%
                    </button>
                  </div>
                )}
              </div>

              {/* Entry Price & Model Invalidation Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="entry-price-input" className={`block text-xs font-medium ${labelText}`}>
                    Entry Price ($)
                  </label>
                  <input
                    id="entry-price-input"
                    type="number"
                    min={0}
                    step={asset.priceDecimals > 2 ? 0.0000001 : 0.01}
                    value={entryPriceInput}
                    onChange={(e) => {
                      setHasCustomEntry(true);
                      setEntryPriceInput(e.target.value);
                    }}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none transition-colors ${inputSurface}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1">
                    <label htmlFor="stop-price-input" className={`text-xs font-medium ${labelText}`}>
                      Invalidation ($)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStopEnabled((prev) => {
                          const next = !prev;
                          if (!next) {
                            setStopPriceInput(asset.invalidationPrice.toFixed(asset.priceDecimals));
                          }
                          return next;
                        });
                      }}
                      className={`inline-flex items-center gap-1 font-mono text-[10px] font-medium whitespace-nowrap ${
                        customStopEnabled ? "text-[#F59E0B]" : "text-[#EF4444]"
                      } hover:underline`}
                      title="Toggle between locked NextWallStreet model invalidation and custom stop test"
                    >
                      {customStopEnabled ? (
                        <>
                          <Unlock className="h-3 w-3" aria-hidden="true" />
                          <span>Custom</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          <span>Model Lock</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    id="stop-price-input"
                    type="number"
                    min={0}
                    step={asset.priceDecimals > 2 ? 0.0000001 : 0.01}
                    readOnly={!customStopEnabled}
                    value={customStopEnabled ? stopPriceInput : (hasLiveSelectedQuote ? asset.invalidationPrice.toFixed(asset.priceDecimals) : "")}
                    onChange={(e) => setStopPriceInput(e.target.value)}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums outline-none transition-colors ${
                      customStopEnabled
                        ? inputSurface
                        : isDark
                          ? "bg-zinc-950/60 border-[#EF4444]/40 text-[#EF4444] cursor-not-allowed"
                          : "bg-red-50/70 border-red-200 text-red-700 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>

              {!sizing.isValid && sizing.validationMessage && (
                <div
                  role="alert"
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    isDark
                      ? "border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {sizing.validationMessage}
                </div>
              )}
            </div>

            {/* Real-Time Calculated Outputs */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <div className={`col-span-2 rounded-xl border p-3.5 ${insetSurface}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={mutedText}>Recommended Position Size</span>
                  <span className="font-mono text-[11px] text-[#10B981]">
                    {sizing.exceedsWeightCap ? `Exceeds ${asset.maxWeightCapPct}% sector cap` : "Within sector cap"}
                  </span>
                </div>
                <div
                  data-testid="output-position-dollars"
                  className="mt-1 font-mono text-2xl font-bold tracking-tight tabular-nums"
                >
                  {formatUsd(sizing.positionDollars)}
                </div>
                <div
                  data-testid="output-position-quantity"
                  className={`mt-0.5 font-mono text-xs tabular-nums ${mutedText}`}
                >
                  {formatQuantity(sizing.quantity, asset.unitLabel)}
                </div>
              </div>

              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className={`text-[11px] ${mutedText}`}>Portfolio Weight</div>
                <div
                  data-testid="output-portfolio-weight"
                  className="mt-1 font-mono text-lg font-bold tabular-nums"
                >
                  {sizing.portfolioWeightPct.toFixed(2)}%
                </div>
              </div>

              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className={`text-[11px] ${mutedText}`}>Distance to Invalidation</div>
                <div
                  data-testid="output-distance-invalidation"
                  className="mt-1 font-mono text-lg font-bold text-[#EF4444] tabular-nums"
                >
                  {sizing.distanceToInvalidationPct.toFixed(2)}%
                </div>
              </div>

              <div className={`col-span-2 flex items-center justify-between rounded-xl border p-3 ${insetSurface}`}>
                <span className={`text-xs ${mutedText}`}>Max Dollar Loss at Invalidation</span>
                <span
                  data-testid="output-max-dollar-loss"
                  className="font-mono text-base font-bold text-[#EF4444] tabular-nums"
                >
                  {formatUsd(sizing.maxDollarLoss)}
                </span>
              </div>
            </div>
          </div>

          {/* R-Multiple Target Ladder */}
          <div className={`mt-4 border-t pt-4 ${hairline}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">R-Multiple Target Ladder</span>
              <span className={`font-mono text-[11px] tabular-nums ${mutedText}`}>
                1R = {formatAssetPrice(sizing.riskPerUnit, asset.priceDecimals)}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {sizing.targets.map((target) => (
                <div key={target.multiple} className={`rounded-lg border p-2.5 ${insetSurface}`}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-[#10B981]">{target.multiple}R</span>
                    <span className={`font-mono tabular-nums ${mutedText}`}>
                      +{target.gainPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs font-semibold tabular-nums">
                    {formatAssetPrice(target.price, asset.priceDecimals)}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-[#10B981] tabular-nums">
                    +{formatUsd(target.profitDollars)}
                  </div>
                </div>
              ))}
            </div>

            {/* Horizontal visual ladder bar */}
            <div className="mt-2.5">
              <div className={`flex h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-zinc-800" : "bg-slate-200"}`}>
                <div className="w-1/4 bg-[#EF4444]" title="Invalidation (1R Risk)" />
                <div className="w-1/4 bg-[#10B981]/50" title="1R Target" />
                <div className="w-1/4 bg-[#10B981]/75" title="2R Target" />
                <div className="w-1/4 bg-[#10B981]" title="3R Target" />
              </div>
              <div className={`mt-1 flex justify-between font-mono text-[10px] tabular-nums ${mutedText}`}>
                <span>Stop (-1R)</span>
                <span>Entry</span>
                <span>1R</span>
                <span>2R</span>
                <span>3R</span>
              </div>
            </div>
          </div>
        </section>

        {/* PANEL 2: Composite Score Breakdown & What-If Simulator */}
        <section
          aria-labelledby="panel-2-title"
          className={`flex flex-col justify-between rounded-xl border p-4 sm:p-5 ${panelSurface}`}
        >
          <div>
            <div className={`flex items-center justify-between gap-2 border-b pb-3 ${hairline}`}>
              <div>
                <h3 id="panel-2-title" className="text-sm font-semibold">
                  02. Composite Score &amp; What-If Simulator
                </h3>
                <p className={`mt-0.5 text-xs ${mutedText}`}>
                  Transparent 40 / 35 / 25 model factor weights
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] tabular-nums ${insetSurface} ${mutedText}`}
              >
                {asset.confidencePct}% Confidence · {asset.confidenceLabel}
              </span>
            </div>

            {/* Composite Score Gauge */}
            <div className={`mt-4 rounded-xl border p-4 ${insetSurface}`}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className={`text-xs ${mutedText}`}>
                    {whatIfDeltaPct === 0 ? "Live Composite Score" : "Scenario Composite Score"}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span
                      data-testid="composite-score-value"
                      className={`font-mono text-4xl font-bold tracking-tight tabular-nums ${
                        whatIf.isInvalidated
                          ? "text-[#EF4444]"
                          : whatIf.compositeScore >= 60
                            ? "text-[#10B981]"
                            : "text-[#F59E0B]"
                      }`}
                    >
                      {whatIf.compositeScore}
                    </span>
                    <span className={`font-mono text-sm ${mutedText}`}>/ 100</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-[11px] ${mutedText}`}>Model Stance</div>
                  <div
                    data-testid="simulated-stance-badge"
                    className={`mt-1 inline-block rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${stanceTone(
                      whatIf.stance,
                    )}`}
                  >
                    {whatIf.stance}
                  </div>
                </div>
              </div>

              {/* Score Gauge Track with 60 Threshold Marker */}
              <div className="relative mt-3">
                <div className={`h-2.5 w-full overflow-hidden rounded-full ${isDark ? "bg-zinc-800" : "bg-slate-200"}`}>
                  <div
                    className={`h-full transition-all duration-150 ${
                      whatIf.isInvalidated
                        ? "bg-[#EF4444]"
                        : whatIf.compositeScore >= 60
                          ? "bg-[#10B981]"
                          : "bg-[#F59E0B]"
                    }`}
                    style={{ width: `${whatIf.compositeScore}%` }}
                  />
                </div>
                <div
                  className="absolute top-0 h-2.5 w-0.5 bg-zinc-400"
                  style={{ left: "60%" }}
                  title="60-pt Neutral Threshold"
                />
                <div className={`mt-1.5 flex justify-between font-mono text-[10px] tabular-nums ${mutedText}`}>
                  <span>0 (Invalidated)</span>
                  <span>60 (Neutral Threshold)</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* 3-Pillar Breakdown */}
            <div className="mt-4 space-y-3">
              {/* Structure (40%) */}
              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    1. Structure <span className={`font-mono font-normal ${mutedText}`}>(40% weight)</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {whatIf.structureScore}/100
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
                  {asset.pillars.structure.smas.map((sma) => {
                    const above = whatIf.simulatedPrice >= sma.value;
                    return (
                      <div key={sma.period} className={`rounded border px-2 py-1.5 ${hairline}`}>
                        <div className={`flex items-center justify-between ${mutedText}`}>
                          <span>{sma.period}</span>
                          {sma.direction === "up" ? (
                            <ArrowUpRight className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                          ) : sma.direction === "down" ? (
                            <ArrowDownRight className="h-3 w-3 text-[#EF4444]" aria-hidden="true" />
                          ) : (
                            <Minus className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />
                          )}
                        </div>
                        <div className="mt-0.5 font-mono font-semibold tabular-nums">
                          {formatAssetPrice(sma.value, asset.priceDecimals)}
                        </div>
                        <div
                          className={`font-mono text-[10px] tabular-nums ${
                            above ? "text-[#10B981]" : "text-[#EF4444]"
                          }`}
                        >
                          {above ? "Above" : "Below"} ({sma.slopePct >= 0 ? "+" : ""}
                          {sma.slopePct.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Momentum (35%) */}
              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    2. Momentum <span className={`font-mono font-normal ${mutedText}`}>(35% weight)</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {whatIf.momentumScore}/100
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className={`text-[11px] ${mutedText}`}>30-Session ROC</div>
                    <div className="font-mono font-semibold text-[#10B981] tabular-nums">
                      +{(asset.pillars.momentum.roc30dPct + whatIfDeltaPct * 0.85).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className={`text-[11px] ${mutedText}`}>RSI(14) Persistence</div>
                    <div className="font-mono font-semibold tabular-nums">
                      {Math.max(15, Math.min(92, asset.pillars.momentum.rsi14 + whatIfDeltaPct * 0.9)).toFixed(1)}{" "}
                      <span className={`text-[10px] font-normal ${mutedText}`}>
                        · {asset.pillars.momentum.rsiZoneLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk & Volatility (25%) */}
              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    3. Risk &amp; Volatility <span className={`font-mono font-normal ${mutedText}`}>(25% weight)</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {whatIf.riskScore}/100
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className={mutedText}>60D Realized Volatility</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {asset.pillars.risk.realizedVolPct.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between font-mono text-[10px] tabular-nums">
                    <span className={mutedText}>
                      52W Low: {formatAssetPrice(asset.pillars.risk.low52w, asset.priceDecimals)}
                    </span>
                    <span className="font-semibold">{range52wPct.toFixed(0)}% pct</span>
                    <span className={mutedText}>
                      High: {formatAssetPrice(asset.pillars.risk.high52w, asset.priceDecimals)}
                    </span>
                  </div>
                  <div className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-zinc-800" : "bg-slate-200"}`}>
                    <div
                      className="h-full bg-zinc-400"
                      style={{ width: `${range52wPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive What-If Price Simulator */}
          <div className={`mt-4 border-t pt-4 ${hairline}`}>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="whatif-price-slider" className="text-xs font-semibold">
                What-If Price Simulator (-20% to +20%)
              </label>
              <button
                type="button"
                onClick={() => setWhatIfDeltaPct(0)}
                disabled={whatIfDeltaPct === 0}
                className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                  whatIfDeltaPct === 0 ? `${mutedText} opacity-50` : "text-[#10B981] hover:underline"
                }`}
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset (0%)</span>
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between font-mono text-xs tabular-nums">
              <span className={whatIfDeltaPct >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                {whatIfDeltaPct >= 0 ? "+" : ""}
                {whatIfDeltaPct.toFixed(1)}% move
              </span>
              <span data-testid="whatif-simulated-price" className="font-bold">
                Scenario Price: {formatAssetPrice(whatIf.simulatedPrice, asset.priceDecimals)}
              </span>
            </div>

            <input
              id="whatif-price-slider"
              type="range"
              min={-20}
              max={20}
              step={0.5}
              value={whatIfDeltaPct}
              onChange={(e) => setWhatIfDeltaPct(Number.parseFloat(e.target.value))}
              className="mt-2 h-1.5 w-full cursor-pointer accent-[#F59E0B]"
            />

            <div className={`mt-2.5 grid grid-cols-2 gap-2 rounded-lg border p-2.5 text-[11px] ${insetSurface}`}>
              <div>
                <div className={mutedText}>Score &lt; 60 Downgrade (NEUTRAL)</div>
                <div className="mt-0.5 font-mono font-semibold text-[#F59E0B] tabular-nums">
                  {formatAssetPrice(whatIf.neutralDowngradePrice, asset.priceDecimals)} (
                  {whatIf.neutralDowngradePct.toFixed(1)}%)
                </div>
              </div>
              <div className="text-right">
                <div className={mutedText}>Hard Invalidation Line</div>
                <div className="mt-0.5 font-mono font-semibold text-[#EF4444] tabular-nums">
                  {formatAssetPrice(asset.invalidationPrice, asset.priceDecimals)} (
                  {whatIf.invalidationPct.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PANEL 3: Historical Signal & Invalidation Audit Trail */}
        <section
          aria-labelledby="panel-3-title"
          className={`flex flex-col justify-between rounded-xl border p-4 sm:p-5 ${panelSurface}`}
        >
          <div>
            <div className={`flex items-center justify-between border-b pb-3 ${hairline}`}>
              <div>
                <h3 id="panel-3-title" className="text-sm font-semibold">
                  03. Signal &amp; Invalidation Audit Trail
                </h3>
                <p className={`mt-0.5 text-xs ${mutedText}`}>
                  Historical model verification &amp; compliance log for {asset.symbol}
                </p>
              </div>
              <ShieldAlert className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
            </div>

            {/* Performance Summary Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-2">
              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className={`text-[11px] ${mutedText}`}>Win Rate Pre-Invalidation</div>
                <div className="mt-1 font-mono text-lg font-bold text-[#10B981] tabular-nums">
                  {asset.performanceSummary.winRatePct.toFixed(1)}%
                </div>
              </div>

              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className={`text-[11px] ${mutedText}`}>Profit Factor</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums">
                  {asset.performanceSummary.profitFactor.toFixed(2)}
                </div>
              </div>

              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className={`text-[11px] ${mutedText}`}>Avg Gain (Valid Trends)</div>
                <div className="mt-1 font-mono text-base font-bold text-[#10B981] tabular-nums">
                  +{asset.performanceSummary.avgGainPct.toFixed(1)}%
                </div>
              </div>

              <div className={`rounded-xl border p-3 ${insetSurface}`}>
                <div className={`text-[11px] ${mutedText}`}>Avg Loss (Invalidated)</div>
                <div className="mt-1 font-mono text-base font-bold text-[#EF4444] tabular-nums">
                  {asset.performanceSummary.avgLossPct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Compact Sortable Signal Log Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-inherit">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className={`border-b text-[11px] ${hairline} ${insetSurface}`}>
                    {(
                      [
                        { field: "date", label: "Date", title: "Signal Date", align: "left" },
                        { field: "stance", label: "Stance", title: "Signal Stance", align: "left" },
                        { field: "entryPrice", label: "Entry", title: "Entry Price", align: "right" },
                        { field: "invalidationLevel", label: "Inv. Level", title: "Invalidation Level", align: "right" },
                        { field: "outcome", label: "Outcome", title: "Outcome (Valid / Invalidated)", align: "left" },
                        { field: "returnPct", label: "Return (%)", title: "Return (%)", align: "right" },
                      ] as const
                    ).map((col) => (
                      <th key={col.field} className={`px-2 py-2.5 font-medium ${mutedText}`} title={col.title}>
                        <button
                          type="button"
                          onClick={() => handleSort(col.field)}
                          className={`inline-flex items-center gap-1 whitespace-nowrap hover:opacity-80 ${
                            col.align === "right" ? "ml-auto justify-end w-full" : ""
                          }`}
                        >
                          <span>{col.label}</span>
                          <ArrowUpDown className="h-3 w-3 opacity-65 shrink-0" aria-hidden="true" />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {sortedAudit.map((row) => (
                    <tr
                      key={row.id}
                      data-testid="audit-trail-row"
                      className={isDark ? "hover:bg-zinc-800/40" : "hover:bg-slate-50"}
                    >
                      <td className="px-2 py-2.5 font-mono text-[11px] whitespace-nowrap tabular-nums">
                        {row.date}
                      </td>
                      <td className="px-2 py-2.5 font-mono text-[11px] font-semibold whitespace-nowrap">
                        <span
                          className={
                            row.stance === "HOLD"
                              ? "text-[#F59E0B]"
                              : row.stance === "SPECULATIVE BUY"
                                ? "text-[#F59E0B]"
                                : "text-[#10B981]"
                          }
                        >
                          {row.stance === "SPECULATIVE BUY" ? "SPEC BUY" : row.stance}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-[11px] whitespace-nowrap tabular-nums">
                        {formatAssetPrice(row.entryPrice, asset.priceDecimals)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-[11px] text-[#EF4444] whitespace-nowrap tabular-nums">
                        {formatAssetPrice(row.invalidationLevel, asset.priceDecimals)}
                      </td>
                      <td className="px-2 py-2.5 font-mono text-[11px] whitespace-nowrap">
                        <span
                          className={
                            row.outcome === "Valid" ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"
                          }
                        >
                          {row.outcome}
                        </span>
                      </td>
                      <td
                        className={`px-2 py-2.5 text-right font-mono text-[11px] font-bold whitespace-nowrap tabular-nums ${
                          row.returnPct >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                        }`}
                      >
                        {row.returnPct >= 0 ? "+" : ""}
                        {row.returnPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pre-Execution Risk Compliance Summary */}
            <div className={`mt-4 rounded-xl border p-3.5 ${insetSurface}`}>
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Execution Compliance Summary</span>
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    sizing.isValid && !sizing.exceedsRiskCap ? "text-[#10B981]" : "text-[#F59E0B]"
                  }`}
                >
                  {sizing.isValid && !sizing.exceedsRiskCap ? "CHECKS PASSED" : "REVIEW GUARDRAILS"}
                </span>
              </div>
              <div className={`mt-2.5 space-y-1.5 border-t pt-2.5 text-xs ${hairline}`}>
                <div className="flex items-center justify-between">
                  <span className={mutedText}>Order Notional / Qty</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {formatUsd(sizing.positionDollars)} ({formatQuantity(sizing.quantity, asset.unitLabel)})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={mutedText}>Hard Stop Policy ({asset.riskGrade})</span>
                  <span className="font-mono font-semibold text-[#EF4444] tabular-nums">
                    {formatAssetPrice(activeInvalidation, asset.priceDecimals)} ({sizing.distanceToInvalidationPct.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={mutedText}>Risk Cap Allocation</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      sizing.exceedsRiskCap ? "text-[#F59E0B]" : "text-[#10B981]"
                    }`}
                  >
                    {maxRiskPct.toFixed(2)}% / {asset.maxRiskCapPct.toFixed(2)}% max
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className={`mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t pt-4 ${hairline}`}>
            <button
              type="button"
              onClick={handleCopyTradePlan}
              data-testid="copy-trade-plan-btn"
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                copiedPlan
                  ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                  : isDark
                    ? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                    : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {copiedPlan ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copied Trade Plan</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy Trade Plan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              data-testid="export-audit-csv-btn"
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                exportedCsv
                  ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                  : `${insetSurface} hover:opacity-90`
              }`}
            >
              {exportedCsv ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Exported CSV</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Export Audit CSV</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
