"use client";

import { useQuote } from "@/components/live-prices";
import { fmtPct, fmtPrice, type Row } from "@/lib/market";

function TapeItem({ row }: { row: Row }) {
  const quote = useQuote(row.symbol);
  const price = quote?.price ?? row.price;
  const change = quote?.change ?? row.change24h;
  const flash = quote?.dir && quote.dir > 0 ? "flash-up" : quote?.dir && quote.dir < 0 ? "flash-down" : "";

  return (
    <span className="flex items-center gap-2 whitespace-nowrap text-xs">
      <span className="font-mono font-semibold tracking-wide text-bone/90">{row.symbol}</span>
      <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
        <span key={`tp-${quote?.tick ?? 0}`} className={`inline-block text-muted ${flash}`}>
          {fmtPrice(price, row.kind)}
        </span>
        {" "}
        <span
          key={`tc-${quote?.tick ?? 0}`}
          className={`inline-block ${change >= 0 ? "text-up" : "text-down"} ${flash}`}
        >
          {fmtPct(change)}
        </span>
      </span>
      <span className="text-line" aria-hidden="true">|</span>
    </span>
  );
}

export default function TickerTape({ rows }: { rows: Row[] }) {
  return (
    <section
      aria-label="Live market prices"
      className="mx-auto my-4 w-full max-w-7xl px-5 sm:my-5"
    >
      <div className="flex min-w-0 overflow-hidden rounded-xl border border-line/80 bg-ink-900/90 shadow-[0_8px_30px_rgba(0,0,0,0.16)]">
        <div className="flex shrink-0 items-center gap-2.5 border-r border-line/80 bg-ink-950/80 px-3 py-3 sm:px-4">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-bright">
            Live markets
          </span>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track flex items-center gap-8 py-2.5 pl-4">
            {rows.map((row) => (
              <TapeItem key={row.symbol} row={row} />
            ))}
            <div className="flex items-center gap-8" aria-hidden="true">
              {rows.map((row) => (
                <TapeItem key={`${row.symbol}-loop`} row={row} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
