import { NextRequest, NextResponse } from "next/server";
import { ensureMarketData } from "@/lib/market-data";
import { rowsFor, type Kind } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedKinds = new Set<Kind>(["stock", "crypto", "meme"]);

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest) {
  const kindValue = request.nextUrl.searchParams.get("kind");
  if (!kindValue || !allowedKinds.has(kindValue as Kind)) {
    return jsonResponse({ error: "Market category not found." }, 404);
  }

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

  await ensureMarketData();
  return jsonResponse({ kind: kindValue, rows: rowsFor(kindValue as Kind) });
}
