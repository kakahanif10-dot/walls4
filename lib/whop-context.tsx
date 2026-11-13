"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, X } from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth-context";

type WhopStatus = {
  authenticated: boolean;
  unlocked: boolean;
};

type WhopContextValue = {
  isUnlocked: boolean;
  isChecking: boolean;
  isModalOpen: boolean;
  modalDesk: string | null;
  openWhopModal: (deskName?: string) => void;
  closeWhopModal: () => void;
  unlockWithWhop: () => Promise<boolean>;
  lockWhop: () => void;
};

const WhopContext = createContext<WhopContextValue | null>(null);

async function fetchWhopStatus(url: string): Promise<WhopStatus> {
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 401) return { authenticated: false, unlocked: false };
  if (!response.ok) throw new Error("Membership status is unavailable.");
  return (await response.json()) as WhopStatus;
}

export function WhopProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDesk, setModalDesk] = useState<string | null>(null);
  const statusKey =
    user && profile?.provider === "supabase"
      ? (["/api/whop/validate", user.uid] as const)
      : null;
  const { data, error, isLoading, mutate } = useSWR(
    statusKey,
    ([url]) => fetchWhopStatus(url),
    { revalidateOnFocus: true, revalidateOnReconnect: true },
  );
  const isUnlocked = data?.unlocked === true;
  const isChecking = isLoading;

  const openWhopModal = useCallback((deskName?: string) => {
    setModalDesk(deskName ?? null);
    setIsModalOpen(true);
  }, []);

  const closeWhopModal = useCallback(() => {
    setIsModalOpen(false);
    setModalDesk(null);
  }, []);

  const unlockWithWhop = useCallback(async () => {
    try {
      const status = await mutate();
      return status?.unlocked === true;
    } catch {
      return false;
    }
  }, [mutate]);

  const lockWhop = useCallback(() => {
    void mutate();
  }, [mutate]);

  const value: WhopContextValue = {
    isUnlocked,
    isChecking,
    isModalOpen,
    modalDesk,
    openWhopModal,
    closeWhopModal,
    unlockWithWhop,
    lockWhop,
  };

  return (
    <WhopContext.Provider value={value}>
      {children}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <section
            aria-labelledby="membership-access-title"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#141512] p-7 shadow-2xl sm:p-9"
            role="dialog"
          >
            <button
              aria-label="Close membership access details"
              className="absolute right-5 top-5 rounded-md p-2 text-bone/55 transition hover:bg-white/5 hover:text-bone"
              onClick={closeWhopModal}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
              {isChecking ? (
                <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : isUnlocked ? (
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              ) : (
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              )}
            </div>
            <h2 className="pr-8 font-display text-2xl text-bone" id="membership-access-title">
              {modalDesk ? `Access ${modalDesk}` : "Lifetime research access"}
            </h2>
            {isUnlocked ? (
              <p className="mt-4 text-sm leading-6 text-bone/65">
                Your verified account has lifetime access. If an article is still locked, refresh your access status and try again.
              </p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-bone/65">
                Purchase access through Whop, then open the secure setup link sent to the buyer email. Your account is created automatically after payment verification.
              </p>
            )}
            {error && (
              <p aria-live="polite" className="mt-4 text-sm text-rose-300">
                Membership status could not be refreshed. Please try again.
              </p>
            )}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {isUnlocked ? (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-[#17140e] transition hover:bg-gold/90"
                  onClick={() => void unlockWithWhop()}
                  type="button"
                >
                  Refresh access <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-[#17140e] transition hover:bg-gold/90"
                  href="/pricing"
                  onClick={closeWhopModal}
                >
                  View membership <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              )}
              <button
                className="rounded-lg border border-white/10 px-5 py-3 text-sm font-medium text-bone/75 transition hover:bg-white/5 hover:text-bone"
                onClick={closeWhopModal}
                type="button"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </WhopContext.Provider>
  );
}

export function useWhop() {
  const context = useContext(WhopContext);
  if (!context) throw new Error("useWhop must be used within WhopProvider.");
  return context;
}
