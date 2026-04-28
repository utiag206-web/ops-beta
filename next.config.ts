import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    // Optimizations for production
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Standalone output is best for production (Docker, VPS, etc.)
  output: "standalone",
};

export default nextConfig;
