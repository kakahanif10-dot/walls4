"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, Search, ArrowUpDown } from "lucide-react";
import InstitutionalToolShell from "./tool-shell";
import {
  SEC_CIK_MAP,
  computeDcfModel,
  computeWacc,
  formatCompactCurrency,
  type TechnicalCandle,
  type TechnicalIndicators,
} from "@/lib/institutional-tools-data";

function useSharedStyles(isLight: boolean) {
  return {
    card: isLight ? "bg-white text-slate-900" : "bg-ink-950/75 text-zinc-100",
    subCard: isLight ? "bg-slate-50 text-slate-900" : "bg-ink-900/65 text-zinc-100",
    muted: isLight ? "text-slate-500" : "text-zinc-400",
    input: isLight
      ? "bg-slate-50 text-slate-900 focus:ring-1 focus:ring-emerald-600/40"
      : "bg-ink-900/90 text-zinc-100 focus:ring-1 focus:ring-emerald-500/40",
    rowHover: isLight ? "hover:bg-slate-100/70" : "hover:bg-ink-900/50",
    thBg: isLight ? "bg-slate-100 text-slate-600" : "bg-ink-900/90 text-zinc-400",
  };
}

// ---------------------------------------------------------------------------
// 1. BLOOMBERG TERMINAL DESK
// ---------------------------------------------------------------------------
interface BloombergData {
  sources: string[];
  asOf: string;
  equities: Array<{ symbol: string; price: number; changePct: number; volume: number }>;
  yieldCurve: Array<{ tenor: string; yieldPct: number; changeBps: number }>;
  crypto: Array<{ symbol: string; price: number; changePct: number; volumeUsd: number }>;
  fx: Array<{ pair: string; rate: number }>;
  headlines: Array<{ time: string; source: string; headline: string; url: string }>;
}

