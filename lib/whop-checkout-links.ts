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

const LIFETIME_CHECKOUT_URL =
  "https://whop.com/checkout/ch_1lB5uiuzPykUtqb/?redirect_url=https%3A%2F%2Fwalls4-ochre.vercel.app%2F&session=chs_BO4t9BaLejWnzi";

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

export function getLifetimeCheckoutUrl(): string {
  return LIFETIME_CHECKOUT_URL;
}

export function buildLifetimeCheckoutUrl(options?: { email?: string }): string {
  const url = new URL(LIFETIME_CHECKOUT_URL);
  if (options?.email && options.email.trim()) {
    url.searchParams.set("email", options.email.trim());
  }
  return url.toString();
}
