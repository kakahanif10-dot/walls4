"use client";

import { useFeedMeta } from "@/components/live-prices";

export default function FeedBadge({ className = "" }: { className?: string }) {
  const { mode } = useFeedMeta();

  const label =
    mode === "unavailable"
      ? "Data unavailable"
      : "Market Tape · Real-Time Equities & Live Crypto";

  return <span className={className}>{label}</span>;
}
