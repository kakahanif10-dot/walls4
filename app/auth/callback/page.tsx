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

    supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
      if (!active) return;
      if (error) {
        setMessage("This sign-in link is invalid or has expired. Please try again.");
        return;
      }
      const acceptedAt = new URLSearchParams(window.location.search).get("policy_accepted_at");
      const policyVersion = new URLSearchParams(window.location.search).get("policy_version");
      if (acceptedAt && policyVersion) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: profileError } = await supabase.from("profiles").update({
            privacy_policy_accepted_at: acceptedAt,
            terms_accepted_at: acceptedAt,
            privacy_policy_version: policyVersion,
            terms_version: policyVersion,
            updated_at: new Date().toISOString(),
          }).eq("id", user.id);
          if (profileError) {
            setMessage("You are signed in, but we could not save your policy consent. Please contact support.");
            return;
          }
        }
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
