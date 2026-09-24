import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
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
      {
        source: "/login",
        destination: "/auth/login",
        permanent: true,
      },
      {
        source: "/activate-account",
        destination: "/auth/activate-account",
        permanent: true,
      },
      {
        source: "/kids/:id/edit",
        destination: "/kids/edit/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
