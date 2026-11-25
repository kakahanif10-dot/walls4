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
      aria-label="Market prices"
      className="my-8 w-full border-y border-line/80 bg-ink-900/90 sm:my-10"
    >
      <div className="w-full overflow-hidden py-4 sm:py-[1.125rem]">
        <div className="marquee-track flex items-center gap-8 pl-5 sm:gap-10 sm:pl-8">
          {rows.map((row) => (
            <TapeItem key={row.symbol} row={row} />
          ))}
          <div className="flex items-center gap-8 sm:gap-10" aria-hidden="true">
            {rows.map((row) => (
              <TapeItem key={`${row.symbol}-loop`} row={row} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
