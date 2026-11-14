"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Award, Bookmark, Calculator, LogOut, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWhop } from "@/lib/whop-context";
import { LockedLink } from "@/components/locked-action";

export default function AuthButton() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser } = useAuth();
  const { isUnlocked } = useWhop();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const openModal = () => {
    setAcceptedPolicies(false);
    setMessage(null);
    setModalOpen(true);
  };

  useEffect(() => {
    const handleOpen = () => {
      setAcceptedPolicies(false);
      setMessage(null);
      setModalOpen(true);
    };
    window.addEventListener("open-auth-modal", handleOpen);
    return () => window.removeEventListener("open-auth-modal", handleOpen);
  }, []);

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setMessage(null);
  };

  const explainAuthError = (error: unknown) => {
    const code = (error as { code?: string })?.code;
    if (code === "auth/email-already-in-use") return "An account already uses this email. Sign in instead.";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "Email or password is incorrect.";
    if (code === "auth/weak-password") return "Choose a password with at least 6 characters.";
    if (code === "auth/popup-closed-by-user") return "Google sign-in was closed before it finished.";
    return (error as { message?: string })?.message || "Could not complete sign-in. Please try again.";
  };

  const handleGoogleSignIn = async () => {
    if (!acceptedPolicies) {
      setMessage({ type: "error", text: "Please accept both policies before continuing." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await signInWithGoogle(acceptedPolicies);
      setModalOpen(false);
    } catch (error) {
      setMessage({ type: "error", text: explainAuthError(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!acceptedPolicies) {
      setMessage({ type: "error", text: "Please accept both policies before continuing." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      if (isSignUp) await signUpWithEmail(email, password, acceptedPolicies);
      else await signInWithEmail(email, password, acceptedPolicies);
      setMessage({ type: "success", text: isSignUp ? "Your account is ready. You are signed in." : "Welcome back. You are signed in." });
      setTimeout(() => {
        setModalOpen(false);
        setMessage(null);
      }, 900);
    } catch (error) {
      setMessage({ type: "error", text: explainAuthError(error) });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div aria-hidden="true" className="h-9 w-24 animate-pulse rounded-full bg-ink-800" />;

  return (
    <>
      {!user ? (
        <button type="button" onClick={openModal} className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-ink-900 px-4 py-2 text-xs font-semibold text-bone transition hover:border-gold hover:text-gold-bright">
          <UserIcon className="h-3.5 w-3.5 text-gold" /> Sign In
        </button>
      ) : (
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} className="flex items-center gap-2 rounded-full bg-ink-900 p-1 pr-3 text-xs text-bone transition hover:bg-ink-850">
            {user.photoURL ? <Image src={user.photoURL} alt="" width={28} height={28} className="rounded-full object-cover" referrerPolicy="no-referrer" /> : <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 font-mono font-bold text-gold-bright">{(user.displayName || user.email || "T")[0].toUpperCase()}</span>}
            <span className="max-w-[100px] truncate font-medium">{user.displayName || user.email?.split("@")[0] || "Trader"}</span>
            <span className="rounded bg-gold/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gold-bright">{isUnlocked ? "LIFETIME" : "ACCOUNT"}</span>
          </button>
          {menuOpen && <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-ink-900/95 p-3 shadow-2xl backdrop-blur-md">
            <div className="rounded-xl bg-ink-950/60 p-3"><p className="truncate text-xs font-semibold text-bone">{user.displayName || "Trader"}</p><p className="truncate text-[10px] text-muted">{user.email}</p></div>
            <div className="my-2 flex flex-col gap-1">
              <LockedLink href="/watchlist" deskLabel="Watchlist" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-bone hover:bg-ink-800"><Bookmark className="h-3.5 w-3.5 text-gold" /> Synced Watchlist</LockedLink>
              <LockedLink href="/community" deskLabel="Community" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-bone hover:bg-ink-800"><Shield className="h-3.5 w-3.5 text-emerald-400" /> Live Trading Floor &amp; Alerts</LockedLink>
              <LockedLink href="/calculator" deskLabel="Position Sizing Calculator" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-bone hover:bg-ink-800"><Calculator className="h-3.5 w-3.5 text-gold-bright" /> Position Sizing Calculator</LockedLink>
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-bone hover:bg-ink-800"><Award className="h-3.5 w-3.5 text-gold-bright" /> Plan: {isUnlocked ? "LIFETIME" : "View plans"}</Link>
            </div>
            <button type="button" onClick={() => { setMenuOpen(false); void signOutUser(); }} className="flex w-full items-center gap-2 rounded-lg bg-down/10 px-2.5 py-2 text-xs text-down hover:bg-down/20"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
          </div>}
        </div>
      )}

      {modalOpen && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gold/20 bg-ink-900 p-6 shadow-[0_24px_100px_rgba(0,0,0,0.55)] sm:max-h-[calc(100dvh-3rem)] sm:p-9">
          <button type="button" onClick={closeModal} aria-label="Close sign-in dialog" className="absolute right-5 top-5 rounded-full p-2 text-muted transition hover:bg-ink-800 hover:text-bone">×</button>
          <div className="mb-7 max-w-lg">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold"><ShieldCheck className="h-4 w-4" /> Secure Firebase Account</span>
            <h2 id="auth-title" className="mt-3 font-display text-3xl text-bone sm:text-4xl">{isSignUp ? "Create your account" : "Sign in to your desk"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Save your watchlist and account preferences securely. Sign-in is optional; you can browse without an account.</p>
          </div>

          {message && <p role="status" className={`mb-5 rounded-xl p-3 text-sm ${message.type === "success" ? "bg-emerald-950/70 text-emerald-300" : "bg-rose-950/70 text-rose-300"}`}>{message.text}</p>}

          <div className="grid gap-7 sm:grid-cols-2 sm:gap-9">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-bone">Continue with Google</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">Quick, secure sign-in using your Google account.</p>
              <button type="button" onClick={handleGoogleSignIn} disabled={submitting || !acceptedPolicies} className="mt-5 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-ink-700 bg-ink-950 px-4 text-sm font-medium text-bone transition hover:border-gold/50 hover:bg-ink-850 disabled:cursor-not-allowed disabled:opacity-50">
                <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.44 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.24C.45 8.15 0 9.97 0 12s.45 3.85 1.24 5.43l4.04-3.14z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.56 1.24 6.57l4.04 3.14c.95-2.83 3.6-4.96 6.72-4.96z"/></svg>
                {submitting ? "Connecting…" : "Continue with Google"}
              </button>
              <div className="mt-6 hidden flex-1 items-end sm:flex"><p className="text-xs leading-relaxed text-muted">Your profile and personal settings sync to your Firebase account. Payment access is verified separately.</p></div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col border-t border-ink-800 pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
              <h3 className="text-sm font-semibold text-bone">{isSignUp ? "Create with email" : "Sign in with email"}</h3>
              <label htmlFor="auth-email" className="mb-1 mt-4 text-xs text-muted">Email address</label>
              <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-11 rounded-xl border border-ink-700 bg-ink-950 px-3.5 text-sm text-bone placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20" />
              <label htmlFor="auth-password" className="mb-1 mt-4 text-xs text-muted">Password</label>
              <input id="auth-password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="min-h-11 rounded-xl border border-ink-700 bg-ink-950 px-3.5 text-sm text-bone placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20" />
              <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-muted">
                <input type="checkbox" required checked={acceptedPolicies} onChange={(event) => setAcceptedPolicies(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-amber-400" />
                <span>I have read and agree to the <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gold-bright underline underline-offset-2">Privacy Policy</Link> and <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-gold-bright underline underline-offset-2">NextWallStreet Terms of Service</Link>.</span>
              </label>
              <button type="submit" disabled={submitting || !acceptedPolicies} className="mt-5 min-h-12 w-full rounded-xl bg-gold px-4 text-sm font-bold text-ink-950 transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Signing in…" : isSignUp ? "Create account" : "Sign in"}</button>
              <button type="button" onClick={() => { setIsSignUp((value) => !value); setMessage(null); }} className="mt-4 text-left text-xs text-gold hover:text-gold-bright">{isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}</button>
            </form>
          </div>
        </section>
      </div>, document.body)}
    </>
  );
}
