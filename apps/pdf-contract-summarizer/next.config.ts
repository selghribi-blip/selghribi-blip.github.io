import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger body size for PDF uploads (handled at route level too)
  experimental: {
    serverActions: {
      bodySizeLimit: "36mb",
    },
  },
};

export default nextConfig;
