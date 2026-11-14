"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWhop } from "@/lib/whop-context";
import { PLANS } from "@/lib/content";
import { getLifetimeCheckoutUrl } from "@/lib/whop-checkout-links";

const ACCOUNT_BILLING_FAQ = [
  {
    q: "How does the one-time $1,487 USD Lifetime Premium purchase work?",
    a: "Lifetime Access Only is a single $1,487 USD payment processed via Whop. There are no monthly or annual plans or renewals. You receive permanent access to all 2,038+ daily trend scores, full crypto and meme-coin coverage, all four Academy courses, score-change alerts, all 32 trade tools, and model portfolio access.",
  },
  {
    q: "What payment methods are supported through Whop?",
    a: "Whop supports major credit and debit cards (Visa, Mastercard, American Express, Discover), digital wallets (Apple Pay, Google Pay), SEPA Direct Debit, and cryptocurrency rails (USDC, USDT, Ethereum, Solana, Bitcoin).",
  },
  {
    q: "When is access activated after checkout?",
    a: "Access is activated only after payment verification. After completing your one-time $1,487 USD purchase on Whop, click Verify Whop License Key on any page or in the activation bar below to unlock the full platform immediately.",
  },
  {
    q: "How do I restore Lifetime Premium access across devices?",
    a: "Click Verify Whop License Key on the Pricing page or on any locked desk, enter your Whop license key or checkout email, and your cloud profile and active session will unlock across devices.",
  },
  {
    q: "Are receipts and invoices issued automatically?",
    a: "Yes. Tax-compliant receipts and line-item invoices are generated automatically by Whop and emailed immediately following payment verification.",
  },
];

interface PricingPlansProps {
  faqList: { q: string; a: string }[];
}

