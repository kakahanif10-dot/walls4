"use client";

const NOTICE_SEGMENTS = [0, 1, 2, 3];

function NoticeItem() {
  return (
    <span className="flex items-center gap-6 whitespace-nowrap text-xs">
      <span className="font-mono tracking-wide">
        <strong className="font-semibold text-gold-bright">Not investment advice.</strong>{" "}
        <span className="text-muted">
          NextWallStreet publishes market analysis and educational material only.
        </span>
      </span>
      <span className="text-line" aria-hidden="true">
        |
      </span>
    </span>
  );
}

export default function DisclaimerMarquee() {
  return (
    <div
      aria-label="Regulatory and educational disclosure marquee"
      className="overflow-hidden bg-ink-950/90"
    >
      <div className="marquee-track flex items-center gap-6 py-2">
        {NOTICE_SEGMENTS.map((idx) => (
          <NoticeItem key={`notice-${idx}`} />
        ))}
        <div className="flex items-center gap-6" aria-hidden="true">
          {NOTICE_SEGMENTS.map((idx) => (
            <NoticeItem key={`notice-loop-${idx}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
