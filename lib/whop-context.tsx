"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle2, Sparkles, ExternalLink, ArrowRight, ShieldCheck, Zap, MessageSquare } from "lucide-react";

interface WhopContextValue {
  isUnlocked: boolean;
  badge: string;
  unlockWithWhop: (options?: { licenseKey?: string; email?: string }) => Promise<boolean>;
  lockWhop: () => void;
  openWhopModal: (deskName?: string) => void;
  closeWhopModal: () => void;
  isModalOpen: boolean;
}

const WhopContext = createContext<WhopContextValue>({
  isUnlocked: false,
  badge: "PRO",
  unlockWithWhop: async () => false,
  lockWhop: () => {},
  openWhopModal: () => {},
  closeWhopModal: () => {},
  isModalOpen: false,
});

export function WhopProvider({ children }: { children: ReactNode }) {
  const { user, profile, updateUserPlan } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deskName, setDeskName] = useState<string>("NextWall Street PRO");
  const [licenseInput, setLicenseInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Synchronize state from user profile or localStorage on mount
  useEffect(() => {
    try {
      const localStatus = localStorage.getItem("nws_whop_unlocked");
      if (localStatus === "true") {
        setIsUnlocked(true);
        return;
      }
      if (profile?.plan === "premium" || profile?.plan === "institutional") {
        setIsUnlocked(true);
        localStorage.setItem("nws_whop_unlocked", "true");
        return;
      }
    } catch {
      // ignore
    }
  }, [profile]);

  const unlockWithWhop = useCallback(
    async (options?: { licenseKey?: string; email?: string }) => {
      setLoading(true);
      setFeedback(null);
      try {
        const res = await fetch("/api/whop/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            licenseKey: options?.licenseKey || licenseInput.trim(),
            email: options?.email || emailInput.trim(),
            action: "activate",
          }),
        });

        const data = await res.json();
        if (data.success && data.unlocked) {
          setIsUnlocked(true);
          try {
            localStorage.setItem("nws_whop_unlocked", "true");
            if (options?.licenseKey || licenseInput) {
              localStorage.setItem("nws_whop_license", options?.licenseKey || licenseInput);
            }
          } catch {}

          // Update user profile in Firestore if logged in
          if (user) {
            try {
              const userRef = doc(db, "users", user.uid);
              await setDoc(userRef, { whopUnlocked: true, plan: "premium" }, { merge: true });
            } catch (err) {
              console.warn("Firestore whop sync:", err);
            }
          }
          await updateUserPlan("premium");

          setFeedback({
            type: "success",
            message: "PRO membership verified. Real-time institutional alerts and terminal access enabled.",
          });
          setTimeout(() => {
            setIsModalOpen(false);
            setFeedback(null);
          }, 2000);
          return true;
        } else {
          setFeedback({
            type: "error",
            message: data.error || "Unable to verify Whop license key. Please check your credentials.",
          });
          return false;
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "Failed to establish handshake with Whop gateway.",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [licenseInput, emailInput, user, updateUserPlan]
  );

  const lockWhop = useCallback(() => {
    setIsUnlocked(false);
    try {
      localStorage.removeItem("nws_whop_unlocked");
      localStorage.removeItem("nws_whop_license");
    } catch {}
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        setDoc(userRef, { whopUnlocked: false, plan: "reader" }, { merge: true });
      } catch {}
    }
    updateUserPlan("reader");
    setFeedback({
      type: "success",
      message: "Terminal access switched to Standard Reader tier.",
    });
    setTimeout(() => setFeedback(null), 2500);
  }, [user, updateUserPlan]);

  const openWhopModal = useCallback((desk?: string) => {
    if (desk) setDeskName(desk);
    setIsModalOpen(true);
  }, []);

  const closeWhopModal = useCallback(() => {
    setIsModalOpen(false);
    setFeedback(null);
  }, []);

  return (
    <WhopContext.Provider
      value={{
        isUnlocked,
        badge: "PRO",
        unlockWithWhop,
        lockWhop,
        openWhopModal,
        closeWhopModal,
        isModalOpen,
      }}
    >
      {children}

      {/* WHOP ACCESS & FAST ALERT CHECKOUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-gold/30 bg-ink-900 p-6 sm:p-7 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={closeWhopModal}
              className="absolute right-4 top-4 text-muted hover:text-bone text-base p-1"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 font-mono text-sm font-bold text-gold-bright shadow-inner">
                PRO
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Institutional Access &amp; VIP Alerts
                </span>
                <h3 className="font-display text-xl text-bone">
                  {isUnlocked ? "PRO Membership Active" : `Access ${deskName}`}
                </h3>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Unlock real-time quantitative pipelines, 70 research dossiers, 60 video masterclasses, position sizing engine, and private Telegram / Discord broadcast channels without browser friction.
            </p>

            {/* Institutional Concierge info (Phone Number 100% Removed) */}
            <div className="rounded-xl border border-gold/30 bg-gold/[0.05] p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gold-bright flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-gold" />
                  VIP Instant Dispatch &amp; Concierge Desk
                </span>
                <span className="font-mono text-[11px] text-bone font-medium">Terminal Broadcast</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Active PRO members receive direct automated push notifications via our private Telegram terminal feed. Immediate fulfillment is processed automatically upon membership authorization.
              </p>
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div
                className={`rounded-xl border p-3 text-xs leading-relaxed ${
                  feedback.type === "success"
                    ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
                    : "border-rose-500/50 bg-rose-950/60 text-rose-300"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {!isUnlocked ? (
              <div className="space-y-4 pt-1">
                {/* Method 1: Instant Whop Pay & Unlock */}
                <button
                  type="button"
                  onClick={() => unlockWithWhop()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-xs font-bold text-ink-950 hover:bg-gold-bright transition-all shadow-lg hover:shadow-gold/20 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying Subscription via Whop...</span>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Unlock PRO via Whop Checkout ($29/month)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-line/60" />
                  </div>
                  <span className="relative bg-ink-900 px-3 text-[10px] uppercase font-bold text-muted">
                    Or Enter Existing Whop License
                  </span>
                </div>

                {/* Method 2: Enter Whop Key / Email */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    placeholder="Paste Whop License Key..."
                    className="w-full rounded-xl border border-line bg-ink-950 px-3.5 py-2.5 text-xs text-bone placeholder:text-muted/60 focus:border-gold focus:outline-none font-mono"
                  />
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Whop Account Email (optional)..."
                      className="flex-1 rounded-xl border border-line bg-ink-950 px-3.5 py-2.5 text-xs text-bone placeholder:text-muted/60 focus:border-gold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => unlockWithWhop()}
                      disabled={loading || (!licenseInput.trim() && !emailInput.trim())}
                      className="rounded-xl border border-gold/50 bg-gold/15 px-4 py-2.5 text-xs font-semibold text-gold-bright hover:bg-gold/25 transition disabled:opacity-40"
                    >
                      Validate
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-200">PRO Membership Active</p>
                    <p className="text-[11px] text-emerald-300/80">
                      Full institutional terminal access unlocked: 44 analyst desks, 70 research dossiers, 60 video masterclasses, and encrypted dispatch channels.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2 pt-2 border-t border-line/60">
                  <button
                    type="button"
                    onClick={lockWhop}
                    className="text-xs text-muted hover:text-rose-400 transition"
                  >
                    Reset Credentials
                  </button>
                  <button
                    type="button"
                    onClick={closeWhopModal}
                    className="rounded-full bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow"
                  >
                    Enter Terminal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </WhopContext.Provider>
  );
}

export function useWhop() {
  return useContext(WhopContext);
}
