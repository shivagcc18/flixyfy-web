import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    workerThreads: true,
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_FLIXYFY_API_URL?.trim().replace(/\/+$/, "")
      || (process.env.NODE_ENV === "production" ? "https://flixyfy-api-free.vercel.app" : "http://127.0.0.1:8000");
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  },
};

export default nextConfig;
