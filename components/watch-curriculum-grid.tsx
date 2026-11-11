"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Coins, Flame, Layers, Search, Play } from "lucide-react";
import WhopBadge from "./whop-badge";
import type { VideoLesson } from "@/lib/academy-videos";

export default function WatchCurriculumGrid({ lessons }: { lessons: VideoLesson[] }) {
  const [activeCategory, setActiveCategory] = useState<"all" | "markets" | "crypto" | "meme">("all");
  const [query, setQuery] = useState("");

  const filtered = lessons.filter((l) => {
    const matchesCat = activeCategory === "all" || (l as any).category === activeCategory;
    const matchesQuery =
      !query.trim() ||
      l.title.toLowerCase().includes(query.toLowerCase()) ||
      l.summary.toLowerCase().includes(query.toLowerCase()) ||
      l.module.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const counts = {
    all: lessons.length,
    markets: lessons.filter((l) => (l as any).category === "markets").length,
    crypto: lessons.filter((l) => (l as any).category === "crypto").length,
    meme: lessons.filter((l) => (l as any).category === "meme").length,
  };

  return (
    <div className="space-y-6">
      {/* 3-Category Switcher & Search (Item 8) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-line/60 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeCategory === "all"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900 border border-line text-muted hover:text-bone"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All 60 Masterclasses ({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("markets")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeCategory === "markets"
                ? "bg-gold text-ink-950 shadow"
                : "bg-ink-900 border border-line text-muted hover:text-bone"
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
                : "bg-ink-900 border border-line text-muted hover:text-bone"
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
                : "bg-ink-900 border border-line text-muted hover:text-bone"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Speculative &amp; Meme Alpha ({counts.meme})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 60 video masterclasses..."
            className="w-full rounded-xl border border-line bg-ink-900 pl-9 pr-3.5 py-2 text-xs text-bone placeholder:text-muted/50 focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of 60 Video Lessons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((lesson, idx) => (
          <Link
            key={lesson.id}
            href={`/academy/watch?lesson=${lesson.id}#video-studio-player`}
            className="group flex flex-col justify-between rounded-xl border border-line bg-ink-900/60 p-4 transition-all hover:border-gold/60 hover:bg-ink-900 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span className="font-mono text-gold font-semibold">
                  Lesson {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="rounded bg-ink-800 px-2 py-0.5 text-[10px] font-mono text-bone/90">
                  {lesson.durationLabel}
                </span>
              </div>
              <h4 className="mt-2.5 font-display text-base text-bone line-clamp-2 leading-snug group-hover:text-gold-bright transition-colors">
                {lesson.title}
              </h4>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-line/50 px-1.5 py-0.5 text-[9px] font-mono text-muted">
                  {lesson.module}
                </span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                  {lesson.level}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted line-clamp-3 leading-relaxed">
                {lesson.summary}
              </p>
            </div>

            <div className="mt-4 border-t border-line/60 pt-3 flex items-center justify-between">
              <p className="text-[11px] text-muted truncate">{lesson.instructor}</p>
              <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-gold group-hover:translate-x-0.5 transition-transform">
                <span>Watch</span>
                {idx > 0 && <WhopBadge size="xs" />}
                <Play className="h-3 w-3 fill-gold" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
