"use client";

import { useState } from "react";
import { Check, ShieldCheck, Zap, Sparkles, ChevronDown, ChevronUp, CheckCircle, ArrowRight, Key } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import WhopBadge from "@/components/whop-badge";
import { PLANS } from "@/lib/content";
import { getWhopCheckoutUrl, type PaidPlanId } from "@/lib/whop-checkout-links";

const ACCOUNT_BILLING_FAQ = [
  {
    q: "What does Lifetime Premium cost?",
    a: "Lifetime Premium is a one-time purchase of $2,497 USD. It does not renew or create a recurring subscription.",
  },
  {
    q: "How do I complete the purchase?",
    a: "Choose Buy lifetime access to continue to the configured Whop checkout. Access is not granted by entering an email address or a license key on this site; payment must be verified by the membership service.",
  },
  {
    q: "Can I get a refund or transfer my purchase?",
    a: "Please review the terms shown at checkout or contact support for purchase and transfer questions before completing payment.",
  },
];

interface PricingPlansProps {
  faqList: { q: string; a: string }[];
}

export default function PricingPlans({ faqList }: PricingPlansProps) {
  const { profile } = useAuth();
  const [faqCategory, setFaqCategory] = useState<"billing" | "general">("billing");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activeModalPlan, setActiveModalPlan] = useState<typeof PLANS[0] | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showFeatureMatrix, setShowFeatureMatrix] = useState(false);

  const currentPlan = profile?.plan || "reader";
  const activeCheckoutUrl =
    activeModalPlan && activeModalPlan.id !== "reader"
      ? getWhopCheckoutUrl(activeModalPlan.id as PaidPlanId)
      : null;

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setActiveModalPlan(plan);
  };

  const handleConfirmSubscription = () => {
    if (!activeModalPlan || activeModalPlan.price > 0) return;
    setActiveModalPlan(null);
    setSuccessToast("Reader is the free plan. No purchase or activation is required.");
    setTimeout(() => setSuccessToast(null), 6000);
  };

  return (
    <div className="space-y-12">
      {/* Toast Alert */}
      {successToast && (
        <div className="mx-auto max-w-2xl rounded-xl border border-emerald-500/50 bg-emerald-950/80 p-4 text-emerald-300 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">{successToast}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-3.5">
        <p className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold-bright">
          One-time payment · Lifetime access · No renewal
        </p>

        <p className="text-xs text-muted">One purchase. No monthly or annual plans.</p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const displayPrice = plan.price;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                plan.highlight
                  ? "border-gold/60 bg-gradient-to-b from-gold/[0.12] to-ink-900 shadow-2xl ring-1 ring-gold/40"
                  : isCurrent
                  ? "border-emerald-500/50 bg-ink-900/80 shadow-lg"
                  : "border-line bg-ink-900/50 hover:border-gold/30"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-950 shadow-md">
                  Most Popular Plan
                </span>
              )}

              {isCurrent && (
                <span className="absolute -top-3 right-7 rounded-full border border-emerald-500/60 bg-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                  Active Tier ✓
                </span>
              )}

              <h2 className="font-display text-2xl text-bone flex items-center">
                <span>{plan.name}</span>
                {plan.id !== "reader" && <WhopBadge className="ml-2 text-base" />}
              </h2>
              <p className="mt-1 text-xs text-muted">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-bone">
                  {displayPrice === 0 ? "Free" : `$${displayPrice.toLocaleString("en-US")}`}
                </span>
                <span className="text-xs text-muted">
                  {plan.cadence}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm leading-relaxed text-bone/85">
                    <span className={`mt-0.5 shrink-0 ${plan.highlight ? "text-gold" : "text-emerald-400"}`}>
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* ACTION BUTTON - Clickable with Real Modal & Tier Switching */}
              <button
                type="button"
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent}
                className={`mt-7 w-full rounded-full px-5 py-3 text-sm font-semibold transition shadow-md flex items-center justify-center gap-2 ${
                  isCurrent
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 cursor-default"
                    : plan.highlight
                    ? "bg-gold text-ink-950 hover:bg-gold-bright hover:scale-[1.01]"
                    : "border border-line bg-ink-850 text-bone hover:border-gold/50 hover:bg-ink-800"
                }`}
              >
                {isCurrent ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Current Active Plan</span>
                  </>
                ) : (
                  <>
                    <span>{plan.cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Matrix Toggle Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setShowFeatureMatrix((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-line bg-ink-900 px-5 py-2.5 text-xs font-semibold text-muted hover:text-bone hover:border-gold/40 transition shadow"
        >
          <span>{showFeatureMatrix ? "Hide Detailed Feature Breakdown" : "View Complete Plan Comparison Matrix"}</span>
          {showFeatureMatrix ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Interactive Feature Matrix Table */}
      {showFeatureMatrix && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-ink-900/60 p-5 animate-in fade-in">
          <h3 className="font-display text-xl text-bone mb-4">Complete Plan Feature Matrix</h3>
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-ink-950 text-[10px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 text-center font-medium">Reader (Free)</th>
                <th className="px-4 py-3 text-center font-medium text-gold">Lifetime Premium ($2,497 once)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {[
                ["Daily trend scores", "26 tracked assets", "26 tracked assets"],
                ["Research library", "2 pieces per month", "All research pieces"],
                ["Academy courses", "Foundation course", "All four courses"],
                ["Crypto and meme-coin coverage", "Reader access", "Full coverage with risk grading"],
                ["Market updates", "Weekly newsletter", "Score-change alerts"],
                ["Model portfolios", "—", "Core, tactical, and digital assets"],
              ].map(([feature, r, p]) => (
                <tr key={feature} className="hover:bg-ink-850/40">
                  <td className="px-4 py-3 text-bone font-medium">{feature}</td>
                  <td className="px-4 py-3 text-center text-muted font-mono">{r}</td>
                  <td className="px-4 py-3 text-center text-gold-bright font-mono font-semibold">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive FAQ Accordion with Dedicated Account & Billing Section */}
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Support &amp; Clarity
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-bone">Frequently asked questions</h2>
          <p className="text-xs text-muted max-w-lg mx-auto">
            Answers about the free Reader plan, one-time Lifetime Premium purchase, and research methodology.
          </p>
        </div>

        {/* FAQ Category Switcher */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setFaqCategory("billing");
              setExpandedFaq(0);
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition shadow-sm ${
              faqCategory === "billing"
                ? "bg-gold text-ink-950 ring-1 ring-gold"
                : "border border-line bg-ink-900 text-muted hover:text-bone hover:border-gold/40"
            }`}
          >
            <span>Account &amp; Billing (Whop)</span>
            <WhopBadge variant="plus" className="ml-0.5 text-[9px]" />
          </button>

          <button
            type="button"
            onClick={() => {
              setFaqCategory("general");
              setExpandedFaq(0);
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              faqCategory === "general"
                ? "bg-gold text-ink-950 ring-1 ring-gold"
                : "border border-line bg-ink-900 text-muted hover:text-bone hover:border-gold/40"
            }`}
          >
            General &amp; Methodology
          </button>
        </div>

        <div className="mx-auto max-w-3xl space-y-3 pt-2">
          {(faqCategory === "billing" ? ACCOUNT_BILLING_FAQ : faqList).map((item, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-xl border border-line bg-ink-900/60 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-bone hover:text-gold-bright transition"
                >
                  <span className="flex items-center gap-2">
                    {faqCategory === "billing" && <Key className="h-3.5 w-3.5 text-gold shrink-0" />}
                    <span>{item.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gold shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted leading-relaxed border-t border-line/40 animate-in fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: CHECKOUT & TIER ACTIVATION */}
      {activeModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-dialog-title"
            className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl space-y-5"
          >
            <button
              type="button"
              aria-label="Close pricing dialog"
              onClick={() => setActiveModalPlan(null)}
              className="absolute right-4 top-4 text-muted hover:text-bone text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold-bright">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Purchase details
                </span>
                <h3 id="pricing-dialog-title" className="font-display text-xl text-bone">
                  {activeModalPlan.price === 0
                    ? `Activate ${activeModalPlan.name}`
                    : `Continue to ${activeModalPlan.name} checkout`}
                </h3>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Get every research piece, full crypto and meme-coin coverage, all four Academy courses, score-change alerts, and model portfolio access with one lifetime purchase.
            </p>

            {/* Plan Summary Box */}
            <div className="rounded-xl border border-line bg-ink-950 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Selected Tier:</span>
                <strong className="text-bone">{activeModalPlan.name}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Payment type:</span>
                <span className="text-bone">One-time · Lifetime</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Amount due once:</span>
                <span className="font-mono text-sm font-bold text-gold-bright">
                  {activeModalPlan.price === 0 ? "$0 (Free)" : "$2,497 USD"}
                </span>
              </div>
            </div>

            {activeModalPlan.price > 0 && (
              <p className="text-xs leading-relaxed text-muted">
                You will continue to Whop to complete the one-time $2,497 USD purchase. Access is not activated until the payment is verified.
              </p>
            )}

            {activeModalPlan.price === 0 && (
              <p className="text-xs leading-relaxed text-muted">
                Reader is free and available without an account or payment.
              </p>
            )}

            {activeModalPlan.price > 0 && !activeCheckoutUrl && (
              <p role="status" className="text-xs text-amber-200">
                Lifetime checkout is not configured yet. Set NEXT_PUBLIC_WHOP_CHECKOUT_LIFETIME_URL to the Whop checkout link for the $2,497 one-time lifetime product.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => setActiveModalPlan(null)}
                className="rounded-full border border-line px-4 py-2 text-xs text-muted hover:text-bone"
              >
                Cancel
              </button>
              {activeModalPlan.price === 0 ? (
                <button
                  type="button"
                  onClick={handleConfirmSubscription}
                  className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow-lg"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Continue with {activeModalPlan.name}</span>
                </button>
              ) : activeCheckoutUrl ? (
                <a
                  href={activeCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow-lg"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Continue to Whop</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-bold text-ink-950 opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Checkout unavailable</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
