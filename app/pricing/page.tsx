import type { Metadata } from "next";
import Link from "next/link";
import PricingPlans from "@/components/pricing-plans";

export const metadata: Metadata = {
  title: "Plans and pricing",
  description:
    "Reader is free. Lifetime Premium is a one-time $2,497 purchase with no recurring subscription.",
};

const FAQ = [
  {
    q: "Is this investment advice?",
    a: "No. NextWall Street publishes market analysis and education. We describe what the tape is doing, how the model scores it and where the call breaks. We do not manage money, do not take positions in the names we cover and do not tell you what to buy.",
  },
  {
    q: "How are the trend scores calculated?",
    a: "A weighted composite of five inputs: price versus the 20-day, the 20-versus-50-day, the 50-versus-200-day, 30-session rate of change and RSI positioning. Weights are published on the methodology page, and each asset page shows the component breakdown.",
  },
  {
    q: "Do you cover meme coins seriously?",
    a: "Seriously, but not as investments. The sector has no cash flows, so we score concentration, order-book depth and narrative decay, and we cap conviction deliberately. Our coverage is designed to keep subscribers out of the worst outcomes, not to talk them into positions.",
  },
  {
    q: "Does Lifetime Premium renew?",
    a: "No. Lifetime Premium is a one-time $2,497 USD purchase and does not renew.",
  },
  {
    q: "When is access activated?",
    a: "Access must be activated after the payment provider verifies the purchase. Checkout is unavailable until the lifetime Whop link is configured.",
  },
];

export default function PricingPage() {
  return (
    <div>
      <section className="grain border-b border-line/60">
        <div className="mx-auto max-w-7xl px-5 py-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Plans</p>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl leading-tight text-bone sm:text-5xl">
            Analysis you can audit. Pricing without theatre.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            Choose the free Reader plan or make a single $2,497 purchase for lifetime Premium access. No recurring charges.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <PricingPlans faqList={FAQ} />

        <div className="mt-12 text-center text-xs text-muted">
          Still deciding? Read{" "}
          <Link href="/research" className="text-bone/85 underline decoration-line underline-offset-2 hover:text-gold-bright">
            free research
          </Link>{" "}
          or start with the{" "}
          <Link href="/academy/reading-trends" className="text-bone/85 underline decoration-line underline-offset-2 hover:text-gold-bright">
            foundation course
          </Link>
          .
        </div>
      </section>
    </div>
  );
}

