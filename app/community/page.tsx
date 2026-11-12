import type { Metadata } from "next";
import ChatViewContainer from "@/components/chat-view-container";

export const metadata: Metadata = {
  title: "Trading Floor Community (1,840+ Traders) — NextWall Street",
  description:
    "Institutional live trading floor community featuring 1,840+ verified traders, active breakout channels, AI moderator synthesis, and audio alerts.",
};

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-[1560px] px-3 py-4 sm:px-6 sm:py-6">
      <ChatViewContainer initialFloor="discord" />
    </div>
  );
}
