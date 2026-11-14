"use client";

import Link from "next/link";
import { useWhop } from "@/lib/whop-context";

export default function PremiumGate({
  children,
  issue,
}: {
  children: React.ReactNode;
  issue: string;
}) {
  const { isUnlocked, openWhopModal } = useWhop();

  if (isUnlocked) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between gap-2 rounded-xl bg-gold/10 px-4 py-2.5 text-xs text-gold-bright">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span>Lifetime Premium active. Institutional models and invalidation stops unlocked.</span>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-ink-900/75 p-6 sm:p-7 text-center space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
        Lifetime Premium
      </p>
      <h3 className="font-display text-2xl text-bone">Continue reading “{issue}”</h3>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
        Get every research piece, full crypto and meme-coin coverage, all four Academy courses,
        score-change alerts, and model portfolio access with one $1,487 USD lifetime purchase.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => openWhopModal(issue)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-bright shadow-md"
        >
          <span>Continue to Lifetime Premium checkout</span>
        </button>
        <Link
          href="/pricing"
          className="rounded-full bg-ink-950/75 px-5 py-2.5 text-sm text-bone transition hover:bg-ink-850 hover:text-gold-bright"
        >
          Purchase details
        </Link>
      </div>
    </div>
  );
}
