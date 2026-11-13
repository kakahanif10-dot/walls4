import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { authenticated: false, unlocked: false },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { authenticated: true, unlocked: false },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from("whop_purchases")
    .select("whop_payment_id")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (purchaseError) {
    return NextResponse.json(
      { authenticated: true, unlocked: false },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  return NextResponse.json(
    { authenticated: true, unlocked: Boolean(purchase) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
