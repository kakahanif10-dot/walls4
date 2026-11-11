"use client";

import { useState } from "react";
import { Zap, Send, MessageSquare, BellRing, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import WhopBadge from "./whop-badge";
import { useWhop } from "@/lib/whop-context";

export default function FastAlertBanner() {
  const { isUnlocked, openWhopModal } = useWhop();
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle && !email) return;
    setSubscribed(true);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900 p-6 sm:p-8 shadow-2xl">
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-gold-bright">
            <Zap className="h-3.5 w-3.5 text-gold animate-pulse" />
            <span>VIP Terminal Dispatch · Real-Time Telegram &amp; Discord Direct Feeds</span>
            <WhopBadge size="xs" />
          </div>

          <h2 className="mt-4 font-display text-2xl sm:text-3xl text-bone leading-tight">
            Realize Immediate $29/Month Value Daily on Your Mobile Terminal.
          </h2>

          <p className="mt-3 text-sm text-muted leading-relaxed max-w-xl">
            Never miss critical market shifts. Receive instantaneous alerts the moment an invalidation anchor breaches, institutional pre-market imbalances appear, or viral liquidity shifts—delivered straight to your encrypted Telegram VIP channel and Discord trading room.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-ink-900/60 p-2.5">
              <Send className="h-4 w-4 text-sky-400 shrink-0" />
              <div>
                <p className="font-semibold text-bone">Telegram Terminal</p>
                <p className="text-[10px] text-muted">Sub-second push alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-ink-900/60 p-2.5">
              <MessageSquare className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <p className="font-semibold text-bone">Discord Trading Room</p>
                <p className="text-[10px] text-muted">Desk setups &amp; live floor</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-ink-900/60 p-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-bone">Subscriber Concierge</p>
                <p className="text-[10px] text-muted">Direct desk access</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-ink-950/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <BellRing className="h-3.5 w-3.5" />
              Subscriber Terminal Activation
            </span>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              LIVE DISPATCH
            </span>
          </div>

          {!subscribed ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-muted mb-1">Telegram / Discord Username</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@trader_handle"
                  className="w-full rounded-xl border border-line bg-ink-900 px-3.5 py-2 text-xs text-bone placeholder:text-muted/50 focus:border-gold focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted mb-1">Subscriber Account Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="subscriber@institutional.com"
                  className="w-full rounded-xl border border-line bg-ink-900 px-3.5 py-2 text-xs text-bone placeholder:text-muted/50 focus:border-gold focus:outline-none font-mono"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-ink-950 transition hover:bg-gold-bright shadow flex items-center justify-center gap-1.5"
                >
                  <span>Connect Terminal Feed</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <CheckCircle className="h-4 w-4" />
                <span>Terminal Connected Successfully</span>
              </div>
              <p className="text-emerald-200/80 text-[11px] leading-relaxed">
                Your handle has been queued for real-time dispatch. Market Open memos, Invalidation Triggers, and Flow Alerts will now stream directly to your terminal.
              </p>
              <button
                type="button"
                onClick={() => setSubscribed(false)}
                className="text-[10px] text-muted hover:text-bone underline underline-offset-2"
              >
                Modify connection details
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted/70 text-center">
            Standard with PRO Membership ($29/month). Dispatched daily at New York Bell, Level Invalidation, and Volume Outliers.
          </p>
        </div>
      </div>
    </section>
  );
}
