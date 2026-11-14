"use client";

import { useState, useMemo } from "react";
import {
  BarChart2,
  TrendingUp,
  Percent,
  Sliders,
  Info,
  Filter,
  X,
  ArrowUpRight,
} from "lucide-react";
import {
  type ScoreDistribution,
  type HistogramBin,
  type ScoredAssetItem,
} from "@/lib/market-pipeline";
import { stanceColor } from "@/lib/market";

interface Props {
  distribution: ScoreDistribution;
  distributionByKind?: {
    stock: ScoreDistribution;
    crypto: ScoreDistribution;
    meme: ScoreDistribution;
  };
  onSelectScoreRange?: (minScore: number | null, maxScore: number | null, label?: string) => void;
  selectedRange?: { minScore: number; maxScore: number; label: string } | null;
}

export default function ScoreDistributionHistogram({
  distribution,
  distributionByKind,
  onSelectScoreRange,
  selectedRange,
}: Props) {
  const [activeAssetScope, setActiveAssetScope] = useState<"all" | "stock" | "crypto" | "meme">("all");
  const [hoveredBin, setHoveredBin] = useState<HistogramBin | null>(null);

  // Active distribution based on scope toggle
  const currentDist: ScoreDistribution = useMemo(() => {
    if (activeAssetScope === "all" || !distributionByKind) {
      return distribution;
    }
    return distributionByKind[activeAssetScope] || distribution;
  }, [activeAssetScope, distribution, distributionByKind]);

  // Find max bin count for height normalization
  const maxBinCount = useMemo(() => {
    if (!currentDist.bins || currentDist.bins.length === 0) return 1;
    return Math.max(...currentDist.bins.map((b) => b.count), 1);
  }, [currentDist]);

  // Color helper for histogram bars based on stance regime
  const getBarColor = (stance: string, isHovered: boolean, isSelected: boolean) => {
    if (isSelected) {
      return "bg-gold-bright shadow-[0_0_12px_rgba(229,184,105,0.7)]";
    }
    switch (stance) {
      case "Buy":
        return isHovered
          ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
          : "bg-emerald-500/80 hover:bg-emerald-400";
      case "Accumulate":
        return isHovered
          ? "bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
          : "bg-teal-500/75 hover:bg-teal-400";
      case "Hold":
        return isHovered
          ? "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
          : "bg-sky-600/70 hover:bg-sky-400";
      case "Trim":
        return isHovered
          ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
          : "bg-amber-600/70 hover:bg-amber-400";
      case "Avoid":
      default:
        return isHovered
          ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
          : "bg-rose-600/70 hover:bg-rose-500";
    }
  };

  const handleBinClick = (bin: HistogramBin) => {
    if (!onSelectScoreRange) return;
    if (selectedRange && selectedRange.minScore === bin.minScore) {
      // Toggle off
      onSelectScoreRange(null, null);
    } else {
      onSelectScoreRange(bin.minScore, bin.maxScore, `Score ${bin.minScore}–${bin.maxScore}`);
    }
  };

  const totalAssets = currentDist.totalAssets || 1;
  const stancePercents = {
    buy: Math.round(((currentDist.stanceCounts.buy || 0) / totalAssets) * 100),
    accumulate: Math.round(((currentDist.stanceCounts.accumulate || 0) / totalAssets) * 100),
    hold: Math.round(((currentDist.stanceCounts.hold || 0) / totalAssets) * 100),
    trim: Math.round(((currentDist.stanceCounts.trim || 0) / totalAssets) * 100),
    avoid: Math.round(((currentDist.stanceCounts.avoid || 0) / totalAssets) * 100),
  };

  return (
    <div className="rounded-2xl bg-ink-900/55 p-6 sm:p-7 backdrop-blur">
      {/* Header and Scope Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gold/20 text-gold-bright">
              <BarChart2 className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Distribution Engine
            </span>
            <span className="rounded bg-ink-850 px-2 py-0.5 font-mono text-[10px] text-muted">
              {currentDist.totalAssets.toLocaleString()} Assets Sampled
            </span>
          </div>
          <h3 className="mt-1 font-display text-xl sm:text-2xl text-bone">
            Trend Score Universe Distribution
          </h3>
          <p className="mt-1 text-xs text-muted max-w-xl">
            Gaussian frequency distribution of composite trend scores (0–100). Click any histogram bin to inspect and filter that exact score cohort.
          </p>
        </div>

        {/* Scope Pill Selector */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-ink-950/80 p-1.5 shrink-0 self-start sm:self-auto">
          {(
            [
              { id: "all", label: "All Assets", count: distribution.totalAssets },
              { id: "stock", label: "Equities", count: distributionByKind?.stock.totalAssets || 800 },
              { id: "crypto", label: "Crypto", count: distributionByKind?.crypto.totalAssets || 831 },
              { id: "meme", label: "Memes", count: distributionByKind?.meme.totalAssets || 407 },
            ] as const
          ).map((scope) => (
            <button
              key={scope.id}
              type="button"
              onClick={() => setActiveAssetScope(scope.id)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                activeAssetScope === scope.id
                  ? "bg-gold text-ink-950 font-bold shadow"
                  : "text-muted hover:text-bone hover:bg-ink-900"
              }`}
            >
              {scope.label}
              <span className="ml-1.5 opacity-70 font-mono text-[10px]">({scope.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Summary Statistical KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-xl bg-ink-950/75 px-4 py-3.5">
          <div className="flex items-center justify-between text-[10px] uppercase text-muted">
            <span>Mean &amp; Std Dev</span>
            <Info className="h-3 w-3 text-muted/60" />
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-bone">
            {currentDist.mean}{" "}
            <span className="text-xs text-muted font-normal">± {currentDist.stdDev}</span>
          </p>
          <p className="text-[10px] text-muted/70">Central tendency &amp; dispersion</p>
        </div>

        <div className="rounded-xl bg-ink-950/75 px-4 py-3.5">
          <div className="flex items-center justify-between text-[10px] uppercase text-muted">
            <span>Median &amp; IQR</span>
            <span className="font-mono text-[10px] text-gold-bright">50%</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-gold-bright">
            {currentDist.median}{" "}
            <span className="text-xs text-muted font-normal">
              [{currentDist.q1} – {currentDist.q3}]
            </span>
          </p>
          <p className="text-[10px] text-muted/70">Middle 50% interquartile range</p>
        </div>

        <div className="rounded-xl bg-ink-950/75 px-4 py-3.5">
          <div className="flex items-center justify-between text-[10px] uppercase text-muted">
            <span>Regime Skew</span>
            <Sliders className="h-3 w-3 text-muted/60" />
          </div>
          <p className="mt-1 text-xs font-bold text-emerald-400 truncate">
            {currentDist.skewness}
          </p>
          <p className="text-[10px] text-muted/70">Distribution symmetry shape</p>
        </div>

        <div className="rounded-xl bg-ink-950/75 px-4 py-3.5">
          <div className="flex items-center justify-between text-[10px] uppercase text-muted">
            <span>Bullish Cohort</span>
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
            {stancePercents.buy + stancePercents.accumulate}%
            <span className="text-xs text-muted font-normal ml-1">
              ({currentDist.stanceCounts.buy + currentDist.stanceCounts.accumulate} assets)
            </span>
          </p>
          <p className="text-[10px] text-muted/70">Scoring 66+ (Accumulate &amp; Buy)</p>
        </div>
      </div>

      {/* Active Filter Pill */}
      {selectedRange && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-gold/15 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-gold-bright">
            <Filter className="h-3.5 w-3.5" />
            <span>Active Range Filter:</span>
            <strong className="font-mono font-bold text-bone">{selectedRange.label}</strong>
          </div>
          <button
            type="button"
            onClick={() => onSelectScoreRange?.(null, null)}
            className="flex items-center gap-1 rounded-lg bg-ink-900/75 px-2.5 py-1 text-[10px] text-muted hover:text-bone hover:bg-ink-900 transition"
          >
            <X className="h-3 w-3" />
            Clear Filter
          </button>
        </div>
      )}

      {/* HISTOGRAM CHART CANVAS */}
      <div className="mt-6 space-y-2">
        <div className="relative pt-4 pb-2">
          {/* Regime Background Watermarks */}
          <div className="absolute inset-0 flex pointer-events-none opacity-20">
            <div className="w-[33%] bg-rose-500/10" />
            <div className="w-[14%] bg-amber-500/10" />
            <div className="w-[19%] bg-sky-500/10" />
            <div className="w-[12%] bg-teal-500/10" />
            <div className="w-[22%] bg-emerald-500/10" />
          </div>

          {/* Histogram Bars */}
          <div className="relative flex h-56 sm:h-64 items-end gap-1 px-1">
            {currentDist.bins.map((bin) => {
              const heightPercent = Math.max(
                4,
                Math.round((bin.count / maxBinCount) * 100),
              );
              const isSelected = Boolean(
                selectedRange &&
                  selectedRange.minScore <= bin.minScore &&
                  selectedRange.maxScore >= bin.maxScore,
              );
              const isHovered = hoveredBin?.binIndex === bin.binIndex;

              return (
                <div
                  key={bin.binIndex}
                  className="group relative flex-1 h-full flex items-end justify-center cursor-pointer"
                  onMouseEnter={() => setHoveredBin(bin)}
                  onMouseLeave={() => setHoveredBin(null)}
                  onClick={() => handleBinClick(bin)}
                >
                  {/* Bar Element */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${getBarColor(
                      bin.stance,
                      isHovered,
                      isSelected,
                    )}`}
                  >
                    {/* Top glow dot on hover */}
                    {isHovered && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-bone animate-ping" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Rule & Scale */}
          <div className="pt-2.5">
            <div className="flex justify-between font-mono text-[10px] text-muted px-1">
              <span>0 (Bearish)</span>
              <span>20</span>
              <span>40</span>
              <span className="text-gold-bright font-bold">50 (Neutral)</span>
              <span>60</span>
              <span>80</span>
              <span className="text-emerald-400 font-bold">100 (Bullish)</span>
            </div>

            {/* Stance Regime Zones Legend */}
            <div className="mt-2 grid grid-cols-5 gap-1.5 text-center font-mono text-[9px] uppercase tracking-wider">
              <span className="text-rose-400/80 bg-rose-500/10 py-1 rounded">Avoid (0–33)</span>
              <span className="text-amber-400/80 bg-amber-500/10 py-1 rounded">Trim (34–46)</span>
              <span className="text-sky-400/80 bg-sky-500/10 py-1 rounded">Hold (47–65)</span>
              <span className="text-teal-400/80 bg-teal-500/10 py-1 rounded">Accumulate (66–77)</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/15 py-1 rounded">Buy (78–100)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip / Bin Inspection Card */}
        {hoveredBin ? (
          <div className="rounded-xl bg-ink-950/85 p-4 shadow-xl transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-gold-bright">
                  Score Range [{hoveredBin.minScore} – {hoveredBin.maxScore}]
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${stanceColor(
                    hoveredBin.stance,
                  )}`}
                >
                  {hoveredBin.stance} Stance
                </span>
                <span className="text-xs text-bone font-mono font-bold">
                  {hoveredBin.count.toLocaleString()} assets ({hoveredBin.percentage}%)
                </span>
              </div>

              <span className="text-[10px] text-muted italic">
                Click bar to filter explorer table below
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-4 text-muted">
                <span>
                  Stocks: <strong className="text-bone font-mono">{hoveredBin.stockCount}</strong>
                </span>
                <span>
                  Crypto: <strong className="text-bone font-mono">{hoveredBin.cryptoCount}</strong>
                </span>
                <span>
                  Memes: <strong className="text-bone font-mono">{hoveredBin.memeCount}</strong>
                </span>
              </div>

              {hoveredBin.sampleSymbols.length > 0 && (
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-muted">Sample:</span>
                  {hoveredBin.sampleSymbols.map((sym) => (
                    <span
                      key={sym}
                      className="rounded bg-ink-900 px-1.5 py-0.5 text-bone font-bold"
                    >
                      ${sym}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-ink-950/55 p-3 text-center text-xs text-muted">
            Hover over any histogram bar to inspect score cluster density, sector composition, and representative symbols.
          </div>
        )}
      </div>

      {/* STANCE REGIME MACRO BAR */}
      <div className="mt-6 pt-3">
        <div className="flex items-center justify-between text-xs pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Macro Regime Distribution ({currentDist.totalAssets.toLocaleString()} Assets)
          </span>
          <span className="font-mono text-[11px] text-muted">
            Breadth Ratio:{" "}
            <strong className="text-emerald-400">
              {stancePercents.buy + stancePercents.accumulate}% Bullish
            </strong>{" "}
            vs{" "}
            <strong className="text-rose-400">
              {stancePercents.avoid + stancePercents.trim}% Defensive
            </strong>
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-950">
          <div
            style={{ width: `${stancePercents.avoid}%` }}
            className="bg-rose-500 hover:brightness-110 transition-all"
            title={`Avoid: ${currentDist.stanceCounts.avoid} assets (${stancePercents.avoid}%)`}
          />
          <div
            style={{ width: `${stancePercents.trim}%` }}
            className="bg-amber-500 hover:brightness-110 transition-all"
            title={`Trim: ${currentDist.stanceCounts.trim} assets (${stancePercents.trim}%)`}
          />
          <div
            style={{ width: `${stancePercents.hold}%` }}
            className="bg-sky-500 hover:brightness-110 transition-all"
            title={`Hold: ${currentDist.stanceCounts.hold} assets (${stancePercents.hold}%)`}
          />
          <div
            style={{ width: `${stancePercents.accumulate}%` }}
            className="bg-teal-400 hover:brightness-110 transition-all"
            title={`Accumulate: ${currentDist.stanceCounts.accumulate} assets (${stancePercents.accumulate}%)`}
          />
          <div
            style={{ width: `${stancePercents.buy}%` }}
            className="bg-emerald-400 hover:brightness-110 transition-all"
            title={`Buy: ${currentDist.stanceCounts.buy} assets (${stancePercents.buy}%)`}
          />
        </div>

        {/* Stance Legend Labels with asset count */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-muted">Avoid:</span>
            <span className="font-mono font-bold text-bone">
              {currentDist.stanceCounts.avoid} ({stancePercents.avoid}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-muted">Trim:</span>
            <span className="font-mono font-bold text-bone">
              {currentDist.stanceCounts.trim} ({stancePercents.trim}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span className="text-muted">Hold:</span>
            <span className="font-mono font-bold text-bone">
              {currentDist.stanceCounts.hold} ({stancePercents.hold}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            <span className="text-muted">Accumulate:</span>
            <span className="font-mono font-bold text-bone">
              {currentDist.stanceCounts.accumulate} ({stancePercents.accumulate}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-muted">Buy:</span>
            <span className="font-mono font-bold text-bone">
              {currentDist.stanceCounts.buy} ({stancePercents.buy}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
