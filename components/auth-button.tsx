"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Award, Bookmark, Calculator, LogOut, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWhop } from "@/lib/whop-context";
import { LockedLink } from "@/components/locked-action";
import BrandMark from "@/components/brand-mark";

export default function AuthButton() {
  const { user, profile, loading, sendPasswordReset, signInWithEmail, signInWithOAuth, signUpWithEmail, signOutUser } = useAuth();
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
    if (code === "invalid_credentials" || code === "invalid_grant") return "Email or password is incorrect.";
    if (code === "user_already_exists") return "An account already uses this email. Sign in instead.";
    if (code === "weak_password") return "Choose a password with at least 6 characters.";
    if (code === "email_not_confirmed") return "Confirm your email using the link we sent before signing in.";
    if (code === "over_email_send_rate_limit") return "Too many email requests. Please wait a few minutes and try again.";
    if (code === "email_address_invalid") return "Enter a valid email address.";
    return "Could not complete sign-in. Please check your details and try again.";
  };

  const handleRecovery = async () => {
    if (!email.trim()) return setMessage({ type: "error", text: "Enter your email address first. Your email is your username." });
    setSubmitting(true);
    setMessage(null);
    try {
      await sendPasswordReset(email);
      setMessage({ type: "success", text: `Password reset instructions were sent to ${email}.` });
    } catch (error) {
      setMessage({ type: "error", text: explainAuthError(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "apple" | "facebook") => {
    if (!acceptedPolicies) {
      setMessage({ type: "error", text: "Please accept both policies before continuing." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await signInWithOAuth(provider, acceptedPolicies);
    } catch {
      setMessage({ type: "error", text: `Could not start ${provider} sign-in. Make sure this provider is enabled in Supabase, then try again.` });
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
      if (isSignUp) {
        const signedIn = await signUpWithEmail(email, password, acceptedPolicies);
        if (!signedIn) {
          setMessage({ type: "success", text: "Account created. Check your inbox to confirm your email, then sign in." });
          return;
        }
      } else {
        await signInWithEmail(email, password, acceptedPolicies);
      }
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
            {profile?.photoURL ? <Image src={profile.photoURL} alt="" width={28} height={28} className="rounded-full object-cover" referrerPolicy="no-referrer" /> : <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 font-mono font-bold text-gold-bright">{(profile?.displayName || user.email || "T")[0].toUpperCase()}</span>}
            <span className="max-w-[100px] truncate font-medium">{profile?.displayName || user.email?.split("@")[0] || "Trader"}</span>
            <span className="rounded bg-gold/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gold-bright">{isUnlocked ? "LIFETIME" : "ACCOUNT"}</span>
          </button>
          {menuOpen && <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-ink-900/95 p-3 shadow-2xl backdrop-blur-md">
            <div className="rounded-xl bg-ink-950/60 p-3"><p className="truncate text-xs font-semibold text-bone">{profile?.displayName || user.email?.split("@")[0] || "Trader"}</p><p className="truncate text-[10px] text-muted">{user.email}</p></div>
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
            <div className="mb-7 flex justify-center border-b border-white/[0.08] pb-5">
              <BrandMark centered />
            </div>
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold"><ShieldCheck className="h-4 w-4" /> Secure Supabase Account</span>
            <h2 id="auth-title" className="mt-3 font-display text-3xl text-bone sm:text-4xl">{isSignUp ? "Create your account" : "Sign in to your desk"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Save your watchlist and account preferences securely. Sign-in is optional; you can browse without an account.</p>
          </div>

          {message && <p role="status" className={`mb-5 rounded-xl p-3 text-sm ${message.type === "success" ? "bg-emerald-950/70 text-emerald-300" : "bg-rose-950/70 text-rose-300"}`}>{message.text}</p>}

          <div className="mx-auto max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col">
              <label htmlFor="auth-email" className="mb-1 mt-1 text-xs text-muted">Email address</label>
                <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-11 rounded-xl border border-ink-700 bg-ink-950 px-3.5 text-sm text-bone placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20" />
                <label htmlFor="auth-password" className="mb-1 mt-4 text-xs text-muted">{isSignUp ? "Create a password" : "Password"}</label>
                <input id="auth-password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={isSignUp ? 6 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignUp ? "At least 6 characters" : "Your password"} className="min-h-11 rounded-xl border border-ink-700 bg-ink-950 px-3.5 text-sm text-bone placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20" />
              <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-muted">
                <input type="checkbox" required checked={acceptedPolicies} onChange={(event) => setAcceptedPolicies(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-amber-400" />
                <span>I have read and agree to the <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gold-bright underline underline-offset-2">Privacy Policy</Link> and <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-gold-bright underline underline-offset-2">NextWallStreet Terms of Service</Link>.</span>
              </label>
              {!isSignUp && <>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {([['google', 'Google'], ['facebook', 'Facebook']] as const).map(([provider, label]) => (
                    <button key={provider} type="button" onClick={() => void handleOAuthSignIn(provider)} disabled={submitting || !acceptedPolicies} className="min-h-11 rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs font-semibold text-bone transition hover:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50">Continue with {label}</button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted">
                  Social sign-in requires each provider to be enabled with its OAuth client credentials in Supabase under Authentication → Sign In / Providers.
                </p>
              </>}
              <button type="submit" disabled={submitting || !acceptedPolicies} className="mt-5 min-h-12 w-full rounded-xl bg-gold px-4 text-sm font-bold text-ink-950 transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Signing in…" : isSignUp ? "Create account" : "Continue"}</button>
              {!isSignUp && <button type="button" onClick={() => void handleRecovery()} disabled={submitting} className="mt-3 text-center text-xs text-muted underline underline-offset-2 hover:text-bone">Forgot your password?</button>}
              <button type="button" onClick={() => { setIsSignUp((value) => !value); setMessage(null); }} className="mt-4 text-left text-xs text-gold hover:text-gold-bright">{isSignUp ? "Already have an account? Sign in" : "New to NWS? Create an account"}</button>
              {!isSignUp && <p className="mt-3 text-center text-xs text-muted">Print subscriber? <Link href="/pricing" onClick={closeModal} className="text-gold-bright underline underline-offset-2">Activate your digital subscription</Link></p>}
            </form>
          </div>
        </section>
      </div>, document.body)}
    </>
  );
}
