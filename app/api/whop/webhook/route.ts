import { NextRequest, NextResponse } from "next/server";
import {
  parseWhopWebhookEvent,
  verifyWhopWebhookSignature,
} from "@/lib/whop-verification";
import {
  recordVerifiedWhopMembership,
  revokeWhopMembership,
} from "@/lib/whop-webhook-store";

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

    if (parsed.kind === "activate") {
      recordVerifiedWhopMembership({
        membershipId: parsed.membershipId,
        email: parsed.email,
        licenseKey: parsed.licenseKey,
        status: parsed.status,
      });
    } else if (parsed.kind === "revoke") {
      revokeWhopMembership({
        membershipId: parsed.membershipId,
        email: parsed.email,
        licenseKey: parsed.licenseKey,
        status: parsed.status,
      });
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
