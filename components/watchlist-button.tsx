"use client";

import { useWatchlist } from "@/lib/use-watchlist";

export default function WatchlistButton({
  symbol,
  compact = false,
}: {
  symbol: string;
  compact?: boolean;
}) {
  const { has, toggle, ready } = useWatchlist();
  const active = ready && has(symbol);

  return (
    <button
      type="button"
      onClick={() => toggle(symbol)}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-gold/20 text-gold-bright"
          : "bg-ink-900/80 text-muted hover:bg-ink-900 hover:text-bone"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9z" strokeLinejoin="round" />
      </svg>
      {active ? (compact ? "Watching" : `Watching ${symbol}`) : compact ? "Watch" : `Watch ${symbol}`}
    </button>
  );
}
