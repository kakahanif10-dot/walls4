import type { Metadata } from "next";
import { ARTICLES } from "@/lib/content";
import ResearchExplorer from "@/components/research-explorer";
import WhopBadge from "@/components/whop-badge";

export const metadata: Metadata = {
  title: "70 Research Decks — NextWall Street Desk",
  description:
    "70 quantitative institutional research decks across Wall Street & Day Trading, Crypto Liquidity, and Meme Coin Risk.",
};

export default function ResearchPage() {
  return (
    <div>
      <section className="grain border-b border-line/60">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">The Research Desks</span>
            <WhopBadge size="xs" />
          </div>
          <h1 className="mt-3 font-display text-4xl text-bone sm:text-5xl">
            70 Institutional Research Decks
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            Structured across three core verticals: <strong>Wall Street &amp; Day Trading</strong> (30 dossiers), <strong>Crypto &amp; Digital Assets</strong> (22 dossiers), and <strong>Speculative &amp; Meme Alpha</strong> (18 dossiers). Each research dossier delivers verified thesis mechanics, mathematical invalidation stops, and quantitative risk parameters.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <ResearchExplorer articles={ARTICLES.map((article) => ({ ...article, body: [] }))} />
      </section>
    </div>
  );
}
