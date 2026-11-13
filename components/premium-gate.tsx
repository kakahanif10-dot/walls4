"use client";

import Link from "next/link";
import useSWR from "swr";
import type { Block } from "@/lib/content";
import { useWhop } from "@/lib/whop-context";

type PremiumContentResponse = { blocks: Block[] };

async function fetchPremiumContent(url: string): Promise<PremiumContentResponse> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Premium article could not be loaded.");
  return (await response.json()) as PremiumContentResponse;
}

function renderBlock(block: Block, key: string) {
  if (block.type === "h2") return <h2 key={key}>{block.text}</h2>;
  if (block.type === "p") return <p key={key}>{block.text}</p>;
  if (block.type === "quote") {
    return (
      <blockquote
        className="my-7 border-l-2 border-gold/70 pl-5 font-display text-xl leading-snug text-bone/90"
        key={key}
      >
        {block.text}
      </blockquote>
    );
  }

  return (
    <ul key={key}>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PremiumGate({ issue, slug }: { issue: string; slug: string }) {
  const { isUnlocked, isChecking, openWhopModal } = useWhop();
  const contentKey = isUnlocked
    ? `/api/premium-content?slug=${encodeURIComponent(slug)}`
    : null;
  const { data, error, isLoading } = useSWR(contentKey, fetchPremiumContent, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  if (!isUnlocked) {
    return (
      <section
        aria-busy={isChecking}
        className="my-10 rounded-2xl border border-gold/20 bg-gold/[0.04] p-7 sm:p-9"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Member research</p>
        <h2 className="mt-3 font-display text-2xl text-bone">Continue “{issue}”</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-bone/65">
          {isChecking
            ? "Checking your verified membership…"
            : "Sign in with the email used at Whop checkout, or open the secure account setup link sent after your payment."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-[#17140e] transition hover:bg-gold/90"
            onClick={() => openWhopModal(issue)}
            type="button"
          >
            Check membership
          </button>
          <Link
            className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-bone/75 transition hover:bg-white/5 hover:text-bone"
            href="/pricing"
          >
            View lifetime access
          </Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div aria-live="polite" className="my-10 rounded-2xl border border-white/10 p-7 text-sm text-bone/60">
        Loading member research…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div aria-live="polite" className="my-10 rounded-2xl border border-white/10 p-7">
        <p className="text-sm text-bone/70">This article could not be loaded right now.</p>
        <p className="mt-2 text-xs text-bone/45">Your access remains linked to your account.</p>
      </div>
    );
  }

  return <div className="space-y-5">{data.blocks.map((block, index) => renderBlock(block, `${slug}-${index}`))}</div>;
}
