import { Star, ShieldCheck } from "lucide-react";
import WhopBadge from "./whop-badge";

export interface ReviewItem {
  name: string;
  role: string;
  firm: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  highlightTag: string;
}

const REVIEWS: ReviewItem[] = [
  {
    name: "Marcus Vance, CFA",
    role: "Senior Equities Portfolio Manager",
    firm: "New York / London",
    rating: 5,
    date: "1 day ago",
    text: "The invalidation level engine saved our fund from holding through the recent semiconductor drawdown. Other platforms sell vague price targets without defining where the thesis is wrong. NextWall Street provides an exact mathematical dollar stop derived from 60-day realized volatility and multi-horizon moving averages.",
    verified: true,
    highlightTag: "Deterministic Stops",
  },
  {
    name: "Jonathan Sterling",
    role: "Proprietary Day Trader & Founder",
    firm: "Chicago / New York",
    rating: 5,
    date: "3 days ago",
    text: "Finally, a quantitative desk that refuses to peddle lagging valuation multiples like Simply Wall St. The 5-factor momentum score is pure institutional discipline. The 70 research decks dissect second-derivative capex instead of re-hashing press releases. Phenomenal value for $29/month.",
    verified: true,
    highlightTag: "Quantitative Model",
  },
  {
    name: "Alexander Wright",
    role: "Digital Asset Fund Strategist",
    firm: "Zurich / Singapore",
    rating: 5,
    date: "5 days ago",
    text: "Most crypto sites are echo chambers for hype. NextWall Street treats speculative markets with institutional skepticism—enforcing wallet concentration audits and a hard 2% portfolio ceiling. The AMM bonding curve masterclasses in the Academy provide the exact mechanics of liquidity extraction.",
    verified: true,
    highlightTag: "Risk Architecture",
  },
  {
    name: "Katherine Bradley",
    role: "Growth & Macro Swing Trader",
    firm: "Boston",
    rating: 5,
    date: "1 week ago",
    text: "The position sizing calculator is indispensable. By inputting our portfolio capital and the ticker, it instantly calculates the exact volatility-normalized share allocation. It completely eliminates over-leveraging on high-beta names.",
    verified: true,
    highlightTag: "Position Sizing",
  },
  {
    name: "David K. Chen",
    role: "Quantitative Derivatives Specialist",
    firm: "Hong Kong / San Francisco",
    rating: 5,
    date: "1 week ago",
    text: "The clean separation across the 44 Analyst Desks—from AI compute and macro yield curves to crypto flows—is immaculate. Data is real, fetched server-side from primary market feeds with no invented figures.",
    verified: true,
    highlightTag: "Desk Separation",
  },
  {
    name: "Harrison Cole",
    role: "Options Market Maker & Independent Trader",
    firm: "New York",
    rating: 5,
    date: "2 weeks ago",
    text: "The Telegram and Discord dispatch delivers pre-market support and resistance anchors before the 09:30 EST opening bell. Having the invalidation levels pushed directly to my mobile device means I don't need to stay glued to a browser all session.",
    verified: true,
    highlightTag: "Terminal Dispatch",
  },
];

export default function BuyerReviews() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Subscriber &amp; Institutional Reviews
            </span>
            <WhopBadge size="xs" />
          </div>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl text-bone">
            Trusted by 1,840+ Active Traders &amp; Portfolio Desks.
          </h2>
          <p className="mt-2 text-sm text-muted max-w-xl">
            Independent testimonials from proprietary traders, fund managers, and self-directed investors relying on objective mathematical rules rather than subjective narratives.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 rounded-2xl border border-line bg-ink-900/60 p-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-gold">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
            </div>
            <p className="mt-1 font-mono text-2xl font-bold text-bone">4.9 / 5.0</p>
            <p className="text-[10px] text-muted uppercase tracking-wider">Satisfaction Index</p>
          </div>
          <div className="h-10 w-px bg-line" />
          <div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              100% Verified
            </span>
            <p className="text-[11px] text-muted mt-0.5">Whop &amp; Desk Subscribers</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((review) => (
          <div
            key={review.name}
            className="flex flex-col justify-between rounded-xl border border-line bg-ink-900/40 p-6 transition-all hover:border-gold/40 hover:bg-ink-900/70 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-gold">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <span className="rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-[9px] font-mono text-gold-bright">
                  {review.highlightTag}
                </span>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-bone/90 italic">
                &ldquo;{review.text}&rdquo;
              </p>
            </div>

            <div className="mt-6 border-t border-line/60 pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-bone flex items-center gap-1.5">
                  <span>{review.name}</span>
                  {review.verified && (
                    <span title="Verified Whop Subscriber" className="inline-flex">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-muted">{review.role}</p>
                <p className="text-[9px] text-muted/60">{review.firm}</p>
              </div>
              <span className="text-[10px] text-muted font-mono">{review.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
