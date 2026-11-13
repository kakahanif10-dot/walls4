import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type LifetimeAccessResult =
  | { status: "member"; user: User }
  | { status: "unpaid"; user: User }
  | { status: "unauthenticated"; user: null }
  | { status: "error"; user: null };

export async function getLifetimeAccess(): Promise<LifetimeAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthenticated", user: null };
  if (authError) return { status: "error", user: null };
  if (!user.email_confirmed_at) {
    return { status: "unauthenticated", user: null };
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from("whop_purchases")
    .select("whop_payment_id")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (purchaseError) return { status: "error", user: null };
  return purchase
    ? { status: "member", user }
    : { status: "unpaid", user };
}
