"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface UserProfileData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  plan?: "reader" | "premium" | "institutional";
  privacyPolicyAcceptedAt?: string;
  termsAcceptedAt?: string;
  privacyPolicyVersion?: string;
  termsVersion?: string;
  provider?: "supabase" | "guest";
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string, acceptedPolicies: boolean) => Promise<void>;
  signInWithOAuth: (provider: "google" | "apple" | "facebook", acceptedPolicies: boolean) => Promise<void>;
  signUpWithEmail: (email: string, password: string, acceptedPolicies: boolean) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signInWithEmail: async () => {},
  signInWithOAuth: async () => {},
  signUpWithEmail: async () => false,
  sendPasswordReset: async () => {},
  signOutUser: async () => {},
});

const POLICY_VERSION = "2026-11-14";

function profileFromUser(user: User): UserProfileData {
  return {
    uid: user.id,
    email: user.email || "",
    displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "Trader",
    photoURL: user.user_metadata?.avatar_url || "",
    provider: "supabase",
  };
}

function acceptedPolicyFields() {
  const acceptedAt = new Date().toISOString();
  return {
    privacy_policy_accepted_at: acceptedAt,
    terms_accepted_at: acceptedAt,
    privacy_policy_version: POLICY_VERSION,
    terms_version: POLICY_VERSION,
    updated_at: acceptedAt,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async (account: User, acceptedPolicies = false) => {
    const fallback = profileFromUser(account);
    setProfile(fallback);

    const { data, error } = await supabase.from("profiles").select(
      "id,email,display_name,photo_url,plan,privacy_policy_accepted_at,terms_accepted_at,privacy_policy_version,terms_version,created_at,updated_at",
    ).eq("id", account.id).maybeSingle();
    if (error) throw error;

    let record = data;
    if (acceptedPolicies && record) {
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update(acceptedPolicyFields())
        .eq("id", account.id)
        .select("id,email,display_name,photo_url,plan,privacy_policy_accepted_at,terms_accepted_at,privacy_policy_version,terms_version,created_at,updated_at")
        .single();
      if (updateError) throw updateError;
      record = updated;
    }

    if (record) {
      setProfile({
        uid: record.id,
        email: record.email || account.email || "",
        displayName: record.display_name || fallback.displayName,
        photoURL: record.photo_url || fallback.photoURL,
        plan: record.plan,
        privacyPolicyAcceptedAt: record.privacy_policy_accepted_at,
        termsAcceptedAt: record.terms_accepted_at,
        privacyPolicyVersion: record.privacy_policy_version,
        termsVersion: record.terms_version,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        provider: "supabase",
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const account = session?.user ?? null;
      setUser(account);
      if (!account) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(profileFromUser(account));
      setLoading(false);
      queueMicrotask(() => {
        if (active) void syncProfile(account).catch((error) => console.error("[v0] Profile sync failed:", error));
      });
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("[v0] Could not restore Supabase session:", error);
      const account = data.session?.user ?? null;
      setUser(account);
      setProfile(account ? profileFromUser(account) : null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string, acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    if (data.user) await syncProfile(data.user, true);
  }, [syncProfile]);

  const signInWithOAuth = useCallback(async (provider: "google" | "apple" | "facebook", acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const callbackUrl = new URL(process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? "/auth/callback", window.location.origin);
    const acceptedAt = new Date().toISOString();
    callbackUrl.searchParams.set("policy_accepted_at", acceptedAt);
    callbackUrl.searchParams.set("policy_version", POLICY_VERSION);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const acceptedAt = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: {
          display_name: email.trim().split("@")[0],
          privacy_policy_accepted_at: acceptedAt,
          terms_accepted_at: acceptedAt,
          privacy_policy_version: POLICY_VERSION,
          terms_version: POLICY_VERSION,
        },
      },
    });
    if (error) throw error;
    if (data.user && data.session) await syncProfile(data.user, true);
    return Boolean(data.session);
  }, [syncProfile]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  }, []);

  const signOutUser = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithEmail, signInWithOAuth, signUpWithEmail, sendPasswordReset, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
