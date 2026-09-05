/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for pdf-parse to work correctly in Next.js (avoids canvas/encoding resolution errors)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
