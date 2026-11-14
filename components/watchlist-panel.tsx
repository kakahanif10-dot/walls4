"use client";

import Link from "next/link";
import Sparkline from "@/components/sparkline";
import { useWatchlist } from "@/lib/use-watchlist";
import { useAuth } from "@/lib/auth-context";
import { LivePrice, LiveChange } from "@/components/live-price";
import { stanceColor, type Row } from "@/lib/market";

export default function WatchlistPanel({ rows }: { rows: Row[] }) {
  const { symbols, ready, toggle } = useWatchlist();
  const { user, signInWithGoogle } = useAuth();
  const tracked = rows.filter((r) => symbols.includes(r.symbol));

  if (!ready) {
    return <p className="text-sm text-muted">Loading your watchlist…</p>;
  }

  if (!tracked.length) {
    return (
      <div className="rounded-2xl bg-ink-900/55 p-10 text-center">
        <p className="font-display text-xl text-bone">Your watchlist is empty</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Add assets from any coverage page or from an individual trend report. Your watchlist is
          stored in this browser only — no account required.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/markets"
            className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-ink-950 transition hover:bg-gold-bright"
          >
            Browse equities
          </Link>
          <Link
            href="/crypto"
            className="rounded-full bg-ink-950/80 px-5 py-2 text-sm text-bone transition hover:bg-ink-950"
          >
            Browse crypto
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink-900/55 px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-muted">
                Synced to cloud Firestore: <span className="text-bone">{user.email}</span>
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="text-muted">Stored in local browser. Sign in to sync across your devices.</span>
            </>
          )}
        </div>
        {!user && (
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="text-xs text-gold hover:text-gold-bright transition-colors font-medium"
          >
            Sign in with Google →
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-ink-950/65 p-2 sm:p-3">
        <table className="w-full text-left border-separate border-spacing-y-1">
        <thead className="text-[10px] uppercase tracking-[0.16em] text-muted">
          <tr className="bg-ink-900/90">
            <th className="rounded-l-xl px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">24h</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">60-day</th>
            <th className="px-4 py-3 text-right font-medium">Score</th>
            <th className="px-4 py-3 text-right font-medium">Stance</th>
            <th className="rounded-r-xl px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {tracked.map((row) => (
            <tr key={row.symbol} className="group transition-colors hover:bg-ink-900/55">
              <td className="rounded-l-xl px-4 py-3.5">
                <Link href={`/ticker/${row.symbol}`} className="flex flex-col">
                  <span className="font-mono text-sm font-semibold text-bone group-hover:text-gold-bright">
                    {row.symbol}
                  </span>
                  <span className="text-xs text-muted">{row.name}</span>
                </Link>
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-sm text-bone">
                <LivePrice symbol={row.symbol} base={row.price} />
              </td>
              <td className="hidden px-4 py-3.5 text-right font-mono text-sm sm:table-cell">
                <LiveChange symbol={row.symbol} change={row.change24h} />
              </td>
              <td className="hidden px-4 py-3.5 md:table-cell">
                <Sparkline values={row.spark} />
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-sm text-bone">{row.score}</td>
              <td className="px-4 py-3.5 text-right">
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] ${stanceColor(row.stance)}`}>
                  {row.stance}
                </span>
              </td>
              <td className="rounded-r-xl px-4 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => toggle(row.symbol)}
                  className="text-xs text-muted transition hover:text-down"
                  aria-label={`Remove ${row.symbol} from watchlist`}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
