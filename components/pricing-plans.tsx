"use client";

import { useState } from "react";
import { Check, ShieldCheck, Zap, Sparkles, CreditCard, ChevronDown, ChevronUp, CheckCircle, ArrowRight, Key } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWhop } from "@/lib/whop-context";
import WhopBadge from "@/components/whop-badge";
import { PLANS } from "@/lib/content";

const ACCOUNT_BILLING_FAQ = [
  {
    q: "How does the Whop subscription and licensing work?",
    a: "NextWall Street partners natively with Whop to provide frictionless institutional subscription management. Once you subscribe or enter your Whop API license key (e.g. apik_...), the entire platform unlocks instantly across your active session and cloud profile without manual provisioning or waiting for support.",
  },
  {
    q: "What payment methods are supported through Whop?",
    a: "Whop supports all major credit and debit cards (Visa, Mastercard, American Express, Discover), digital wallets (Apple Pay, Google Pay), European SEPA Direct Debit, and cryptocurrency payments (USDC, USDT, Ethereum, Solana, Bitcoin) with instant automated order fulfillment.",
  },
  {
    q: "What is the cancellation policy?",
    a: "You can cancel your subscription at any time with a single click in your Whop customer portal or from your NextWall Street account settings. There are zero hidden fees, cancellation penalties, or multi-month lock-in contracts. Upon cancellation, your institutional access remains fully active until the final day of your current paid billing period.",
  },
  {
    q: "How do I activate or restore my subscription on multiple devices?",
    a: "Click the ✦ MEMBER ONLY badge or the Whop key icon in the navigation bar on any device. Enter your Whop license key or the email address used during checkout to restore full access instantly. If you are signed in with Google, your access automatically synchronizes with your cloud Firestore profile.",
  },
  {
    q: "How does the 14-day free trial work?",
    a: "The Premium plan includes a 14-day trial with unhindered access to all 2,000+ scored assets, real-time Discord signals, Day Trade targets, and all 20 video masterclasses. If you cancel before day 14 expires, your card will never be charged.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes. You can switch between monthly and annual plans at any time directly through Whop. Upgrading to annual billing applies an immediate 20% discount and prorates any unused time from your current monthly cycle.",
  },
  {
    q: "Do you issue official VAT / sales tax invoices and receipts?",
    a: "Yes. Formal tax-compliant PDF invoices with line-item VAT/sales tax breakdowns and company billing details are generated automatically by Whop and emailed to you immediately after every billing event for corporate expense reporting.",
  },
];

interface PricingPlansProps {
  faqList: { q: string; a: string }[];
}

