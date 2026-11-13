"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deskName, setDeskName] = useState<string>("NextWall Street PRO");
  const [licenseInput, setLicenseInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
        if (res.ok && data.success === true && data.unlocked === true) {
          setIsUnlocked(true);
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
    [licenseInput, emailInput]
  );

  const lockWhop = useCallback(() => {
    setIsUnlocked(false);
    setFeedback({
      type: "success",
      message: "Terminal access switched to Standard Reader tier.",
    });
    setTimeout(() => setFeedback(null), 2500);
  }, []);

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
                  Lifetime Premium
                </span>
                <h3 className="font-display text-xl text-bone">
                  {isUnlocked ? "Lifetime membership active" : `Access ${deskName}`}
                </h3>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              One-time $2,497 USD purchase for lifetime access to the complete research library and Premium features. Access requires server-side payment verification.
            </p>

            <div className="rounded-xl border border-gold/30 bg-gold/[0.05] p-3.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-gold-bright">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                Purchase activation
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Premium access stays locked until the server verifies a completed one-time payment. A checkout redirect or client-side change does not grant access.
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
              <div className="space-y-3 pt-1">
                <p className="text-xs leading-relaxed text-muted">
                  Lifetime Premium is a one-time $2,497 USD purchase. Membership verification is not configured yet, so checkout will not unlock premium content automatically.
                </p>
                <a
                  href="/pricing"
                  onClick={closeWhopModal}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-xs font-bold text-ink-950 hover:bg-gold-bright"
                >
                  View lifetime plan
                  <ArrowRight className="h-4 w-4" />
                </a>
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
