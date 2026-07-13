import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ~70 type errors remain (Prisma schema mismatches in API routes).
  // Fix on Day 4 pre-deploy. UI pages are clean.
  typescript: {
    ignoreBuildErrors: true,
  },
  // TODO: Set to false once ESLint config is updated for flat config
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Prevent the browser from ever serving a stale HTML/build. Hashed build assets
  // (_next/static, _next/image) keep their immutable long-cache; everything else
  // (HTML documents, API) must revalidate — kills the "stale cached build" problem.
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
