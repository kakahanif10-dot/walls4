import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock,
  Globe,
  History,
  ExternalLink,
  Fingerprint,
  Code2,
  Building2,
  Mail,
  Radio,
  Shield,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

const metrics = [
  { value: "24/7", label: "Global market coverage", icon: Radio, detail: "Across equities and digital assets" },
  { value: "100+", label: "Quantitative indicator models", icon: Activity, detail: "Rules-based signals and risk tools" },
  { value: "0", label: "Broker affiliations", icon: Fingerprint, detail: "Independent by design" },
  { value: "Live", label: "Data integrity", icon: ShieldCheck, detail: "Encrypted connections · source-aware" },
];

const pillars: Array<{ number: string; title: string; description: string; icon: LucideIcon; span: string; points: string[] }> = [
  {
    number: "01",
    title: "Quantitative precision",
    description: "Purpose-built models help distinguish durable market structure from short-lived noise, combining price action, momentum, volatility, and context.",
    icon: Activity,
    span: "md:col-span-7",
    points: ["Multi-horizon trend analysis", "Rules-based scoring", "Transparent methodology"],
  },
  {
    number: "02",
    title: "Independent editorial policy",
    description: "Research is created to inform—not to route orders. We do not accept broker kickbacks or sell sponsored trading volume.",
    icon: Fingerprint,
    span: "md:col-span-5",
    points: ["No broker affiliation", "Clear risk disclosures", "Research-first publishing"],
  },
  {
    number: "03",
    title: "Risk-first frameworks",
    description: "A useful market view includes the conditions that would change it. We foreground invalidation, volatility, and macro context—not certainty.",
    icon: ShieldCheck,
    span: "md:col-span-12",
    points: ["Defined invalidation levels", "Volatility-aware sizing tools", "Context before conviction"],
  },
];

const disciplines = [
  { code: "QNT", title: "Quantitative research", focus: "Signal construction · trend models · market structure", icon: TrendingUp },
  { code: "MAC", title: "Macro research", focus: "Rates · liquidity · cross-asset regimes", icon: ArrowUpRight },
  { code: "ENG", title: "Financial engineering", focus: "Market data systems · research tooling · reliability", icon: TerminalSquare },
];

