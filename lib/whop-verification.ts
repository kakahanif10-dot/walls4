import crypto from "node:crypto";

export interface WhopMembershipRecord {
  id?: string;
  status?: string;
  valid?: boolean;
  email?: string;
  user_email?: string;
  license_key?: string;
  product_id?: string;
  product?: string | { id?: string };
  plan?: string;
  user?: {
    email?: string;
  };
}

export interface WhopVerificationResult {
  verified: boolean;
  membershipId?: string;
  status?: string;
  email?: string;
  licenseKey?: string;
  reason?: string;
}

export interface WhopValidationCriteria {
  licenseKey?: string;
  email?: string;
  membershipId?: string;
  receiptId?: string;
  paymentId?: string;
  productId?: string;
}

const ACTIVE_STATUSES = new Set(["active", "completed", "trialing", "valid", "paid", "succeeded"]);

export function validateWhopCredentialsInput(
  input: WhopValidationCriteria,
): {
  ok: boolean;
  licenseKey: string;
  email: string;
  membershipId: string;
  receiptId: string;
  paymentId: string;
  error?: string;
} {
  const licenseKey = (input.licenseKey ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const membershipId = (input.membershipId ?? "").trim();
  const receiptId = (input.receiptId ?? "").trim();
  const paymentId = (input.paymentId ?? "").trim();

  if (!licenseKey && !membershipId && !receiptId && !paymentId) {
    return {
      ok: false,
      licenseKey,
      email,
      membershipId,
      receiptId,
      paymentId,
      error:
        "Payment verification required. Enter the Whop license key or checkout email from your $1,487 USD purchase.",
    };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      licenseKey,
      email,
      membershipId,
      receiptId,
      paymentId,
      error: "Please enter a valid Whop checkout email address.",
    };
  }

  return { ok: true, licenseKey, email, membershipId, receiptId, paymentId };
}

export function extractActiveWhopMembership(
  records: WhopMembershipRecord[] | undefined | null,
  criteria: WhopValidationCriteria,
): WhopVerificationResult {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      verified: false,
      reason: "No verified $1,487 USD Lifetime Premium membership found for those credentials.",
    };
  }

  const keyTarget = (criteria.licenseKey ?? "").trim();
  const emailTarget = (criteria.email ?? "").trim().toLowerCase();
  const membershipTarget = (criteria.membershipId ?? "").trim();

  for (const rec of records) {
    const status = (rec.status ?? "").toLowerCase();
    const isActive = rec.valid === true || ACTIVE_STATUSES.has(status);
    if (!isActive) continue;

    const recordEmail = (rec.email ?? rec.user_email ?? rec.user?.email ?? "").trim().toLowerCase();
    const recordKey = (rec.license_key ?? "").trim();
    const recordId = (rec.id ?? "").trim();
    const recordProductId = rec.product_id ?? (typeof rec.product === "object" ? rec.product.id : undefined);

    if (!criteria.productId || recordProductId !== criteria.productId) continue;

    const membershipMatch = Boolean(membershipTarget) && recordId === membershipTarget;
    const keyMatch =
      Boolean(keyTarget) && (recordKey === keyTarget || recordId === keyTarget);
    const emailMatch = Boolean(emailTarget) && Boolean(recordEmail) && recordEmail === emailTarget;

    if (membershipMatch || keyMatch || emailMatch) {
      return {
        verified: true,
        membershipId: rec.id,
        status: rec.status ?? "active",
        email: recordEmail || undefined,
        licenseKey: recordKey || undefined,
      };
    }
  }

  return {
    verified: false,
    reason: "No active Lifetime Premium membership matched the provided license key, membership ID, or email.",
  };
}

export interface ParsedWhopReturnParams {
  membershipId?: string;
  licenseKey?: string;
  receiptId?: string;
  paymentId?: string;
  email?: string;
  hasWhopReturn: boolean;
}

