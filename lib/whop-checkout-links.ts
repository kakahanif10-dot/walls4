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

export function getWhopCheckoutUrl(
  planId: PaidPlanId,
  cadence: BillingCadence,
): string | null {
  const value = checkoutLinks[planId][cadence]?.trim();

  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
