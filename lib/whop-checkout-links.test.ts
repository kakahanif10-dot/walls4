import test from "node:test";
import assert from "node:assert/strict";
import { buildLifetimeCheckoutUrl, getLifetimeCheckoutUrl } from "./whop-checkout-links";

const expectedCheckoutUrl =
  "https://whop.com/checkout/ch_1lB5uiuzPykUtqb/?redirect_url=https%3A%2F%2Fwalls4-ochre.vercel.app%2F&session=chs_BO4t9BaLejWnzi";

test("uses the requested Whop checkout and production return URL", () => {
  assert.equal(getLifetimeCheckoutUrl(), expectedCheckoutUrl);
  assert.equal(buildLifetimeCheckoutUrl(), expectedCheckoutUrl);
});

test("keeps optional email while preserving checkout session and redirect", () => {
  const url = new URL(buildLifetimeCheckoutUrl({ email: "buyer@example.com" }));
  assert.equal(url.searchParams.get("session"), "chs_BO4t9BaLejWnzi");
  assert.equal(url.searchParams.get("redirect_url"), "https://walls4-ochre.vercel.app/");
  assert.equal(url.searchParams.get("email"), "buyer@example.com");
});