export function parseWhopReturnParams(search: string | URLSearchParams): ParsedWhopReturnParams {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;

  const membershipId =
    params.get("membership_id")?.trim() ||
    params.get("whop_membership_id")?.trim() ||
    undefined;
  const licenseKey =
    params.get("license_key")?.trim() ||
    params.get("whop_key")?.trim() ||
    params.get("key")?.trim() ||
    undefined;
  const receiptId = params.get("receipt_id")?.trim() || undefined;
  const paymentId = params.get("payment_id")?.trim() || undefined;
  const email = params.get("email")?.trim().toLowerCase() || undefined;

  const hasWhopReturn = Boolean(membershipId || licenseKey || receiptId || paymentId);

  return {
    membershipId,
    licenseKey,
    receiptId,
    paymentId,
    email,
    hasWhopReturn,
  };
}

export interface ParsedWhopWebhookEvent {
  kind: "activate" | "revoke" | "ignore";
  eventName: string;
  membershipId?: string;
  email?: string;
  licenseKey?: string;
  productId?: string;
  status?: string;
}

export function parseWhopWebhookEvent(payload: unknown): ParsedWhopWebhookEvent {
  if (!payload || typeof payload !== "object") {
    return { kind: "ignore", eventName: "unknown" };
  }

  const root = payload as Record<string, unknown>;
  const rawAction = String(root.action ?? root.event ?? root.type ?? "").toLowerCase();
  const data = (root.data && typeof root.data === "object"
    ? root.data
    : root) as Record<string, unknown>;

  const status = typeof data.status === "string" ? data.status.toLowerCase() : undefined;
  const validFlag = typeof data.valid === "boolean" ? data.valid : undefined;
  const membershipId =
    typeof data.membership_id === "string"
      ? data.membership_id
      : typeof data.id === "string" && data.id.startsWith("mem_")
        ? data.id
        : undefined;
  const licenseKey = typeof data.license_key === "string" ? data.license_key : undefined;
  const productObj = data.product && typeof data.product === "object"
    ? (data.product as Record<string, unknown>)
    : null;
  const productId =
    (typeof data.product_id === "string" && data.product_id) ||
    (productObj && typeof productObj.id === "string" ? productObj.id : undefined);

  const userObj =
    data.user && typeof data.user === "object" ? (data.user as Record<string, unknown>) : null;
  const emailRaw =
    (typeof data.email === "string" && data.email) ||
    (typeof data.user_email === "string" && data.user_email) ||
    (userObj && typeof userObj.email === "string" && userObj.email) ||
    undefined;
  const email = emailRaw ? emailRaw.trim().toLowerCase() : undefined;

  if (
    rawAction.includes("went_invalid") ||
    rawAction.includes("canceled") ||
    rawAction.includes("expired") ||
    rawAction.includes("refunded") ||
    rawAction.includes("failed") ||
    validFlag === false
  ) {
    return {
      kind: "revoke",
      eventName: rawAction || "revoke",
      membershipId,
      email,
      licenseKey,
      productId,
      status: status ?? "canceled",
    };
  }

  if (
    rawAction.includes("went_valid") ||
    rawAction.includes("payment.succeeded") ||
    rawAction.includes("payment_succeeded") ||
    rawAction.includes("membership.created") ||
    validFlag === true ||
    (status !== undefined && ACTIVE_STATUSES.has(status))
  ) {
    return {
      kind: "activate",
      eventName: rawAction || "activate",
      membershipId,
      email,
      licenseKey,
      productId,
      status: status ?? "active",
    };
  }

  return { kind: "ignore", eventName: rawAction || "unknown" };
}

export function verifyWhopWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !secret.trim()) return false;
  if (!signatureHeader || !signatureHeader.trim()) return false;

  const cleanSig = signatureHeader.trim().replace(/^sha256=/i, "").replace(/^v1,/i, "");
  const expectedHex = crypto
    .createHmac("sha256", secret.trim())
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const sigBuf = Buffer.from(cleanSig, "hex");
    const expBuf = Buffer.from(expectedHex, "hex");
    if (sigBuf.length === expBuf.length && sigBuf.length > 0) {
      return crypto.timingSafeEqual(sigBuf, expBuf);
    }
  } catch {
    // fallback to utf8 compare if base64/other format
  }

  const expectedB64 = crypto
    .createHmac("sha256", secret.trim())
    .update(rawBody, "utf8")
    .digest("base64");

  return signatureHeader.includes(expectedHex) || signatureHeader.includes(expectedB64);
}
