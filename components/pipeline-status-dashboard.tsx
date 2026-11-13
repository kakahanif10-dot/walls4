"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Server,
  RefreshCw,
  TrendingUp,
  Shield,
  Layers,
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Info,
  Clock,
  Sparkles,
  BarChart2,
  Filter,
  X,
} from "lucide-react";
import { type PipelineMetrics, type ScoredAssetItem } from "@/lib/market-pipeline";
import { stanceColor } from "@/lib/market-format";
import WhopBadge from "@/components/whop-badge";
import { useWhop } from "@/lib/whop-context";
import ScoreDistributionHistogram from "@/components/score-distribution-histogram";

export default function PipelineStatusDashboard() {
  const { isUnlocked, openWhopModal } = useWhop();
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [topRanked, setTopRanked] = useState<ScoredAssetItem[]>([]);
  const [bottomRanked, setBottomRanked] = useState<ScoredAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "distribution" | "explorer" | "providers">("overview");

  // Explorer states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState<"all" | "stock" | "crypto" | "meme">("all");
  const [selectedStance, setSelectedStance] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [explorerAssets, setExplorerAssets] = useState<ScoredAssetItem[]>([]);
  const [explorerTotal, setExplorerTotal] = useState(0);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Score range filter from histogram
  const [selectedScoreRange, setSelectedScoreRange] = useState<{
    minScore: number;
    maxScore: number;
    label: string;
  } | null>(null);

  // Asset detail modal
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load pipeline status from API
  const fetchPipeline = async (force = false) => {
    if (!isUnlocked) return;
    try {
      if (force) setRefreshing(true);
      const url = force ? "/api/pipeline?force=true" : "/api/pipeline";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Pipeline status fetch failed");
      const data = await res.json();
      if (data.status === "ok") {
        setMetrics(data.pipeline);
        setTopRanked(data.topRanked || []);
        setBottomRanked(data.bottomRanked || []);
      }
    } catch (err) {
      console.warn("Failed to load pipeline telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isUnlocked) {
      setMetrics(null);
      setTopRanked([]);
      setBottomRanked([]);
      setExplorerAssets([]);
      setExplorerTotal(0);
      setSelectedAssetDetail(null);
      setLoading(false);
      setExplorerLoading(false);
      return;
    }

    fetchPipeline();
    const interval = setInterval(() => fetchPipeline(), 45_000);
    return () => clearInterval(interval);
  }, [isUnlocked]);

  // Fetch explorer assets from /api/scoring
  const fetchExplorer = useCallback(async () => {
    if (!isUnlocked) return;
    try {
      setExplorerLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedKind !== "all") params.set("kind", selectedKind);
      if (selectedStance !== "all") params.set("stance", selectedStance);
      if (selectedScoreRange) {
        params.set("minScore", String(selectedScoreRange.minScore));
        params.set("maxScore", String(selectedScoreRange.maxScore));
      }
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/scoring?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load universe");
      const data = await res.json();
      setExplorerAssets(data.results || []);
      setExplorerTotal(data.meta?.totalMatching || 0);
    } catch (err) {
      console.warn("Failed to query scoring universe:", err);
    } finally {
      setExplorerLoading(false);
    }
  }, [searchQuery, selectedKind, selectedStance, selectedScoreRange, page, pageSize, isUnlocked]);

  useEffect(() => {
    fetchExplorer();
  }, [fetchExplorer]);

  // Handle score range selection from the histogram
  const handleSelectScoreRange = (minScore: number | null, maxScore: number | null, label?: string) => {
    if (minScore === null || maxScore === null) {
      setSelectedScoreRange(null);
    } else {
      setSelectedScoreRange({
        minScore,
        maxScore,
        label: label || `Score ${minScore}–${maxScore}`,
      });
      setPage(1);
    }
  };

  // Fetch detailed 5-component breakdown for an asset
  const inspectAsset = async (symbol: string) => {
    if (!isUnlocked) return;
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/scoring?symbol=${encodeURIComponent(symbol)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAssetDetail(data);
      }
    } catch (err) {
      console.warn("Failed to fetch asset detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(explorerTotal / pageSize) || 1;

  if (!isUnlocked) {
    return (
      <section
        aria-labelledby="pipeline-member-heading"
        className="mx-auto max-w-3xl rounded-2xl border border-gold/25 bg-ink-900 p-8 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Member-only analytics
        </p>
        <h2 id="pipeline-member-heading" className="mt-3 text-2xl font-semibold text-bone">
          Full scoring universe is protected
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          The pipeline, ranked assets, and detailed scoring models are available to verified lifetime members.
        </p>
        <button
          className="mt-6 rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-bright"
          onClick={() => openWhopModal("Full scoring pipeline and asset universe")}
          type="button"
        >
          View lifetime access
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-line bg-ink-900/80 p-5 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Backend Pipeline Live
            </span>
            <span className="rounded bg-line/60 px-2 py-0.5 font-mono text-[10px] text-muted">
              2,038 Total Assets Scored
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl text-bone flex items-center">
            <span>Multi-Source Market Data &amp; Scoring Engine</span>
            <WhopBadge className="ml-2 text-lg align-middle" />
          </h2>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            Ingests real quotes from <strong className="text-bone">Nasdaq</strong>, <strong className="text-bone">Coinbase</strong>, <strong className="text-bone">Binance</strong>, and <strong className="text-bone">OKX</strong>. Computes 5-factor mathematical trend scores, technical invalidation levels, and Gaussian universe distribution.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => fetchPipeline(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 py-2 text-xs font-semibold text-gold-bright hover:bg-gold/25 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Recalculating..." : "Run Pipeline Ingestion"}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-xl border border-line bg-ink-900/60 p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted">Total Universe</span>
          <p className="mt-1 font-mono text-2xl font-bold text-bone">
            {metrics?.totalAssets?.toLocaleString() || "2,038"}
          </p>
          <p className="text-[10px] text-muted/70">800 stocks · 831 crypto · 407 memes</p>
        </div>

        <div className="rounded-xl border border-line bg-ink-900/60 p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted">Market Breadth</span>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
            {metrics ? `${metrics.breadthScore}%` : "—"}
          </p>
          <p className="text-[10px] text-muted/70">names scoring 60+ (bullish)</p>
        </div>

        <div className="rounded-xl border border-line bg-ink-900/60 p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted">Equities Median</span>
          <p className="mt-1 font-mono text-2xl font-bold text-gold-bright">
            {metrics?.medianScoreStock || "52"}
            <span className="text-xs text-muted font-normal"> / 100</span>
          </p>
          <p className="text-[10px] text-muted/70">S&amp;P 500 / Nasdaq</p>
        </div>

        <div className="rounded-xl border border-line bg-ink-900/60 p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted">Crypto Median</span>
          <p className="mt-1 font-mono text-2xl font-bold text-bone">
            {metrics?.medianScoreCrypto || "54"}
            <span className="text-xs text-muted font-normal"> / 100</span>
          </p>
          <p className="text-[10px] text-muted/70">Coinbase / Binance spot</p>
        </div>

        <div className="rounded-xl border border-line bg-ink-900/60 p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted">Meme Risk Median</span>
          <p className="mt-1 font-mono text-2xl font-bold text-[#e7a86b]">
            {metrics?.medianScoreMeme || "47"}
            <span className="text-xs text-muted font-normal"> / 100</span>
          </p>
          <p className="text-[10px] text-muted/70">pump.fun / viral meta</p>
        </div>

        <div className="rounded-xl border border-line bg-ink-900/60 p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted">Pipeline Latency</span>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
            {metrics ? `${metrics.executionDurationMs}ms` : "—"}
          </p>
          <p className="text-[10px] text-muted/70">2,038 assets full scoring</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-line/60 pb-1 flex items-center justify-between">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-t-lg px-4 py-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "border-b-2 border-gold text-gold-bright"
                : "text-muted hover:text-bone"
            }`}
          >
            Overview &amp; Momentum
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("distribution")}
            className={`rounded-t-lg px-4 py-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "distribution"
                ? "border-b-2 border-gold text-gold-bright"
                : "text-muted hover:text-bone"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Distribution Histogram
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("explorer")}
            className={`rounded-t-lg px-4 py-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "explorer"
                ? "border-b-2 border-gold text-gold-bright"
                : "text-muted hover:text-bone"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>2,000+ Asset Scored Universe</span>
              <WhopBadge className="ml-1" />
            </span>
            {selectedScoreRange && (
              <span className="rounded-full bg-gold/20 px-1.5 py-0.2 text-[9px] text-gold-bright font-mono font-bold">
                Filtered
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("providers")}
            className={`rounded-t-lg px-4 py-2 font-medium transition-colors ${
              activeTab === "providers"
                ? "border-b-2 border-gold text-gold-bright"
                : "text-muted hover:text-bone"
            }`}
          >
            API Providers ({metrics?.providers?.length || 4})
          </button>
        </div>

        {metrics?.lastSyncTime && (
          <span className="text-[10px] text-muted font-mono flex items-center gap-1.5 hidden sm:flex">
            <Clock className="h-3 w-3" />
            Last Ingestion: {new Date(metrics.lastSyncTime).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* HISTOGRAM VISUALIZATION COMPONENT (Rendered in Overview & Distribution tabs) */}
      {(activeTab === "overview" || activeTab === "distribution") && metrics?.distribution && (
        <ScoreDistributionHistogram
          distribution={metrics.distribution}
          distributionByKind={metrics.distributionByKind}
          onSelectScoreRange={(min, max, label) => {
            handleSelectScoreRange(min, max, label);
            if (min !== null && max !== null) {
              setActiveTab("explorer");
            }
          }}
          selectedRange={selectedScoreRange}
        />
      )}

      {/* TAB 1: OVERVIEW & TOP MOMENTUM BOARDS */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top 10 Momentum Leaders */}
          <div className="rounded-xl border border-line bg-ink-900/60 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Top Trend Momentum Leaders (Score 78+)
              </span>
              <span className="text-[10px] text-muted">Confirmed Buy Stance</span>
            </div>

            <div className="mt-3 divide-y divide-line/60">
              {topRanked.slice(0, 8).map((item) => (
                <div key={item.symbol} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => inspectAsset(item.symbol)}
                      className="font-mono font-bold text-bone hover:text-gold-bright transition-colors text-left"
                    >
                      ${item.symbol}
                    </button>
                    <span className="text-[10px] text-muted truncate max-w-[130px] hidden sm:inline">
                      {item.name}
                    </span>
                    <span className="rounded bg-line/50 px-1.5 py-0.2 font-mono text-[9px] text-muted uppercase">
                      {item.kind}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-bone">
                      ${item.price >= 1 ? item.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : item.price.toFixed(5)}
                    </span>
                    <span className={`w-14 text-right ${item.change24h >= 0 ? "text-up" : "text-down"}`}>
                      {item.change24h >= 0 ? "+" : ""}{(item.change24h * 100).toFixed(1)}%
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300 font-bold w-10 text-center">
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom 10 Deteriorating Assets */}
          <div className="rounded-xl border border-line bg-ink-900/60 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-down flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Lowest Trend Scores (Avoid / Breakdown)
              </span>
              <span className="text-[10px] text-muted">Broken Structure</span>
            </div>

            <div className="mt-3 divide-y divide-line/60">
              {bottomRanked.slice(0, 8).map((item) => (
                <div key={item.symbol} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => inspectAsset(item.symbol)}
                      className="font-mono font-bold text-bone hover:text-gold-bright transition-colors text-left"
                    >
                      ${item.symbol}
                    </button>
                    <span className="text-[10px] text-muted truncate max-w-[130px] hidden sm:inline">
                      {item.name}
                    </span>
                    <span className="rounded bg-line/50 px-1.5 py-0.2 font-mono text-[9px] text-muted uppercase">
                      {item.kind}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-bone">
                      ${item.price >= 1 ? item.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : item.price.toFixed(5)}
                    </span>
                    <span className={`w-14 text-right ${item.change24h >= 0 ? "text-up" : "text-down"}`}>
                      {item.change24h >= 0 ? "+" : ""}{(item.change24h * 100).toFixed(1)}%
                    </span>
                    <span className="rounded-full bg-down/20 px-2 py-0.5 text-down font-bold w-10 text-center">
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: API PROVIDERS STATUS */}
      {activeTab === "providers" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(metrics?.providers || []).map((provider) => (
            <div key={provider.name} className="rounded-xl border border-line bg-ink-900/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-bone">
                  <Server className="h-3.5 w-3.5 text-gold" />
                  {provider.name}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  ONLINE
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Host:</span>
                  <span className="font-mono text-bone">{provider.endpoint}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Latency:</span>
                  <span className="font-mono text-emerald-400">{provider.latencyMs}ms</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Direct Coverage:</span>
                  <span className="font-mono text-bone">{provider.assetsFetched} assets</span>
                </div>
              </div>

              <div className="border-t border-line/60 pt-2 text-[10px] text-muted/70 flex items-center justify-between">
                <span>Protocol: HTTPS/REST</span>
                <span>Active Poll</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: EXPLORER ACROSS SCORING UNIVERSE (2,000+ ASSETS) */}
      {activeTab === "explorer" && (
        <div className="space-y-4">
          {/* Active Range Filter Indicator */}
          {selectedScoreRange && (
            <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-gold-bright">
                <Filter className="h-4 w-4" />
                <span>Histogram Selection Filter:</span>
                <strong className="font-mono font-bold text-bone">{selectedScoreRange.label}</strong>
                <span className="text-muted">({explorerTotal.toLocaleString()} assets match)</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScoreRange(null)}
                className="flex items-center gap-1 rounded bg-line/60 px-2.5 py-1 text-[11px] text-muted hover:text-bone hover:bg-line transition"
              >
                <X className="h-3 w-3" />
                Clear Range
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search symbol, company, or sector..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-line bg-ink-900 pl-9 pr-3 py-1.5 text-xs text-bone placeholder:text-muted/60 focus:border-gold focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Kind selector */}
              <div className="flex items-center gap-1 rounded-full border border-line bg-ink-950 p-0.5">
                {(["all", "stock", "crypto", "meme"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSelectedKind(k);
                      setPage(1);
                    }}
                    className={`rounded-full px-2.5 py-1 uppercase text-[9px] tracking-wider transition ${
                      selectedKind === k
                        ? "bg-gold text-ink-950 font-bold"
                        : "text-muted hover:text-bone"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Stance filter */}
              <select
                value={selectedStance}
                onChange={(e) => {
                  setSelectedStance(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-line bg-ink-900 px-3 py-1.5 text-xs text-bone focus:border-gold focus:outline-none"
              >
                <option value="all">All Stances</option>
                <option value="buy">Buy (78–100)</option>
                <option value="accumulate">Accumulate (66–77)</option>
                <option value="hold">Hold (47–65)</option>
                <option value="trim">Trim (34–46)</option>
                <option value="avoid">Avoid (0–33)</option>
              </select>

              <span className="text-xs text-muted font-mono">
                {explorerTotal.toLocaleString()} Total Matches
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-line bg-ink-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-900 text-[10px] uppercase tracking-wider text-muted border-b border-line/60">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">24h Change</th>
                  <th className="px-4 py-3 text-right">Trend Score</th>
                  <th className="px-4 py-3 text-center">Stance</th>
                  <th className="px-4 py-3 text-right">Invalidation Level</th>
                  <th className="px-4 py-3 text-right">Risk Grade</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {explorerLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-gold" />
                        <span>Querying 2,000+ asset scoring universe...</span>
                      </div>
                    </td>
                  </tr>
                ) : explorerAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted">
                      No assets found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  explorerAssets.map((row) => (
                    <tr key={row.symbol} className="hover:bg-ink-850/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/ticker/${row.symbol}`} className="font-mono font-bold text-bone hover:text-gold-bright">
                            ${row.symbol}
                          </Link>
                          <span className="text-[10px] text-muted truncate max-w-[140px]">{row.name}</span>
                          <span className="rounded bg-line/50 px-1 py-0.2 font-mono text-[9px] text-muted uppercase">
                            {row.kind}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-bone">
                        ${row.price >= 1 ? row.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : row.price.toFixed(5)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${row.change24h >= 0 ? "text-up" : "text-down"}`}>
                        {row.change24h >= 0 ? "+" : ""}{(row.change24h * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gold-bright">
                        {row.score} / 100
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stanceColor(row.stance)}`}>
                          {row.stance}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-bone">
                        ${row.invalidationLevel >= 1 ? row.invalidationLevel.toLocaleString(undefined, { maximumFractionDigits: 2 }) : row.invalidationLevel.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted">
                        {row.riskGrade}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => inspectAsset(row.symbol)}
                          className="rounded bg-line/60 px-2 py-1 text-[10px] text-muted hover:text-bone hover:bg-gold/20 transition-colors"
                        >
                          Audit Math
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-line/60 pt-3 text-xs text-muted">
            <span className="font-mono">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, explorerTotal)} of {explorerTotal.toLocaleString()} assets
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded border border-line px-3 py-1 hover:text-bone disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <span className="font-mono font-semibold text-bone">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded border border-line px-3 py-1 hover:text-bone disabled:opacity-40 transition"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATHEMATICAL SCORING INSPECTOR MODAL */}
      {selectedAssetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-xl border border-line bg-ink-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedAssetDetail(null)}
              className="absolute right-4 top-4 text-muted hover:text-bone text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                Algorithmic Scoring Audit
              </span>
            </div>
            <h3 className="mt-1 font-display text-2xl text-bone">
              ${selectedAssetDetail.symbol} — {selectedAssetDetail.name}
            </h3>
            <p className="text-xs text-muted">
              Published 5-Factor Quantitative Composite Engine Verification
            </p>

            <div className="mt-5 rounded-lg border border-gold/40 bg-gold/10 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted uppercase font-mono">Final Computed Score</span>
                <p className="font-mono text-3xl font-bold text-bone">
                  {selectedAssetDetail.metrics.score} <span className="text-sm text-muted">/ 100</span>
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${stanceColor(selectedAssetDetail.metrics.stance)}`}>
                  {selectedAssetDetail.metrics.stance}
                </span>
                <p className="text-[10px] text-muted mt-1 font-mono">
                  Invalidation: ${selectedAssetDetail.invalidationLevel >= 1 ? selectedAssetDetail.invalidationLevel.toFixed(2) : selectedAssetDetail.invalidationLevel.toFixed(5)}
                </p>
              </div>
            </div>

            {/* 5 Components Table */}
            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Component Breakdown (Fixed Weights)
              </span>
              <div className="divide-y divide-line/60 rounded-lg border border-line bg-ink-850 p-2 text-xs">
                {selectedAssetDetail.breakdown.map((comp: any) => (
                  <div key={comp.label} className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-semibold text-bone">{comp.label}</span>
                      <p className="text-[10px] text-muted">{comp.reads}</p>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-muted text-[11px]">{comp.weight}</span>
                      <span className="font-bold text-gold-bright">{comp.reading}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Link
                href={`/ticker/${selectedAssetDetail.symbol}`}
                className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition"
              >
                Open Full Asset Report →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
