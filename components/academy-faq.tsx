"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, ShieldCheck, Zap } from "lucide-react";
import WhopBadge from "./whop-badge";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What does Lifetime Premium cost?",
    answer: "Lifetime Premium costs $2,497 USD as a single payment. There is no recurring subscription or renewal.",
  },
  {
    question: "How is access activated after purchase?",
    answer: "Access is granted only after Whop confirms the one-time payment. The checkout and account setup flow are being configured; do not submit payment while checkout is unavailable.",
  },
  {
    question: "What is included with Lifetime Premium?",
    answer: "The plan includes the full research library, all four Academy courses, market coverage, score-change alerts, and model portfolio access.",
  },
  {
    question: "Do I need to keep a browser window open during market hours?",
    answer: "No. You can review research and saved watchlists whenever you return. Access to paid features is checked against the verified purchase.",
  },
  {
    question: "Is the Academy curriculum suitable for beginning and intermediate traders?",
    answer: "Yes. The curriculum starts with structural price action and trend mechanics, then progresses to order flow, volatility-aware position sizing, and capital preservation.",
  },
  {
    question: "What is the desk's methodology regarding risk and market signals?",
    answer: "No indicator or model guarantees an outcome. The framework focuses on identifying where a trend thesis is invalidated and communicating risk clearly.",
  },
];

export default function AcademyFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="rounded-2xl border border-line bg-ink-900/60 p-6 sm:p-10 shadow-xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Lifetime Premium &amp; FAQ
            </span>
            <WhopBadge size="xs" />
          </div>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl text-bone">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-muted max-w-xl">
            One $2,497 payment unlocks Lifetime Premium after Whop verifies the purchase. There are no recurring charges.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs text-gold-bright shrink-0">
          <Zap className="h-4 w-4 text-gold shrink-0" />
          <span>One-time · $2,497 · Lifetime access</span>
        </div>
      </div>


      {/* Accordion Questions */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "border-gold/50 bg-ink-900 shadow-md"
                  : "border-line bg-ink-900/40 hover:border-gold/30"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left select-none"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-gold shrink-0" />
                  <span className="font-display text-base text-bone font-medium">
                    {item.question}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-gold" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-line/60 text-xs text-muted leading-relaxed space-y-3 animate-in fade-in duration-150">
                  <p>{item.answer}</p>


                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Institutional Subscriber Concierge Footer */}
      <div className="rounded-xl border border-gold/30 bg-ink-950 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-bone text-sm flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-gold" />
            Questions about Lifetime Premium
          </p>
          <p className="text-xs text-muted mt-1">
            Lifetime Premium is a one-time $2,497 purchase. Access is enabled only after the payment is verified.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/pricing"
            className="rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow"
          >
            View Lifetime plan
          </Link>
        </div>
      </div>
    </div>
  );
}
