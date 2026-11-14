"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { buildLifetimeCheckoutUrl } from "@/lib/whop-checkout-links";
import { parseWhopReturnParams } from "@/lib/whop-verification";
import { X } from "lucide-react";

interface WhopUnlockOptions {
  licenseKey?: string;
  email?: string;
  membershipId?: string;
  receiptId?: string;
  paymentId?: string;
  silent?: boolean;
}

interface WhopContextValue {
  isUnlocked: boolean;
  hasCheckedStorage: boolean;
  badge: string;
  unlockWithWhop: (options?: WhopUnlockOptions) => Promise<boolean>;
  lockWhop: () => void;
  openWhopModal: (deskName?: string, targetHref?: string) => void;
  closeWhopModal: () => void;
  isModalOpen: boolean;
}

const WhopContext = createContext<WhopContextValue>({
  isUnlocked: false,
  hasCheckedStorage: false,
  badge: "LIFETIME",
  unlockWithWhop: async () => false,
  lockWhop: () => {},
  openWhopModal: () => {},
  closeWhopModal: () => {},
  isModalOpen: false,
});

const PENDING_HREF_KEY = "nws_whop_pending_href";
const PENDING_CHECKOUT_KEY = "nws_whop_checkout_pending";

export function WhopProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deskName, setDeskName] = useState<string>("Lifetime Premium");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [licenseInput, setLicenseInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [awaitingCheckout, setAwaitingCheckout] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const handledUrlReturnRef = useRef(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const effectiveEmail = (emailInput || user?.email || "").trim();
  const lifetimeCheckoutUrl = buildLifetimeCheckoutUrl({
    email: effectiveEmail || undefined,
    redirectUrl: origin ? `${origin}${pendingHref || "/"}` : undefined,
  });

  useEffect(() => {
    try {
      const savedPendingHref = sessionStorage.getItem(PENDING_HREF_KEY);
      if (savedPendingHref) setPendingHref(savedPendingHref);
      if (sessionStorage.getItem(PENDING_CHECKOUT_KEY) === "true") {
        setAwaitingCheckout(true);
      }
    } catch {
      // ignore storage errors
    } finally {
      setHasCheckedStorage(true);
    }
  }, []);

  const applyVerifiedUnlock = useCallback(
    async (silent?: boolean) => {
      setIsUnlocked(true);
      setAwaitingCheckout(false);
      try {
        sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      } catch {
        // ignore storage errors
      }

      let targetToOpen: string | null = null;
      try {
        targetToOpen = pendingHref || sessionStorage.getItem(PENDING_HREF_KEY);
        sessionStorage.removeItem(PENDING_HREF_KEY);
      } catch {
        targetToOpen = pendingHref;
      }

      if (!silent) {
        setFeedback({
          type: "success",
          message:
            "Lifetime Premium verified. All 2,038+ assets, research desks, Academy courses, and 32 Trade Tools are now unlocked.",
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setFeedback(null);
          if (targetToOpen && targetToOpen !== window.location.pathname + window.location.search) {
            router.push(targetToOpen);
          }
        }, 900);
      } else {
        setIsModalOpen(false);
        setFeedback(null);
        if (targetToOpen && targetToOpen !== window.location.pathname + window.location.search) {
          router.push(targetToOpen);
        }
      }
    },
    [pendingHref, router],
  );

  const unlockWithWhop = useCallback(
    async (options?: WhopUnlockOptions) => {
      const cleanKey = (options?.licenseKey ?? licenseInput).trim();
      const cleanEmail = (options?.email ?? emailInput).trim();
      const cleanMembershipId = (options?.membershipId ?? "").trim();
      const cleanReceiptId = (options?.receiptId ?? "").trim();
      const cleanPaymentId = (options?.paymentId ?? "").trim();
      const silent = Boolean(options?.silent);

      if (!cleanKey && !cleanMembershipId && !cleanReceiptId && !cleanPaymentId) {
        if (!silent) {
          setShowKeyForm(true);
          setFeedback({
            type: "error",
            message: "Complete checkout, then use the Whop license key or membership ID from your receipt to verify access.",
          });
        }
        return false;
      }

      if (!silent) {
        setLoading(true);
        setFeedback(null);
      }

      try {
        const res = await fetch("/api/whop/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            licenseKey: cleanKey || undefined,
            email: cleanEmail || undefined,
            membershipId: cleanMembershipId || undefined,
            receiptId: cleanReceiptId || undefined,
            paymentId: cleanPaymentId || undefined,
            action: "activate",
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.unlocked) {
          await applyVerifiedUnlock(silent);
          return true;
        } else {
          if (!silent) {
            setFeedback({
              type: "error",
              message:
                data.error ||
                "Unable to verify active Whop Lifetime purchase. Confirm your license key or checkout email.",
            });
          }
          return false;
        }
      } catch (err: unknown) {
        if (!silent) {
          const message = err instanceof Error ? err.message : "Failed to connect to Whop verification.";
          setFeedback({ type: "error", message });
        }
        return false;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [licenseInput, emailInput, applyVerifiedUnlock],
  );

  // 1. Auto-verify immediately when Whop redirects back with membership_id, receipt_id, payment_id, or license_key
  useEffect(() => {
    if (!hasCheckedStorage || isUnlocked || handledUrlReturnRef.current) return;
    if (typeof window === "undefined") return;

    const parsed = parseWhopReturnParams(window.location.search);
    if (!parsed.hasWhopReturn) return;

    handledUrlReturnRef.current = true;
    void (async () => {
      const ok = await unlockWithWhop({
        membershipId: parsed.membershipId,
        licenseKey: parsed.licenseKey,
        receiptId: parsed.receiptId,
        paymentId: parsed.paymentId,
        email: parsed.email,
        silent: false,
      });
      if (ok) {
        const url = new URL(window.location.href);
        for (const param of [
          "membership_id",
          "whop_membership_id",
          "receipt_id",
          "payment_id",
          "license_key",
          "whop_key",
          "key",
          "email",
          "status",
          "checkout_status",
        ]) {
          url.searchParams.delete(param);
        }
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    })();
  }, [hasCheckedStorage, isUnlocked, unlockWithWhop]);

  const handleCheckoutStarted = useCallback(() => {
    setAwaitingCheckout(true);
    try {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, "true");
    } catch {
      // ignore storage errors
    }
  }, [effectiveEmail]);

  const lockWhop = useCallback(() => {
    setIsUnlocked(false);
    setAwaitingCheckout(false);
    try {
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      sessionStorage.removeItem(PENDING_HREF_KEY);
    } catch {}
    setFeedback({
      type: "success",
      message: "Lifetime session locked.",
    });
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  const openWhopModal = useCallback((desk?: string, targetHref?: string) => {
    setDeskName(desk || "Lifetime Premium");
    if (targetHref) {
      setPendingHref(targetHref);
      try {
        sessionStorage.setItem(PENDING_HREF_KEY, targetHref);
      } catch {
        // ignore storage errors
      }
    }
    setFeedback(null);
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
        hasCheckedStorage,
        badge: "LIFETIME",
        unlockWithWhop,
        lockWhop,
        openWhopModal,
        closeWhopModal,
        isModalOpen,
      }}
    >
      {children}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeWhopModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lifetime-purchase-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-[#13110c] via-ink-900 to-ink-950 p-7 sm:p-8 shadow-[0_32px_90px_rgba(0,0,0,0.92)]"
          >
            <button
              type="button"
              aria-label="Close purchase modal"
              onClick={closeWhopModal}
              className="absolute right-5 top-5 rounded-lg p-1.5 text-muted transition hover:bg-ink-800 hover:text-bone"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-5">
              <div className="pr-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
                  Membership &amp; Access
                </p>
                <h3
                  id="lifetime-purchase-title"
                  className="mt-1.5 font-display text-2xl leading-snug text-bone"
                >
                  {isUnlocked ? "Lifetime Premium Active" : "Lifetime Premium"}
                </h3>
              </div>

              {!isUnlocked && deskName && deskName !== "Lifetime Premium" && (
                <div className="rounded-lg bg-gold/10 px-3.5 py-2 text-[11px] text-gold-bright">
                  Selected access: <span className="font-semibold text-bone">{deskName}</span>
                </div>
              )}

              <p className="text-xs sm:text-[13px] leading-relaxed text-muted">
                One-time membership granting permanent access to all 2,038+ daily trend scores, exact
                invalidation levels, 70 research desks, all four Academy courses, score-change
                alerts, and all 32 trade tools with zero recurring fees.
              </p>

              {/* Minimalist Summary Ledger */}
              <div className="rounded-xl bg-ink-950/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Membership Tier</span>
                  <span className="font-semibold text-bone">Lifetime Premium</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Billing Structure</span>
                  <span className="font-medium text-bone">One-time · Permanent access</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5">
                  <span className="text-muted">Total Investment</span>
                  <span className="font-mono text-base font-bold text-gold-bright tabular-nums">
                    $1,487 USD
                  </span>
                </div>
              </div>

              {feedback && (
                <div
                  className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                    feedback.type === "success"
                      ? "bg-emerald-950/70 text-emerald-300"
                      : "bg-rose-950/70 text-rose-300"
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              {!isUnlocked ? (
                <div className="space-y-3.5 pt-1">
                  {lifetimeCheckoutUrl ? (
                    <a
                      href={lifetimeCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleCheckoutStarted}
                      className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-xs font-bold tracking-wide text-ink-950 transition hover:bg-gold-bright shadow-lg"
                    >
                      Continue to Lifetime Premium checkout — $1,487 USD
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowKeyForm(true);
                        setFeedback({
                          type: "error",
                          message:
                            "Whop checkout link (NEXT_PUBLIC_WHOP_CHECKOUT_LIFETIME_URL) is not configured yet. Configure it or verify an existing Whop license key below.",
                        });
                      }}
                      className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-xs font-bold tracking-wide text-ink-950 transition hover:bg-gold-bright shadow-lg"
                    >
                      Continue to Lifetime Premium checkout — $1,487 USD
                    </button>
                  )}

                  {awaitingCheckout && (
                    <div className="rounded-xl bg-gold/10 px-3.5 py-2.5 text-[11px] text-gold-bright text-center">
                      Waiting for Whop payment confirmation — access unlocks immediately once your
                      checkout completes.
                    </div>
                  )}

                  <p className="text-[11px] leading-relaxed text-muted/85 text-center">
                    You will continue to Whop to complete the one-time $1,487 USD settlement. Full
                    platform access activates immediately upon payment verification.
                  </p>

                  <div className="pt-1">
                    {!showKeyForm ? (
                      <button
                        type="button"
                        onClick={() => setShowKeyForm(true)}
                        className="flex w-full items-center justify-center text-[11px] font-medium text-gold-bright/90 transition hover:text-gold-bright hover:underline underline-offset-4"
                      >
                        Already completed payment? Verify Whop License Key
                      </button>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        <input
                          type="text"
                          value={licenseInput}
                          onChange={(e) => setLicenseInput(e.target.value)}
                          placeholder="Paste your Whop license key..."
                          className="w-full rounded-xl bg-ink-950/90 px-3.5 py-2.5 text-xs font-mono text-bone placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
                        />
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="Whop Checkout Email..."
                            className="flex-1 rounded-xl bg-ink-950/90 px-3.5 py-2.5 text-xs text-bone placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
                          />
                          <button
                            type="button"
                            onClick={() => unlockWithWhop()}
                            disabled={loading || !licenseInput.trim()}
                            className="rounded-xl bg-gold/15 px-4 py-2 text-xs font-semibold text-gold-bright transition hover:bg-gold/25 disabled:opacity-40"
                          >
                            {loading ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="rounded-xl bg-emerald-500/12 p-4 text-xs text-emerald-300 space-y-1">
                    <p className="font-semibold text-emerald-200">Lifetime Premium Unlocked</p>
                    <p className="text-[11px] leading-relaxed text-emerald-300/85">
                      All 2,038+ assets, 70 research desks, all four Academy courses, and all 32 Trade
                      Tools are permanently active on your account.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={lockWhop}
                      className="text-xs text-muted transition hover:text-rose-400"
                    >
                      Reset Session
                    </button>
                    <button
                      type="button"
                      onClick={closeWhopModal}
                      className="rounded-full bg-gold px-5 py-2 text-xs font-bold text-ink-950 transition hover:bg-gold-bright"
                    >
                      Enter Platform
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </WhopContext.Provider>
  );
}

export function useWhop() {
  return useContext(WhopContext);
}