export function BloombergDeskView() {
  const [data, setData] = useState<BloombergData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [command, setCommand] = useState("NVDA");

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/institutional-feed?tool=bloomberg-desk", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Live feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live Bloomberg feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const spread2s10s = useMemo(() => {
    if (!data?.yieldCurve?.length) return null;
    const y3m = data.yieldCurve.find((y) => y.tenor === "US 3M")?.yieldPct ?? 0;
    const y10 = data.yieldCurve.find((y) => y.tenor === "US 10Y")?.yieldPct ?? 0;
    return (y10 - y3m) * 100;
  }, [data]);

  return (
    <InstitutionalToolShell
      slug="bloomberg-desk"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const s = useSharedStyles(isLight);
        return (
          <div className="space-y-5">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live terminal data temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
            {/* Terminal Command Line */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (command.trim()) {
                  window.location.href = `/ticker/${encodeURIComponent(command.trim().toUpperCase())}`;
                }
              }}
              className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl p-3.5 ${s.card}`}
            >
              <label htmlFor="bbg-cmd" className="font-mono text-xs font-semibold text-amber-500 whitespace-nowrap shrink-0">
                COMMAND &lt;GO&gt;
              </label>
              <input
                id="bbg-cmd"
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value.toUpperCase())}
                placeholder="Enter ticker symbol (NVDA, AAPL, BTC, SOL)..."
                className={`flex-1 rounded-xl px-3 py-2 font-mono text-xs uppercase outline-none ${s.input}`}
              />
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
              >
                Load Security &lt;GO&gt;
              </button>
            </form>

            {/* 3-Column Bento Grid: Equities | Fixed Income & FX | Crypto & Wire */}
            <div className="grid gap-5 lg:grid-cols-12">
              {/* Equities Monitor */}
              <div className={`lg:col-span-5 rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">US Equities &amp; Benchmarks</h3>
                  <span className={`font-mono text-[11px] ${s.muted}`}>Yahoo Live</span>
                </div>
                <div className={`overflow-x-auto rounded-xl p-2 ${s.subCard}`}>
                  <table className="w-full text-xs border-separate border-spacing-y-1 font-mono tabular-nums">
                    <thead>
                      <tr className={s.thBg}>
                        <th className="py-2 px-3 text-left font-medium rounded-l-lg">Ticker</th>
                        <th className="py-2 px-3 text-right font-medium">Last</th>
                        <th className="py-2 px-3 text-right font-medium">Chg %</th>
                        <th className="py-2 px-3 text-right font-medium rounded-r-lg">Vol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.equities ?? []).map((eq) => (
                        <tr key={eq.symbol} className={`transition-colors ${s.rowHover}`}>
                          <td className="py-2 px-3 font-semibold rounded-l-lg">
                            <Link href={`/ticker/${eq.symbol}`} className="hover:text-emerald-500">
                              {eq.symbol}
                            </Link>
                          </td>
                          <td className="py-2 px-3 text-right">${eq.price.toFixed(2)}</td>
                          <td
                            className={`py-2 px-3 text-right font-medium ${
                              eq.changePct >= 0 ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            {eq.changePct >= 0 ? "+" : ""}
                            {eq.changePct.toFixed(2)}%
                          </td>
                          <td className={`py-2 px-3 text-right rounded-r-lg ${s.muted}`}>
                            {(eq.volume / 1e6).toFixed(1)}M
                          </td>
                        </tr>
                      ))}
                      {!data?.equities?.length && (
                        <tr>
                          <td colSpan={4} className={`py-6 text-center ${s.muted}`}>
                            {loading ? "Syncing equity feed..." : "Live equity feed unavailable."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* US Treasury Yield Curve & ECB FX */}
              <div className={`lg:col-span-4 rounded-xl p-4 sm:p-5 space-y-4 ${s.card}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">US Treasury Yield Curve</h3>
                  {spread2s10s !== null && (
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        spread2s10s >= 0 ? "text-emerald-500" : "text-amber-500"
                      }`}
                    >
                      10Y–3M: {spread2s10s >= 0 ? "+" : ""}
                      {spread2s10s.toFixed(0)} bps
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {(data?.yieldCurve ?? []).length > 0 ? (
                    (data?.yieldCurve ?? []).map((y) => (
                      <div key={y.tenor} className={`rounded-xl p-3 ${s.subCard}`}>
                        <div className={`text-[11px] ${s.muted}`}>{y.tenor}</div>
                        <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                          {y.yieldPct.toFixed(2)}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`col-span-2 rounded-xl p-4 text-center text-xs ${s.subCard} ${s.muted}`}>
                      {loading ? "Syncing US Treasury yields..." : "Live Treasury curve unavailable."}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold">ECB Spot FX Crosses</h4>
                    <span className={`font-mono text-[11px] ${s.muted}`}>Frankfurter</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs tabular-nums">
                    {(data?.fx ?? []).length > 0 ? (
                      (data?.fx ?? []).map((f) => (
                        <div key={f.pair} className="flex items-center justify-between">
                          <span className={s.muted}>{f.pair}</span>
                          <span className="font-medium">{f.rate.toFixed(4)}</span>
                        </div>
                      ))
                    ) : (
                      <div className={`col-span-2 text-xs ${s.muted}`}>
                        {loading ? "Syncing ECB FX rates..." : "Live FX feed unavailable."}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Digital Spot & SEC Wire */}
              <div className={`lg:col-span-3 rounded-xl p-4 sm:p-5 space-y-4 ${s.card}`}>
                <div>
                  <h3 className="text-sm font-semibold mb-2.5">24/7 Crypto Benchmark</h3>
                  <div className="space-y-2">
                    {(data?.crypto ?? []).length > 0 ? (
                      (data?.crypto ?? []).map((c) => (
                        <div
                          key={c.symbol}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 font-mono text-xs tabular-nums ${s.subCard}`}
                        >
                          <span className="font-semibold">{c.symbol}/USD</span>
                          <div className="text-right">
                            <div>${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                            <div className={c.changePct >= 0 ? "text-emerald-500" : "text-rose-500"}>
                              {c.changePct >= 0 ? "+" : ""}
                              {c.changePct.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`rounded-xl p-3 text-center text-xs ${s.subCard} ${s.muted}`}>
                        {loading ? "Syncing crypto benchmark..." : "Live crypto feed unavailable."}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-semibold mb-2">SEC EDGAR Regulatory Wire</h4>
                  <div className="space-y-2">
                    {(data?.headlines ?? []).length > 0 ? (
                      (data?.headlines ?? []).slice(0, 4).map((h, i) => (
                        <a
                          key={i}
                          href={h.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block rounded-xl p-2.5 text-xs transition-colors ${s.subCard} hover:opacity-90`}
                        >
                          <div className={`flex items-center justify-between text-[10px] font-mono ${s.muted}`}>
                            <span>{h.source}</span>
                            <span>{h.time}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 leading-snug">{h.headline}</p>
                        </a>
                      ))
                    ) : (
                      <div className={`rounded-xl p-3 text-center text-xs ${s.subCard} ${s.muted}`}>
                        {loading ? "Syncing SEC EDGAR filings..." : "SEC EDGAR wire unavailable."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

// ---------------------------------------------------------------------------
// 2. MICROSOFT EXCEL DCF & SENSITIVITY WORKBOOK
// ---------------------------------------------------------------------------
interface ExcelDcfSeed {
  sources: string[];
  asOf: string;
  symbol: string;
  companyName: string;
  sector: string;
  currentPriceUsd: number;
  riskFreeRatePct: number;
  revenueM: number;
  ebitdaMarginPct: number;
  netDebtM: number;
  sharesOutM: number;
}

export function ExcelDcfView() {
  const [symbol, setSymbol] = useState("NVDA");
  const [seed, setSeed] = useState<ExcelDcfSeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedError, setSeedError] = useState<string | null>(null);

  // Editable Spreadsheet Cells (seeded exclusively from live SEC EDGAR + Yahoo + Treasury APIs)
  const [baseRevenueM, setBaseRevenueM] = useState<number | null>(null);
  const [revenueGrowthPct, setRevenueGrowthPct] = useState(24);
  const [ebitdaMarginPct, setEbitdaMarginPct] = useState<number | null>(null);
  const [taxRatePct, setTaxRatePct] = useState(16);
  const [daPctOfRev, setDaPctOfRev] = useState(2.5);
  const [capexPctOfRev, setCapexPctOfRev] = useState(3.5);
  const [nwcPctOfRev, setNwcPctOfRev] = useState(2.0);
  const [riskFreeRatePct, setRiskFreeRatePct] = useState<number | null>(null);
  const [equityRiskPremiumPct, setEquityRiskPremiumPct] = useState(5.0);
  const [beta, setBeta] = useState(1.45);
  const [costOfDebtPct, setCostOfDebtPct] = useState(5.2);
  const [debtWeightPct, setDebtWeightPct] = useState(3.0);
  const [terminalGrowthPct, setTerminalGrowthPct] = useState(3.5);
  const [netDebtM, setNetDebtM] = useState<number | null>(null);
  const [sharesOutM, setSharesOutM] = useState<number | null>(null);
  const [currentPriceUsd, setCurrentPriceUsd] = useState<number | null>(null);

  const load = useCallback(async (sym: string) => {
    setLoading(true);
    setSeedError(null);
    try {
      const res = await fetch(`/api/institutional-feed?tool=excel-dcf&symbol=${encodeURIComponent(sym)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `Live DCF feed error (${res.status})`);
      }
      const d = (await res.json()) as ExcelDcfSeed;
      setSeed(d);
      setBaseRevenueM(d.revenueM);
      setEbitdaMarginPct(d.ebitdaMarginPct);
      setRiskFreeRatePct(d.riskFreeRatePct);
      setNetDebtM(d.netDebtM);
      setSharesOutM(d.sharesOutM);
      setCurrentPriceUsd(d.currentPriceUsd);
    } catch (err) {
      setSeed(null);
      setSeedError(err instanceof Error ? err.message : "Live fundamentals unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(symbol);
  }, [load, symbol]);

  const wacc = useMemo(() => {
    if (riskFreeRatePct === null) return null;
    return computeWacc({
      riskFreeRatePct,
      equityRiskPremiumPct,
      beta,
      costOfDebtPct,
      taxRatePct,
      debtWeightPct,
    });
  }, [riskFreeRatePct, equityRiskPremiumPct, beta, costOfDebtPct, taxRatePct, debtWeightPct]);

  const dcf = useMemo(() => {
    if (
      wacc === null ||
      baseRevenueM === null ||
      ebitdaMarginPct === null ||
      netDebtM === null ||
      sharesOutM === null ||
      currentPriceUsd === null
    ) {
      return null;
    }
    return computeDcfModel({
      baseRevenueM,
      revenueGrowthPct,
      ebitdaMarginPct,
      taxRatePct,
      daPctOfRev,
      capexPctOfRev,
      nwcPctOfRev,
      waccPct: wacc.waccPct,
      terminalGrowthPct,
      netDebtM,
      sharesOutM,
      currentPriceUsd,
    });
  }, [
    baseRevenueM,
    revenueGrowthPct,
    ebitdaMarginPct,
    taxRatePct,
    daPctOfRev,
    capexPctOfRev,
    nwcPctOfRev,
    wacc,
    terminalGrowthPct,
    netDebtM,
    sharesOutM,
    currentPriceUsd,
  ]);

  const handleExportCsv = () => {
    if (!dcf || !wacc || netDebtM === null) return;
    const rows = [
      ["NextWallStreet Excel DCF Model", symbol, seed?.companyName ?? symbol],
      ["Metric", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
      ["Revenue ($M)", ...dcf.projections.map((p) => p.revenueM.toFixed(1))],
      ["EBITDA ($M)", ...dcf.projections.map((p) => p.ebitdaM.toFixed(1))],
      ["NOPAT ($M)", ...dcf.projections.map((p) => p.nopatM.toFixed(1))],
      ["Unlevered FCF ($M)", ...dcf.projections.map((p) => p.ufcfM.toFixed(1))],
      ["PV of FCF ($M)", ...dcf.projections.map((p) => p.pvFcfM.toFixed(1))],
      [],
      ["WACC (%)", wacc.waccPct.toFixed(2)],
      ["Enterprise Value ($M)", dcf.enterpriseValueM.toFixed(1)],
      ["Less Net Debt ($M)", netDebtM.toFixed(1)],
      ["Implied Equity Value ($M)", dcf.equityValueM.toFixed(1)],
      ["Implied Share Price ($)", dcf.impliedSharePriceUsd.toFixed(2)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${symbol}-DCF-Model.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <InstitutionalToolShell
      slug="excel-dcf"
      asOf={seed?.asOf}
      activeSources={seed?.sources}
      loading={loading}
      onRefresh={() => load(symbol)}
      toolbarExtra={
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={!dcf}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Export Excel CSV</span>
        </button>
      }
    >
      {({ isLight }) => {
        const s = useSharedStyles(isLight);
        const tickers = ["NVDA", "AAPL", "MSFT", "AMZN", "META", "GOOGL", "TSLA", "AMD"];

        return (
          <div className="space-y-5">
            {/* Ticker Quick Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {tickers.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSymbol(t)}
                    className={`rounded-xl px-3 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      symbol === t
                        ? "bg-emerald-500/20 text-emerald-400"
                        : `${s.subCard} ${s.muted}`
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className={`text-xs font-mono tabular-nums ${s.muted}`}>
                {seed?.companyName ?? symbol} · Spot{" "}
                {currentPriceUsd !== null ? `$${currentPriceUsd.toFixed(2)}` : "—"} · 10Y Rf{" "}
                {riskFreeRatePct !== null ? `${riskFreeRatePct.toFixed(2)}%` : "—"}
              </div>
            </div>

            {seedError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live SEC EDGAR / market fundamentals temporarily unavailable ({seedError}).</span>
                <button
                  type="button"
                  onClick={() => void load(symbol)}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-12">
              {/* Left Column: Excel Assumption Cells */}
              <div className={`lg:col-span-4 rounded-xl p-4 sm:p-5 space-y-4 ${s.card}`}>
                <h3 className="text-sm font-semibold">Operating &amp; WACC Assumptions</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {(
                    [
                      { label: "Base Rev ($M)", val: baseRevenueM, set: (v: number) => setBaseRevenueM(v), step: 100 },
                      { label: "Rev Growth (%)", val: revenueGrowthPct, set: setRevenueGrowthPct, step: 0.5 },
                      { label: "EBITDA Margin (%)", val: ebitdaMarginPct, set: (v: number) => setEbitdaMarginPct(v), step: 0.5 },
                      { label: "Tax Rate (%)", val: taxRatePct, set: setTaxRatePct, step: 0.5 },
                      { label: "D&A (% Rev)", val: daPctOfRev, set: setDaPctOfRev, step: 0.2 },
                      { label: "CapEx (% Rev)", val: capexPctOfRev, set: setCapexPctOfRev, step: 0.2 },
                      { label: "NWC (% ΔRev)", val: nwcPctOfRev, set: setNwcPctOfRev, step: 0.2 },
                      { label: "Term. Growth (%)", val: terminalGrowthPct, set: setTerminalGrowthPct, step: 0.25 },
                      { label: "10Y Risk-Free (%)", val: riskFreeRatePct, set: (v: number) => setRiskFreeRatePct(v), step: 0.1 },
                      { label: "Equity Risk Prem (%)", val: equityRiskPremiumPct, set: setEquityRiskPremiumPct, step: 0.25 },
                      { label: "CAPM Beta", val: beta, set: setBeta, step: 0.05 },
                      { label: "Debt Weight (%)", val: debtWeightPct, set: setDebtWeightPct, step: 1 },
                    ] as const
                  ).map((cell) => (
                    <label key={cell.label} className="space-y-1 block">
                      <span className={`block text-[11px] ${s.muted}`}>{cell.label}</span>
                      <input
                        type="number"
                        step={cell.step}
                        value={cell.val ?? ""}
                        placeholder={loading ? "…" : "—"}
                        onChange={(e) => cell.set(Number(e.target.value) || 0)}
                        className={`w-full rounded-xl px-2.5 py-2 font-mono text-xs tabular-nums outline-none ${s.input}`}
                      />
                    </label>
                  ))}
                </div>

                <div className="pt-2 space-y-1.5 font-mono text-xs tabular-nums">
                  <div className="flex justify-between">
                    <span className={s.muted}>Cost of Equity (CAPM)</span>
                    <span>{wacc ? `${wacc.costOfEquityPct.toFixed(2)}%` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={s.muted}>After-Tax Cost of Debt</span>
                    <span>{wacc ? `${wacc.afterTaxCostOfDebtPct.toFixed(2)}%` : "—"}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-500">
                    <span>Computed WACC</span>
                    <span>{wacc ? `${wacc.waccPct.toFixed(2)}%` : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Valuation Output + 5-Year Sheet + 5x5 Sensitivity */}
              <div className="lg:col-span-8 space-y-5">
                {/* Headline Valuation Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`rounded-xl p-3.5 ${s.card}`}>
                    <div className={`text-[11px] ${s.muted}`}>Implied Share Price</div>
                    <div className="mt-1 font-mono text-xl font-semibold text-emerald-500 tabular-nums">
                      {dcf ? `$${dcf.impliedSharePriceUsd.toFixed(2)}` : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3.5 ${s.card}`}>
                    <div className={`text-[11px] ${s.muted}`}>Implied Upside</div>
                    <div
                      className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
                        (dcf?.upsidePct ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {dcf && dcf.upsidePct !== null
                        ? `${dcf.upsidePct >= 0 ? "+" : ""}${dcf.upsidePct.toFixed(1)}%`
                        : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3.5 ${s.card}`}>
                    <div className={`text-[11px] ${s.muted}`}>Enterprise Value</div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
                      {dcf ? formatCompactCurrency(dcf.enterpriseValueM * 1e6) : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3.5 ${s.card}`}>
                    <div className={`text-[11px] ${s.muted}`}>PV of TV / EV</div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
                      {dcf ? `${dcf.tvShareOfEvPct.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </div>

                {/* 5-Year Unlevered Free Cash Flow Sheet */}
                <div className={`rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
                  <h3 className="text-sm font-semibold">5-Year Unlevered Free Cash Flow Schedule ($M)</h3>
                  {!dcf ? (
                    <div className={`rounded-xl p-6 text-center text-xs font-mono ${s.subCard} ${s.muted}`}>
                      {loading ? "Syncing live SEC EDGAR financial schedule..." : "Live DCF cash-flow schedule unavailable."}
                    </div>
                  ) : (
                  <div className={`overflow-x-auto rounded-xl p-2 ${s.subCard}`}>
                    <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                      <thead>
                        <tr className={s.thBg}>
                          <th className="py-2 px-3 text-left font-medium rounded-l-lg">Line Item ($M)</th>
                          {dcf.projections.map((p, idx) => (
                            <th key={p.year} className={`py-2 px-3 text-right font-medium ${idx === dcf.projections.length - 1 ? "rounded-r-lg" : ""}`}>
                              FY+{p.year}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={`transition-colors ${s.rowHover}`}>
                          <td className="py-2 px-3 font-sans font-medium rounded-l-lg">Revenue</td>
                          {dcf.projections.map((p, idx) => (
                            <td key={p.year} className={`py-2 px-3 text-right ${idx === dcf.projections.length - 1 ? "rounded-r-lg" : ""}`}>
                              {Math.round(p.revenueM).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className={`transition-colors ${s.rowHover}`}>
                          <td className="py-2 px-3 font-sans font-medium rounded-l-lg">EBITDA</td>
                          {dcf.projections.map((p, idx) => (
                            <td key={p.year} className={`py-2 px-3 text-right ${idx === dcf.projections.length - 1 ? "rounded-r-lg" : ""}`}>
                              {Math.round(p.ebitdaM).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className={`transition-colors ${s.rowHover}`}>
                          <td className="py-2 px-3 font-sans font-medium rounded-l-lg">NOPAT</td>
                          {dcf.projections.map((p, idx) => (
                            <td key={p.year} className={`py-2 px-3 text-right ${idx === dcf.projections.length - 1 ? "rounded-r-lg" : ""}`}>
                              {Math.round(p.nopatM).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className={`font-semibold text-emerald-500 transition-colors ${s.rowHover}`}>
                          <td className="py-2 px-3 font-sans rounded-l-lg">Unlevered FCF</td>
                          {dcf.projections.map((p, idx) => (
                            <td key={p.year} className={`py-2 px-3 text-right ${idx === dcf.projections.length - 1 ? "rounded-r-lg" : ""}`}>
                              {Math.round(p.ufcfM).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className={`transition-colors ${s.rowHover}`}>
                          <td className={`py-2 px-3 font-sans rounded-l-lg ${s.muted}`}>PV of FCF</td>
                          {dcf.projections.map((p, idx) => (
                            <td key={p.year} className={`py-2 px-3 text-right ${idx === dcf.projections.length - 1 ? "rounded-r-lg" : ""} ${s.muted}`}>
                              {Math.round(p.pvFcfM).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>

                {/* 5x5 Sensitivity Table */}
                <div className={`rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">WACC vs. Terminal Growth Sensitivity ($)</h3>
                    <span className={`font-mono text-[11px] ${s.muted}`}>Implied Equity Price / Share</span>
                  </div>
                  {!dcf || currentPriceUsd === null ? (
                    <div className={`rounded-xl p-6 text-center text-xs font-mono ${s.subCard} ${s.muted}`}>
                      {loading ? "Computing sensitivity matrix from live WACC..." : "Live sensitivity grid unavailable."}
                    </div>
                  ) : (
                  <div className={`overflow-x-auto rounded-xl p-2 ${s.subCard}`}>
                    <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                      <thead>
                        <tr className={s.thBg}>
                          <th className="py-2 px-3 text-left font-medium rounded-l-lg">WACC \ TGR</th>
                          {dcf.sensitivityGrid[0]?.cells.map((c, idx, arr) => (
                            <th key={c.terminalGrowthPct} className={`py-2 px-3 text-right font-medium ${idx === arr.length - 1 ? "rounded-r-lg" : ""}`}>
                              {c.terminalGrowthPct.toFixed(2)}%
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dcf.sensitivityGrid.map((row) => (
                          <tr key={row.waccPct} className={`transition-colors ${s.rowHover}`}>
                            <td className={`py-2 px-3 font-semibold rounded-l-lg ${s.thBg}`}>{row.waccPct.toFixed(2)}%</td>
                            {row.cells.map((cell, cIdx, arr) => {
                              const rIdx = dcf.sensitivityGrid.indexOf(row);
                              const isCenter = rIdx === 2 && cIdx === 2;
                              const aboveSpot = cell.impliedPriceUsd >= currentPriceUsd;
                              return (
                                <td
                                  key={cell.terminalGrowthPct}
                                  className={`py-2 px-3 text-right ${cIdx === arr.length - 1 ? "rounded-r-lg" : ""} ${
                                    isCenter
                                      ? "bg-emerald-500/20 text-emerald-400 font-bold"
                                      : aboveSpot
                                        ? "text-emerald-500"
                                        : "text-rose-500"
                                  }`}
                                >
                                  ${cell.impliedPriceUsd.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

// ---------------------------------------------------------------------------
// 3. S&P CAPITAL IQ & FACTSET COMPS
// ---------------------------------------------------------------------------
interface PeerRow {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  mcapM: number;
  evM: number;
  revenueM: number;
  ebitdaM: number;
  netIncomeM: number;
  evToRev: number;
  evToEbitda: number;
  peRatio: number;
  ebitdaMarginPct: number;
  liveSec: boolean;
}

export function CapitalIqCompsView() {
  const [data, setData] = useState<{ sources: string[]; asOf: string; peers: PeerRow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"mcapM" | "evToRev" | "evToEbitda" | "peRatio" | "ebitdaMarginPct">("mcapM");
  const [sortDesc, setSortDesc] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/institutional-feed?tool=capital-iq", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Live comps error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live Capital IQ peer comps unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const list = (data?.peers ?? []).filter(
      (p) =>
        !query.trim() ||
        p.symbol.toLowerCase().includes(query.toLowerCase()) ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sector.toLowerCase().includes(query.toLowerCase()),
    );
    return [...list].sort((a, b) => (sortDesc ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]));
  }, [data, query, sortBy, sortDesc]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDesc((v) => !v);
    else {
      setSortBy(col);
      setSortDesc(true);
    }
  };

  const medians = useMemo(() => {
    if (rows.length === 0) return null;
    const mid = (vals: number[]) => {
      const s = [...vals].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)];
    };
    return {
      evToRev: mid(rows.map((r) => r.evToRev)),
      evToEbitda: mid(rows.map((r) => r.evToEbitda)),
      peRatio: mid(rows.filter((r) => r.peRatio > 0).map((r) => r.peRatio)) || 0,
      margin: mid(rows.map((r) => r.ebitdaMarginPct)),
    };
  }, [rows]);

  return (
    <InstitutionalToolShell
      slug="capital-iq"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const s = useSharedStyles(isLight);
        return (
          <div className="space-y-4">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live peer valuation feed temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className={`h-4 w-4 absolute left-3 top-2.5 ${s.muted}`} aria-hidden="true" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter peers by ticker, company, or sector..."
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none ${s.input}`}
                />
              </div>
              {medians && (
                <div className={`flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums ${s.muted}`}>
                  <span>Peer Medians:</span>
                  <span>EV/Rev {medians.evToRev.toFixed(1)}×</span>
                  <span>·</span>
                  <span>EV/EBITDA {medians.evToEbitda.toFixed(1)}×</span>
                  <span>·</span>
                  <span>P/E {medians.peRatio.toFixed(1)}×</span>
                  <span>·</span>
                  <span>Margin {medians.margin.toFixed(1)}%</span>
                </div>
              )}
            </div>

            <div className={`overflow-x-auto rounded-xl p-2 ${s.card}`}>
              <table className="w-full text-xs border-separate border-spacing-y-1 font-mono tabular-nums">
                <thead>
                  <tr className={s.thBg}>
                    <th className="py-3 px-3 text-left font-sans font-semibold rounded-l-lg">Company</th>
                    <th className="py-3 px-3 text-right font-medium">Spot</th>
                    <th className="py-3 px-3 text-right font-medium">
                      <button type="button" onClick={() => toggleSort("mcapM")} className="inline-flex items-center gap-1">
                        MCap <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right font-medium">Revenue</th>
                    <th className="py-3 px-3 text-right font-medium">
                      <button type="button" onClick={() => toggleSort("evToRev")} className="inline-flex items-center gap-1">
                        EV/Rev <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right font-medium">
                      <button type="button" onClick={() => toggleSort("evToEbitda")} className="inline-flex items-center gap-1">
                        EV/EBITDA <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right font-medium">
                      <button type="button" onClick={() => toggleSort("peRatio")} className="inline-flex items-center gap-1">
                        P/E <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right font-medium rounded-r-lg">
                      <button type="button" onClick={() => toggleSort("ebitdaMarginPct")} className="inline-flex items-center gap-1">
                        EBITDA % <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.symbol} className={`transition-colors ${s.rowHover}`}>
                      <td className="py-2.5 px-3 font-sans rounded-l-lg">
                        <div className="font-semibold">
                          <Link href={`/ticker/${r.symbol}`} className="hover:text-emerald-500">
                            {r.symbol}
                          </Link>{" "}
                          <span className={`font-normal ${s.muted}`}>{r.name}</span>
                        </div>
                        <div className={`text-[11px] ${s.muted}`}>{r.sector}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div>${r.price.toFixed(2)}</div>
                        <div className={r.changePct >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {r.changePct >= 0 ? "+" : ""}
                          {r.changePct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">{formatCompactCurrency(r.mcapM * 1e6)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCompactCurrency(r.revenueM * 1e6)}</td>
                      <td className="py-2.5 px-3 text-right">{r.evToRev.toFixed(1)}×</td>
                      <td className="py-2.5 px-3 text-right">{r.evToEbitda.toFixed(1)}×</td>
                      <td className="py-2.5 px-3 text-right">{r.peRatio > 0 ? `${r.peRatio.toFixed(1)}×` : "N/M"}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-500 rounded-r-lg">
                        {r.ebitdaMarginPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className={`py-8 text-center font-sans ${s.muted}`}>
                        Querying SEC EDGAR XBRL &amp; Yahoo Finance comparable multiples...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

// ---------------------------------------------------------------------------
// 4. ALPHASENSE FILINGS & DOCUMENT SEARCH
// ---------------------------------------------------------------------------
interface FilingItem {
  form: string;
  filingDate: string;
  reportDate: string;
  description: string;
  accessionNumber: string;
  url: string;
}

export function AlphaSenseSearchView() {
  const [symbol, setSymbol] = useState("NVDA");
  const [formFilter, setFormFilter] = useState<"ALL" | "10-K" | "10-Q" | "8-K" | "4">("ALL");
  const [keyword, setKeyword] = useState("");
  const [data, setData] = useState<{
    sources: string[];
    asOf: string;
    entityName: string;
    sicDescription: string;
    exchange: string;
    filings: FilingItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async (sym: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/institutional-feed?tool=alphasense&symbol=${encodeURIComponent(sym)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `SEC EDGAR feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live SEC filings feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(symbol);
  }, [load, symbol]);

  const filtered = useMemo(() => {
    return (data?.filings ?? []).filter((f) => {
      const matchForm = formFilter === "ALL" || f.form === formFilter;
      const q = keyword.trim().toLowerCase();
      const matchKw =
        !q ||
        f.description.toLowerCase().includes(q) ||
        f.form.toLowerCase().includes(q) ||
        f.filingDate.includes(q) ||
        f.accessionNumber.includes(q);
      return matchForm && matchKw;
    });
  }, [data, formFilter, keyword]);

  return (
    <InstitutionalToolShell
      slug="alphasense"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={() => load(symbol)}
    >
      {({ isLight }) => {
        const s = useSharedStyles(isLight);
        return (
          <div className="space-y-4">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live SEC EDGAR filings feed temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load(symbol)}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.keys(SEC_CIK_MAP).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSymbol(t)}
                    className={`rounded-xl px-3 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      symbol === t
                        ? "bg-emerald-500/20 text-emerald-400"
                        : `${s.subCard} ${s.muted}`
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["ALL", "10-K", "10-Q", "8-K", "4"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormFilter(f)}
                    className={`rounded-xl px-3 py-1.5 font-mono text-xs transition-colors whitespace-nowrap shrink-0 ${
                      formFilter === f
                        ? isLight
                          ? "bg-slate-900 text-white"
                          : "bg-zinc-100 text-zinc-950 font-semibold"
                        : `${s.subCard} ${s.muted}`
                    }`}
                  >
                    {f === "ALL" ? "All Forms" : f === "4" ? "Form 4" : f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className={`h-4 w-4 absolute left-3 top-2.5 ${s.muted}`} aria-hidden="true" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search filings by form, date, accession number, or topic..."
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none ${s.input}`}
                />
              </div>
              <div className={`text-xs ${s.muted}`}>
                {data?.entityName} · {data?.sicDescription} · {data?.exchange}
              </div>
            </div>

            <div className={`overflow-x-auto rounded-xl p-2 ${s.card}`}>
              <table className="w-full text-xs border-separate border-spacing-y-1">
                <thead>
                  <tr className={s.thBg}>
                    <th className="py-2.5 px-3 text-left font-semibold rounded-l-lg">Form</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Filing Date</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Document Summary</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Accession #</th>
                    <th className="py-2.5 px-3 text-right font-semibold rounded-r-lg">Primary Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.accessionNumber} className={`transition-colors ${s.rowHover}`}>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-500 whitespace-nowrap rounded-l-lg">
                        {item.form}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                        {item.filingDate}
                      </td>
                      <td className="py-2.5 px-3 max-w-md">{item.description}</td>
                      <td className={`py-2.5 px-3 font-mono tabular-nums ${s.muted}`}>
                        {item.accessionNumber}
                      </td>
                      <td className="py-2.5 px-3 text-right rounded-r-lg">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-500 hover:underline font-medium whitespace-nowrap"
                        >
                          <span>SEC.gov</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className={`py-8 text-center ${s.muted}`}>
                        No SEC filings matched your filter. Try selecting &ldquo;All Forms&rdquo; or clearing search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

// ---------------------------------------------------------------------------
// 5. TRADINGVIEW MULTI-ASSET TECHNICAL CHART & SCREENER
// ---------------------------------------------------------------------------
interface TvData {
  sources: string[];
  asOf: string;
  symbol: string;
  price: number;
  changePct: number;
  candles: TechnicalCandle[];
  indicators: TechnicalIndicators;
  screener: Array<{
    symbol: string;
    assetClass: string;
    price: number;
    changePct: number;
    rsi14: number;
    sma20: number;
    bias: string;
  }>;
}

export function TradingViewScreenerView() {
  const [symbol, setSymbol] = useState("NVDA");
  const [data, setData] = useState<TvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async (sym: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/institutional-feed?tool=tradingview-screener&symbol=${encodeURIComponent(sym)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Live OHLCV feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live TradingView OHLCV feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(symbol);
  }, [load, symbol]);

  const chartSvg = useMemo(() => {
    const candles = data?.candles ?? [];
    if (candles.length < 5) return null;
    const width = 920;
    const height = 280;
    const padX = 16;
    const padY = 18;
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const minP = Math.min(...lows);
    const maxP = Math.max(...highs);
    const range = Math.max(1e-9, maxP - minP);
    const stepX = (width - padX * 2) / candles.length;
    const toY = (p: number) => height - padY - ((p - minP) / range) * (height - padY * 2);

    // Compute rolling 20-period SMA path
    const smaPts: string[] = [];
    candles.forEach((_, idx) => {
      const slice = candles.slice(Math.max(0, idx - 19), idx + 1);
      const avg = slice.reduce((acc, c) => acc + c.close, 0) / slice.length;
      const x = padX + idx * stepX + stepX / 2;
      smaPts.push(`${idx === 0 ? "M" : "L"}${x.toFixed(1)},${toY(avg).toFixed(1)}`);
    });

    return { width, height, padX, stepX, toY, candles, smaPath: smaPts.join(" "), minP, maxP };
  }, [data]);

  return (
    <InstitutionalToolShell
      slug="tradingview-screener"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={() => load(symbol)}
    >
      {({ isLight }) => {
        const s = useSharedStyles(isLight);
        const symbols = ["NVDA", "AAPL", "MSFT", "TSLA", "SPY", "BTC", "ETH", "SOL"];

        return (
          <div className="space-y-5">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live OHLCV candlestick feed temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load(symbol)}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
            {/* Asset Strip & Live Indicators */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {symbols.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setSymbol(sym)}
                    className={`rounded-xl px-3 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      symbol === sym
                        ? "bg-emerald-500/20 text-emerald-400"
                        : `${s.subCard} ${s.muted}`
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              {data && (
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
                  <span className="font-semibold text-base">
                    {data.symbol} ${data.price.toFixed(2)}
                  </span>
                  <span className={data.changePct >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {data.changePct >= 0 ? "+" : ""}
                    {data.changePct.toFixed(2)}%
                  </span>
                  <span className={s.muted}>RSI(14): {data.indicators.rsi14.toFixed(1)}</span>
                  <span className={s.muted}>MACD: {data.indicators.macdLine.toFixed(2)}</span>
                  <span className="font-semibold text-amber-500">{data.indicators.trendBias}</span>
                </div>
              )}
            </div>

            {/* Interactive SVG OHLC Candlestick + SMA-20 Chart */}
            <div className={`rounded-xl p-4 sm:p-5 ${s.card}`}>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold">
                  {symbol} Daily Candlestick &amp; 20-Day SMA Overlay (Live OHLCV)
                </span>
                <span className={`font-mono text-[11px] tabular-nums ${s.muted}`}>
                  SMA20: ${data?.indicators.sma20.toFixed(2) ?? "—"} · SMA50: ${data?.indicators.sma50.toFixed(2) ?? "—"}
                </span>
              </div>

              {chartSvg ? (
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${chartSvg.width} ${chartSvg.height}`}
                    className="w-full h-64"
                    role="img"
                    aria-label={`${symbol} candlestick chart`}
                  >
                    {/* Horizontal Guide Gridlines */}
                    {[0.2, 0.5, 0.8].map((frac) => {
                      const y = chartSvg.height * frac;
                      const p = chartSvg.maxP - (chartSvg.maxP - chartSvg.minP) * frac;
                      return (
                        <g key={frac}>
                          <line
                            x1={chartSvg.padX}
                            x2={chartSvg.width - chartSvg.padX}
                            y1={y}
                            y2={y}
                            stroke={isLight ? "#e2e8f0" : "#27272a"}
                            strokeDasharray="3 3"
                          />
                          <text
                            x={chartSvg.width - chartSvg.padX - 4}
                            y={y - 4}
                            textAnchor="end"
                            className="fill-zinc-500 text-[10px] font-mono"
                          >
                            ${p.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Candlesticks */}
                    {chartSvg.candles.map((c, idx) => {
                      const xCenter = chartSvg.padX + idx * chartSvg.stepX + chartSvg.stepX / 2;
                      const bodyW = Math.max(3, chartSvg.stepX * 0.58);
                      const isUp = c.close >= c.open;
                      const color = isUp ? "#10b981" : "#ef4444";
                      const yTop = chartSvg.toY(Math.max(c.open, c.close));
                      const yBot = chartSvg.toY(Math.min(c.open, c.close));
                      return (
                        <g key={c.time}>
                          <line
                            x1={xCenter}
                            x2={xCenter}
                            y1={chartSvg.toY(c.high)}
                            y2={chartSvg.toY(c.low)}
                            stroke={color}
                            strokeWidth={1.3}
                          />
                          <rect
                            x={xCenter - bodyW / 2}
                            y={yTop}
                            width={bodyW}
                            height={Math.max(2, yBot - yTop)}
                            fill={color}
                            rx={1}
                          />
                        </g>
                      );
                    })}

                    {/* SMA-20 Curve */}
                    <path d={chartSvg.smaPath} fill="none" stroke="#f59e0b" strokeWidth={1.75} />
                  </svg>
                </div>
              ) : (
                <div className={`h-64 flex items-center justify-center text-xs ${s.muted}`}>
                  Loading OHLCV candlesticks...
                </div>
              )}
            </div>

            {/* Live Multi-Asset Technical Screener */}
            <div className={`overflow-x-auto rounded-xl p-2 ${s.card}`}>
              <table className="w-full text-xs border-separate border-spacing-y-1 font-mono tabular-nums">
                <thead>
                  <tr className={s.thBg}>
                    <th className="py-2.5 px-3 text-left font-sans font-semibold rounded-l-lg">Asset</th>
                    <th className="py-2.5 px-3 text-left font-sans font-semibold">Class</th>
                    <th className="py-2.5 px-3 text-right font-medium">Price</th>
                    <th className="py-2.5 px-3 text-right font-medium">24h Chg</th>
                    <th className="py-2.5 px-3 text-right font-medium">RSI (14)</th>
                    <th className="py-2.5 px-3 text-right font-medium">SMA (20)</th>
                    <th className="py-2.5 px-3 text-right font-sans font-semibold rounded-r-lg">Signal State</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.screener ?? []).map((row) => (
                    <tr
                      key={row.symbol}
                      onClick={() => setSymbol(row.symbol)}
                      className={`cursor-pointer transition-colors ${s.rowHover}`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-emerald-500 rounded-l-lg">{row.symbol}</td>
                      <td className={`py-2.5 px-3 font-sans ${s.muted}`}>{row.assetClass}</td>
                      <td className="py-2.5 px-3 text-right">${row.price.toFixed(2)}</td>
                      <td
                        className={`py-2.5 px-3 text-right ${
                          row.changePct >= 0 ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {row.changePct >= 0 ? "+" : ""}
                        {row.changePct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right">{row.rsi14.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right">${row.sma20.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-sans font-medium rounded-r-lg">{row.bias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}
