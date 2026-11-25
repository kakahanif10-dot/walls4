import type { Metadata } from "next";
import AboutTrustPage from "@/components/about-trust-page";

export const metadata: Metadata = {
  title: "Our Heritage & Evolution | About NextWallStreet",
  description:
    "Discover NextWallStreet's evolution from a family-run market advisory consultancy founded in 2001 to a public digital intelligence platform for quantitative research and risk frameworks.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutTrustPage />;
}
