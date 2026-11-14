import Link from "next/link";
import { ASSETS } from "@/lib/market";
import { LockedLink } from "@/components/locked-action";

const COLUMNS = [
  {
    title: "Coverage",
    links: [
      { href: "/markets", label: "US Equities" },
      { href: "/crypto", label: "Digital Assets" },
      { href: "/crypto?tab=speculative", label: "Speculative Risk Models" },
      { href: "/ticker/BTC", label: "Bitcoin Trend Score" },
      { href: "/ticker/NVDA", label: "NVIDIA Trend Score" },
    ],
  },
  {
    title: "Research",
    links: [
      { href: "/research", label: "All research" },
      { href: "/research/the-ai-capex-cycle-is-now-a-second-derivative-trade", label: "AI capex cycle" },
      { href: "/research/bitcoin-has-no-valuation-floor-it-has-a-liquidity-ceiling", label: "Bitcoin & liquidity" },
      { href: "/research/the-breadth-divergence-playbook-when-five-mega-caps-carry-the-index", label: "Narrow market playbook" },
    ],
  },
  {
    title: "Academy",
    links: [
      { href: "/academy", label: "All courses" },
      { href: "/academy/reading-trends", label: "Reading a Trend: From Structure to Signal" },
      { href: "/academy/crypto-without-hype", label: "Crypto Without the Hype" },
      { href: "/academy/portfolio-construction", label: "Portfolio Construction & Sizing" },
      { href: "/academy/meme-coin-risk", label: "Speculative Risk & Liquidity Traps" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/pricing", label: "Lifetime access ($1,487 USD)", isPublic: true },
      { href: "/disclaimer", label: "Disclaimer & methodology", isPublic: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-14 bg-ink-900/70">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-xl text-bone">
              Next<span className="text-gold-bright">Wall</span>Street
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Rules-based trend analysis and research across equities, digital assets and
              speculative markets — plus the education to use it responsibly.
            </p>
            <p className="mt-5 text-xs leading-relaxed text-muted/70">
              {ASSETS.length.toLocaleString()} Assets Tracked · 70 Research Desks · 60 Academy Lessons · 32 Trade Tools · 1,100+ Community Members
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    {"isPublic" in link && link.isPublic ? (
                      <Link
                        href={link.href}
                        className="text-sm text-bone/75 transition-colors hover:text-gold-bright"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <LockedLink
                        href={link.href}
                        deskLabel={link.label}
                        className="text-sm text-bone/75 transition-colors hover:text-gold-bright"
                      >
                        {link.label}
                      </LockedLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-ink-950/55 p-5 sm:p-6">
          <p className="max-w-4xl text-xs leading-relaxed text-muted/80">
            <strong className="text-bone/80">Not investment advice.</strong> NextWallStreet
            publishes market analysis and educational material only. Nothing here is a
            recommendation, solicitation or offer to buy or sell any security, token or derivative.
            Quotes are sourced from real-time exchange and public market feeds across equities,
            digital assets, and global venues. Investing and trading involve
            substantial risk of loss, including total loss of capital. Past performance does not
            predict future results. Do your own research and consult a licensed adviser where
            appropriate.
          </p>
          <div className="mt-5 flex flex-col gap-3 text-xs text-muted/70 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} NextWallStreet. All rights reserved.</p>
            <div className="flex gap-5">
              <Link href="/disclaimer" className="hover:text-bone">
                Methodology
              </Link>
              <Link href="/disclaimer" className="hover:text-bone">
                Terms
              </Link>
              <Link href="/disclaimer" className="hover:text-bone">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
