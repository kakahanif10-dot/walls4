"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Sparkline from "@/components/sparkline";
import WatchlistButton from "@/components/watchlist-button";
import WhopBadge from "@/components/whop-badge";
import { LivePrice, LiveChange } from "@/components/live-price";
import { fmtPct, stanceColor, type Row } from "@/lib/market";
import { useWhop } from "@/lib/whop-context";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type SortKey = "score" | "change24h" | "change30d" | "name";

const STANCES = ["All", "Buy", "Accumulate", "Hold", "Trim", "Avoid"] as const;

function dayTradeBadgeColor(bias: string) {
  switch (bias) {
    case "LONG SCALP":
      return "text-emerald-400 bg-emerald-500/15";
    case "SHORT SCALP":
      return "text-rose-400 bg-rose-500/15";
    case "RANGE BREAK":
      return "text-gold-bright bg-gold/15";
    default:
      return "text-bone bg-ink-850";
  }
}

function swingLongBadgeColor(bias: string) {
  switch (bias) {
    case "STAGE 2 EXPANSION":
      return "text-emerald-400 bg-emerald-500/15";
    case "CORE ACCUMULATE":
    case "CYCLE LONG":
      return "text-gold-bright bg-gold/15";
    case "HOLD / REBALANCE":
      return "text-bone bg-ink-850";
    default:
      return "text-amber-400 bg-amber-500/15";
  }
}

type AssetTab = "core" | "speculative";

