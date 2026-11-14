import fs from "node:fs";
import path from "node:path";
import type { WhopValidationCriteria, WhopVerificationResult } from "./whop-verification";

export interface StoredWhopRecord {
  membershipId?: string;
  email?: string;
  licenseKey?: string;
  productId?: string;
  status: string;
  valid: boolean;
  updatedAt: string;
}

const STORE_PATH = path.join("/tmp", "nws-whop-verified-memberships.json");
const memoryRecords = new Map<string, StoredWhopRecord>();
let hydrated = false;

function keyForRecord(rec: { membershipId?: string; email?: string; licenseKey?: string }): string {
  if (rec.membershipId) return `id:${rec.membershipId.trim()}`;
  if (rec.licenseKey) return `key:${rec.licenseKey.trim()}`;
  if (rec.email) return `email:${rec.email.trim().toLowerCase()}`;
  return `anon:${Date.now()}`;
}

function hydrateOnce() {
  if (hydrated) return;
  hydrated = true;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      const parsed = JSON.parse(raw) as StoredWhopRecord[];
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") {
            memoryRecords.set(keyForRecord(item), item);
          }
        }
      }
    }
  } catch {
    // ignore read errors on ephemeral filesystem
  }
}

function persistSafe() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(Array.from(memoryRecords.values()), null, 2), "utf8");
  } catch {
    // ignore write errors if filesystem is read-only
  }
}

export function recordVerifiedWhopMembership(entry: {
  membershipId?: string;
  email?: string;
  licenseKey?: string;
  productId?: string;
  status?: string;
}): StoredWhopRecord {
  hydrateOnce();
  const normalized: StoredWhopRecord = {
    membershipId: entry.membershipId?.trim() || undefined,
    email: entry.email?.trim().toLowerCase() || undefined,
    licenseKey: entry.licenseKey?.trim() || undefined,
    productId: entry.productId?.trim() || undefined,
    status: entry.status?.trim() || "active",
    valid: true,
    updatedAt: new Date().toISOString(),
  };
  memoryRecords.set(keyForRecord(normalized), normalized);
  persistSafe();
  return normalized;
}

export function revokeWhopMembership(criteria: {
  membershipId?: string;
  email?: string;
  licenseKey?: string;
  status?: string;
}): void {
  hydrateOnce();
  const targetEmail = criteria.email?.trim().toLowerCase();
  const targetId = criteria.membershipId?.trim();
  const targetKey = criteria.licenseKey?.trim();

  for (const [k, rec] of memoryRecords.entries()) {
    const matches =
      (targetId && rec.membershipId === targetId) ||
      (targetKey && rec.licenseKey === targetKey) ||
      (targetEmail && rec.email === targetEmail);
    if (matches) {
      memoryRecords.set(k, {
        ...rec,
        valid: false,
        status: criteria.status ?? "canceled",
        updatedAt: new Date().toISOString(),
      });
    }
  }
  persistSafe();
}

export function findVerifiedWhopMembership(
  criteria: WhopValidationCriteria,
): WhopVerificationResult {
  hydrateOnce();
  const targetEmail = criteria.email?.trim().toLowerCase();
  const targetId = criteria.membershipId?.trim();
  const targetKey = criteria.licenseKey?.trim();
  const targetProductId = criteria.productId?.trim();

  for (const rec of memoryRecords.values()) {
    if (!rec.valid || !targetProductId || rec.productId !== targetProductId) continue;
    const idMatch = Boolean(targetId) && rec.membershipId === targetId;
    const keyMatch =
      Boolean(targetKey) && (rec.licenseKey === targetKey || rec.membershipId === targetKey);
    const emailMatch = Boolean(targetEmail) && rec.email === targetEmail;

    if (idMatch || keyMatch || emailMatch) {
      return {
        verified: true,
        membershipId: rec.membershipId,
        status: rec.status,
        email: rec.email,
        licenseKey: rec.licenseKey,
      };
    }
  }

  return { verified: false };
}
