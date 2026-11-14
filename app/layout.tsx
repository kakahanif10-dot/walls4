import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bloomberg-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-wsj-serif",
  display: "swap",
});
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import LivePricesProvider from "@/components/live-prices";
import { LifetimeRouteGuard } from "@/components/locked-action";
import { AuthProvider } from "@/lib/auth-context";
import { WhopProvider } from "@/lib/whop-context";
import { liveSeed } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";

// Re-fetch real quotes so rendered pages stay current rather than frozen at build time.
export const revalidate = 120;

export const metadata: Metadata = {
  metadataBase: new URL("https://nextwallstreet.com"),
  title: {
    default: "NextWallStreet — market trend analysis, research and education",
    template: "%s — NextWallStreet",
  },
  description:
    "Trend scores, research and education for equities, digital assets, and speculative risk models. A transparent, rules-based read on what is working — not a tip sheet.",
  keywords: [
    "market trend analysis",
    "stock research",
    "digital assets analysis",
    "speculative risk models",
    "investment education",
    "quantitative research",
  ],
  openGraph: {
    title: "NextWallStreet",
    description:
      "Rules-based trend analysis across equities, digital assets, and speculative risk models, with the education to use it.",
    type: "website",
    url: "https://nextwallstreet.com",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await ensureMarketData();
  const source = snapshot.sources.join(" + ");
  const delayed = false;

  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${newsreader.variable}`}>
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
              <main>
                <LifetimeRouteGuard>{children}</LifetimeRouteGuard>
              </main>
              <SiteFooter />
            </LivePricesProvider>
          </WhopProvider>
        </AuthProvider>
        <Script
          id="knocket-live-chat"
          src="https://trtc.io/knocket-sdk/sdk.js?identifier=fd7d9a030d2f0cd4d2&v=1794656212131"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
