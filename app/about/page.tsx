import type { Metadata } from "next";
import AboutTrustPage from "@/components/about-trust-page";

export const metadata: Metadata = {
  title: "About, Heritage & Methodology",
  description:
    "Explore NextWallStreet's market research roots since 2001, its analytical timeline, quantitative methodology, risk practices, and educational resources.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutTrustPage />;
}
