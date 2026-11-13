import { NextResponse } from "next/server";
import { ANALYST_DESKS_44 } from "@/lib/analyst-desks";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email_confirmed_at) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from("whop_purchases")
    .select("whop_payment_id")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (purchaseError) return jsonResponse({ error: "Access could not be checked." }, 500);
  if (!purchase) return jsonResponse({ error: "Lifetime access required." }, 403);

  return jsonResponse({ desks: ANALYST_DESKS_44 });
}
