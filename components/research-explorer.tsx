"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, BarChart3, Coins, Flame, Layers } from "lucide-react";
import WhopBadge from "./whop-badge";
import type { Article } from "@/lib/content";

export default function ResearchExplorer({ articles }: { articles: Article[] }) {
  const [activeCategory, setActiveCategory] = useState<"all" | "markets" | "crypto" | "meme">("all");
  const [query, setQuery] = useState("");

  const filtered = articles.filter((a) => {
    const matchesCat = activeCategory === "all" || a.category === activeCategory;
    const matchesQuery =
      !query.trim() ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.dek.toLowerCase().includes(query.toLowerCase()) ||
      a.tickers.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const counts = {
    all: articles.length,
    markets: articles.filter((a) => a.category === "markets").length,
    crypto: articles.filter((a) => a.category === "crypto").length,
    meme: articles.filter((a) => a.category === "meme").length,
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-8">
      {/* 3-Category Menu Switcher Bar (Item 8) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeCategory === "all"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900/75 text-muted hover:text-bone hover:bg-ink-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All 70 Decks ({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("markets")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeCategory === "markets"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900/75 text-muted hover:text-bone hover:bg-ink-900"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Wall Street &amp; Equities ({counts.markets})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("crypto")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeCategory === "crypto"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900/75 text-muted hover:text-bone hover:bg-ink-900"
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Crypto &amp; Digital Assets ({counts.crypto})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("meme")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeCategory === "meme"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900/75 text-muted hover:text-bone hover:bg-ink-900"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Speculative &amp; Meme Alpha ({counts.meme})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 70 dossiers by ticker or topic..."
            className="w-full rounded-xl bg-ink-900/90 pl-9 pr-3.5 py-2 text-xs text-bone placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
        </div>
      </div>

      {/* Grid of Decks */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((article) => (
          <Link
            key={article.slug}
            href={`/research/${article.slug}`}
            className="group flex flex-col justify-between rounded-2xl bg-ink-900/55 p-6 transition-all hover:bg-ink-900/80 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted">
                <span className="text-gold font-mono font-semibold">
                  {article.category === "markets"
                    ? "Wall Street Desk"
                    : article.category === "crypto"
                    ? "Crypto Desk"
                    : "Meme Alpha Desk"}
                </span>
                <div className="flex items-center gap-1.5">
                  <span>{article.readMinutes} min read</span>
                  {article.premium && <WhopBadge size="xs" />}
                </div>
              </div>

              <h3 className="mt-3 font-display text-lg leading-snug text-bone group-hover:text-gold-bright transition-colors line-clamp-2">
                {article.title}
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-3">
                {article.dek}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {article.tickers.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-ink-950/75 px-2 py-0.5 font-mono text-[9px] text-bone/80"
                  >
                    ${t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-2 flex items-center justify-between text-[11px] text-muted">
              <span>{article.author}</span>
              <span className="font-mono text-[10px]">{fmtDate(article.date)}</span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-ink-900/55 p-8 text-center text-sm text-muted">
          No research dossiers found matching &ldquo;{query}&rdquo;.
        </div>
      )}
    </div>
  );
}
