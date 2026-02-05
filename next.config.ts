import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Set to false once Prisma module resolution is fixed
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
