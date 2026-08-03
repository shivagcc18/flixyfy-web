import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: ["ts", "tsx"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
      { protocol: "https", hostname: "media.themoviedb.org", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/**" },
    ],
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [{ key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https: http://127.0.0.1:8000; connect-src 'self' https: http://127.0.0.1:8000; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; font-src 'self' data:; frame-ancestors 'none'" }],
    }];
  },
  experimental: {
    workerThreads: true,
  },
};

export default nextConfig;
