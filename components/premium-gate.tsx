"use client";

import { useState } from "react";
import { useWhop } from "@/lib/whop-context";
import WhopBadge from "@/components/whop-badge";

export default function PremiumGate({
  children,
  issue,
}: {
  children: React.ReactNode;
  issue: string;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const { isUnlocked, badge, openWhopModal } = useWhop();

  if (unlocked || isUnlocked) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-2.5 text-xs text-gold-bright">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span>
              {isUnlocked
                ? "PRO Membership active via Whop verification. Institutional models and raw invalidation stops unlocked."
                : "Preview unlocked for this session. In production this dossier is reserved for PRO subscribers."}
            </span>
          </div>
          <WhopBadge />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none max-h-72 select-none overflow-hidden opacity-60 blur-[3px]">
        {children}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 via-ink-950/90 to-transparent" />
      <div className="relative -mt-16 rounded-xl border border-line bg-ink-900/95 p-7 text-center">
        <p className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          <span>Institutional Research</span>
          <WhopBadge className="ml-1.5" />
        </p>
        <h3 className="mt-2 font-display text-2xl text-bone">Continue reading “{issue}”</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Full-position mathematical reasoning, invalidation anchors, and quantitative model weights require a verified PRO membership.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openWhopModal(issue)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/20 px-5 py-2.5 text-sm font-semibold text-gold-bright transition hover:bg-gold/30 shadow-md"
          >
            <span>Unlock via Whop</span>
            <span>{badge}</span>
          </button>
          <a
            href="/pricing"
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-gold-bright"
          >
            View plans
          </a>
          <button
            type="button"
            onClick={() => setUnlocked(true)}
            className="rounded-full border border-line px-5 py-2.5 text-sm text-bone transition hover:border-gold/40"
          >
            Preview this issue
          </button>
        </div>
        <p className="mt-4 text-[11px] text-muted/60">
          Authorize your active Whop license key to unlock institutional coverage across all NextWall Street desks.
        </p>
      </div>
    </div>
  );
}
