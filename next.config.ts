import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  allowedDevOrigins: ["*.run.app", "*.style.dev", "localhost:3000"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/realtime-news", destination: "/news-wire", permanent: true },
      { source: "/oraclex", destination: "/vector-rag", permanent: true },
      { source: "/neuberg", destination: "/macro-perps", permanent: true },
      { source: "/openstock", destination: "/global-markets", permanent: true },
      { source: "/fincept", destination: "/dcf-agents", permanent: true },
      { source: "/terminal", destination: "/pro-terminal", permanent: true },
      { source: "/openbb", destination: "/var-cli", permanent: true },
      { source: "/gold-news", destination: "/news", permanent: true },
      { source: "/wsj", destination: "/market-center", permanent: true },
      { source: "/chat", destination: "/community", permanent: true },
    ];
  },
};

export default nextConfig;
