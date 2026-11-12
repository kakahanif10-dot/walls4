import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  allowedDevOrigins: ["*.run.app", "*.style.dev", "localhost:3000"],
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
      { source: "/chat", destination: "/nws-ai", permanent: true },
    ];
  },
};

export default nextConfig;
