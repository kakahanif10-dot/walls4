import { unwrapWebhook } from "@whop/sdk/helpers";
import { NextRequest, NextResponse } from "next/server";
import { fulfillWhopPayment, reconcileWhopReversal } from "@/lib/whop-fulfillment";

export const runtime = "nodejs";
export const maxDuration = 15;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function POST(request: NextRequest) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) {
    return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
  }

  const rawBody = await request.text();
  let event: unknown;

  try {
    event = unwrapWebhook(rawBody, {
      headers: Object.fromEntries(request.headers.entries()),
      key: secret,
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const webhook = asRecord(event);
  if (!webhook) return NextResponse.json({ received: true, ignored: true });

  try {
    switch (webhook.type) {
      case "payment.succeeded":
        await fulfillWhopPayment(webhook.data);
        break;
      case "refund.created":
      case "refund.updated":
      case "dispute.created":
      case "dispute.updated":
        await reconcileWhopReversal(webhook.type, webhook.data);
        break;
      default:
        return NextResponse.json({ received: true, ignored: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "[Whop webhook] Fulfillment failed:",
      error instanceof Error ? error.name : "unknown error",
    );
    return NextResponse.json(
      { error: "Purchase fulfillment could not be completed." },
      { status: 500 },
    );
  }
}
