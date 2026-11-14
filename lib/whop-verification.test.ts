import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  extractActiveWhopMembership,
  parseWhopReturnParams,
  parseWhopWebhookEvent,
  validateWhopCredentialsInput,
  verifyWhopWebhookSignature,
} from "./whop-verification";

test("validateWhopCredentialsInput rejects empty activation attempts and accepts key, email, membershipId, or receiptId", () => {
  const empty = validateWhopCredentialsInput({});
  assert.equal(empty.ok, false);
  assert.match(empty.error ?? "", /Payment verification required/);

  const badEmail = validateWhopCredentialsInput({ email: "not-an-email" });
  assert.equal(badEmail.ok, false);

  const validKey = validateWhopCredentialsInput({ licenseKey: "whop_key_12345" });
  assert.equal(validKey.ok, true);
  assert.equal(validKey.licenseKey, "whop_key_12345");

  const validMembership = validateWhopCredentialsInput({ membershipId: "mem_abc123" });
  assert.equal(validMembership.ok, true);
  assert.equal(validMembership.membershipId, "mem_abc123");

  const validReceipt = validateWhopCredentialsInput({ receiptId: "rcpt_xyz789" });
  assert.equal(validReceipt.ok, true);
  assert.equal(validReceipt.receiptId, "rcpt_xyz789");
});

test("extractActiveWhopMembership grants verified=true when active membership matches licenseKey, membershipId, or email", () => {
  const records = [
    {
      id: "mem_1",
      status: "canceled",
      valid: false,
      email: "canceled@example.com",
      license_key: "key_canceled",
    },
    {
      id: "mem_2",
      status: "completed",
      valid: true,
      email: "Buyer@NextWallStreet.com",
      license_key: "key_lifetime_1487",
    },
  ];

  const miss = extractActiveWhopMembership(records, { licenseKey: "key_canceled" });
  assert.equal(miss.verified, false);

  const byKey = extractActiveWhopMembership(records, { licenseKey: "key_lifetime_1487" });
  assert.equal(byKey.verified, true);
  assert.equal(byKey.membershipId, "mem_2");

  const byMembershipId = extractActiveWhopMembership(records, { membershipId: "mem_2" });
  assert.equal(byMembershipId.verified, true);
  assert.equal(byMembershipId.membershipId, "mem_2");

  const byEmail = extractActiveWhopMembership(records, { email: "buyer@nextwallstreet.com" });
  assert.equal(byEmail.verified, true);
  assert.equal(byEmail.membershipId, "mem_2");
});

test("parseWhopReturnParams detects Whop post-checkout redirect parameters", () => {
  const empty = parseWhopReturnParams("");
  assert.equal(empty.hasWhopReturn, false);

  const fromRedirect = parseWhopReturnParams(
    "?membership_id=mem_live_999&email=Trader@Example.com",
  );
  assert.equal(fromRedirect.hasWhopReturn, true);
  assert.equal(fromRedirect.membershipId, "mem_live_999");
  assert.equal(fromRedirect.email, "trader@example.com");

  const fromReceipt = parseWhopReturnParams("?receipt_id=rcpt_456&license_key=key_999");
  assert.equal(fromReceipt.hasWhopReturn, true);
  assert.equal(fromReceipt.receiptId, "rcpt_456");
  assert.equal(fromReceipt.licenseKey, "key_999");
});

test("parseWhopWebhookEvent handles activation and revocation events + signature validation", () => {
  const validPayload = {
    action: "membership.went_valid",
    data: {
      id: "mem_paid_1487",
      valid: true,
      status: "active",
      license_key: "NWS-LIFE-1487",
      user: { email: "VIP@Buyer.com" },
    },
  };
  const parsedValid = parseWhopWebhookEvent(validPayload);
  assert.equal(parsedValid.kind, "activate");
  assert.equal(parsedValid.membershipId, "mem_paid_1487");
  assert.equal(parsedValid.email, "vip@buyer.com");
  assert.equal(parsedValid.licenseKey, "NWS-LIFE-1487");

  const revokedPayload = {
    action: "membership.went_invalid",
    data: {
      id: "mem_paid_1487",
      valid: false,
      status: "canceled",
      email: "vip@buyer.com",
    },
  };
  const parsedRevoke = parseWhopWebhookEvent(revokedPayload);
  assert.equal(parsedRevoke.kind, "revoke");

  const rawBody = JSON.stringify(validPayload);
  const secret = "whsec_test_1487";
  const sig = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  assert.equal(verifyWhopWebhookSignature(rawBody, sig, secret), true);
  assert.equal(verifyWhopWebhookSignature(rawBody, "bad_sig", secret), false);
});
