"use client";

import { useEffect, useState } from "react";

function formatUtc(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function sessionFor(date: Date): { label: string; tone: string } {
  const day = date.getUTCDay();
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();

  if (day === 0 || day === 6) return { label: "Closed · weekend", tone: "text-muted bg-ink-900/75" };
  if (minutes >= 810 && minutes < 1200) return { label: "US session", tone: "text-up bg-up/15" };
  if (minutes >= 540 && minutes < 810) return { label: "Pre-market", tone: "text-gold bg-gold/15" };
  if (minutes >= 1200) return { label: "After hours", tone: "text-gold bg-gold/15" };
  return { label: "Overnight", tone: "text-muted bg-ink-900/75" };
}

export default function LiveClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const session = sessionFor(now);

  return (
    <div
      className="flex items-center gap-2 text-xs"
      title={now.toUTCString()}
      suppressHydrationWarning
    >
      <span className="font-mono tabular-nums text-bone/90" suppressHydrationWarning>
        {formatUtc(now)}
        <span className="ml-1 text-muted">UTC</span>
      </span>
      {!compact && (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] ${session.tone}`}
          suppressHydrationWarning
        >
          {session.label}
        </span>
      )}
    </div>
  );
}
