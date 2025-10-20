import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Handle native modules for ibm_db
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('ibm_db');
    }
    return config;
  },
  // Disable Turbopack to avoid native module issues
  experimental: {
    turbo: undefined,
  },
};

export default nextConfig;
