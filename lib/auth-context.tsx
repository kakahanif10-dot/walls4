"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPhoneNumber,
  signOut as fbSignOut,
  type ConfirmationResult,
  type RecaptchaVerifier,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleAuthProvider, appleAuthProvider, facebookAuthProvider } from "./firebase";

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
  provider?: "firebase" | "guest";
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  signInWithGoogle: (acceptedPolicies: boolean) => Promise<void>;
  signInWithApple: (acceptedPolicies: boolean) => Promise<void>;
  signInWithFacebook: (acceptedPolicies: boolean) => Promise<void>;
  sendEmailSignInLink: (email: string) => Promise<void>;
  completeEmailSignIn: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  requestPhoneCode: (phone: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneCode: (confirmation: ConfirmationResult, code: string, acceptedPolicies: boolean) => Promise<void>;
  signInWithEmail: (email: string, password: string, acceptedPolicies: boolean) => Promise<void>;
  signUpWithEmail: (email: string, password: string, acceptedPolicies: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signInWithFacebook: async () => {},
  sendEmailSignInLink: async () => {},
  completeEmailSignIn: async () => {},
  sendPasswordReset: async () => {},
  requestPhoneCode: async () => { throw new Error("Phone sign-in is unavailable."); },
  verifyPhoneCode: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOutUser: async () => {},
});

const POLICY_VERSION = "2026-11-14";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async (account: User, acceptedPolicies = false) => {
    const userRef = doc(db, "users", account.uid);
    const now = new Date().toISOString();
    try {
      const snapshot = await getDoc(userRef);
      const existing = snapshot.exists() ? snapshot.data() : null;
      const accountProfile = {
        uid: account.uid,
        email: account.email || "",
        displayName: account.displayName || account.email?.split("@")[0] || "Trader",
        photoURL: account.photoURL || "",
        updatedAt: now,
        ...(existing ? {} : { plan: "reader" as const, createdAt: now }),
        ...(acceptedPolicies ? {
          privacyPolicyAcceptedAt: now,
          termsAcceptedAt: now,
          privacyPolicyVersion: POLICY_VERSION,
          termsVersion: POLICY_VERSION,
        } : {}),
      };
      await setDoc(userRef, accountProfile, { merge: true });
      const nextProfile = { ...(existing || {}), ...accountProfile, provider: "firebase" as const } as UserProfileData;
      setProfile(nextProfile);
    } catch (error) {
      console.warn("Could not sync user profile:", error);
      setProfile({
        uid: account.uid,
        email: account.email || "",
        displayName: account.displayName || "Trader",
        provider: "firebase",
      });
      if (acceptedPolicies) throw error;
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (account) => {
    setUser(account);
    if (account) await syncProfile(account);
    else setProfile(null);
    setLoading(false);
  }), [syncProfile]);

  const signInWithGoogle = useCallback(async (acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const credential = await signInWithPopup(auth, googleAuthProvider);
    await syncProfile(credential.user, true);
  }, [syncProfile]);

  const signInWithApple = useCallback(async (acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const credential = await signInWithPopup(auth, appleAuthProvider);
    await syncProfile(credential.user, true);
  }, [syncProfile]);

  const signInWithFacebook = useCallback(async (acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const credential = await signInWithPopup(auth, facebookAuthProvider);
    await syncProfile(credential.user, true);
  }, [syncProfile]);

  const sendEmailSignInLink = useCallback(async (email: string) => {
    await sendSignInLinkToEmail(auth, email.trim(), {
      url: typeof window !== "undefined" ? window.location.href : "https://nextwallstreet.com",
      handleCodeInApp: true,
    });
  }, []);

  const completeEmailSignIn = useCallback(async (email: string) => {
    if (!isSignInWithEmailLink(auth, window.location.href)) throw new Error("This sign-in link is invalid or has expired.");
    const credential = await signInWithEmailLink(auth, email.trim(), window.location.href);
    await syncProfile(credential.user, true);
  }, [syncProfile]);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const requestPhoneCode = useCallback(async (phone: string, verifier: RecaptchaVerifier) => {
    return signInWithPhoneNumber(auth, phone.trim(), verifier);
  }, []);

  const verifyPhoneCode = useCallback(async (confirmation: ConfirmationResult, code: string, acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const credential = await confirmation.confirm(code.trim());
    await syncProfile(credential.user, true);
  }, [syncProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string, acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await syncProfile(credential.user, true);
  }, [syncProfile]);

  const signUpWithEmail = useCallback(async (email: string, password: string, acceptedPolicies: boolean) => {
    if (!acceptedPolicies) throw new Error("Please accept the Privacy Policy and Terms of Service first.");
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await syncProfile(credential.user, true);
  }, [syncProfile]);

  const signOutUser = useCallback(async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithApple,
        signInWithFacebook,
        sendEmailSignInLink,
        completeEmailSignIn,
        sendPasswordReset,
        requestPhoneCode,
        verifyPhoneCode,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
