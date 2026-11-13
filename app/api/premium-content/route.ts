import { NextRequest, NextResponse } from "next/server";
import { ARTICLE_BY_SLUG } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest) {
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

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug || slug.length > 160) return jsonResponse({ error: "Article not found." }, 404);

  const article = ARTICLE_BY_SLUG[slug as keyof typeof ARTICLE_BY_SLUG];
  if (!article?.premium) return jsonResponse({ error: "Article not found." }, 404);

  return jsonResponse({ blocks: article.body.slice(1) });
}
