import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
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

    const productId = process.env.WHOP_PRODUCT_ID?.trim();
    if (!productId) {
      return NextResponse.json(
        { success: false, unlocked: false, error: "Whop lifetime product verification is not configured." },
        { status: 503 },
      );
    }

    // 1. Check webhook-verified local store first for immediate post-checkout unlock
    const webhookHit = findVerifiedWhopMembership({
      licenseKey: validation.licenseKey,
      email: validation.email,
      membershipId: validation.membershipId,
      productId,
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

    // 2. Reuse entitlements persisted by signed Whop webhooks across server restarts.
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (supabaseUrl && serviceRoleKey) {
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      let query = admin
        .from("whop_memberships")
        .select("membership_id,email,status,product_id")
        .eq("product_id", productId)
        .eq("valid", true);
      if (validation.membershipId) {
        query = query.eq("membership_id", validation.membershipId);
      } else if (validation.email) {
        query = query.ilike("email", validation.email);
      } else if (validation.licenseKey) {
        const licenseKeyHash = createHash("sha256").update(validation.licenseKey.trim()).digest("hex");
        query = query.eq("license_key_hash", licenseKeyHash);
      }
      const { data: persisted } = await query.maybeSingle();
      if (persisted) {
        return NextResponse.json({
          success: true,
          unlocked: true,
          plan: "premium",
          membershipId: persisted.membership_id,
          email: persisted.email,
          message: "Lifetime Premium purchase verified from the secure account record.",
        });
      }
    }

    // 3. Verify live against Whop API v2
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

    // Payment IDs are only a pointer to the associated membership; the membership must match WHOP_PRODUCT_ID.
    let candidateMembershipId = validation.membershipId;
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
          status?: string;
          membership_id?: string;
        };
        const status = (payData.status ?? "").toLowerCase();
        if (ACTIVE_PAYMENT_STATUSES.has(status) && payData.membership_id) {
          candidateMembershipId = payData.membership_id;
        }
      }
    }

    // 2b. Direct membership ID lookup, including the membership referenced by a paid checkout.
    if (candidateMembershipId) {
      const memRes = await fetch(
        `https://api.whop.com/api/v2/memberships/${encodeURIComponent(candidateMembershipId)}`,
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
          membershipId: candidateMembershipId,
          email: validation.email,
          licenseKey: validation.licenseKey,
          productId,
        });
        if (result.verified) {
          recordVerifiedWhopMembership({
            membershipId: result.membershipId,
            email: result.email,
            licenseKey: result.licenseKey,
            productId,
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

    // 2c. Search only the configured lifetime product, never any active Whop membership.
    const membershipQuery = new URLSearchParams({ product_id: productId });
    if (validation.licenseKey) membershipQuery.set("query", validation.licenseKey);
    const whopRes = await fetch(`https://api.whop.com/api/v2/memberships?${membershipQuery}`, {
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
      productId,
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
      productId,
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
