import type { Metadata } from "next";
import CoveragePage from "@/components/coverage-page";

export const metadata: Metadata = {
  title: "Speculative & High-Beta Risk Models",
  description:
    "High-beta speculative digital token coverage graded on wallet concentration, order-book depth, and narrative decay with hard 2% position caps.",
};

export default function MemeCoinsPage() {
  return <CoveragePage kind="meme" tab="speculative" />;
}
