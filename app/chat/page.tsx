import type { Metadata } from "next";
import DiscordLiveChat from "@/components/discord-live-chat";
import WhopBadge from "@/components/whop-badge";

export const metadata: Metadata = {
  title: "Live Trading Floor & Quantitative Strategy Terminal — NextWall Street",
  description:
    "Institutional live trading floor with minute-by-minute quantitative predictions, technical invalidation levels, multi-timezone market clocks (UTC, EST, SGT), and trading floor discussion.",
};

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-[1560px] px-3 py-4 sm:px-6 sm:py-6">
      {/* Live Floor Header Status Banner */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="live-dot h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold text-emerald-300 text-sm inline-flex items-center">
              <span>NextWall Street Live Trading Floor &amp; Quantitative Desk</span>
              <WhopBadge className="ml-1.5 align-middle" />
            </span>
            <p className="text-emerald-200/80 text-[11px] mt-0.5">
              Live desk feed connected. Audit any of 2,000+ assets with <code className="bg-emerald-900/50 px-1 py-0.2 rounded text-gold font-mono">/predict [symbol]</code>, or participate in institutional trade setups.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted shrink-0">
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-emerald-300 font-bold">
            1,840+ Traders Online
          </span>
        </div>
      </div>

      <DiscordLiveChat />
    </div>
  );
}
