export type PaidPlanId = "premium" | "institutional";
export type BillingCadence = "monthly" | "annual";

type CheckoutLinks = Record<PaidPlanId, Record<BillingCadence, string | undefined>>;

const checkoutLinks: CheckoutLinks = {
  premium: {
    monthly: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PREMIUM_MONTHLY_URL,
    annual: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PREMIUM_ANNUAL_URL,
  },
  institutional: {
    monthly: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_INSTITUTIONAL_MONTHLY_URL,
    annual: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_INSTITUTIONAL_ANNUAL_URL,
  },
};

function sanitizeHttpsUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getWhopCheckoutUrl(
  planId: PaidPlanId,
  cadence: BillingCadence,
): string | null {
  return sanitizeHttpsUrl(checkoutLinks[planId][cadence]);
}

export function getLifetimeCheckoutUrl(): string | null {
  return (
    sanitizeHttpsUrl(process.env.NEXT_PUBLIC_WHOP_CHECKOUT_LIFETIME_URL) ??
    sanitizeHttpsUrl(process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PREMIUM_ANNUAL_URL) ??
    sanitizeHttpsUrl(process.env.NEXT_PUBLIC_WHOP_CHECKOUT_PREMIUM_MONTHLY_URL)
  );
}

export function buildLifetimeCheckoutUrl(options?: {
  email?: string;
  redirectUrl?: string;
}): string | null {
  const base = getLifetimeCheckoutUrl();
  if (!base) return null;
  try {
    const url = new URL(base);
    if (options?.email && options.email.trim() && !url.searchParams.has("email")) {
      url.searchParams.set("email", options.email.trim());
    }
    if (options?.redirectUrl && !url.searchParams.has("redirect_url")) {
      url.searchParams.set("redirect_url", options.redirectUrl);
    }
    return url.toString();
  } catch {
    return base;
  }
}
