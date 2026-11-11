"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Check, X, ShieldCheck, Zap } from "lucide-react";
import WhopBadge from "./whop-badge";

interface FAQItem {
  question: string;
  answer: string;
  freeVsPremium?: {
    free: string;
    premium: string;
  };
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is the primary difference between Free (Reader) and Premium (PRO) access?",
    answer: "Free Reader access provides foundational theoretical training and transparency into our scoring philosophy. Premium PRO membership ($29/month) unlocks full daily institutional execution: definitive invalidation price levels, all 60 video masterclasses, 70 research decks, real-time Telegram/Discord terminal dispatch, and full access to our 44 Analyst Desks.",
    freeVsPremium: {
      free: "Foundation Course ('Reading a Trend'), 2 monthly research pieces, delayed public board scores, no terminal dispatch.",
      premium: "All 4 Complete Curriculums, 60 HD Masterclasses, 70 Research Decks, Sub-second Telegram & Discord Terminal Dispatch, Position Sizing Engine, and 44 Quantitative Desks.",
    },
  },
  {
    question: "Are the 60 Video Masterclasses in the Video Studio accessible for free?",
    answer: "Lesson 01 across each curriculum module is available as a complimentary preview of our production quality. Unrestricted access to all 60 interactive masterclasses—complete with technical chart overlays, chapter bookmarks, synchronized takeaways, and comprehension quizzes—is exclusive to PRO members.",
  },
  {
    question: "How does the 14-Day Trial work, and can I cancel at any time?",
    answer: "Every Premium subscription includes a comprehensive 14-day trial with unrestricted access to all features. You may cancel at any moment with a single click in your subscriber dashboard or through the Whop customer portal without penalty or hidden commitments.",
  },
  {
    question: "Do I need to keep a browser window open during market hours?",
    answer: "No. Our direct Telegram Terminal and Discord room integrations push real-time technical alerts, invalidation breaches, and pre-market desk memos straight to your mobile device, allowing seamless execution on the go.",
  },
  {
    question: "Is the Academy curriculum suitable for beginning and intermediate traders?",
    answer: "Yes. Our pedagogy is grounded in rigorous mathematical rules rather than subjective 'feel.' The curriculum begins with structural price action and moving average slope mechanics, progressing sequentially into order flow absorption, volatility-adjusted position sizing, and capital preservation.",
  },
  {
    question: "What is the desk's methodology regarding risk and market signals?",
    answer: "We publish zero speculative certainty. No indicator or model possesses a guaranteed edge. Our framework teaches survival first: identifying the precise dollar level where the trend thesis breaks, so you can exit with minimal, mathematically bounded losses before drawdowns compound.",
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
              Membership Architecture &amp; FAQ
            </span>
            <WhopBadge size="xs" />
          </div>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl text-bone">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-muted max-w-xl">
            Understand the distinction between complimentary Reader access and full PRO institutional membership ($29/month) across the NextWall Street Academy.
          </p>
        </div>

        {/* Free vs Premium Quick Pill Indicator */}
        <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs text-gold-bright shrink-0">
          <Zap className="h-4 w-4 text-gold shrink-0" />
          <span>14-Day Risk-Free Trial · Cancel Anytime</span>
        </div>
      </div>

      {/* Quick Comparison Matrix Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-ink-950">
        <div className="grid grid-cols-3 bg-ink-900 text-xs font-semibold text-bone border-b border-line p-3 sm:p-4">
          <div className="text-muted">Feature &amp; Curriculum Access</div>
          <div className="text-center text-muted">Free Reader Access</div>
          <div className="text-center text-gold-bright flex items-center justify-center gap-1">
            <span>PRO Member ($29/mo)</span>
            <WhopBadge size="xs" />
          </div>
        </div>

        <div className="divide-y divide-line/60 text-xs">
          {[
            { feature: "Foundation Course ('Reading a Trend')", free: true, pro: true },
            { feature: "3 Advanced Curriculums (Crypto, Meme Risk, Sizing)", free: false, pro: true },
            { feature: "60 HD Masterclasses with Interactive Studio", free: "Lesson 01 Only", pro: "All 60 Lessons Unrestricted" },
            { feature: "70 Institutional Quantitative Research Decks", free: "2 Sample Decks", pro: "All 70 Decks Uncut" },
            { feature: "Definitive Invalidation Levels (Stop Loss Anchors)", free: false, pro: true },
            { feature: "60-Day Realized Volatility Sizing Calculator", free: false, pro: true },
            { feature: "Sub-Second Telegram Terminal & Discord Alerts", free: false, pro: true },
            { feature: "44 Specialized Quantitative Analyst Desks", free: "Limited Previews", pro: "Full 44 Desks Active" },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 p-3 sm:p-4 items-center hover:bg-ink-900/40 transition-colors">
              <div className="text-bone/90 font-medium">{row.feature}</div>
              <div className="text-center text-muted font-mono text-[11px]">
                {typeof row.free === "boolean" ? (
                  row.free ? (
                    <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-muted/50 mx-auto" />
                  )
                ) : (
                  <span>{row.free}</span>
                )}
              </div>
              <div className="text-center text-gold-bright font-mono text-[11px] font-semibold">
                {typeof row.pro === "boolean" ? (
                  row.pro ? (
                    <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-muted/50 mx-auto" />
                  )
                ) : (
                  <span>{row.pro}</span>
                )}
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

                  {item.freeVsPremium && (
                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                      <div className="rounded-lg border border-line bg-ink-950 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                          Free Reader Tier:
                        </span>
                        <p className="text-bone/80 text-[11px]">{item.freeVsPremium.free}</p>
                      </div>
                      <div className="rounded-lg border border-gold/40 bg-gold/10 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-bright block mb-1">
                          PRO Membership ($29/mo):
                        </span>
                        <p className="text-gold-bright text-[11px] font-medium">{item.freeVsPremium.premium}</p>
                      </div>
                    </div>
                  )}
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
            Institutional Subscriber Inquiries &amp; Desk Concierge
          </p>
          <p className="text-xs text-muted mt-1">
            Institutional multi-seat access, signal audit trail exports, or custom research inquiries are handled directly by the quantitative desk.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/pricing"
            className="rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow"
          >
            Start 14-Day Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
