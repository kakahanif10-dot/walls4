import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  CircleHelp,
  Clock,
  Code2,
  Fingerprint,
  Globe,
  History,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const metrics = [
  { value: "25 Years", label: "(Since 2001)", icon: Clock, detail: "Roots in macro & market cycle study" },
  { value: "Multi-Market", label: "Focus", icon: Globe, detail: "Equities, macro benchmarks, and digital assets" },
  { value: "100%", label: "Independent", icon: Fingerprint, detail: "Free from broker affiliations or paid volume incentives" },
  { value: "Rule-Based", label: "Risk Focus", icon: ShieldCheck, detail: "Structured validation and disciplined capital protection" },
];

const pillars: Array<{ number: string; title: string; description: string; icon: LucideIcon; span: string }> = [
  {
    number: "01",
    title: "Quantitative Precision",
    description: "Quantitative models and backtested indicators designed to separate structural trend shifts from short-term market noise.",
    icon: Activity,
    span: "md:col-span-7",
  },
  {
    number: "02",
    title: "Independent Editorial Policy",
    description: "Objective research free from broker kickbacks, sponsored promotions, or conflicted incentives.",
    icon: Fingerprint,
    span: "md:col-span-5",
  },
  {
    number: "03",
    title: "Risk-First Analytical Framework",
    description: "Every market study emphasizes macro context, structural invalidation zones, and disciplined capital preservation.",
    icon: ShieldCheck,
    span: "md:col-span-12",
  },
];

const governance = [
  {
    title: "Research & Methodology Standards",
    description: "Research notes identify source inputs, explain the analytical framework, and make relevant limitations and risk conditions clear.",
    icon: CheckCircle2,
  },
  {
    title: "Quantitative Modeling & Backtesting Process",
    description: "Models use defined rules and historical testing. Backtests inform analysis but cannot guarantee future performance.",
    icon: Activity,
  },
  {
    title: "Data Verification Practices",
    description: "Market inputs are checked for source, timestamp, and consistency, with known gaps or limitations stated where applicable.",
    icon: ShieldCheck,
  },
];

const channels = [
  { title: "X", label: "@nextwallstreet", href: "https://x.com/nextwallstreet", icon: ArrowUpRight },
  { title: "LinkedIn", label: "NextWallStreet", href: "https://www.linkedin.com/search/results/companies/?keywords=NextWallStreet", icon: Building2 },
  { title: "Research Substack", label: "Public research", href: "https://substack.com/search/NextWallStreet", icon: BookOpen },
  { title: "Documentation", label: "Methodology & disclosures", href: "/disclaimer", icon: Code2 },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">{children}</p>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-2xl">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="mt-3 font-display text-3xl leading-tight text-bone sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 max-w-xl text-sm leading-7 text-muted">{description}</p>}
    </div>
  );
}

function MetricCard({ value, label, detail, icon: Icon }: (typeof metrics)[number]) {
  return (
    <article className="group rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 transition-colors duration-300 hover:border-gold/30 hover:bg-white/[0.04] sm:p-6">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/15 bg-gold/[0.07] text-gold"><Icon className="h-4 w-4" aria-hidden="true" /></span>
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted/60">NWS / RESEARCH</span>
      </div>
      <p className="mt-7 font-display text-3xl tracking-tight text-bone sm:text-[2.1rem]">{value}</p>
      <h3 className="mt-1 text-sm font-medium text-bone/90">{label}</h3>
      <p className="mt-2 text-xs text-muted">{detail}</p>
    </article>
  );
}

