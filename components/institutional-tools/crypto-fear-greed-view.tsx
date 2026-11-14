"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Flame,
  Gauge,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import InstitutionalToolShell from "./tool-shell";
import { formatCompactCurrency } from "@/lib/institutional-tools-data";
import {
  SENTIMENT_BANDS,
  classifySentiment,
  type FearGreedPoint,
  type SentimentStats,
} from "@/lib/crypto-fear-greed";

interface CryptoFearGreedResponse {
  tool: "crypto-fear-greed";
  liveFeed: boolean;
  sources: string[];
  asOf: string;
  timeUntilUpdateSec: number | null;
  history: FearGreedPoint[];
  stats: SentimentStats | null;
  marketContext: {
    btcPrice: number | null;
    btcChange24h: number | null;
    ethPrice: number | null;
    ethChange24h: number | null;
    solPrice: number | null;
    solChange24h: number | null;
    btcFunding8hPct: number | null;
    btcDominancePct: number | null;
    ethDominancePct: number | null;
    totalMarketCapUsd: number | null;
    marketCapChange24hPct: number | null;
  };
}

function formatCountdown(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "Daily 00:00 UTC";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatSignedDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function SentimentGaugeSvg({
  value,
  accentHex,
  isLight,
}: {
  value: number;
  accentHex: string;
  isLight: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  // Semicircle from -180deg (left, 0) to 0deg (right, 100)
  const cx = 140;
  const cy = 128;
  const r = 98;

  const arcPoint = (score: number, radius: number) => {
    const rad = ((180 - (score / 100) * 180) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const describeArc = (startScore: number, endScore: number, radius: number) => {
    const start = arcPoint(startScore, radius);
    const end = arcPoint(endScore, radius);
    const largeArc = endScore - startScore > 50 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  };

  const needleTip = arcPoint(clamped, r - 14);
  const trackText = isLight ? "#64748b" : "#71717a";
  const centerFill = isLight ? "#0f172a" : "#f4f4f5";
  const needleStroke = isLight ? "#0f172a" : "#f8fafc";

  const segments = [
    { from: 0, to: 24, color: "#ef4444" },
    { from: 25, to: 45, color: "#f59e0b" },
    { from: 46, to: 54, color: "#64748b" },
    { from: 55, to: 74, color: "#34d399" },
    { from: 75, to: 100, color: "#10b981" },
  ];

  return (
    <svg
      viewBox="0 0 280 165"
      className="w-full max-w-[280px] mx-auto"
      role="img"
      aria-label={`Crypto Fear and Greed gauge at ${clamped} out of 100`}
    >
      {segments.map((seg) => (
        <path
          key={seg.from}
          d={describeArc(seg.from, seg.to, r)}
          fill="none"
          stroke={seg.color}
          strokeWidth={14}
          strokeLinecap="butt"
          opacity={0.85}
        />
      ))}

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke={needleStroke}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={6} fill={accentHex} stroke={needleStroke} strokeWidth={2} />

      {/* Score & Scale Labels */}
      <text
        x={cx}
        y={cy - 24}
        textAnchor="middle"
        fill={centerFill}
        className="font-mono text-4xl font-bold"
        style={{ fontSize: "36px", fontWeight: 700 }}
      >
        {clamped}
      </text>
      <text x={42} y={cy + 22} textAnchor="middle" fill={trackText} style={{ fontSize: "10px" }}>
        0 · FEAR
      </text>
      <text x={cx} y={18} textAnchor="middle" fill={trackText} style={{ fontSize: "10px" }}>
        50
      </text>
      <text x={238} y={cy + 22} textAnchor="middle" fill={trackText} style={{ fontSize: "10px" }}>
        100 · GREED
      </text>
    </svg>
  );
}

export function CryptoFearGreedView() {
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<CryptoFearGreedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institutional-feed?tool=crypto-fear-greed", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Feed error (${res.status})`);
      }
      const json: CryptoFearGreedResponse = await res.json();
      setData(json);
      setActiveIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sentiment feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleSeries = useMemo(() => {
    const history = data?.history ?? [];
    return history.slice(-timeframe);
  }, [data, timeframe]);

  const inspectedPoint = useMemo(() => {
    if (visibleSeries.length === 0) return null;
    if (activeIndex !== null && visibleSeries[activeIndex]) {
      return visibleSeries[activeIndex];
    }
    return visibleSeries[visibleSeries.length - 1];
  }, [visibleSeries, activeIndex]);

  const chartGeometry = useMemo(() => {
    if (visibleSeries.length < 2) return null;
    const w = 680;
    const h = 210;
    const padL = 34;
    const padR = 16;
    const padT = 16;
    const padB = 26;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    const toX = (i: number) => padL + (i / (visibleSeries.length - 1)) * innerW;
    const toY = (val: number) => padT + ((100 - val) / 100) * innerH;

    const linePath = visibleSeries
      .map((pt, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(pt.value).toFixed(1)}`)
      .join(" ");

    const areaPath = `${linePath} L${toX(visibleSeries.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${toX(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

    return {
      w,
      h,
      padL,
      padR,
      padT,
      innerW,
      innerH,
      y75: toY(75),
      y50: toY(50),
      y25: toY(25),
      linePath,
      areaPath,
      points: visibleSeries.map((pt, i) => ({
        ...pt,
        x: toX(i),
        y: toY(pt.value),
      })),
    };
  }, [visibleSeries]);

  const stats = data?.stats;
  const market = data?.marketContext;

  return (
    <InstitutionalToolShell
      slug="crypto-fear-greed"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const card = isLight
          ? "bg-white text-slate-900"
          : "bg-ink-950/75 text-zinc-100";
        const subCard = isLight
          ? "bg-slate-50 text-slate-900"
          : "bg-ink-900/65 text-zinc-100";
        const muted = isLight ? "text-slate-500" : "text-zinc-400";
        const thBg = isLight ? "bg-slate-100 text-slate-600" : "bg-ink-900/90 text-zinc-400";
        const rowHover = isLight ? "hover:bg-slate-100/70" : "hover:bg-ink-900/50";

        const currentScore = stats?.current.value ?? 0;
        const currentMeta = stats?.meta ?? classifySentiment(currentScore);
        const inspectedMeta = inspectedPoint
          ? classifySentiment(inspectedPoint.value)
          : currentMeta;

        return (
          <div className="space-y-5" data-testid="crypto-fear-greed-module">
            {error && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </span>
                <button
                  type="button"
                  onClick={load}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Primary Gauge + 90D History Chart */}
            <div className="grid gap-5 lg:grid-cols-12">
              {/* Left: Live Sentiment Gauge & Deltas */}
              <div className={`min-w-0 lg:col-span-5 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 ${card}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Gauge className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                      <span>Composite Sentiment Gauge</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${muted}`}>
                      {data?.liveFeed
                        ? "Live Alternative.me Index (0 = Max Fear, 100 = Max Greed)"
                        : loading
                          ? "Syncing live Alternative.me Index..."
                          : "Live Alternative.me F&G Offline"}
                    </p>
                  </div>
                  <span
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold ${
                      isLight ? currentMeta.badgeClassLight : currentMeta.badgeClassDark
                    }`}
                    data-testid="sentiment-zone-badge"
                  >
                    {stats ? currentMeta.zone : loading ? "Loading..." : "Offline"}
                  </span>
                </div>

                <div className="py-1">
                  {stats ? (
                    <SentimentGaugeSvg
                      value={currentScore}
                      accentHex={currentMeta.accentHex}
                      isLight={isLight}
                    />
                  ) : (
                    <div className={`flex h-40 items-center justify-center rounded-xl text-xs font-mono ${subCard} ${muted}`}>
                      {loading ? "Syncing Alternative.me F&G gauge..." : "Live Fear & Greed reading unavailable"}
                    </div>
                  )}
                </div>

                {/* Multi-Horizon Point Deltas */}
                <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
                  {[
                    { label: "24h Delta", val: stats?.delta24h ?? 0 },
                    { label: "7d Delta", val: stats?.delta7d ?? 0 },
                    { label: "30d Delta", val: stats?.delta30d ?? 0 },
                  ].map((d) => (
                    <div key={d.label} className={`rounded-xl p-2.5 sm:p-3 ${subCard}`}>
                      <div className={`font-sans text-[10px] sm:text-[11px] ${muted}`}>{d.label}</div>
                      <div
                        className={`mt-1 text-xs sm:text-sm font-semibold whitespace-nowrap flex items-center gap-1 ${
                          d.val > 0
                            ? "text-emerald-500"
                            : d.val < 0
                              ? "text-rose-500"
                              : muted
                        }`}
                      >
                        {d.val > 0 ? (
                          <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" aria-hidden="true" />
                        ) : d.val < 0 ? (
                          <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" aria-hidden="true" />
                        ) : null}
                        <span>{stats ? `${formatSignedDelta(d.val)} pts` : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Update Countdown & Regime Streak */}
                <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] ${muted}`}>
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    <span>Next update: {formatCountdown(data?.timeUntilUpdateSec ?? null)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Flame className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                    <span>
                      Streak: {stats ? `${stats.streakDays}d ${stats.streakZone}` : "—"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Right: Historical Regime Chart */}
              <div className={`min-w-0 lg:col-span-7 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 ${card}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Historical Sentiment Extremes ({timeframe}-Day Regime)
                    </h3>
                    <p className={`text-[11px] mt-0.5 ${muted}`}>
                      Dashed bands mark Extreme Greed (&ge;75) and Extreme Fear (&le;24) contrarian pivots.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1 self-start">
                    {([7, 30, 90] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => {
                          setTimeframe(tf);
                          setActiveIndex(null);
                        }}
                        aria-pressed={timeframe === tf}
                        className={`rounded-xl px-2.5 py-1 font-mono text-xs font-semibold transition-colors ${
                          timeframe === tf
                            ? "bg-emerald-500/20 text-emerald-400"
                            : `${subCard} ${muted}`
                        }`}
                      >
                        {tf}D
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inspected Point Readout Bar */}
                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-mono tabular-nums ${subCard}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={muted}>{inspectedPoint?.date ?? "—"}</span>
                    <span className="font-semibold text-sm" style={{ color: inspectedMeta.accentHex }}>
                      {inspectedPoint ? `${inspectedPoint.value}/100` : "—"}
                    </span>
                    <span className={muted}>{inspectedPoint?.classification ?? "—"}</span>
                  </div>
                  <div className={`flex items-center gap-4 text-[11px] ${muted}`}>
                    <span>30D Mean: <strong className={isLight ? "text-slate-900" : "text-zinc-100"}>{stats ? stats.avg30d.toFixed(1) : "—"}</strong></span>
                    <span>30D Range: <strong className={isLight ? "text-slate-900" : "text-zinc-100"}>{stats ? `${stats.min30d}–${stats.max30d}` : "—"}</strong></span>
                    <span>Z-Score: <strong className={stats && stats.zScore30d <= -1.2 ? "text-rose-400" : stats && stats.zScore30d >= 1.2 ? "text-emerald-400" : ""}>{stats ? stats.zScore30d.toFixed(2) : "—"}</strong></span>
                  </div>
                </div>

                {/* Interactive SVG History Chart */}
                {chartGeometry ? (
                  <div className="relative">
                    <svg
                      viewBox={`0 0 ${chartGeometry.w} ${chartGeometry.h}`}
                      className="w-full h-52 select-none"
                      role="img"
                      aria-label={`${timeframe}-day Crypto Fear and Greed history chart`}
                    >
                      <defs>
                        <linearGradient id="fngAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={currentMeta.accentHex} stopOpacity="0.32" />
                          <stop offset="100%" stopColor={currentMeta.accentHex} stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Threshold Lines */}
                      <line
                        x1={chartGeometry.padL}
                        y1={chartGeometry.y75}
                        x2={chartGeometry.w - chartGeometry.padR}
                        y2={chartGeometry.y75}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                      />
                      <line
                        x1={chartGeometry.padL}
                        y1={chartGeometry.y50}
                        x2={chartGeometry.w - chartGeometry.padR}
                        y2={chartGeometry.y50}
                        stroke={isLight ? "#cbd5e1" : "#3f3f46"}
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={chartGeometry.padL}
                        y1={chartGeometry.y25}
                        x2={chartGeometry.w - chartGeometry.padR}
                        y2={chartGeometry.y25}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                      />

                      {/* Y-axis Labels */}
                      <text x={4} y={chartGeometry.y75 + 3} fill="#10b981" style={{ fontSize: "10px" }}>75</text>
                      <text x={4} y={chartGeometry.y50 + 3} fill={isLight ? "#64748b" : "#71717a"} style={{ fontSize: "10px" }}>50</text>
                      <text x={4} y={chartGeometry.y25 + 3} fill="#ef4444" style={{ fontSize: "10px" }}>25</text>

                      {/* Area & Line */}
                      <path d={chartGeometry.areaPath} fill="url(#fngAreaGrad)" />
                      <path
                        d={chartGeometry.linePath}
                        fill="none"
                        stroke={currentMeta.accentHex}
                        strokeWidth={2.25}
                        strokeLinejoin="round"
                      />

                      {/* Interactive Hover Targets */}
                      {chartGeometry.points.map((pt, idx) => {
                        const isSelected =
                          activeIndex === idx ||
                          (activeIndex === null && idx === chartGeometry.points.length - 1);
                        return (
                          <g key={pt.date}>
                            {isSelected && (
                              <>
                                <line
                                  x1={pt.x}
                                  y1={chartGeometry.padT}
                                  x2={pt.x}
                                  y2={chartGeometry.padT + chartGeometry.innerH}
                                  stroke={isLight ? "#94a3b8" : "#52525b"}
                                  strokeDasharray="2 2"
                                />
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={4.5}
                                  fill={classifySentiment(pt.value).accentHex}
                                  stroke={isLight ? "#ffffff" : "#09090b"}
                                  strokeWidth={2}
                                />
                              </>
                            )}
                            <rect
                              x={pt.x - chartGeometry.innerW / (chartGeometry.points.length * 2)}
                              y={chartGeometry.padT}
                              width={Math.max(4, chartGeometry.innerW / chartGeometry.points.length)}
                              height={chartGeometry.innerH}
                              fill="transparent"
                              className="cursor-crosshair"
                              onMouseEnter={() => setActiveIndex(idx)}
                              onClick={() => setActiveIndex(idx)}
                            />
                          </g>
                        );
                      })}

                      {/* X-axis Start / Mid / End Dates */}
                      {chartGeometry.points.length >= 2 && (
                        <>
                          <text
                            x={chartGeometry.padL}
                            y={chartGeometry.h - 6}
                            fill={isLight ? "#64748b" : "#71717a"}
                            style={{ fontSize: "10px" }}
                          >
                            {chartGeometry.points[0].date}
                          </text>
                          <text
                            x={chartGeometry.padL + chartGeometry.innerW / 2}
                            y={chartGeometry.h - 6}
                            textAnchor="middle"
                            fill={isLight ? "#64748b" : "#71717a"}
                            style={{ fontSize: "10px" }}
                          >
                            {chartGeometry.points[Math.floor(chartGeometry.points.length / 2)].date}
                          </text>
                          <text
                            x={chartGeometry.w - chartGeometry.padR}
                            y={chartGeometry.h - 6}
                            textAnchor="end"
                            fill={isLight ? "#64748b" : "#71717a"}
                            style={{ fontSize: "10px" }}
                          >
                            {chartGeometry.points[chartGeometry.points.length - 1].date}
                          </text>
                        </>
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className={`h-52 flex flex-col items-center justify-center gap-2 text-xs ${muted}`}>
                    <span>
                      {loading
                        ? "Loading historical sentiment series..."
                        : "Live Alternative.me sentiment history temporarily unavailable."}
                    </span>
                    {!loading && (
                      <button
                        type="button"
                        onClick={load}
                        className="rounded-lg bg-emerald-500/15 px-3 py-1.5 font-mono text-[11px] text-emerald-400 hover:bg-emerald-500/25"
                      >
                        Retry Live Feed
                      </button>
                    )}
                  </div>
                )}

                {/* Statistical Extremes Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs tabular-nums">
                  <div className={`rounded-xl p-3 ${subCard}`}>
                    <div className={`font-sans text-[11px] ${muted}`}>7D / 90D Average</div>
                    <div className="mt-1 font-semibold">
                      {stats ? `${stats.avg7d.toFixed(1)} / ${stats.avg90d.toFixed(1)}` : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${subCard}`}>
                    <div className={`font-sans text-[11px] ${muted}`}>90D Min – Max</div>
                    <div className="mt-1 font-semibold">
                      {stats ? `${stats.min90d} – ${stats.max90d}` : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${subCard}`}>
                    <div className={`font-sans text-[11px] ${muted}`}>30D Extreme Fear</div>
                    <div className="mt-1 font-semibold text-rose-500">
                      {stats ? `${stats.extremeFearDays30d} days` : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${subCard}`}>
                    <div className={`font-sans text-[11px] ${muted}`}>30D Extreme Greed</div>
                    <div className="mt-1 font-semibold text-emerald-500">
                      {stats ? `${stats.extremeGreedDays30d} days` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Spot, Leverage & Dominance Correlation Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {
                  label: "BTC Spot (Binance)",
                  value: market?.btcPrice
                    ? `$${market.btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : "—",
                  sub: market?.btcChange24h,
                },
                {
                  label: "ETH Spot (Binance)",
                  value: market?.ethPrice
                    ? `$${market.ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : "—",
                  sub: market?.ethChange24h,
                },
                {
                  label: "SOL Spot (Binance)",
                  value: market?.solPrice
                    ? `$${market.solPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : "—",
                  sub: market?.solChange24h,
                },
                {
                  label: "BTC 8h Funding",
                  value:
                    market?.btcFunding8hPct !== null && market?.btcFunding8hPct !== undefined
                      ? `${market.btcFunding8hPct >= 0 ? "+" : ""}${market.btcFunding8hPct.toFixed(4)}%`
                      : "—",
                  subText: "Perp leverage skew",
                },
                {
                  label: "BTC Dominance",
                  value:
                    market?.btcDominancePct !== null && market?.btcDominancePct !== undefined
                      ? `${market.btcDominancePct.toFixed(1)}%`
                      : "—",
                  subText:
                    market?.ethDominancePct !== null && market?.ethDominancePct !== undefined
                      ? `ETH ${market.ethDominancePct.toFixed(1)}%`
                      : "CoinGecko Global",
                },
                {
                  label: "Total Crypto Cap",
                  value: market?.totalMarketCapUsd
                    ? formatCompactCurrency(market.totalMarketCapUsd)
                    : "—",
                  sub: market?.marketCapChange24hPct,
                },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-xl p-3.5 ${card}`}>
                  <div className={`text-[11px] ${muted}`}>{kpi.label}</div>
                  <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {kpi.value}
                  </div>
                  {typeof kpi.sub === "number" ? (
                    <div
                      className={`mt-0.5 font-mono text-[11px] tabular-nums ${
                        kpi.sub >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {kpi.sub >= 0 ? "+" : ""}
                      {kpi.sub.toFixed(2)}% (24h)
                    </div>
                  ) : (
                    <div className={`mt-0.5 text-[11px] ${muted}`}>{kpi.subText ?? "—"}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Grid: Contrarian Regime Playbook + 5-Band Reference + Daily Readings */}
            <div className="grid gap-5 lg:grid-cols-12">
              {/* Contrarian Regime Playbook & Band Matrix */}
              <div className={`min-w-0 lg:col-span-7 rounded-xl p-4 sm:p-5 space-y-4 ${card}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    <h3 className="text-sm font-semibold">Contrarian Regime Playbook &amp; Risk Bands</h3>
                  </div>
                  <span className="font-mono text-xs font-semibold text-emerald-500">
                    {currentMeta.sizingMultiplier}
                  </span>
                </div>

                <div className={`rounded-xl p-3.5 space-y-1.5 ${subCard}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold">{currentMeta.contrarianBias}</span>
                    <span className={`font-mono text-[11px] ${muted}`}>
                      Active Band: {currentMeta.rangeLabel}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${muted}`}>{currentMeta.guidance}</p>
                </div>

                <div className={`overflow-x-auto rounded-xl p-2 ${subCard}`}>
                  <table className="w-full text-xs border-separate border-spacing-y-1">
                    <thead>
                      <tr className={thBg}>
                        <th className="py-2 px-3 text-left font-medium rounded-l-lg">Zone</th>
                        <th className="py-2 px-3 text-left font-mono font-medium">Score</th>
                        <th className="py-2 px-3 text-left font-medium rounded-r-lg">Desk Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SENTIMENT_BANDS.map((band) => {
                        const isActive = band.zone === currentMeta.zone;
                        return (
                          <tr
                            key={band.zone}
                            className={`transition-colors ${
                              isActive
                                ? isLight
                                  ? "bg-emerald-50"
                                  : "bg-emerald-500/15"
                                : rowHover
                            }`}
                          >
                            <td className="py-2.5 px-3 font-medium whitespace-nowrap rounded-l-lg">
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: band.accentHex }}
                                />
                                <span>{band.zone}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                              {band.rangeLabel}
                            </td>
                            <td className={`py-2.5 px-3 leading-relaxed rounded-r-lg ${muted}`}>
                              {band.deskAction}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Daily Sentiment Ledger */}
              <div className={`min-w-0 lg:col-span-5 rounded-xl p-4 sm:p-5 space-y-3 ${card}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Recent Daily Sentiment Readings</h3>
                  <span className={`font-mono text-[11px] ${muted}`}>Last 14 Sessions</span>
                </div>

                <div className={`overflow-x-auto rounded-xl p-2 ${subCard}`}>
                  <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                    <thead>
                      <tr className={thBg}>
                        <th className="py-2 px-3 text-left font-medium rounded-l-lg">Date (UTC)</th>
                        <th className="py-2 px-3 text-right font-medium">Index</th>
                        <th className="py-2 px-3 text-left font-sans font-medium">Regime</th>
                        <th className="py-2 px-3 text-right font-medium rounded-r-lg">1D Chg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.history ?? [])
                        .slice(-14)
                        .reverse()
                        .map((pt, idx, arr) => {
                          const prev = arr[idx + 1];
                          const chg = prev ? pt.value - prev.value : 0;
                          const ptMeta = classifySentiment(pt.value);
                          return (
                            <tr key={pt.date} className={`transition-colors ${rowHover}`}>
                              <td className="py-2 px-3 rounded-l-lg">{pt.date}</td>
                              <td
                                className="py-2 px-3 text-right font-semibold"
                                style={{ color: ptMeta.accentHex }}
                              >
                                {pt.value}
                              </td>
                              <td className="py-2 px-3 font-sans">{pt.classification}</td>
                              <td
                                className={`py-2 px-3 text-right rounded-r-lg ${
                                  chg > 0
                                    ? "text-emerald-500"
                                    : chg < 0
                                      ? "text-rose-500"
                                      : muted
                                }`}
                              >
                                {prev ? formatSignedDelta(chg) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}
