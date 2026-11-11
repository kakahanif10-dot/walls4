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
  Sparkles,
  Lock,
  Key,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

type SortKey = "score" | "change24h" | "change30d" | "name";

const STANCES = ["All", "Buy", "Accumulate", "Hold", "Trim", "Avoid"] as const;
const PREVIEW_LIMIT = 8;

function dayTradeBadgeColor(bias: string) {
  switch (bias) {
    case "LONG SCALP":
      return "text-emerald-400 bg-emerald-500/15 border-emerald-500/40";
    case "SHORT SCALP":
      return "text-rose-400 bg-rose-500/15 border-rose-500/40";
    case "RANGE BREAK":
      return "text-gold-bright bg-gold/15 border-gold/40";
    default:
      return "text-bone bg-ink-800 border-line";
  }
}

function swingLongBadgeColor(bias: string) {
  switch (bias) {
    case "STAGE 2 EXPANSION":
      return "text-emerald-400 bg-emerald-500/15 border-emerald-500/40";
    case "CORE ACCUMULATE":
    case "CYCLE LONG":
      return "text-gold-bright bg-gold/15 border-gold/40";
    case "HOLD / REBALANCE":
      return "text-bone bg-ink-800 border-line";
    default:
      return "text-amber-400 bg-amber-500/15 border-amber-500/40";
  }
}

