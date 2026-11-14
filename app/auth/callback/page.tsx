"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your email link…");

  useEffect(() => {
    let active = true;
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      router.replace("/");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (!active) return;
      if (error) {
        setMessage("This sign-in link is invalid or has expired. Please try again.");
        return;
      }
      router.replace("/");
    });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-5 text-center">
      <p role="status" className="text-sm text-muted">{message}</p>
    </main>
  );
}