const channels = [
  { title: "X", label: "@nextwallstreet", href: "https://x.com/nextwallstreet", icon: ArrowUpRight },
  { title: "LinkedIn", label: "Organization search", href: "https://www.linkedin.com/search/results/companies/?keywords=NextWallStreet", icon: Building2 },
  { title: "Substack", label: "Research search", href: "https://substack.com/search/NextWallStreet", icon: BookOpen },
  { title: "GitHub", label: "Open data modules", href: "https://github.com/search?q=NextWallStreet&type=repositories", icon: Code2 },
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
    description: "Founded as an independent family-run market research and trading consultancy, focused on macroeconomic analysis and disciplined capital protection.",
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
    title: "Launch of NextWallStreet",
    description: "Bringing these proprietary quantitative indicators, market intelligence, and analytics directly to the public web via our digital platform.",
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
          <h2 id="heritage-heading" className="mt-5 font-display text-3xl leading-tight tracking-tight text-bone sm:text-4xl">Our Heritage &amp; Evolution</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">Over Two Decades of Market Discipline, Now Accessible Online</p>
        </header>

        <div className="mt-8 max-w-4xl rounded-2xl border border-gold/20 bg-gradient-to-br from-[#19170f] via-[#111722] to-[#10151e] p-5 sm:p-7">
          <span className="inline-flex rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-bright sm:text-[11px]">
            20+ Years Market Intelligence | Roots Since 2001
          </span>
          <h3 className="mt-5 font-display text-2xl leading-tight text-bone sm:text-3xl">
            Two Decades of Analytical Evolution
          </h3>
          <p className="mt-4 text-sm leading-7 text-muted sm:text-[15px]">
            Originating as an independent proprietary research desk in 2001, our quantitative models and market frameworks have navigated multiple market cycles—from the early 2000s tech transitions to the current digital asset era. In 2026, we unified and modernized our entire institutional toolset under the nextwallstreet.com terminal to bring high-conviction intelligence directly to modern investors.
          </p>
        </div>

        <h3 className="mt-10 font-display text-xl text-bone sm:text-2xl">Legacy &amp; Heritage Timeline</h3>
        <ol aria-label="NextWallStreet heritage milestones" className="mt-5 max-w-4xl">
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

        <aside className="mt-8 flex max-w-4xl items-start gap-4 rounded-2xl border border-gold/15 bg-gold/[0.025] p-5 sm:p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-gold/[0.06] text-gold">
            <Shield className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-bone">A Clear Evolution, Grounded in Trust</h3>
            <p className="mt-2 text-sm leading-7 text-muted">We began as a private, traditional consultancy. Today, NextWallStreet is a public digital intelligence portal making our market analysis, quantitative indicators, and research tools accessible online. The portal shares information and education; it does not provide individualized investment advice.</p>
          </div>
        </aside>
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
              <span className="h-1.5 w-1.5 rounded-full bg-gold-bright" aria-hidden="true" /> Institutional Market Intelligence
            </div>
            <h1 className="mt-7 max-w-4xl font-display text-[2.7rem] leading-[1.04] tracking-[-0.035em] text-bone sm:text-6xl lg:text-[4.5rem]">
              Engineering clarity in <span className="text-gold-bright">complex markets.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Empowering modern investors, quantitative traders, and institutional researchers with validated market intelligence, real-time trend verification, and risk-managed market frameworks.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/pipeline" className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-bright">
                Explore Market Pulse <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link href="/disclaimer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-medium text-bone/80 transition-colors hover:border-gold/30 hover:text-gold-bright">
                Read our methodology <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.08] pt-5 text-[11px] text-muted/75">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> Rules-based research</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> Independent analysis</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> Risk-aware tools</span>
            </div>
          </div>
        </div>
      </section>

      <HeritageSection />

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="The operating standard" title="Built around measurable discipline." description="A transparent view of what the platform covers and how we approach market research." />
          <span className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" /> Platform overview</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-muted/60">Coverage and model counts describe the platform&apos;s current published scope. Security and data handling details are described in our <Link className="underline decoration-white/20 underline-offset-4 hover:text-bone" href="/privacy-policy">Privacy Policy</Link>.</p>
      </section>

      <section className="border-y border-white/[0.055] bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <SectionHeading eyebrow="Research framework" title="Three principles. One consistent process." description="The research process starts with evidence, makes uncertainty visible, and treats risk as part of every market view." />
          <div className="mt-9 grid gap-3 md:grid-cols-12">
            {pillars.map(({ number, title, description, icon: Icon, span, points }) => (
              <article key={number} className={`${span} group rounded-2xl border border-white/[0.075] bg-[#0b0f17]/80 p-6 transition-all duration-300 hover:border-gold/25 sm:p-7`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/15 bg-gold/[0.06] text-gold"><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></div>
                  <span className="font-mono text-xs tracking-widest text-muted/45">{number}</span>
                </div>
                <h3 className="mt-6 font-display text-2xl text-bone">{title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {points.map((point) => <li key={point} className="rounded-full border border-white/[0.075] px-3 py-1.5 text-[10px] text-bone/70">{point}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="People & practice" title="Specialists, focused on the work." description="Research and product development span quantitative analysis, macro context, and financial software engineering." />
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold/15 bg-gold/[0.035] p-4">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <p className="text-xs leading-5 text-muted">We publish named biographies and professional profiles only when identities and credentials can be independently verified. Until then, we describe the disciplines behind the research rather than inventing individual credentials.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {disciplines.map(({ code, title, focus, icon: Icon }) => (
              <article key={code} className="flex min-h-[215px] flex-col rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 transition-colors hover:border-gold/25">
                <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/[0.07] text-gold"><Icon className="h-4 w-4" aria-hidden="true" /></span><span className="font-mono text-[10px] tracking-widest text-muted/55">{code}</span></div>
                <h3 className="mt-8 text-sm font-semibold leading-5 text-bone">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted">{focus}</p>
                <span className="mt-auto pt-5 text-[10px] uppercase tracking-wider text-muted/45">Research discipline</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.055] bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="External presence" title="Follow the work at its source." description="Use platform search to locate NextWallStreet channels and public research. Confirm account identity before relying on third-party profiles." />
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] px-3 py-2 text-[10px] text-muted"><ExternalLink className="h-3 w-3" aria-hidden="true" /> Opens external platform</span>
          </div>
          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map(({ title, label, href, icon: Icon }) => (
              <a key={title} href={href} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl border border-white/[0.075] bg-[#0b0f17]/70 p-4 transition-all hover:border-gold/25 hover:bg-white/[0.035]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-muted transition-colors group-hover:border-gold/20 group-hover:text-gold"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-bone">{title}</span><span className="mt-0.5 block truncate text-xs text-muted">{label}</span></span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted/55 transition-colors group-hover:text-gold" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading eyebrow="Contact the desk" title="A direct line to our team." description="For product support, enterprise conversations, or help navigating the platform." />
            <a href="mailto:support@nextwallstreet.com" className="mt-7 flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition-colors hover:border-gold/25">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/15 bg-gold/[0.06] text-gold"><Mail className="h-5 w-5" aria-hidden="true" /></span>
              <span><span className="block text-xs text-muted">General support</span><span className="mt-1 block text-sm font-medium text-bone">support@nextwallstreet.com</span></span>
              <ArrowUpRight className="ml-auto h-4 w-4 text-muted" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="mailto:support@nextwallstreet.com?subject=Enterprise%20inquiry" className="group rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 transition-colors hover:border-gold/25">
              <div className="flex items-center justify-between"><Sparkles className="h-4 w-4 text-gold" aria-hidden="true" /><ArrowUpRight className="h-4 w-4 text-muted/50 transition-colors group-hover:text-gold" aria-hidden="true" /></div>
              <h3 className="mt-8 text-sm font-semibold text-bone">Enterprise inquiries</h3><p className="mt-2 text-xs leading-5 text-muted">Discuss research access, data workflows, or team requirements.</p>
            </a>
            <Link href="/academy" className="group rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 transition-colors hover:border-gold/25">
              <div className="flex items-center justify-between"><CircleHelp className="h-4 w-4 text-gold" aria-hidden="true" /><ArrowUpRight className="h-4 w-4 text-muted/50 transition-colors group-hover:text-gold" aria-hidden="true" /></div>
              <h3 className="mt-8 text-sm font-semibold text-bone">Help & learning center</h3><p className="mt-2 text-xs leading-5 text-muted">Browse platform guides, research explainers, and learning resources.</p>
            </Link>
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 sm:col-span-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/[0.08] text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /></span>
              <p className="text-xs leading-5 text-muted"><span className="font-medium text-bone/90">Fast-response support.</span> Send a note to our desk and we&apos;ll respond as promptly as possible.</p>
              <ArrowDownRight className="ml-auto h-4 w-4 shrink-0 text-muted/40" aria-hidden="true" />
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
              <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">NextWallStreet is a financial technology publisher and educational intelligence platform. We are not a registered broker-dealer, investment advisor, or asset management firm. All research, trade setups, and data points are provided for informational and educational purposes only.</p>
              <p className="mt-3 text-xs leading-6 text-muted/80">Trading and investing involve risk, including loss of principal. Information is not individualized advice or a recommendation to transact. Past performance does not predict future results. Review the complete <Link href="/disclaimer" className="text-gold-bright underline decoration-gold/30 underline-offset-4 hover:decoration-gold">risk disclosure and methodology</Link> before using any research.</p>
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
          <div className="max-w-xl"><SectionEyebrow>NextWallStreet · Market Pulse</SectionEyebrow><h2 className="mt-3 font-display text-3xl leading-tight text-bone sm:text-4xl">Step inside the institutional terminal.</h2><p className="mt-3 text-sm leading-6 text-muted">Move from market noise to a clearer, risk-aware view of what is moving.</p></div>
          <div className="flex flex-wrap gap-3">
            <Link href="/pipeline" className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-bright">Launch Market Pulse <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
            <Link href="/disclaimer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-medium text-bone/80 transition-colors hover:border-gold/30 hover:text-gold-bright"><BookOpen className="h-4 w-4" aria-hidden="true" /> Documentation</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
