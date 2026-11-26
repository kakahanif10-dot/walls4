import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Database,
  Fingerprint,
  Mail,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

const metrics = [
  {
    value: "25+",
    title: "Years of Market Lineage",
    detail: "Roots in macro and cycle analysis since 2001",
    icon: Activity,
  },
  {
    value: "24/7",
    title: "Multi-Asset Coverage",
    detail: "Equities, macro indices, and digital assets",
    icon: Radio,
  },
  {
    value: "100%",
    title: "Independent Research",
    detail: "Zero broker affiliations or sponsored volume",
    icon: Fingerprint,
  },
  {
    value: "Rules-based",
    title: "Systematic Risk Frameworks",
    detail: "Validation and capital protection",
    icon: ShieldCheck,
  },
];

const pillars = [
  {
    title: "Quantitative Precision",
    description:
      "Proprietary algorithms and backtested models designed to filter market noise from structural trend shifts.",
    icon: SlidersHorizontal,
  },
  {
    title: "Independent Editorial Policy",
    description:
      "Objective market research free from broker kickbacks, paid promotions, or conflicted incentives.",
    icon: Fingerprint,
  },
  {
    title: "Risk-First Analytical Framework",
    description:
      "Every market study emphasizes macro context, structural invalidation zones, and disciplined capital preservation.",
    icon: ShieldCheck,
  },
];

const governance = [
  {
    title: "Research Committee",
    description:
      "Cross-discipline review brings quantitative, macro, and market-structure perspectives together before research is published.",
    icon: CheckCircle2,
  },
  {
    title: "Quantitative Modeling & Backtesting",
    description:
      "Models use documented rules, historical testing, and ongoing review; backtests are analytical tools, not guarantees of future results.",
    icon: SlidersHorizontal,
  },
  {
    title: "Data Verification Process",
    description:
      "Market inputs are checked for source, timestamp, and consistency, with validation limits made clear where data is incomplete.",
    icon: Database,
  },
];

const channels = [
  { name: "X", label: "@nextwallstreet", href: "https://x.com/nextwallstreet" },
  {
    name: "LinkedIn",
    label: "NextWallStreet",
    href: "https://www.linkedin.com/search/results/companies/?keywords=NextWallStreet",
  },
  {
    name: "Research Substack",
    label: "Public research",
    href: "https://substack.com/search/NextWallStreet",
  },
];

function PosterHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
        {eyebrow}
      </p>
      <h4 id={id} className="mt-2 font-display text-xl text-bone sm:text-2xl">{title}</h4>
    </div>
  );
}

