"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What does $1,487 USD Lifetime Premium include across the Academy?",
    answer:
      "Lifetime Premium ($1,487 USD one-time purchase) permanently unlocks all four Academy courses, all 60 interactive HD video masterclasses with synchronized takeaways, 70 institutional research decks, all 2,038+ daily trend scores, exact invalidation levels, all 32 trade tools, and community access.",
  },
  {
    question: "Are the 60 Video Masterclasses included in the one-time purchase?",
    answer:
      "Yes. Unrestricted access to all 60 video masterclasses across Wall Street & Equities, Crypto & Microstructure, and Speculative Bonding Curve Mechanics is unlocked permanently upon payment verification.",
  },
  {
    question: "Are there any recurring monthly or annual subscription fees?",
    answer:
      "No. Lifetime Access Only is the only plan: one $1,487 USD payment through Whop, with no monthly or annual subscription or renewals.",
  },
  {
    question: "Do I need to keep a browser window open during market hours?",
    answer:
      "No. Real-time score-change alerts, invalidation breaches, and pre-market desk notes push directly to your alert channels once Lifetime Premium is active.",
  },
  {
    question: "Is the Academy curriculum suitable for intermediate and advanced traders?",
    answer:
      "Yes. Our curriculum is grounded in transparent quantitative rules: structural price action, moving average slope mechanics, cross-asset liquidity flows, volatility-adjusted position sizing, and capital preservation.",
  },
  {
    question: "What is the desk methodology regarding risk and market signals?",
    answer:
      "We publish zero speculative certainty. Every asset includes an objective composite score, stance, and mathematical invalidation price where the thesis breaks so losses remain bounded.",
  },
];

export default function AcademyFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="rounded-2xl bg-ink-900/55 p-6 sm:p-8 shadow-xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Membership Architecture &amp; FAQ
          </span>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl text-bone">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-muted max-w-xl">
            Everything included in NextWallStreet Lifetime Premium ($1,487 USD one-time purchase).
          </p>
        </div>

        <div className="rounded-xl bg-gold/15 px-4 py-2.5 text-xs font-medium text-gold-bright shrink-0">
          LIFETIME ACCESS ONLY · $1,487 USD ONCE
        </div>
      </div>

      {/* Included Benefits Ledger */}
      <div className="overflow-hidden rounded-xl bg-ink-950/65 p-2 space-y-1.5">
        <div className="grid grid-cols-[1fr_auto] rounded-lg bg-ink-900/90 text-xs font-semibold text-bone px-4 py-3">
          <div className="text-muted">Feature &amp; Curriculum Scope</div>
          <div className="text-right text-gold-bright">Lifetime Premium ($1,487 USD)</div>
        </div>

        <div className="space-y-1 text-xs">
          {[
            "All 4 Quantitative Curriculums (Structure, Crypto, Portfolio Sizing, Speculative Risk)",
            "All 60 HD Watchable Video Masterclasses",
            "All 70 Institutional Quantitative Research Decks",
            "All 2,038+ Daily Asset Scores & Exact Invalidation Levels",
            "60-Day Realized Volatility Position Sizing Engine",
            "All 32 Trade Tools (#30 Whale Alert, #31 AI Sentiment, #32 Top Signals)",
          ].map((feature) => (
            <div
              key={feature}
              className="grid grid-cols-[1fr_auto] rounded-lg px-4 py-3 items-center hover:bg-ink-900/50 transition-colors gap-4"
            >
              <div className="text-bone/90 font-medium">{feature}</div>
              <div className="text-right text-emerald-400 font-mono text-[11px] font-semibold">
                Included
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion Questions */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-xl transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-ink-900/90 shadow-md"
                  : "bg-ink-950/60 hover:bg-ink-900/65"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left select-none"
              >
                <span className="font-display text-base text-bone font-medium">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-gold" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-muted leading-relaxed animate-in fade-in duration-150">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-ink-950/75 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-bone text-sm">
            Lifetime Premium Checkout &amp; Activation
          </p>
          <p className="text-xs text-muted mt-1">
            One-time $1,487 USD purchase via Whop activates permanent access after payment verification.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/pricing"
            className="rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow"
          >
            Get Lifetime Access Only — $1,487 USD
          </Link>
        </div>
      </div>
    </div>
  );
}