export default function PricingPlans({ faqList }: PricingPlansProps) {
  const { user, profile, updateUserPlan, signInWithGoogle } = useAuth();
  const { openWhopModal, badge } = useWhop();
  const [cadence, setCadence] = useState<"monthly" | "annual">("monthly");
  const [faqCategory, setFaqCategory] = useState<"billing" | "general">("billing");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activeModalPlan, setActiveModalPlan] = useState<typeof PLANS[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "gpay" | "crypto">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showFeatureMatrix, setShowFeatureMatrix] = useState(false);

  const currentPlan = profile?.plan || "reader";

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setActiveModalPlan(plan);
  };

  const handleConfirmSubscription = async () => {
    if (!activeModalPlan) return;
    setIsProcessing(true);
    try {
      const planKey = activeModalPlan.id as "reader" | "premium" | "institutional";
      await updateUserPlan(planKey);
      setSuccessToast(`Successfully activated ${activeModalPlan.name} plan! All corresponding research and desk permissions are unlocked.`);
      setActiveModalPlan(null);
      setTimeout(() => {
        setSuccessToast(null);
      }, 6000);
    } catch (err) {
      console.error("Subscription error:", err);
    } finally {
      setIsProcessing(false);
    }
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

      {/* Cadence Switcher Buttons & Whop Direct Button */}
      <div className="flex flex-col items-center justify-center gap-3.5">
        <div className="flex items-center rounded-full border border-line bg-ink-900 p-1 shadow-lg">
          <button
            type="button"
            onClick={() => setCadence("monthly")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              cadence === "monthly"
                ? "bg-gold text-ink-950 shadow-md"
                : "text-muted hover:text-bone"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setCadence("annual")}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              cadence === "annual"
                ? "bg-gold text-ink-950 shadow-md"
                : "text-muted hover:text-bone"
            }`}
          >
            <span>Annual Billing</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Save 20%
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => openWhopModal()}
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs text-gold-bright hover:bg-gold/20 transition shadow-sm"
        >
          <Key className="h-3.5 w-3.5 text-gold" />
          <span>Have an existing Whop Key? Unlock Terminal Access Instantly</span>
          <WhopBadge />
        </button>

        {user && (
          <p className="text-xs text-muted">
            Logged in as <strong className="text-bone">{user.email}</strong> · Current tier:{" "}
            <span className="font-mono font-bold uppercase text-gold-bright">
              {currentPlan}
            </span>
          </p>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const displayPrice =
            plan.price === 0
              ? 0
              : cadence === "annual"
              ? Math.round(plan.price * 0.8)
              : plan.price;

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
                  Most Popular Desk
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
                  {displayPrice === 0 ? "Free" : `$${displayPrice}`}
                </span>
                <span className="text-xs text-muted">
                  {displayPrice === 0 ? "forever" : cadence === "annual" ? "/month (billed annually)" : plan.cadence}
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
                <th className="px-4 py-3 text-center font-medium text-gold">Premium ($29/mo)</th>
                <th className="px-4 py-3 text-center font-medium">Institutional ($149/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {[
                ["2,000+ Asset Trend Scores", "Top 24 only", "All 2,000+ Unlimited", "All 2,000+ Unlimited"],
                ["Realtime Minute Predictions", "5 per day", "Continuous 60s stream", "Continuous 60s + Webhook"],
                ["Discord Live Chat Floor", "Read & react", "Full posting & signals", "Priority Analyst Desk"],
                ["Position Sizing Calculator", "Basic", "Advanced Vol Parity", "Institutional Multi-book"],
                ["20 Video Masterclasses", "Course 1 only", "All 20 masterclasses", "All 20 + Team Seats"],
                ["Raw Math Invalidation Levels", "Delayed", "Instant Realtime", "Instant Realtime"],
                ["Direct API & CSV Exports", "✗", "Daily CSV", "Real-Time REST & Webhooks"],
              ].map(([feature, r, p, inst]) => (
                <tr key={feature} className="hover:bg-ink-850/40">
                  <td className="px-4 py-3 text-bone font-medium">{feature}</td>
                  <td className="px-4 py-3 text-center text-muted font-mono">{r}</td>
                  <td className="px-4 py-3 text-center text-gold-bright font-mono font-semibold">{p}</td>
                  <td className="px-4 py-3 text-center text-bone font-mono">{inst}</td>
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
            Everything you need to know about the Whop subscription, cancellation policies, supported payment rails, and institutional scoring methodology.
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
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl space-y-5">
            <button
              type="button"
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
                  Desk Subscription
                </span>
                <h3 className="font-display text-xl text-bone">
                  Activate {activeModalPlan.name}
                </h3>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Unlock complete algorithmic access to 2,000+ asset scoring models, Discord live floor execution, and all 20 video masterclasses.
            </p>

            {/* Plan Summary Box */}
            <div className="rounded-xl border border-line bg-ink-950 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Selected Tier:</span>
                <strong className="text-bone">{activeModalPlan.name}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Billing Cycle:</span>
                <span className="text-bone capitalize">{cadence}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Amount Due Today:</span>
                <span className="font-mono text-sm font-bold text-gold-bright">
                  {activeModalPlan.price === 0
                    ? "$0 (Free)"
                    : cadence === "annual"
                    ? `$${Math.round(activeModalPlan.price * 0.8 * 12)} / year`
                    : `$${activeModalPlan.price} / month`}
                </span>
              </div>
            </div>

            {/* Simulated Payment Selector */}
            {activeModalPlan.price > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted uppercase">Select Payment Rail</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "card", label: "Credit Card", icon: "💳" },
                    { id: "gpay", label: "Google Pay", icon: "⚡" },
                    { id: "crypto", label: "USDC Crypto", icon: "🪙" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs transition ${
                        paymentMethod === m.id
                          ? "border-gold bg-gold/15 text-gold-bright font-bold"
                          : "border-line bg-ink-950 text-muted hover:text-bone"
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="mt-1 text-[11px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Account Sync Status */}
            {!user ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-2">
                <p>
                  You are not currently signed in. You can activate this plan as a local guest or sign in with Google to permanently save it to your Firestore cloud profile.
                </p>
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-ink-950 hover:bg-amber-300 transition"
                >
                  Sign in with Google First
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Syncs directly to your Firebase profile: <strong>{user.email}</strong></span>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => setActiveModalPlan(null)}
                className="rounded-full border border-line px-4 py-2 text-xs text-muted hover:text-bone"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscription}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Activating Plan...</span>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>Confirm &amp; Unlock {activeModalPlan.name}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
