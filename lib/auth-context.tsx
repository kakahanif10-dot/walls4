"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleAuthProvider } from "./firebase";

export interface UserProfileData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider?: "supabase" | "firebase" | "guest";
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextValue {
  user: User | { uid: string; email: string; displayName?: string; photoURL?: string } | null;
  profile: UserProfileData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithSupabaseEmail: (email: string, password?: string) => Promise<{ error: any }>;
  signUpWithSupabaseEmail: (email: string, password?: string) => Promise<{ error: any }>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithSupabaseEmail: async () => ({ error: null }),
  signUpWithSupabaseEmail: async () => ({ error: null }),
  signOutUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile to local/database
  const syncProfile = useCallback(async (u: { uid: string; email: string; displayName?: string; photoURL?: string }, provider: "supabase" | "firebase") => {
    const now = new Date().toISOString();
    try {
      if (provider === "firebase") {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const newProfile: UserProfileData = {
            uid: u.uid,
            email: u.email || "",
            displayName: u.displayName || "Desk Trader",
            photoURL: u.photoURL || "",
            createdAt: now,
            updatedAt: now,
          };
          await setDoc(userRef, newProfile);
          setProfile({ ...newProfile, provider: "firebase" });
        } else {
          const data = snap.data();
          setProfile({
            uid: data.uid,
            email: data.email,
            displayName: data.displayName,
            photoURL: data.photoURL,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            provider: "firebase",
          });
        }
      } else {
        // Supabase profile sync
        setProfile({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || u.email.split("@")[0] || "Supabase Trader",
          photoURL: u.photoURL || "",
          provider: "supabase",
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn("Could not sync user profile:", err);
      setProfile({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || "Trader",
        provider,
        updatedAt: now,
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Check Supabase session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mounted) {
        const suUser = {
          uid: session.user.id,
          email: session.user.email || "",
          displayName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          photoURL: session.user.user_metadata?.avatar_url,
        };
        setUser(suUser);
        syncProfile(suUser, "supabase");
        setLoading(false);
      } else {
        // Fallback to Firebase auth listener
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (!mounted) return;
          if (fbUser) {
            setUser(fbUser);
            await syncProfile({
              uid: fbUser.uid,
              email: fbUser.email || "",
              displayName: fbUser.displayName || undefined,
              photoURL: fbUser.photoURL || undefined,
            }, "firebase");
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });
        return () => unsubscribe();
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        const suUser = {
          uid: session.user.id,
          email: session.user.email || "",
          displayName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          photoURL: session.user.user_metadata?.avatar_url,
        };
        setUser(suUser);
        syncProfile(suUser, "supabase");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      if (cred.user) {
        await syncProfile({
          uid: cred.user.uid,
          email: cred.user.email || "",
          displayName: cred.user.displayName || undefined,
          photoURL: cred.user.photoURL || undefined,
        }, "firebase");
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      throw error;
    }
  }, [syncProfile]);

  const signInWithSupabaseEmail = useCallback(async (email: string, password?: string) => {
    if (password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } else {
      // Magic link
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      return { error };
    }
  }, []);

  const signUpWithSupabaseEmail = useCallback(async (email: string, password?: string) => {
    if (!password) {
      return signInWithSupabaseEmail(email);
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  }, [signInWithSupabaseEmail]);

  const signOutUser = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await fbSignOut(auth).catch(() => {});
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithSupabaseEmail,
        signUpWithSupabaseEmail,
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