const heritageMilestones = [
  {
    period: "2001 · FOUNDATIONS",
    title: "Private Market Advisory",
    description: "Founded in 2001 as an independent, community-driven market research and trading consultancy focused on macroeconomic analysis and disciplined capital protection.",
    icon: History,
  },
  {
    period: "2010s · QUANTITATIVE EVOLUTION",
    title: "Systematic Frameworks",
    description: "Transitioning from discretionary analysis to algorithmic models and rule-based risk management.",
    icon: Clock,
  },
  {
    period: "2026 · DIGITAL ERA",
    title: "Public Digital Platform Expansion",
    description: "Bringing these quantitative indicators, market intelligence, and analytics together on a public web terminal at nextwallstreet.com.",
    icon: Globe,
  },
];

function HeritageSection() {
  return (
    <section id="our-heritage" aria-labelledby="heritage-heading" className="border-y border-white/[0.055] bg-[#0b0f17]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.05] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-bright">
            <History className="h-3.5 w-3.5" aria-hidden="true" /> Our Heritage
          </span>
            <h2 id="heritage-heading" className="mt-5 font-display text-3xl leading-tight tracking-tight text-bone sm:text-4xl">Built Through Market Cycles</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">Twenty-five years of market discipline, brought together on a web-based analytical platform.</p>
        </header>

        <ol aria-label="NextWallStreet heritage milestones" className="mt-10 max-w-4xl">
          {heritageMilestones.map(({ period, title, description, icon: Icon }, index) => (
            <li key={period} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 pb-7 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-6">
              {index < heritageMilestones.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[1.375rem] top-10 w-px bg-gradient-to-b from-gold/35 to-gold/10 sm:left-6" />}
              <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 bg-[#0b0f17] text-gold-bright shadow-[0_0_0_5px_#0b0f17]">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <article className="rounded-2xl border border-white/[0.075] bg-white/[0.02] p-5 transition-colors hover:border-gold/20 sm:p-6">
                <p className="font-mono text-[10px] font-medium tracking-[0.16em] text-gold">{period}</p>
                <h3 className="mt-2 font-display text-xl text-bone sm:text-2xl">{title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{description}</p>
              </article>
            </li>
          ))}
        </ol>

        <section aria-label="Heritage narrative" className="mt-8 max-w-5xl rounded-2xl border border-gold/20 bg-gradient-to-br from-[#19170f] via-[#111722] to-[#10151e] p-5 sm:p-7 lg:p-8">
          <span className="inline-flex max-w-full rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-2 font-mono text-[10px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-gold-bright sm:text-[11px]">
            25 Years of Analytical Evolution | Roots Since 2001
          </span>
          <p className="mt-5 text-sm leading-7 text-muted sm:text-[15px]">
            Founded in 2001 as an independent, community-driven market research and trading consultancy focused on macroeconomic analysis and disciplined capital protection, our frameworks have been tested across shifting market environments—from post-2001 market transitions and the 2008 financial crisis to later modern digital asset cycles. After evolving into systematic quantitative models in the 2010s, we unified and modernized our analytics under NextWallStreet in 2026 to make structured market intelligence accessible on nextwallstreet.com.
          </p>
        </section>

        <section aria-labelledby="entity-overview-heading" className="mt-8 max-w-5xl rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#19170f] via-[#111722] to-[#0d1119] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8 lg:p-10">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">ENTITY OVERVIEW &amp; IDENTITY</p>
          <h2 id="entity-overview-heading" className="mt-3 font-display text-3xl leading-tight text-bone sm:text-4xl">What is NextWallStreet?</h2>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-muted sm:text-base sm:leading-8">
            NextWallStreet is an independent quantitative market research and intelligence platform rooted in macro-analytical and trading consultancy practices established in 2001. Combining over two decades of cross-cycle market discipline with systematic algorithmic modeling, NextWallStreet delivers structured trend validation, macro context, and rule-based risk frameworks through its modern digital terminal at nextwallstreet.com.
          </p>
          <dl className="mt-8 grid gap-0 divide-y divide-gold/15 border-y border-gold/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-5 sm:pr-5 sm:py-6">
              <dt className="font-display text-base font-medium text-bone">Origin &amp; Lineage</dt>
              <dd className="mt-2 text-sm leading-6 text-muted">Independent macro &amp; capital-protection practice since 2001</dd>
            </div>
            <div className="py-5 sm:px-5 sm:py-6">
              <dt className="font-display text-base font-medium text-bone">Core Methodology</dt>
              <dd className="mt-2 text-sm leading-6 text-muted">Systematic quantitative models &amp; rule-based risk management</dd>
            </div>
            <div className="py-5 sm:pl-5 sm:py-6">
              <dt className="font-display text-base font-medium text-bone">Digital Platform</dt>
              <dd className="mt-2 text-sm leading-6 text-muted">Unified web analytics &amp; market intelligence terminal (nextwallstreet.com)</dd>
            </div>
          </dl>
          <nav aria-label="NextWallStreet information" className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <Link href="/" className="text-bone/75 transition-colors hover:text-gold-bright">NextWallStreet homepage</Link>
            <Link href="#our-heritage" className="text-bone/75 transition-colors hover:text-gold-bright">Heritage &amp; About</Link>
            <Link href="/disclaimer" className="text-bone/75 transition-colors hover:text-gold-bright">Compliance disclaimer</Link>
          </nav>
        </section>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "NextWallStreet",
              url: "https://nextwallstreet.com",
              foundingDate: "2001",
              description: "NextWallStreet is an independent quantitative market research and intelligence platform rooted in macro-analytical and trading consultancy practices established in 2001. Combining over two decades of cross-cycle market discipline with systematic algorithmic modeling, NextWallStreet delivers structured trend validation, macro context, and rule-based risk frameworks through its modern digital terminal at nextwallstreet.com.",
            }),
          }}
        />
      </div>
    </section>
  );
}

