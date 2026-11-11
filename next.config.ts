import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  allowedDevOrigins: ["*.run.app", "*.style.dev", "localhost:3000"],
};

export default nextConfig;
