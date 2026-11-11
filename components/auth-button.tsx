"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogIn, LogOut, User as UserIcon, Shield, Bookmark, Award, Calculator, Mail, KeyRound, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWhop } from "@/lib/whop-context";

export default function AuthButton() {
  const { user, profile, loading, signInWithGoogle, signInWithSupabaseEmail, signUpWithSupabaseEmail, signOutUser } = useAuth();
  const { isUnlocked } = useWhop();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authMsg, setAuthMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      await signInWithGoogle();
      setAuthModalOpen(false);
    } catch (err: any) {
      setAuthMsg({ type: "error", text: err?.message || "Sign-in failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubmitting(true);
    setAuthMsg(null);
    try {
      if (isSignUp) {
        const { error } = await signUpWithSupabaseEmail(emailInput, passwordInput || undefined);
        if (error) throw error;
        setAuthMsg({
          type: "success",
          text: passwordInput ? "Subscriber account registered! You are signed in." : "Magic sign-in link dispatched to your inbox.",
        });
      } else {
        const { error } = await signInWithSupabaseEmail(emailInput, passwordInput || undefined);
        if (error) throw error;
        setAuthMsg({
          type: "success",
          text: passwordInput ? "Authentication successful. Welcome to NextWall Street." : "Verification link sent to your email.",
        });
      }
      setTimeout(() => {
        setAuthModalOpen(false);
        setAuthMsg(null);
      }, 1500);
    } catch (err: any) {
      setAuthMsg({ type: "error", text: err?.message || "Authentication error encountered." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded-full bg-ink-800" />;
  }

  return (
    <>
      {!user ? (
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-900 px-3.5 py-1.5 text-xs font-medium text-bone transition hover:border-gold/50 hover:bg-ink-850 hover:text-gold-bright"
        >
          <UserIcon className="h-3.5 w-3.5 text-gold" />
          <span>Sign In</span>
        </button>
      ) : (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-line bg-ink-900 p-1 pr-3 text-xs text-bone transition hover:border-gold/50"
          >
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User avatar"}
                width={24}
                height={24}
                className="rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-gold-bright font-mono font-bold text-[11px]">
                {(user.displayName || user.email || "T")[0].toUpperCase()}
              </div>
            )}
            <span className="max-w-[100px] truncate text-xs font-medium text-bone">
              {user.displayName || user.email?.split("@")[0] || "Trader"}
            </span>
            <span className="rounded border border-gold/40 bg-gold/15 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase tracking-wider text-gold-bright">
              {isUnlocked || profile?.plan === "premium" ? "PRO" : "READER"}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-ink-900/95 p-3 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center gap-3 border-b border-line/60 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-gold-bright font-mono font-bold">
                  {(user.displayName || user.email || "T")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-bone">
                    {user.displayName || "Trader"}
                  </p>
                  <p className="truncate text-[10px] text-muted">{user.email}</p>
                </div>
              </div>

              <div className="my-2 space-y-1">
                <Link
                  href="/watchlist"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-bone hover:bg-ink-800 transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5 text-gold" />
                  <span>Synced Watchlist</span>
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-bone hover:bg-ink-800 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Live Trading Floor &amp; Alerts</span>
                </Link>
                <Link
                  href="/calculator"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-bone hover:bg-ink-800 transition-colors"
                >
                  <Calculator className="h-3.5 w-3.5 text-gold-bright" />
                  <span>Position Sizing Calculator</span>
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-bone hover:bg-ink-800 transition-colors"
                >
                  <Award className="h-3.5 w-3.5 text-gold-bright" />
                  <span>Plan: {isUnlocked || profile?.plan === "premium" ? "PRO MEMBER" : "FREE READER"}</span>
                </Link>
              </div>

              <div className="border-t border-line/60 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    signOutUser();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-down hover:bg-down/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUPABASE & GOOGLE SIGN-IN MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-bone text-base"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                NextWall Street Terminal Access
              </span>
              <h3 className="font-display text-2xl text-bone mt-1">
                {isSignUp ? "Create Subscriber Account" : "Sign In to Terminal"}
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Synchronize your cloud watchlist, personal stop invalidation levels, and private terminal broadcasts.
              </p>
            </div>

            {authMsg && (
              <div
                className={`rounded-xl border p-3 text-xs leading-relaxed ${
                  authMsg.type === "success"
                    ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
                    : "border-rose-500/50 bg-rose-950/60 text-rose-300"
                }`}
              >
                {authMsg.text}
              </div>
            )}

            {/* Google Sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-ink-950 px-4 py-2.5 text-xs font-medium text-bone transition hover:border-gold/50 hover:bg-ink-850 hover:text-gold-bright shadow disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.44 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.15 0 9.97 0 12s.45 3.85 1.24 5.43l4.04-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.56 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line/60" />
              </div>
              <span className="relative bg-ink-900 px-3 text-[10px] uppercase font-bold text-muted">
                Or Supabase Email Auth
              </span>
            </div>

            {/* Supabase Email/Password Form */}
            <form onSubmit={handleSupabaseSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-muted mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted/60" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="trader@nextwallstreet.com"
                    className="w-full rounded-xl border border-line bg-ink-950 pl-9 pr-3.5 py-2 text-xs text-bone placeholder:text-muted/50 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-muted mb-1">Password (optional for magic link)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted/60" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="•••••••• (leave empty for magic link)"
                    className="w-full rounded-xl border border-line bg-ink-950 pl-9 pr-3.5 py-2 text-xs text-bone placeholder:text-muted/50 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-ink-950 transition hover:bg-gold-bright shadow disabled:opacity-50"
              >
                {submitting ? "Authenticating..." : isSignUp ? "Sign Up with Supabase" : "Sign In with Supabase"}
              </button>

              <div className="flex justify-between items-center text-[11px] pt-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp((prev) => !prev)}
                  className="text-gold hover:text-gold-bright"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Need an account? Register"}
                </button>
                <span className="text-muted/60 text-[10px]">Supabase Cloud Connected</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