export default function AboutTrustPage() {
  return (
    <div className="overflow-hidden">
      <section className="grain relative border-b border-white/[0.055]">
        <div className="pointer-events-none absolute -right-36 top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-gold/[0.055] blur-[100px]" />
        <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold-bright">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-bright" aria-hidden="true" /> Quantitative &amp; Macro Market Research
            </div>
            <h1 className="mt-7 max-w-4xl font-display text-[2.7rem] leading-[1.04] tracking-[-0.035em] text-bone sm:text-6xl lg:text-[4.5rem]">
              Engineering Clarity in <span className="text-gold-bright">Complex Markets</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Built on 25 years of market observation and discipline, supporting independent traders and investors with structured market intelligence, trend validation, and risk-first frameworks.
            </p>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading eyebrow="Track record & verified metrics" title="A long view of market research." description="The foundations and analytical focus behind NextWallStreet." />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </div>
      </section>

      <HeritageSection />

      <section className="border-y border-white/[0.055] bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <SectionHeading eyebrow="Core research pillars" title="Principles behind every market view." description="Quantitative precision, independent editorial policy, and risk-first analysis guide our work." />
          <div className="mt-9 grid gap-3 md:grid-cols-12">
            {pillars.map(({ number, title, description, icon: Icon, span }) => (
              <article key={number} className={`${span} group rounded-2xl border border-white/[0.075] bg-[#0b0f17]/80 p-6 transition-all duration-300 hover:border-gold/25 sm:p-7`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/15 bg-gold/[0.06] text-gold"><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></div>
                  <span className="font-mono text-xs tracking-widest text-muted/45">{number}</span>
                </div>
                <h3 className="mt-6 font-display text-2xl text-bone">{title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading eyebrow="Methodology & research standards" title="How the work is assessed." description="Clear process descriptions help readers understand what the analysis can—and cannot—say." />
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {governance.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-white/[0.075] bg-[#0b0f17]/80 p-6 transition-colors hover:border-gold/25">
              <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
              <h3 className="mt-5 text-sm font-semibold leading-5 text-bone">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.055] bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <SectionHeading eyebrow="Official channels & contact information" title="Connect with NextWallStreet." description="Find our public channels, contact the support desk, or explore educational resources." />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-2 sm:grid-cols-2">
              {channels.map(({ title, label, href, icon: Icon }) => (
                <a key={title} href={href} target={href.startsWith("https://") ? "_blank" : undefined} rel={href.startsWith("https://") ? "noreferrer" : undefined} className="group flex items-center gap-3 rounded-xl border border-white/[0.075] bg-[#0b0f17]/70 p-4 transition-all hover:border-gold/25 hover:bg-white/[0.035]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-muted transition-colors group-hover:border-gold/20 group-hover:text-gold"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-bone">{title}</span><span className="mt-0.5 block truncate text-xs text-muted">{label}</span></span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted/55 transition-colors group-hover:text-gold" aria-hidden="true" />
                </a>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <a href="mailto:support@nextwallstreet.com" className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 transition-colors hover:border-gold/25 sm:col-span-2">
                <Mail className="h-5 w-5 text-gold" aria-hidden="true" />
                <h3 className="mt-5 text-sm font-semibold text-bone">Direct support</h3>
                <p className="mt-1 text-xs text-muted">support@nextwallstreet.com</p>
              </a>
              <a href="mailto:support@nextwallstreet.com?subject=Webinar%20and%20education%20inquiry" className="group rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 transition-colors hover:border-gold/25">
                <BookOpen className="h-5 w-5 text-gold" aria-hidden="true" />
                <h3 className="mt-5 text-sm font-semibold text-bone">Webinars &amp; education</h3>
                <p className="mt-1 text-xs leading-5 text-muted">Inquire about upcoming sessions and learning resources.</p>
              </a>
              <Link href="/academy" className="group rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 transition-colors hover:border-gold/25">
                <CircleHelp className="h-5 w-5 text-gold" aria-hidden="true" />
                <h3 className="mt-5 text-sm font-semibold text-bone">Help Center</h3>
                <p className="mt-1 text-xs leading-5 text-muted">Platform guides and educational resources.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.075] via-[#10141d] to-[#0b0f17] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/15 bg-amber-200/[0.06] text-gold"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <SectionEyebrow>Important information</SectionEyebrow>
              <h2 className="mt-2 font-display text-xl text-bone">Regulatory status &amp; financial disclaimer</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">NextWallStreet has evolved from a private, community-driven research practice into a modern digital intelligence portal. We are not a registered broker-dealer, investment advisor, or asset management firm. All market research, quantitative indicators, and analytics are provided strictly for informational and educational purposes only and do not constitute personalized investment advice or a solicitation to buy or sell any security.</p>
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.08] pt-4 text-xs">
            <Link href="/terms-of-service" className="text-bone/70 transition-colors hover:text-gold-bright">Terms of Service</Link>
            <Link href="/privacy-policy" className="text-bone/70 transition-colors hover:text-gold-bright">Privacy Policy</Link>
            <Link href="/disclaimer" className="text-bone/70 transition-colors hover:text-gold-bright">Risk Disclosure</Link>
          </div>
        </div>
      </section>

      <section className="grain border-t border-white/[0.055]">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl"><SectionEyebrow>NextWallStreet · Market Pulse</SectionEyebrow><h2 className="mt-3 font-display text-3xl leading-tight text-bone sm:text-4xl">Explore the NextWallStreet Platform</h2><p className="mt-3 text-sm leading-6 text-muted">Open the live Market Pulse board or explore education and methodology resources.</p></div>
          <div className="flex flex-wrap gap-3">
            <Link href="/pipeline" className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-bright">Launch Market Pulse board <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
            <Link href="/academy" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-medium text-bone/80 transition-colors hover:border-gold/30 hover:text-gold-bright"><BookOpen className="h-4 w-4" aria-hidden="true" /> Webinars &amp; education</Link>
            <Link href="/disclaimer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-medium text-bone/80 transition-colors hover:border-gold/30 hover:text-gold-bright">Methodology docs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