export default function MarketExplorer({ rows }: { rows: Row[] }) {
  const { isUnlocked, openWhopModal } = useWhop();

  const [query, setQuery] = useState("");
  const [stance, setStance] = useState<(typeof STANCES)[number]>("All");
  const [sector, setSector] = useState<string>("All Sectors");
  const [sort, setSort] = useState<SortKey>("score");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(0);

  // Extract unique sectors/groups from rows
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.group) {
        const main = r.group.split("/")[0].trim();
        set.add(main);
      }
    });
    return ["All Sectors", ...Array.from(set).slice(0, 8)];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => {
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
  }, [rows, query, stance, sector, sort]);

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
      // In preview mode, allow viewing the first PREVIEW_LIMIT assets
      return filtered.slice(0, PREVIEW_LIMIT);
    }
    if (isShowAll) return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, effectivePageSize, isShowAll, isUnlocked]);

  return (
    <div>
      {/* WSJ Institutional Status Banner & Mode Controls */}
      <div className="mb-4 rounded-xl border border-gold/30 bg-gold/[0.04] p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="live-dot h-2 w-2 rounded-full bg-up shrink-0" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm sm:text-base font-semibold text-bone">
                {isUnlocked
                  ? `Full Universe Active: ${filtered.length} of ${rows.length} Assets Loaded`
                  : `Member Only Preview: 8 of ${rows.length}+ Scored Assets`}
              </span>
              <WhopBadge variant={isUnlocked ? "plus" : "wsj"} />
              <span className="rounded bg-gold/15 border border-gold/40 px-2 py-0.5 text-[10px] font-mono font-bold text-gold-bright">
                {isUnlocked
                  ? isShowAll
                    ? "ALL ASSETS UNLOCKED"
                    : `Page ${currentPage}/${totalPages}`
                  : "FREE PREVIEW MODE"}
              </span>
            </div>
            <p className="text-[11px] text-muted leading-tight mt-0.5">
              {isUnlocked
                ? "Full institutional feed active. Real-time intraday Day Trading and multi-week Swing models unlocked."
                : "You are currently viewing an institutional preview. Subscribe with Whop to unlock the complete 2,000+ universe and full live data."}
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={handleViewAllClick}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              isUnlocked && isShowAll
                ? "bg-gold text-ink-950 shadow-md ring-1 ring-gold"
                : "border border-gold/40 bg-gold/10 text-gold-bright hover:bg-gold/20"
            }`}
          >
            <span>⚡ View All ({rows.length})</span>
            {!isUnlocked && <WhopBadge variant="pro" className="ml-1" />}
          </button>

          {isUnlocked && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPageSize(100);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  pageSize === 100
                    ? "bg-gold text-ink-950 font-semibold"
                    : "border border-line bg-ink-900 text-muted hover:text-bone"
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
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  pageSize === 50
                    ? "bg-gold text-ink-950 font-semibold"
                    : "border border-line bg-ink-900 text-muted hover:text-bone"
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
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                stance === s
                  ? "border border-gold bg-gold/15 font-semibold text-gold-bright"
                  : "border border-line bg-ink-900 text-muted hover:text-bone"
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
              placeholder={`Search ${rows.length}+ symbols, companies or themes...`}
              className="w-full rounded-full border border-line bg-ink-900 px-4 py-1.5 text-xs sm:text-sm text-bone placeholder:text-muted/70 focus:border-gold/50 focus:outline-none lg:w-72"
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
            className="rounded-full border border-line bg-ink-900 px-3 py-1.5 text-xs text-bone focus:border-gold/50 focus:outline-none"
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
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] transition-all ${
                sector === sec
                  ? "border border-gold/60 bg-gold/20 text-gold-bright font-semibold"
                  : "border border-line/70 bg-ink-900/80 text-muted hover:text-bone"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}

      {/* Institutional Table with Day Trade and Long-Term / Swing Columns */}
      <div className="overflow-x-auto rounded-xl border border-line bg-ink-950">
        <table className="w-full text-left">
          <thead className="bg-ink-900 text-[10px] uppercase tracking-[0.16em] text-muted border-b border-line">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Asset</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Theme</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">24h</th>
              {/* NEW COLUMN 1: Day Trade (Intraday) */}
              <th className="px-4 py-3 text-left font-medium">Day Trade (Intraday)</th>
              {/* NEW COLUMN 2: Long-Term / Swing */}
              <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Long-Term / Swing</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">Trend</th>
              <th className="px-4 py-3 text-right font-medium">Score</th>
              <th className="px-4 py-3 text-right font-medium">Stance</th>
              <th className="hidden px-4 py-3 md:table-cell" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {displayedRows.map((row) => (
              <tr key={row.symbol} className="group transition-colors hover:bg-ink-850/60">
                {/* Asset Identity */}
                <td className="px-4 py-3.5">
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
                  <LivePrice symbol={row.symbol} base={row.price} />
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-sm">
                  <LiveChange symbol={row.symbol} change={row.change24h} />
                </td>

                {/* NEW COLUMN 1: Day Trade (Intraday) */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${dayTradeBadgeColor(
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
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${swingLongBadgeColor(
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
                    <div className="hidden h-1 w-12 overflow-hidden rounded-full bg-line sm:block">
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
                <td className="px-4 py-3.5 text-right">
                  <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] ${stanceColor(row.stance)}`}>
                    {row.stance}
                  </span>
                </td>

                {/* Watchlist */}
                <td className="hidden px-4 py-3.5 text-right md:table-cell">
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

        {/* WSJ-STYLE MEMBER ONLY PAYWALL BANNER (When free user views beyond preview) */}
        {!isUnlocked && filtered.length > PREVIEW_LIMIT && (
          <div className="border-t border-gold/30 bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950 px-6 py-8 text-center">
            <div className="mx-auto max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-3 py-1 text-[11px] text-gold-bright font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span>MEMBER ONLY · WALL STREET JOURNAL GRADE TAPE</span>
                <WhopBadge variant="plus" className="ml-0" />
              </div>

              <h4 className="font-display text-2xl text-bone">
                Viewing Free Preview ({PREVIEW_LIMIT} of {filtered.length} Scored Assets)
              </h4>

              <p className="text-xs text-muted leading-relaxed">
                Unlock the complete <strong className="text-bone">2,000+ asset universe</strong>, real-time Nasdaq, Coinbase &amp; Binance algorithmic scoring, institutional Day Trading scalp targets, and multi-month Swing invalidations with your active Whop Member Pass.
              </p>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openWhopModal("View All 2,000+ Scored Assets")}
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow-xl"
                >
                  <Key className="h-4 w-4" />
                  <span>Unlock Full Terminal Access via Whop</span>
                  <WhopBadge variant="plus" className="ml-0 text-[10px]" />
                </button>

                <Link
                  href="/pricing"
                  className="rounded-full border border-line bg-ink-900 px-5 py-3 text-xs font-semibold text-bone hover:border-gold/50 transition"
                >
                  View Plans &amp; Billing
                </Link>
              </div>

              <p className="text-[10px] text-muted/70 pt-1">
                Instant activation with Whop checkout or license key. Cancel anytime with one click.
              </p>
            </div>
          </div>
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-900 transition hover:border-gold/40 hover:text-bone disabled:opacity-30"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-900 transition hover:border-gold/40 hover:text-bone disabled:opacity-30"
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-900 transition hover:border-gold/40 hover:text-bone disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-900 transition hover:border-gold/40 hover:text-bone disabled:opacity-30"
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
