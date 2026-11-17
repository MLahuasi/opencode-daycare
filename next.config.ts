import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
    serverActions: {
      // Supports four 10 MB images plus multipart/form-data overhead.
      bodySizeLimit: "45mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/home",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
