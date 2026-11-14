import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import InstitutionalToolRouter from "@/components/institutional-tools/tool-router";
import { INSTITUTIONAL_TOOL_SPECS } from "@/lib/institutional-tools-data";

export function generateStaticParams() {
  return INSTITUTIONAL_TOOL_SPECS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const spec = INSTITUTIONAL_TOOL_SPECS.find((t) => t.slug === slug);
  if (!spec) {
    return { title: "Institutional Tool — NextWallStreet" };
  }
  return {
    title: `${spec.label} — NextWallStreet`,
    description: spec.tagline,
  };
}

export default async function InstitutionalToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spec = INSTITUTIONAL_TOOL_SPECS.find((t) => t.slug === slug);
  if (!spec) {
    notFound();
  }

  return (
    <div>
      <section className="grain">
        <div className="mx-auto max-w-[1440px] px-5 py-9 sm:py-10">
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-bone">
              Home
            </Link>
            <span className="text-line">/</span>
            <Link href="/desks" className="hover:text-bone">
              Trade Tools
            </Link>
            <span className="text-line">/</span>
            <span className="text-gold-bright">{spec.label}</span>
          </nav>

          <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-bone sm:text-4xl">
            {spec.label}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            {spec.tagline}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8">
        <InstitutionalToolRouter slug={spec.slug} />
      </section>
    </div>
  );
}
