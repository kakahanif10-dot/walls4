import "server-only";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const LIFETIME_PRICE_CENTS = 249_700;

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readMoneyInCents(value: unknown): number | null {
  const record = asRecord(value);
  const rawAmount = record?.amount ?? record?.value ?? value;
  const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);

  if (!Number.isFinite(amount) || amount < 0) return null;
  return Number.isInteger(amount) && amount >= 100_000
    ? Math.round(amount)
    : Math.round(amount * 100);
}

function getApplicationOrigin(): string {
  const host =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "www.nextwallstreet.com"
      : process.env.VERCEL_URL ?? "localhost:3000";

  return host.startsWith("http")
    ? new URL(host).origin
    : `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

async function getLifetimeVariant() {
  const checkoutUrl = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_LIFETIME_URL;
  const apiKey = process.env.WHOP_API_KEY;

  if (!checkoutUrl || !apiKey) {
    throw new Error("Whop checkout configuration is missing.");
  }

  const checkoutId = new URL(checkoutUrl).pathname.match(/ch_[A-Za-z0-9_-]+/)?.[0];
  if (!checkoutId) throw new Error("Whop checkout configuration ID is invalid.");

  const response = await fetch(
    `https://api.whop.com/api/v1/checkout_configurations/${checkoutId}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Whop checkout configuration lookup failed.");

  const payload = asRecord(await response.json());
  const config = asRecord(payload?.data) ?? payload;
  if (!config) throw new Error("Whop checkout configuration is invalid.");

  const variantValue = config.variant ?? config.plan;
  let variant = asRecord(variantValue);
  const variantId =
    readString(variant?.id) ??
    readString(variantValue) ??
    readString(config.variant_id) ??
    readString(config.plan_id);

  if (!variant && variantId) {
    const variantResponse = await fetch(
      `https://api.whop.com/api/v1/variants/${variantId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      },
    );
    if (!variantResponse.ok) throw new Error("Whop lifetime plan lookup failed.");
    const variantPayload = asRecord(await variantResponse.json());
    variant = asRecord(variantPayload?.data) ?? variantPayload;
  }

  if (!variant) throw new Error("Whop lifetime plan is missing.");

  const id = readString(variant.id) ?? variantId;
  const initialPrice = readMoneyInCents(variant.initial_price);
  const renewalPrice = readMoneyInCents(variant.renewal_price);
  const currency = readString(variant.currency ?? config.currency)?.toLowerCase();
  const billingPeriod = variant.billing_period;

  if (
    !id ||
    initialPrice !== LIFETIME_PRICE_CENTS ||
    (renewalPrice !== null && renewalPrice !== 0) ||
    (billingPeriod !== null && billingPeriod !== undefined && billingPeriod !== "") ||
    currency !== "usd"
  ) {
    throw new Error("Whop checkout is not configured as the expected lifetime plan.");
  }

  const product = asRecord(variant.product);
  const configProduct = asRecord(config.product);

  return {
    id,
    productId:
      readString(variant.product_id) ??
      readString(product?.id) ??
      readString(config.product_id) ??
      readString(configProduct?.id) ??
      id,
  };
}

async function findUserByEmail(email: string) {
  const supabaseAdmin = getSupabaseAdmin();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw new Error("Supabase user lookup failed.");
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function getOrCreateUser(email: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: randomBytes(32).toString("base64url"),
    email_confirm: true,
    user_metadata: { signup_source: "whop_lifetime_purchase" },
  });

  if (data.user) return data.user.id;

  const existingUser = await findUserByEmail(email);
  if (existingUser) return existingUser.id;
  throw new Error(error ? "Supabase account creation failed." : "Supabase account is missing.");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendAccountSetupEmail(email: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const apiKey = process.env.RESEND_API_KEY;
  const senderDomain = process.env.RESEND_EMAIL_DOMAIN;

  if (!apiKey || !senderDomain || !/^[a-z0-9.-]+$/i.test(senderDomain)) {
    throw new Error("Transactional email configuration is missing.");
  }

  const origin = getApplicationOrigin();
  const redirectTo = new URL("/auth/callback", origin);
  redirectTo.searchParams.set("next", "/account/setup");

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: redirectTo.toString() },
  });

  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) throw new Error("Supabase account link generation failed.");

  const setupUrl = new URL("/auth/callback", origin);
  setupUrl.searchParams.set("token_hash", tokenHash);
  setupUrl.searchParams.set("type", "magiclink");
  setupUrl.searchParams.set("next", "/account/setup");

  const safeUrl = escapeHtml(setupUrl.toString());
  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: `NextWall Street <accounts@${senderDomain}>`,
    to: [email],
    subject: "Set up your NextWall Street account",
    text: `Your lifetime research access is ready. Set your account password using this secure link: ${setupUrl.toString()}`,
    html: `<!doctype html><html><body style="margin:0;background:#0c0d0b;color:#f5f1e8;font-family:Arial,sans-serif"><main style="max-width:560px;margin:0 auto;padding:40px 24px"><p style="color:#c9a86a;letter-spacing:.12em;text-transform:uppercase;font-size:12px">NextWall Street</p><h1 style="font-size:28px;line-height:1.2">Your lifetime access is ready</h1><p style="color:#d5d0c5;line-height:1.6">Your Whop payment has been verified. Use the secure link below to sign in and set your account password.</p><p style="margin:32px 0"><a href="${safeUrl}" style="display:inline-block;background:#c9a86a;color:#14130f;padding:14px 20px;text-decoration:none;font-weight:700">Set up your account</a></p><p style="color:#aaa398;font-size:13px;line-height:1.6">If you did not make this purchase, you can ignore this email. The link expires and can only be used to access the account associated with this email address.</p></main></body></html>`,
  });

  if (sendError) throw new Error("Account setup email could not be sent.");
}

export async function fulfillWhopPayment(eventData: unknown): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const outerRecord = asRecord(eventData);
  const payment = asRecord(outerRecord?.payment) ?? outerRecord;
  if (!payment) throw new Error("Whop payment payload is invalid.");

  const paymentId = readString(payment.id);
  const eventEmail = readString(
    payment.customer_email ?? asRecord(payment.customer)?.email ?? payment.email,
  )?.toLowerCase();
  const planId =
    readString(payment.plan_id) ?? readString(asRecord(payment.plan)?.id) ??
    readString(payment.variant_id) ?? readString(asRecord(payment.variant)?.id);
  const amount = readMoneyInCents(payment.amount);
  const currency =
    readString(payment.currency ?? asRecord(payment.amount)?.currency)?.toLowerCase();
  const status = readString(payment.status)?.toLowerCase();

  if (
    !paymentId ||
    !eventEmail ||
    !eventEmail.includes("@") ||
    !planId ||
    amount === null ||
    amount < LIFETIME_PRICE_CENTS ||
    currency !== "usd" ||
    (status && !["succeeded", "paid", "complete", "completed"].includes(status))
  ) {
    throw new Error("Whop payment does not match a successful lifetime purchase.");
  }

  const lifetimeVariant = await getLifetimeVariant();
  if (planId !== lifetimeVariant.id) {
    throw new Error("Whop payment plan does not match the lifetime checkout.");
  }

  const { data: existingPurchase, error: lookupError } = await supabaseAdmin
    .from("whop_purchases")
    .select("user_id, buyer_email, whop_product_id, account_setup_email_sent_at")
    .eq("whop_payment_id", paymentId)
    .maybeSingle();

  if (lookupError) throw new Error("Whop purchase lookup failed.");
  if (existingPurchase?.account_setup_email_sent_at) return;

  const email =
    readString(existingPurchase?.buyer_email)?.toLowerCase() ?? eventEmail;
  const userId = existingPurchase?.user_id ?? (await getOrCreateUser(email));
  const productId =
    readString(existingPurchase?.whop_product_id) ?? lifetimeVariant.productId;

  const { error: upsertError } = await supabaseAdmin
    .from("whop_purchases")
    .upsert(
      {
        whop_payment_id: paymentId,
        user_id: userId,
        buyer_email: email,
        whop_product_id: productId,
        amount: 2497,
        currency: "usd",
        status: "paid",
      },
      { onConflict: "whop_payment_id", ignoreDuplicates: true },
    );

  if (upsertError) throw new Error("Whop purchase could not be recorded.");

  if (!existingPurchase?.user_id) {
    const { error: userLinkError } = await supabaseAdmin
      .from("whop_purchases")
      .update({ user_id: userId })
      .eq("whop_payment_id", paymentId);
    if (userLinkError) throw new Error("Whop purchase could not be linked to the account.");
  }

  const { data: purchaseAfterInsert, error: recheckError } = await supabaseAdmin
    .from("whop_purchases")
    .select("account_setup_email_sent_at")
    .eq("whop_payment_id", paymentId)
    .maybeSingle();

  if (recheckError) throw new Error("Whop purchase status could not be checked.");
  if (purchaseAfterInsert?.account_setup_email_sent_at) return;

  await sendAccountSetupEmail(email);

  const { error: sentMarkerError } = await supabaseAdmin
    .from("whop_purchases")
    .update({ account_setup_email_sent_at: new Date().toISOString() })
    .eq("whop_payment_id", paymentId);

  if (sentMarkerError) throw new Error("Account setup email status could not be saved.");
}

async function setPurchaseStatus(
  paymentId: string,
  status: "paid" | "refunded" | "disputed",
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("whop_purchases")
    .update({ status })
    .eq("whop_payment_id", paymentId)
    .select("whop_payment_id")
    .maybeSingle();

  if (error || !data) throw new Error("Whop purchase status could not be updated.");
}

export async function reconcileWhopReversal(
  eventType: "refund.created" | "refund.updated" | "dispute.created" | "dispute.updated",
  eventData: unknown,
): Promise<void> {
  const payload = asRecord(eventData);
  const reversal = asRecord(payload?.refund) ?? asRecord(payload?.dispute) ?? payload;
  const paymentId =
    readString(reversal?.payment_id) ?? readString(asRecord(reversal?.payment)?.id);
  if (!paymentId) throw new Error("Whop reversal event is missing its payment ID.");

  const status = readString(reversal?.status)?.toLowerCase();
  if (eventType.startsWith("refund.")) {
    if (status !== "succeeded") return;
    await setPurchaseStatus(paymentId, "refunded");
    return;
  }

  if (eventType === "dispute.updated" && status === "won") {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: purchase, error } = await supabaseAdmin
      .from("whop_purchases")
      .select("status")
      .eq("whop_payment_id", paymentId)
      .maybeSingle();

    if (error || !purchase) throw new Error("Whop purchase status could not be checked.");
    if (purchase.status === "disputed") await setPurchaseStatus(paymentId, "paid");
    return;
  }

  await setPurchaseStatus(paymentId, "disputed");
}
