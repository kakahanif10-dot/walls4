import type { Metadata } from "next";
import CoveragePage from "@/components/coverage-page";

export const metadata: Metadata = {
  title: "Digital Assets & Speculative Risk Coverage",
  description:
    "Core digital assets (BTC/ETH) and speculative high-beta risk models scored on liquidity depth, flow, volatility, and invalidation levels.",
};

export default async function CryptoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolved = await searchParams;
  const tab = resolved.tab === "speculative" ? "speculative" : "core";
  return <CoveragePage kind="crypto" tab={tab} />;
}
