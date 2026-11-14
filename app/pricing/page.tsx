import type { Metadata } from "next";
import Link from "next/link";
import PricingPlans from "@/components/pricing-plans";

export const metadata: Metadata = {
  title: "Lifetime Access Only ($1,487 USD Once) — NextWallStreet",
  description:
    "Lifetime Access Only: one $1,487 USD payment unlocks all 2,038+ daily trend scores, exact invalidation levels, 70 research desks, 60 Academy lessons, and 32 trade tools. No monthly or annual plans.",
};

const FAQ = [
  {
    q: "Is this investment advice?",
    a: "No. NextWallStreet publishes market analysis and education. We describe what the tape is doing, how the model scores it and where the call breaks. We do not manage money, do not take positions in the names we cover and do not tell you what to buy.",
  },
  {
    q: "How are the trend scores calculated?",
    a: "A weighted composite of five inputs: price versus the 20-day, the 20-versus-50-day, the 50-versus-200-day, 30-session rate of change and RSI positioning. Weights are published on the methodology page, and each asset page shows the component breakdown.",
  },
  {
    q: "How do you grade speculative digital assets?",
    a: "As pure liquidity risk, not investments. The sector has no cash flows, so we score concentration, order-book depth and narrative decay, and we cap conviction deliberately.",
  },
  {
    q: "What is included in $1,487 USD Lifetime Premium?",
    a: "Lifetime Access Only is one $1,487 USD payment. It permanently unlocks all 2,038+ daily trend scores, exact invalidation levels, 70 research desks, all four Academy courses (60 video masterclasses), 32 trade tools, score-change alerts, and future desk updates. There is no monthly or annual plan.",
  },
];

export default function PricingPage() {
  return (
    <div>
      <section className="grain">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Lifetime Access Only · $1,487 USD · One-Time Payment
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-3xl leading-tight text-bone sm:text-5xl">
            Analysis you can audit. One-time lifetime purchase.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Get every research piece, full crypto and meme-coin coverage, all four Academy courses,
            32 trade tools, score-change alerts, and model portfolio access with one lifetime
            purchase.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <PricingPlans faqList={FAQ} />

        <div className="mt-10 text-center text-xs text-muted">
          Questions on the scoring math? Review our{" "}
          <Link
            href="/disclaimer"
            className="text-bone/85 underline decoration-muted/40 underline-offset-2 hover:text-gold-bright"
          >
            methodology &amp; disclosures
          </Link>
          .
        </div>
      </section>
    </div>
  );
}
