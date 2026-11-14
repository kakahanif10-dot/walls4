"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { supabase } from "./supabase";

const KEY = "nws.watchlist.v1";
const EVENT = "nws:watchlist-change";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((symbol): symbol is string => typeof symbol === "string") : [];
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

  useEffect(() => {
    let active = true;
    if (!user) {
      setSymbols(readLocal());
      setReady(true);
      const sync = () => setSymbols(readLocal());
      window.addEventListener(EVENT, sync);
      window.addEventListener("storage", sync);
      return () => {
        active = false;
        window.removeEventListener(EVENT, sync);
        window.removeEventListener("storage", sync);
      };
    }

    setReady(false);
    const load = async () => {
      const { data, error } = await supabase.from("watchlist_items").select("symbol").eq("user_id", user.id).order("added_at");
      if (!active) return;
      if (error) {
        console.error("[v0] Could not load Supabase watchlist:", error);
        setSymbols(readLocal());
      } else {
        const savedSymbols = data.map((item) => item.symbol);
        setSymbols(savedSymbols);
        writeLocal(savedSymbols);
      }
      setReady(true);
    };
    void load();

    const channel = supabase.channel(`watchlist-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "watchlist_items", filter: `user_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const toggle = useCallback(async (symbol: string) => {
    const current = symbols;
    const isPresent = current.includes(symbol);
    const next = isPresent ? current.filter((item) => item !== symbol) : [...current, symbol];
    setSymbols(next);
    writeLocal(next);

    if (!user) return;
    const result = isPresent
      ? await supabase.from("watchlist_items").delete().eq("user_id", user.id).eq("symbol", symbol)
      : await supabase.from("watchlist_items").insert({ user_id: user.id, symbol });
    if (result.error) {
      console.error("[v0] Could not save Supabase watchlist:", result.error);
      setSymbols(current);
      writeLocal(current);
    }
  }, [symbols, user]);

  const has = useCallback((symbol: string) => symbols.includes(symbol), [symbols]);
  return { symbols, ready, toggle, has };
}
