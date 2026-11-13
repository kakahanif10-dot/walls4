"use client";

import { useWhop } from "@/lib/whop-context";
import WhopBadge from "@/components/whop-badge";

export default function PremiumGate({
  children,
  issue,
}: {
  children: React.ReactNode;
  issue: string;
}) {
  const { isUnlocked } = useWhop();

  if (isUnlocked) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-2.5 text-xs text-gold-bright">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span>Membership verified by the server. Premium research is available.</span>
          </div>
          <WhopBadge />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative rounded-xl border border-line bg-ink-900/95 p-7 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Lifetime Premium</p>
        <h3 className="mt-2 font-display text-2xl text-bone">Continue reading “{issue}”</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Full research, invalidation levels, and model details require a verified one-time purchase.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-line px-5 py-2.5 text-sm text-muted" role="status">
            Payment verification unavailable
          </span>
          <a
            href="/pricing"
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-gold-bright"
          >
            View plans
          </a>
        </div>
        <p className="mt-4 text-[11px] text-muted/60">
          Full article text is withheld until server-side payment verification is configured.
        </p>
      </div>
    </div>
  );
}
