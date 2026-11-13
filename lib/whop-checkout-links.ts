export type PaidPlanId = "premium";

const lifetimeCheckoutUrl = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_LIFETIME_URL;

export function getWhopCheckoutUrl(planId: PaidPlanId): string | null {
  if (planId !== "premium") return null;
  const value = lifetimeCheckoutUrl?.trim();

  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