export default function HeritageMethodologyPoster() {
  return (
    <section
      aria-labelledby="heritage-poster-heading"
      className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-[#151713] via-[#10151e] to-[#0d1119] shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
    >
      <div className="relative border-b border-white/[0.07] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-gold/[0.08]"
        />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-bright">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold-bright" />
            Quantitative &amp; Macro Market Intelligence
          </p>
          <h3
            id="heritage-poster-heading"
            className="mt-5 font-display text-3xl leading-tight tracking-tight text-bone sm:text-4xl"
          >
            Engineering Clarity in Complex Markets
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Built on over two decades of market discipline, empowering independent traders and
            modern investors with validated market intelligence, trend verification, and risk-first
            frameworks.
          </p>
        </div>
      </div>

      <div className="space-y-10 px-5 py-8 sm:space-y-12 sm:px-8 sm:py-10 lg:px-10">
        <section aria-labelledby="heritage-metrics-heading">
          <h4 id="heritage-metrics-heading" className="sr-only">
            Track Record &amp; Verified Metrics
          </h4>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ value, title, detail, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition-colors hover:border-gold/25 sm:p-5"
              >
                <dt className="flex items-center justify-between gap-3 text-xs text-muted">
                  {title}
                  <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                </dt>
                <dd className="mt-4 font-display text-2xl text-bone">{value}</dd>
                <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="research-pillars-heading">
          <PosterHeading id="research-pillars-heading" eyebrow="Core research pillars" title="Principles behind every market view" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {pillars.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/[0.075] bg-[#0b0f17]/70 p-5 transition-colors hover:border-gold/25"
              >
                <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                <h5 className="mt-5 text-sm font-semibold leading-5 text-bone">{title}</h5>
                <p className="mt-2 text-xs leading-6 text-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="research-governance-heading">
          <PosterHeading id="research-governance-heading" eyebrow="Research governance" title="Standards that keep the work accountable" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {governance.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/[0.075] bg-white/[0.02] p-5"
              >
                <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                <h5 className="mt-4 text-sm font-semibold leading-5 text-bone">{title}</h5>
                <p className="mt-2 text-xs leading-6 text-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="official-channels-heading" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <PosterHeading id="official-channels-heading" eyebrow="Official channels" title="Follow the research at its source" />
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {channels.map((channel) => (
                <a
                  key={channel.name}
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-white/[0.075] bg-white/[0.02] px-4 py-3 transition-colors hover:border-gold/25"
                >
                  <span>
                    <span className="block text-sm font-medium text-bone">{channel.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{channel.label}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-gold" aria-hidden="true" />
                </a>
              ))}
              <Link
                href="/disclaimer"
                className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-white/[0.075] bg-white/[0.02] px-4 py-3 transition-colors hover:border-gold/25"
              >
                <span>
                  <span className="block text-sm font-medium text-bone">Documentation</span>
                  <span className="mt-0.5 block text-xs text-muted">Methodology &amp; disclosures</span>
                </span>
                <BookOpen className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-gold" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.075] bg-white/[0.02] p-5 sm:p-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              Contact &amp; education
            </p>
            <a
              href="mailto:support@nextwallstreet.com"
              className="mt-4 flex items-center gap-3 text-sm font-medium text-bone transition-colors hover:text-gold-bright"
            >
              <Mail className="h-4 w-4 text-gold" aria-hidden="true" />
              support@nextwallstreet.com
            </a>
            <a
              href="mailto:support@nextwallstreet.com?subject=Webinar%20and%20education%20inquiry"
              className="mt-4 block rounded-xl border border-white/[0.07] p-4 transition-colors hover:border-gold/25"
            >
              <span className="block text-sm font-medium text-bone">Webinars &amp; educational inquiries</span>
              <span className="mt-1 block text-xs leading-5 text-muted">Contact our desk about upcoming sessions and learning resources.</span>
            </a>
            <Link
              href="/academy"
              className="mt-4 inline-flex items-center gap-2 text-xs text-muted transition-colors hover:text-gold-bright"
            >
              Visit the Help &amp; Learning Center <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="heritage-compliance-heading" className="rounded-2xl border border-amber-300/20 bg-amber-200/[0.035] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                Regulatory compliance
              </p>
              <h4 id="heritage-compliance-heading" className="mt-2 text-sm font-semibold text-bone">
                Important information about our research
              </h4>
              <p className="mt-2 text-xs leading-6 text-muted sm:text-sm sm:leading-7">
                NextWallStreet has evolved from a private, community-driven research practice into a
                modern digital intelligence portal. We are not a registered broker-dealer,
                investment advisor, or asset management firm. All market research, quantitative
                indicators, and analytics are provided strictly for informational and educational
                purposes only and do not constitute personalized investment advice or a
                solicitation to buy or sell any security.
              </p>
            </div>
          </div>
          <nav aria-label="Legal information" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.08] pt-4 text-xs">
            <Link href="/terms-of-service" className="text-bone/70 transition-colors hover:text-gold-bright">Terms of Service</Link>
            <Link href="/privacy-policy" className="text-bone/70 transition-colors hover:text-gold-bright">Privacy Policy</Link>
            <Link href="/disclaimer" className="text-bone/70 transition-colors hover:text-gold-bright">Risk Disclosure</Link>
          </nav>
        </section>

        <section aria-labelledby="heritage-cta-heading" className="flex flex-col gap-5 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/[0.08] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">NextWallStreet · Market Pulse</p>
            <h4 id="heritage-cta-heading" className="mt-2 font-display text-xl text-bone sm:text-2xl">
              Explore the NextWallStreet Terminal
            </h4>
            <p className="mt-2 text-xs leading-5 text-muted">Explore live market intelligence, learning resources, and the methodology behind our research.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/pipeline"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-4 text-xs font-semibold text-ink-950 transition-colors hover:bg-gold-bright"
            >
              Launch Market Pulse <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/disclaimer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-medium text-bone/85 transition-colors hover:border-gold/30 hover:text-gold-bright"
            >
              Methodology &amp; disclosures
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
