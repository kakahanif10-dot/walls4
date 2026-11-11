"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "./auth-context";
import { db } from "./firebase";
import { handleFirestoreError, OperationType } from "./firestore-error";

const KEY = "nws.watchlist.v1";
const EVENT = "nws:watchlist-change";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(symbols: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(symbols));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function useWatchlist() {
  const { user } = useAuth();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Initial read and local listener
  useEffect(() => {
    if (!user) {
      setSymbols(readLocal());
      setReady(true);
      const sync = () => setSymbols(readLocal());
      window.addEventListener(EVENT, sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener(EVENT, sync);
        window.removeEventListener("storage", sync);
      };
    }
  }, [user]);

  // Firestore sync when user is signed in
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/watchlist`;
    const watchlistCol = collection(db, "users", user.uid, "watchlist");

    const unsubscribe = onSnapshot(
      watchlistCol,
      (snapshot) => {
        const firestoreSymbols: string[] = [];
        snapshot.forEach((docSnap) => {
          firestoreSymbols.push(docSnap.id);
        });
        setSymbols(firestoreSymbols);
        writeLocal(firestoreSymbols);
        setReady(true);
      },
      (error) => {
        console.warn("Watchlist Firestore listener fallback:", error);
        setSymbols(readLocal());
        setReady(true);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const toggle = useCallback(
    async (symbol: string) => {
      const current = symbols;
      const isPresent = current.includes(symbol);
      const next = isPresent
        ? current.filter((s) => s !== symbol)
        : [...current, symbol];

      setSymbols(next);
      writeLocal(next);

      if (user) {
        const path = `users/${user.uid}/watchlist/${symbol}`;
        try {
          const itemRef = doc(db, "users", user.uid, "watchlist", symbol);
          if (isPresent) {
            await deleteDoc(itemRef);
          } else {
            await setDoc(itemRef, {
              symbol,
              addedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          handleFirestoreError(error, isPresent ? OperationType.DELETE : OperationType.WRITE, path);
        }
      }
    },
    [symbols, user],
  );

  const has = useCallback((symbol: string) => symbols.includes(symbol), [symbols]);

  return { symbols, ready, toggle, has };
}