export default function MarketExplorer({
  rows,
  speculativeRows,
  initialTab = "core",
}: {
  rows: Row[];
  speculativeRows?: Row[];
  initialTab?: AssetTab;
}) {
  const { isUnlocked, openWhopModal } = useWhop();

  const [activeTab, setActiveTab] = useState<AssetTab>(initialTab);
  const [query, setQuery] = useState("");
  const [stance, setStance] = useState<(typeof STANCES)[number]>("All");
  const [sector, setSector] = useState<string>("All Sectors");
  const [sort, setSort] = useState<SortKey>("score");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(0);

  const hasSubTabs = Boolean(speculativeRows && speculativeRows.length > 0);
  const activeRows = useMemo(
    () => (hasSubTabs && activeTab === "speculative" ? speculativeRows! : rows),
    [hasSubTabs, activeTab, speculativeRows, rows],
  );

  // Extract unique sectors/groups from active rows
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    activeRows.forEach((r) => {
      if (r.group) {
        const main = r.group.split("/")[0].trim();
        set.add(main);
      }
    });
    return ["All Sectors", ...Array.from(set).slice(0, 8)];
  }, [activeRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = activeRows.filter((row) => {
      const matchesQuery =
        !q ||
        row.symbol.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q);
      const matchesStance = stance === "All" || row.stance === stance;
      const matchesSector =
        sector === "All Sectors" ||
        row.group.toLowerCase().includes(sector.toLowerCase());
      return matchesQuery && matchesStance && matchesSector;
    });

    return [...list].sort((a, b) => {
      if (sort === "name") return a.symbol.localeCompare(b.symbol);
      return (b[sort] as number) - (a[sort] as number);
    });
  }, [activeRows, query, stance, sector, sort]);

  const handleTabChange = (tab: AssetTab) => {
    setActiveTab(tab);
    setSector("All Sectors");
    setStance("All");
    setQuery("");
    setPage(1);
  };

  // Reset to page 1 when filters change
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(1);
  };

  const handleStanceChange = (s: (typeof STANCES)[number]) => {
    setStance(s);
    setPage(1);
  };

  const handleSectorChange = (sec: string) => {
    setSector(sec);
    setPage(1);
  };

  const handleViewAllClick = () => {
    if (!isUnlocked) {
      openWhopModal("View All 2,000+ Universe & Day Trade Alpha");
      return;
    }
    setPageSize(0);
    setPage(1);
  };

  const isShowAll = pageSize === 0;
  const effectivePageSize = isShowAll ? filtered.length || 1 : pageSize;
  const totalPages = isShowAll ? 1 : Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const currentPage = Math.min(page, totalPages);

  const displayedRows = useMemo(() => {
    if (!isUnlocked) {
      return [];
    }
    if (isShowAll) return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize, isShowAll, isUnlocked]);

  if (!isUnlocked) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-gradient-to-b from-[#15120c] via-ink-900/95 to-ink-950 p-6 sm:p-7 text-center shadow-2xl space-y-4">
        <h3 className="font-display text-2xl text-bone">
          Continue to Lifetime Premium checkout
        </h3>
        <p className="text-xs leading-relaxed text-muted">
          Get every research piece, full crypto and meme-coin coverage, all four Academy courses,
          score-change alerts, and all 2,038+ scored assets with one $1,487 USD lifetime purchase.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => openWhopModal("All 2,038+ Scored Assets")}
            className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-xs font-bold text-ink-950 transition hover:bg-gold-bright shadow-lg"
          >
            Unlock Lifetime Premium — $1,487 USD
          </button>
          <Link
            href="/pricing"
            className="rounded-full bg-ink-900 px-5 py-3 text-xs font-semibold text-bone transition hover:bg-ink-850"
          >
            Purchase details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Institutional Sub-Tabs for Consolidated Digital Assets */}
      {hasSubTabs && (
        <div
          role="tablist"
          aria-label="Digital Assets Universe"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-900/55 p-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "core"}
              onClick={() => handleTabChange("core")}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                activeTab === "core"
                  ? "bg-gold text-ink-950 font-semibold shadow-sm"
                  : "text-muted hover:bg-ink-850 hover:text-bone"
              }`}
            >
              Core Digital Assets (BTC/ETH)
              <span className="ml-2 font-mono text-[11px] opacity-80">({rows.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "speculative"}
              onClick={() => handleTabChange("speculative")}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                activeTab === "speculative"
                  ? "bg-gold text-ink-950 font-semibold shadow-sm"
                  : "text-muted hover:bg-ink-850 hover:text-bone"
              }`}
            >
              Speculative &amp; High-Beta Risk
              <span className="ml-2 font-mono text-[11px] opacity-80">({speculativeRows?.length ?? 0})</span>
            </button>
          </div>
          <span className="px-2 text-[11px] text-muted">
            {activeTab === "speculative"
              ? "Hard 2% allocation ceiling · liquidity-first risk grading"
              : "Spot ETF flows, Layer-1/2 infrastructure & macro liquidity"}
          </span>
        </div>
      )}

      {/* Institutional Status Banner & Mode Controls */}
      <div className="mb-5 rounded-2xl bg-ink-900/55 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="live-dot h-2 w-2 rounded-full bg-up shrink-0" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm sm:text-base font-semibold text-bone">
                Full Universe Active: {filtered.length} of {activeRows.length} Assets Loaded
              </span>
              <WhopBadge variant="plus" />
              <span className="rounded-md bg-gold/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-gold-bright">
                {isShowAll ? "ALL ASSETS UNLOCKED" : `Page ${currentPage}/${totalPages}`}
              </span>
            </div>
            <p className="text-[11px] text-muted leading-tight mt-0.5">
              Full institutional feed active. Real-time intraday Day Trading and multi-week Swing models unlocked.
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={handleViewAllClick}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isShowAll
                ? "bg-gold text-ink-950 shadow-md"
                : "bg-gold/15 text-gold-bright hover:bg-gold/25"
            }`}
          >
            <span>View All ({activeRows.length})</span>
          </button>

          {isUnlocked && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPageSize(100);
                  setPage(1);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  pageSize === 100
                    ? "bg-gold text-ink-950 font-semibold"
                    : "bg-ink-950/75 text-muted hover:text-bone hover:bg-ink-950"
                }`}
              >
                100 / page
              </button>
              <button
                type="button"
                onClick={() => {
                  setPageSize(50);
                  setPage(1);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  pageSize === 50
                    ? "bg-gold text-ink-950 font-semibold"
                    : "bg-ink-950/75 text-muted hover:text-bone hover:bg-ink-950"
                }`}
              >
                50 / page
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Stance Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mr-1">Stance:</span>
          {STANCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStanceChange(s)}
              className={`rounded-full px-3.5 py-1 text-xs transition-all ${
                stance === s
                  ? "bg-gold/20 font-semibold text-gold-bright"
                  : "bg-ink-900/75 text-muted hover:text-bone hover:bg-ink-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={`Search ${activeRows.length}+ symbols, companies or themes...`}
              className="w-full rounded-full bg-ink-900/90 px-4 py-1.5 text-xs sm:text-sm text-bone placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-gold/40 lg:w-72"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                className="absolute right-3 top-2 text-xs text-muted hover:text-bone"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full bg-ink-900/90 px-3.5 py-1.5 text-xs text-bone focus:outline-none focus:ring-1 focus:ring-gold/40"
            aria-label="Sort assets"
          >
            <option value="score">Sort: Highest Score</option>
            <option value="change24h">Sort: 24h Change</option>
            <option value="change30d">Sort: 30d Momentum</option>
            <option value="name">Sort: Ticker A-Z</option>
          </select>
        </div>
      </div>

      {/* Sector Quick Filter Pills */}
      {availableSectors.length > 2 && (
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted shrink-0 mr-1">Sector:</span>
          {availableSectors.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleSectorChange(sec)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                sector === sec
                  ? "bg-gold/20 text-gold-bright font-semibold"
                  : "bg-ink-900/75 text-muted hover:text-bone hover:bg-ink-900"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}

      {/* Institutional Table with Day Trade and Long-Term / Swing Columns */}
      <div className="overflow-x-auto rounded-2xl bg-ink-950/65 p-2 sm:p-3">
        <table className="w-full text-left border-separate border-spacing-y-1">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-muted">
            <tr className="bg-ink-900/90">
              <th className="rounded-l-xl px-4 py-3 text-left font-medium">Asset</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Theme</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">24h</th>
              {/* NEW COLUMN 1: Day Trade (Intraday) */}
              <th className="px-4 py-3 text-left font-medium">Day Trade (Intraday)</th>
              {/* NEW COLUMN 2: Long-Term / Swing */}
              <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Long-Term / Swing</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">Trend</th>
              <th className="px-4 py-3 text-right font-medium">Score</th>
              <th className="px-4 py-3 text-right font-medium md:rounded-none rounded-r-xl">Stance</th>
              <th className="hidden rounded-r-xl px-4 py-3 md:table-cell" />
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row) => (
              <tr key={row.symbol} className="group transition-colors hover:bg-ink-900/55">
                {/* Asset Identity */}
                <td className="rounded-l-xl px-4 py-3.5">
                  <Link href={`/ticker/${row.symbol}`} className="flex items-center gap-3">
                    <span className="flex flex-col">
                      <span className="font-mono text-sm font-semibold text-bone group-hover:text-gold-bright">
                        {row.symbol}
                      </span>
                      <span className="text-xs text-muted max-w-[140px] sm:max-w-none truncate">{row.name}</span>
                    </span>
                  </Link>
                </td>

                {/* Theme / Sector */}
                <td className="hidden px-4 py-3.5 text-xs text-muted md:table-cell max-w-[160px] truncate">
                  {row.group}
                </td>

                {/* Price & Change */}
                <td className="px-4 py-3.5 text-right font-mono text-sm text-bone">
                  <LivePrice symbol={row.symbol} base={row.price} kind={row.kind} />
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-sm">
                  <LiveChange symbol={row.symbol} change={row.change24h} />
                </td>

                {/* NEW COLUMN 1: Day Trade (Intraday) */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${dayTradeBadgeColor(
                          row.dayTrade.bias
                        )}`}
                      >
                        {row.dayTrade.bias}
                      </span>
                      <span className="text-[10px] font-mono text-muted hidden sm:inline">
                        {row.dayTrade.vwapBias}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
                      <span>
                        Tgt:{" "}
                        <strong className="text-bone">
                          $
                          {row.dayTrade.intradayTarget.toLocaleString(undefined, {
                            minimumFractionDigits: row.dayTrade.intradayTarget < 1 ? 4 : 2,
                            maximumFractionDigits: row.dayTrade.intradayTarget < 1 ? 6 : 2,
                          })}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Stop:{" "}
                        <span className="text-rose-400">
                          $
                          {row.dayTrade.intradayStop.toLocaleString(undefined, {
                            minimumFractionDigits: row.dayTrade.intradayStop < 1 ? 4 : 2,
                            maximumFractionDigits: row.dayTrade.intradayStop < 1 ? 6 : 2,
                          })}
                        </span>
                      </span>
                    </div>
                  </div>
                </td>

                {/* NEW COLUMN 2: Long-Term / Swing */}
                <td className="hidden px-4 py-3.5 lg:table-cell">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${swingLongBadgeColor(
                          row.swingLong.bias
                        )}`}
                      >
                        {row.swingLong.bias}
                      </span>
                      <span className="text-[10px] font-mono text-gold-bright font-semibold">
                        R:R {row.swingLong.riskReward}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
                      <span>
                        Inv:{" "}
                        <strong className="text-bone">
                          $
                          {row.swingLong.macroInvalidation.toLocaleString(undefined, {
                            minimumFractionDigits: row.swingLong.macroInvalidation < 1 ? 4 : 2,
                            maximumFractionDigits: row.swingLong.macroInvalidation < 1 ? 6 : 2,
                          })}
                        </strong>
                      </span>
                      <span>·</span>
                      <span className="text-muted/80">{row.swingLong.timeHorizon}</span>
                    </div>
                  </div>
                </td>

                {/* Sparkline */}
                <td className="hidden px-4 py-3.5 xl:table-cell">
                  <Sparkline values={row.spark} width={80} />
                </td>

                {/* Composite Trend Score */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="hidden h-1 w-12 overflow-hidden rounded-full bg-ink-850 sm:block">
                      <div
                        className={`h-full rounded-full ${
                          row.score >= 66 ? "bg-up" : row.score >= 47 ? "bg-gold" : "bg-down"
                        }`}
                        style={{ width: `${row.score}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm text-bone">{row.score}</span>
                  </div>
                </td>

                {/* Stance */}
                <td className="px-4 py-3.5 text-right md:rounded-none rounded-r-xl">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] ${stanceColor(row.stance)}`}>
                    {row.stance}
                  </span>
                </td>

                {/* Watchlist */}
                <td className="hidden rounded-r-xl px-4 py-3.5 text-right md:table-cell">
                  <WatchlistButton symbol={row.symbol} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {!filtered.length && (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No assets match that filter. Try a different stance or clear the search.
          </p>
        )}
      </div>

      {/* Pagination Bar (Only when unlocked and paged) */}
      {isUnlocked && !isShowAll && filtered.length > pageSize && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 py-2 text-xs text-muted">
          <div>
            Showing{" "}
            <span className="font-mono font-medium text-bone">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-mono font-medium text-bone">{filtered.length}</span> assets
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900/80 transition hover:bg-ink-900 hover:text-bone disabled:opacity-30"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900/80 transition hover:bg-ink-900 hover:text-bone disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 font-mono text-bone">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900/80 transition hover:bg-ink-900 hover:text-bone disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900/80 transition hover:bg-ink-900 hover:text-bone disabled:opacity-30"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
