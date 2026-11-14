import { NextRequest, NextResponse } from "next/server";
import {
  extractActiveWhopMembership,
  validateWhopCredentialsInput,
  type WhopMembershipRecord,
} from "@/lib/whop-verification";
import {
  findVerifiedWhopMembership,
  recordVerifiedWhopMembership,
} from "@/lib/whop-webhook-store";
import { getLifetimeCheckoutUrl } from "@/lib/whop-checkout-links";

const ACTIVE_PAYMENT_STATUSES = new Set(["paid", "succeeded", "completed"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const validation = validateWhopCredentialsInput({
      licenseKey: typeof body?.licenseKey === "string" ? body.licenseKey : undefined,
      email: typeof body?.email === "string" ? body.email : undefined,
      membershipId: typeof body?.membershipId === "string" ? body.membershipId : undefined,
      receiptId: typeof body?.receiptId === "string" ? body.receiptId : undefined,
      paymentId: typeof body?.paymentId === "string" ? body.paymentId : undefined,
    });

    if (!validation.ok) {
      return NextResponse.json(
        {
          success: false,
          unlocked: false,
          error: validation.error,
        },
        { status: 400 },
      );
    }

    // 1. Check webhook-verified local store first for immediate post-checkout unlock
    const webhookHit = findVerifiedWhopMembership({
      licenseKey: validation.licenseKey,
      email: validation.email,
      membershipId: validation.membershipId,
    });
    if (webhookHit.verified) {
      return NextResponse.json({
        success: true,
        unlocked: true,
        plan: "premium",
        membershipId: webhookHit.membershipId,
        email: webhookHit.email,
        licenseKey: webhookHit.licenseKey,
        message:
          "Lifetime Premium ($1,487 USD) verified. All 2,038+ assets, 70 research desks, 60 Academy lessons, and 32 Trade Tools are now unlocked.",
      });
    }

    // 2. Verify live against Whop API v2
    const apiKey = process.env.WHOP_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          unlocked: false,
          error:
            "Payment verification unavailable: WHOP_API_KEY is not configured on this server. Add WHOP_API_KEY in environment secrets to enable live Whop verification.",
        },
        { status: 403 },
      );
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // 2a. Direct payment / receipt lookup if paymentId or receiptId was returned from Whop redirect
    const paymentOrReceiptId = validation.paymentId || validation.receiptId;
    if (paymentOrReceiptId) {
      const payRes = await fetch(
        `https://api.whop.com/api/v2/payments/${encodeURIComponent(paymentOrReceiptId)}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        },
      );
      if (payRes.ok) {
        const payData = (await payRes.json()) as {
          id?: string;
          status?: string;
          membership_id?: string;
          user_email?: string;
          user?: { email?: string };
        };
        const status = (payData.status ?? "").toLowerCase();
        if (ACTIVE_PAYMENT_STATUSES.has(status)) {
          const email = (payData.user_email ?? payData.user?.email ?? validation.email) || undefined;
          recordVerifiedWhopMembership({
            membershipId: payData.membership_id ?? payData.id,
            email,
            status,
          });
          return NextResponse.json({
            success: true,
            unlocked: true,
            plan: "premium",
            membershipId: payData.membership_id ?? payData.id,
            email,
            message:
              "Lifetime Premium ($1,487 USD) payment verified. All 2,038+ assets, 70 research desks, 60 Academy lessons, and 32 Trade Tools are now unlocked.",
          });
        }
      }
    }

    // 2b. Direct membership ID lookup if membershipId (e.g. mem_...) was provided
    if (validation.membershipId) {
      const memRes = await fetch(
        `https://api.whop.com/api/v2/memberships/${encodeURIComponent(validation.membershipId)}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        },
      );
      if (memRes.ok) {
        const memRecord = (await memRes.json()) as WhopMembershipRecord;
        const result = extractActiveWhopMembership([memRecord], {
          membershipId: validation.membershipId,
          email: validation.email,
          licenseKey: validation.licenseKey,
        });
        if (result.verified) {
          recordVerifiedWhopMembership({
            membershipId: result.membershipId,
            email: result.email,
            licenseKey: result.licenseKey,
            status: result.status,
          });
          return NextResponse.json({
            success: true,
            unlocked: true,
            plan: "premium",
            membershipId: result.membershipId,
            email: result.email,
            licenseKey: result.licenseKey,
            message:
              "Lifetime Premium ($1,487 USD) payment verified. All 2,038+ assets, 70 research desks, 60 Academy lessons, and 32 Trade Tools are now unlocked.",
          });
        }
      }
    }

    // 2c. Query memberships list by email or licenseKey
    const queryParam = validation.email
      ? `?email=${encodeURIComponent(validation.email)}`
      : validation.licenseKey
        ? `?query=${encodeURIComponent(validation.licenseKey)}`
        : validation.membershipId
          ? `?query=${encodeURIComponent(validation.membershipId)}`
          : "";

    const whopRes = await fetch(`https://api.whop.com/api/v2/memberships${queryParam}`, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (!whopRes.ok) {
      return NextResponse.json(
        {
          success: false,
          unlocked: false,
          error: `Whop verification gateway rejected query (${whopRes.status}). Access is activated only after payment verification.`,
        },
        { status: 403 },
      );
    }

    const whopData = (await whopRes.json()) as { data?: WhopMembershipRecord[] };
    const result = extractActiveWhopMembership(whopData?.data, {
      licenseKey: validation.licenseKey,
      email: validation.email,
      membershipId: validation.membershipId,
    });

    if (!result.verified) {
      return NextResponse.json(
        {
          success: false,
          unlocked: false,
          error: result.reason || "No active Lifetime Premium ($1,487 USD) membership found.",
        },
        { status: 403 },
      );
    }

    recordVerifiedWhopMembership({
      membershipId: result.membershipId,
      email: result.email,
      licenseKey: result.licenseKey,
      status: result.status,
    });

    return NextResponse.json({
      success: true,
      unlocked: true,
      plan: "premium",
      membershipId: result.membershipId,
      email: result.email,
      licenseKey: result.licenseKey,
      message:
        "Lifetime Premium ($1,487 USD) payment verified. All 2,038+ assets, 70 research desks, 60 Academy lessons, and 32 Trade Tools are now unlocked.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify Whop payment.";
    return NextResponse.json(
      { success: false, unlocked: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET() {
  const apiKey = process.env.WHOP_API_KEY?.trim();
  return NextResponse.json({
    configured: Boolean(apiKey),
    checkoutConfigured: Boolean(getLifetimeCheckoutUrl()),
    tier: "Lifetime Premium",
    amountUsd: 1487,
  });
}
