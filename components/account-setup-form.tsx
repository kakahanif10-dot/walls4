"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export function AccountSetupForm() {
  const { user, profile, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 12) {
      setMessage("Choose a password with at least 12 characters.");
      return;
    }

    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage("Your password could not be saved. Request a fresh secure link and try again.");
        return;
      }

      setPassword("");
      setConfirmation("");
      setComplete(true);
    } catch {
      setMessage("Your password could not be saved. Request a fresh secure link and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || (user && !profile)) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-bone/65">
        Checking your secure account link…
      </div>
    );
  }

  if (!user || profile?.provider !== "supabase") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-sm leading-6 text-bone/70">
          Open the latest account setup email on this device to verify your purchase and continue.
          For your security, the setup link can only be used through the email address entered at checkout.
        </p>
        <p className="mt-5 text-sm text-bone/55">
          If you have already set up your account, sign in with the same email used for your Whop purchase.
        </p>
        <Link className="mt-6 inline-flex text-sm font-semibold text-gold hover:text-gold/80" href="/pricing">
          Return to membership options
        </Link>
      </div>
    );
  }

  if (complete) {
    return (
      <div aria-live="polite" className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-8">
        <p className="text-sm font-semibold text-gold">Your account is ready.</p>
        <p className="mt-2 text-sm leading-6 text-bone/70">
          Your password has been saved and lifetime access is linked to {user.email}.
        </p>
        <Link className="mt-6 inline-flex text-sm font-semibold text-gold hover:text-gold/80" href="/research">
          Continue to research
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-8" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-bone" htmlFor="account-email">
          Account email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-bone outline-none"
          id="account-email"
          readOnly
          value={user.email ?? ""}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-bone" htmlFor="new-password">
          Create password
        </label>
        <input
          autoComplete="new-password"
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-bone outline-none focus:border-gold/60"
          id="new-password"
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <p className="mt-2 text-xs text-bone/50">Use at least 12 characters.</p>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-bone" htmlFor="confirm-password">
          Confirm password
        </label>
        <input
          autoComplete="new-password"
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-bone outline-none focus:border-gold/60"
          id="confirm-password"
          minLength={12}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
        />
      </div>
      {message && (
        <p aria-live="polite" className="text-sm text-rose-300">
          {message}
        </p>
      )}
      <button
        className="w-full rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-[#17140e] transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        {saving ? "Saving password…" : "Finish account setup"}
      </button>
    </form>
  );
}