export default function PricingPlans({ faqList }: PricingPlansProps) {
  const { user, profile } = useAuth();
  const { isUnlocked, openWhopModal } = useWhop();
  const [faqCategory, setFaqCategory] = useState<"billing" | "general">("billing");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const lifetimePlan = PLANS[0];
  const lifetimeCheckoutUrl = getLifetimeCheckoutUrl();
  const isCurrentActive = isUnlocked || profile?.plan === "premium" || profile?.plan === "institutional";

  return (
    <div className="space-y-10">
      {/* Existing Key Quick Activation */}
      <div className="flex flex-col items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => openWhopModal("Verify Whop Lifetime Key")}
          className="inline-flex items-center rounded-full bg-gold/12 px-5 py-2 text-xs font-medium text-gold-bright transition hover:bg-gold/20"
        >
          Already purchased on Whop? Verify License Key to Unlock
        </button>

        {user && (
          <p className="text-xs text-muted">
            Signed in as <strong className="text-bone">{user.email}</strong> · Status:{" "}
            <span className="font-mono font-bold uppercase text-gold-bright">
              {isCurrentActive ? "LIFETIME PREMIUM" : "LOCKED"}
            </span>
          </p>
        )}
      </div>

      {/* Single Prestigious Lifetime Premium Card */}
      <div className="mx-auto max-w-xl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#17130a]/95 via-ink-900 to-ink-950/90 p-7 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-gold px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-950">
              LIFETIME ACCESS ONLY · ONE-TIME PAYMENT
            </span>
            {isCurrentActive && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Active Membership
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 rounded-xl bg-ink-950/60 p-5 sm:p-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-bone">{lifetimePlan.name}</h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted">{lifetimePlan.tagline}</p>
            </div>
            <div className="sm:text-right">
              <div className="flex items-baseline sm:justify-end gap-2">
                <span className="font-display text-3xl sm:text-4xl font-bold text-gold-bright tabular-nums">
                  $1,487
                </span>
                <span className="font-mono text-xs sm:text-sm font-semibold text-bone">USD</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">One payment only · Lifetime access · No monthly or annual plans</p>
            </div>
          </div>

          <ul className="mt-6 space-y-3 px-1">
            {lifetimePlan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-bone/90">
                <span aria-hidden="true" className="text-gold/80 select-none">
                  —
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 space-y-3">
            {isCurrentActive ? (
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center rounded-full bg-emerald-500/15 px-6 py-3.5 text-sm font-semibold text-emerald-300"
              >
                Lifetime Premium Unlocked
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCheckoutModal(true)}
                className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-sm font-bold text-ink-950 transition hover:bg-gold-bright shadow-xl"
              >
                One Lifetime Plan Only — $1,487 USD
              </button>
            )}

            <p className="text-center text-[11px] leading-relaxed text-muted">
              This is the only plan: one $1,487 USD payment for lifetime access. No monthly or annual subscription. Access activates after payment verification.
            </p>
          </div>
        </div>
      </div>

      {/* Included Institutional Scope Table */}
      <div className="mx-auto max-w-3xl rounded-2xl bg-ink-900/55 p-5 sm:p-6">
        <h3 className="font-display text-xl sm:text-2xl text-bone mb-4 px-1">Everything Included With Lifetime Premium ($1,487 USD)</h3>
        <div className="space-y-1.5 rounded-xl bg-ink-950/55 p-2 text-xs sm:text-sm">
          {[
            ["Tracked Universe", "All 2,038+ equities, crypto & meme-coin risk models"],
            ["Research Desks", "All 70 institutional research decks & invalidation reports"],
            ["The Academy", "All 4 courses & 60 watchable video masterclasses"],
            ["Trade Tools Directory", "All 32 institutional tools including #30 Whale Alert, #31 AI Sentiment & #32 Top 3 Signals"],
            ["Community & Alerts", "Live trading floor chat & real-time score-change alerts"],
            ["Only Plan", "Lifetime Access Only · $1,487 USD once · No monthly or annual plans"],
          ].map(([item, value]) => (
            <div key={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-lg px-3.5 py-2.5 transition hover:bg-ink-900/45">
              <span className="font-medium text-bone">{item}</span>
              <span className="font-mono text-xs text-gold-bright">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="space-y-5 pt-2">
        <div className="text-center space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Support &amp; Clarity
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-bone">Frequently asked questions</h2>
          <p className="text-xs text-muted max-w-lg mx-auto">
            Details on the one-time $1,487 USD Whop checkout, payment verification, and scoring methodology.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setFaqCategory("billing");
              setExpandedFaq(0);
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              faqCategory === "billing"
                ? "bg-gold text-ink-950"
                : "bg-ink-900/80 text-muted hover:bg-ink-850 hover:text-bone"
            }`}
          >
            Checkout &amp; Verification (Whop)
          </button>

          <button
            type="button"
            onClick={() => {
              setFaqCategory("general");
              setExpandedFaq(0);
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              faqCategory === "general"
                ? "bg-gold text-ink-950"
                : "bg-ink-900/80 text-muted hover:bg-ink-850 hover:text-bone"
            }`}
          >
            General &amp; Methodology
          </button>
        </div>

        <div className="mx-auto max-w-3xl space-y-2.5 pt-1">
          {(faqCategory === "billing" ? ACCOUNT_BILLING_FAQ : faqList).map((item, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-xl bg-ink-900/55 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-bone hover:text-gold-bright transition"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gold shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="mx-3 mb-3 rounded-lg bg-ink-950/55 px-4 py-3 text-xs sm:text-sm text-muted leading-relaxed animate-in fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PRESTIGIOUS LIFETIME CHECKOUT MODAL WITH EXACT REQUIRED COPY */}
      {showCheckoutModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCheckoutModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-dialog-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-[#13110c] via-ink-900 to-ink-950 p-7 sm:p-8 shadow-[0_32px_90px_rgba(0,0,0,0.92)] space-y-5"
          >
            <button
              type="button"
              aria-label="Close purchase dialog"
              onClick={() => setShowCheckoutModal(false)}
              className="absolute right-5 top-5 rounded-lg p-1.5 text-muted transition hover:bg-ink-800 hover:text-bone"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pr-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
                Purchase details
              </p>
              <h3 id="pricing-dialog-title" className="mt-1.5 font-display text-2xl text-bone">
                Lifetime Premium
              </h3>
            </div>

            <p className="text-xs sm:text-[13px] leading-relaxed text-muted">
              One-time membership granting permanent access to all 2,038+ daily trend scores, exact
              invalidation levels, 70 research desks, all four Academy courses, score-change alerts,
              and all 32 trade tools with zero recurring fees.
            </p>

            <div className="rounded-xl bg-ink-950/80 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Membership Tier</span>
                <strong className="text-bone">Lifetime Premium</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Billing Structure</span>
                <span className="font-medium text-bone">One-time · Permanent access</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-muted">Total Investment</span>
                <span className="font-mono text-base font-bold text-gold-bright tabular-nums">
                  $1,487 USD
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted">
              You will continue to Whop to complete the one-time $1,487 USD settlement. Full
              platform access activates immediately upon payment verification.
            </p>

            {!lifetimeCheckoutUrl && (
              <p role="status" className="text-[11px] text-amber-200">
                Whop checkout URL environment variable (NEXT_PUBLIC_WHOP_CHECKOUT_LIFETIME_URL) is not configured yet.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  openWhopModal("Verify Whop Lifetime Key");
                }}
                className="text-xs font-medium text-gold-bright hover:underline underline-offset-4"
              >
                Verify Whop License Key
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="rounded-full bg-ink-850 px-4 py-2 text-xs text-muted hover:bg-ink-800 hover:text-bone"
                >
                  Cancel
                </button>
                {lifetimeCheckoutUrl ? (
                  <a
                    href={lifetimeCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 transition hover:bg-gold-bright shadow-lg"
                  >
                    Continue to Whop
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 opacity-50"
                  >
                    Checkout URL Required
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
