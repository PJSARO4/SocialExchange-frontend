import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Set to false once Prisma module resolution is fixed
  typescript: {
    ignoreBuildErrors: true,
  },
  // TODO: Set to false once ESLint config is updated for flat config
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
