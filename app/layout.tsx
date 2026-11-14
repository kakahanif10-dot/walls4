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
        <Script id="tawk-to-live-chat" strategy="afterInteractive">
          {`var Tawk_API = window.Tawk_API = window.Tawk_API || {};
var Tawk_LoadStart = new Date();
Tawk_API.customStyle = {
  visibility: {
    desktop: { position: 'br', xOffset: 18, yOffset: 18 },
    mobile: { position: 'br', xOffset: 12, yOffset: 18 }
  }
};
(function(){
  var s1 = document.createElement('script');
  var s0 = document.getElementsByTagName('script')[0];
  s1.async = true;
  s1.src = 'https://embed.tawk.to/6af842eaff603a3c45c3a661/1k7csapnf';
  s1.charset = 'UTF-8';
  s1.setAttribute('crossorigin', '*');
  s0.parentNode.insertBefore(s1, s0);
})();`}
        </Script>
      </body>
    </html>
  );
}
