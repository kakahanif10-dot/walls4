import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  parseWhopWebhookEvent,
  verifyWhopWebhookSignature,
} from "@/lib/whop-verification";
import {
  recordVerifiedWhopMembership,
  revokeWhopMembership,
} from "@/lib/whop-webhook-store";

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) throw new Error("Supabase server credentials are not configured.");
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function licenseHash(licenseKey?: string) {
  return licenseKey?.trim()
    ? createHash("sha256").update(licenseKey.trim()).digest("hex")
    : null;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET?.trim();
    const signatureHeader =
      req.headers.get("x-whop-signature") ??
      req.headers.get("webhook-signature") ??
      req.headers.get("whop-signature");

    if (!verifyWhopWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      return NextResponse.json(
        { ok: false, error: "Invalid Whop webhook signature." },
        { status: 401 },
      );
    }

    const payload = JSON.parse(rawBody || "{}");
    const parsed = parseWhopWebhookEvent(payload);

    const lifetimeProductId = process.env.WHOP_PRODUCT_ID?.trim();
    if (parsed.kind === "activate" && parsed.productId === lifetimeProductId && lifetimeProductId) {
      recordVerifiedWhopMembership({
        membershipId: parsed.membershipId,
        email: parsed.email,
        licenseKey: parsed.licenseKey,
        productId: parsed.productId,
        status: parsed.status,
      });
      const recordKey = parsed.membershipId?.trim()
        ? `membership:${parsed.membershipId.trim()}`
        : parsed.email?.trim()
          ? `email:${parsed.email.trim().toLowerCase()}`
          : `license:${licenseHash(parsed.licenseKey)}`;
      const { error } = await getAdminSupabase().from("whop_memberships").upsert(
        {
          record_key: recordKey,
          membership_id: parsed.membershipId?.trim() || null,
          email: parsed.email?.trim().toLowerCase() || null,
          product_id: parsed.productId,
          license_key_hash: licenseHash(parsed.licenseKey),
          status: parsed.status || "active",
          valid: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "record_key" },
      );
      if (error) throw error;
    } else if (parsed.kind === "revoke" && parsed.productId === lifetimeProductId && lifetimeProductId) {
      revokeWhopMembership({
        membershipId: parsed.membershipId,
        email: parsed.email,
        licenseKey: parsed.licenseKey,
        status: parsed.status,
      });
      const admin = getAdminSupabase();
      const updatedAt = new Date().toISOString();
      const updates = { valid: false, status: parsed.status || "canceled", updated_at: updatedAt };
      const { error } = parsed.membershipId
        ? await admin.from("whop_memberships").update(updates).eq("membership_id", parsed.membershipId)
        : parsed.email
          ? await admin.from("whop_memberships").update(updates).ilike("email", parsed.email.trim())
          : parsed.licenseKey
            ? await admin.from("whop_memberships").update(updates).eq("license_key_hash", licenseHash(parsed.licenseKey))
            : { error: null };
      if (error) throw error;
    }

    return NextResponse.json({
      ok: true,
      event: parsed.eventName,
      action: parsed.kind,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process Whop webhook.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
