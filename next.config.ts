import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
