import type { Metadata } from "next";
import AboutTrustPage from "@/components/about-trust-page";

export const metadata: Metadata = {
  title: "About, Trust & Methodology",
  description:
    "Learn how NextWallStreet approaches quantitative research, market intelligence, risk frameworks, platform transparency, and investor education.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutTrustPage />;
}
