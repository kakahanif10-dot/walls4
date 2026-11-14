import type { Metadata } from "next";
import Link from "next/link";
import WatchlistPanel from "@/components/watchlist-panel";
import WhopBadge from "@/components/whop-badge";
import { rowsFor } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Your watchlist",
  description:
    "The assets you follow, with their current trend score, stance and change — stored locally in your browser.",
};

export default async function WatchlistPage() {
  await ensureMarketData();
  const rows = rowsFor();

  return (
    <div>
      <section className="grain">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Personal</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl text-bone flex items-center">
            <span>Your watchlist</span>
            <WhopBadge className="ml-2 align-middle text-2xl" />
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            Everything you have starred across all 2,038+ assets, with live trend scores,
            stances, and alert thresholds synced for Lifetime Premium members.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <WatchlistPanel rows={rows} />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-ink-900/55 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">How to add</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Use the star button on any coverage table or asset report. Changes sync across tabs in
              this browser instantly.
            </p>
          </div>
          <div className="rounded-2xl bg-ink-900/55 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Premium alerts</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Premium adds score-change alerts: an email when a tracked asset moves across a stance
              band (for example Hold → Trim) or its invalidation level is breached.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-block text-xs text-bone/85 underline decoration-muted/40 underline-offset-2 hover:text-gold-bright"
            >
              Compare plans
            </Link>
          </div>
          <div className="rounded-2xl bg-ink-900/55 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Discipline</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A watchlist is not a shopping list. Use it to track structure and invalidation levels,
              not to collect conviction you have not earned.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
