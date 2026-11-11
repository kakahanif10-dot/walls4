"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, BarChart3, Globe, Coins, Flame, Cpu, ArrowUpRight, CheckCircle2 } from "lucide-react";
import WhopBadge from "./whop-badge";
import { ANALYST_DESKS_44, type AnalystDesk, CATEGORY_LABELS } from "@/lib/analyst-desks";

export default function AnalystDesksCatalog() {
  const [activeCategory, setActiveCategory] = useState<"all" | "equities" | "macro" | "crypto" | "meme" | "quant">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setSearch(q);
  }, []);

  const filteredDesks = ANALYST_DESKS_44.filter((desk) => {
    const matchesCat = activeCategory === "all" || desk.category === activeCategory;
    const matchesSearch =
      !search.trim() ||
      desk.name.toLowerCase().includes(search.toLowerCase()) ||
      desk.leadAnalyst.toLowerCase().includes(search.toLowerCase()) ||
      desk.summary.toLowerCase().includes(search.toLowerCase()) ||
      desk.focusTickers.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      desk.keyMetric.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categoryIcons = {
    all: null,
    equities: BarChart3,
    macro: Globe,
    crypto: Coins,
    meme: Flame,
    quant: Cpu,
  };

  const counts = {
    all: ANALYST_DESKS_44.length,
    equities: ANALYST_DESKS_44.filter((d) => d.category === "equities").length,
    macro: ANALYST_DESKS_44.filter((d) => d.category === "macro").length,
    crypto: ANALYST_DESKS_44.filter((d) => d.category === "crypto").length,
    meme: ANALYST_DESKS_44.filter((d) => d.category === "meme").length,
    quant: ANALYST_DESKS_44.filter((d) => d.category === "quant").length,
  };

  return (
    <div className="space-y-8">
      {/* Category Pills & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-line/60 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategory === "all"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900 border border-line text-muted hover:text-bone"
            }`}
          >
            <span>All 44 Desks ({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("equities")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategory === "equities"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900 border border-line text-muted hover:text-bone"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Equities &amp; Growth ({counts.equities})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("macro")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategory === "macro"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900 border border-line text-muted hover:text-bone"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Macro &amp; Rates ({counts.macro})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("crypto")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategory === "crypto"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900 border border-line text-muted hover:text-bone"
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Crypto &amp; Flows ({counts.crypto})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("meme")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategory === "meme"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900 border border-line text-muted hover:text-bone"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Speculative &amp; Meme ({counts.meme})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("quant")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategory === "quant"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900 border border-line text-muted hover:text-bone"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Quant &amp; Risk ({counts.quant})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 44 desks, lead analysts, or symbols..."
            className="w-full rounded-xl border border-line bg-ink-900 pl-9 pr-3.5 py-2 text-xs text-bone placeholder:text-muted/50 focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Desk Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredDesks.map((desk, idx) => (
          <div
            key={desk.id}
            className="group flex flex-col justify-between rounded-xl border border-line bg-ink-900/50 p-5 transition-all hover:border-gold/50 hover:bg-ink-900 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span className="font-mono text-gold font-semibold">
                  Desk {String(idx + 1).padStart(2, "0")}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold ${
                    desk.status.includes("High Volatility")
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      : desk.status.includes("Live Order Flow")
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : desk.status.includes("Pre-Market")
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      : "bg-ink-800 text-bone/80 border border-line"
                  }`}
                >
                  {desk.status}
                </span>
              </div>

              <div className="mt-3 flex items-start justify-between gap-2">
                <h3 className="font-display text-base text-bone leading-snug group-hover:text-gold-bright transition-colors">
                  {desk.name}
                </h3>
                {desk.proOnly && <WhopBadge size="xs" />}
              </div>

              <p className="mt-2 text-xs text-muted line-clamp-3 leading-relaxed">
                {desk.summary}
              </p>

              {/* Key Metric & Focus Tickers */}
              <div className="mt-3.5 rounded-lg border border-line/60 bg-ink-950 p-2.5 text-[11px] space-y-1.5 font-mono">
                <div className="flex justify-between items-center text-muted">
                  <span className="text-[10px] uppercase">Key Metric:</span>
                  <span className="text-bone/90 font-semibold truncate ml-1">{desk.keyMetric}</span>
                </div>
                <div className="flex items-center gap-1 pt-1 border-t border-line/40 flex-wrap">
                  <span className="text-[10px] text-muted mr-1">Focus:</span>
                  {desk.focusTickers.map((t) => (
                    <Link
                      key={t}
                      href={`/ticker/${t.replace("-PERP", "")}`}
                      className="rounded bg-ink-850 px-1.5 py-0.2 text-[9px] text-gold hover:text-gold-bright transition border border-line/60"
                    >
                      ${t}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-line/60 pt-3 flex items-center justify-between text-[11px]">
              <div>
                <p className="text-bone/90 font-medium">{desk.leadAnalyst}</p>
                <p className="text-[10px] text-muted">{desk.role}</p>
              </div>
              <Link
                href={desk.category === "crypto" ? "/crypto" : desk.category === "meme" ? "/meme-coins" : "/markets"}
                className="text-xs text-gold flex items-center gap-0.5 hover:text-gold-bright font-semibold group-hover:translate-x-0.5 transition-transform"
              >
                <span>Audit</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredDesks.length === 0 && (
        <div className="rounded-xl border border-line bg-ink-900 p-8 text-center text-sm text-muted">
          No analyst desks found matching &ldquo;{search}&rdquo;.
        </div>
      )}
    </div>
  );
}
