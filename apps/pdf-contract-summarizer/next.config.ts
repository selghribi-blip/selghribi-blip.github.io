import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The stripe webhook route needs raw body for signature verification.
  // We disable the default body parser for that route via Next.js config.
  experimental: {},
};

export default nextConfig;
