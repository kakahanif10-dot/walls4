import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import LivePricesProvider from "@/components/live-prices";
import { AuthProvider } from "@/lib/auth-context";
import { WhopProvider } from "@/lib/whop-context";
import { liveSeed } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";

// Re-fetch real quotes so rendered pages stay current rather than frozen at build time.
export const revalidate = 120;

export const metadata: Metadata = {
  metadataBase: new URL("https://nextwallstreet.com"),
  title: {
    default: "NextWall Street — market trend analysis, research and education",
    template: "%s — NextWall Street",
  },
  description:
    "Trend scores, research and education for stocks, crypto and meme coins. A transparent, rules-based read on what is working — not a tip sheet.",
  keywords: [
    "market trend analysis",
    "stock research",
    "crypto analysis",
    "meme coin risk",
    "investment education",
    "subscription research",
  ],
  openGraph: {
    title: "NextWall Street",
    description:
      "Rules-based trend analysis across equities, crypto and meme coins, with the education to use it.",
    type: "website",
    url: "https://nextwallstreet.com",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await ensureMarketData();
  const source = snapshot.sources.join(" + ");
  const delayed = Object.values(snapshot.quotes).some((quote) => quote.delayed);

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var _fetch = window.fetch;
                  try {
                    Object.defineProperty(window, 'fetch', {
                      get: function() { return _fetch; },
                      set: function(v) { _fetch = v; },
                      configurable: true,
                      enumerable: true
                    });
                  } catch (e1) {
                    try {
                      var proto = Object.getPrototypeOf(window);
                      if (proto) {
                        Object.defineProperty(proto, 'fetch', {
                          get: function() { return _fetch; },
                          set: function(v) { _fetch = v; },
                          configurable: true,
                          enumerable: true
                        });
                      }
                    } catch (e2) {}
                  }
                } catch (e) {}

                try {
                  window.addEventListener('error', function(event) {
                    if (event && event.filename && (event.filename.indexOf('chrome-extension://') !== -1 || (event.message && event.message.indexOf('fetch') !== -1 && event.message.indexOf('getter') !== -1))) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }, true);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <WhopProvider>
            <LivePricesProvider seed={liveSeed()} source={source} delayed={delayed}>
              <SiteHeader />
              <main>{children}</main>
              <SiteFooter />
            </LivePricesProvider>
          </WhopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
