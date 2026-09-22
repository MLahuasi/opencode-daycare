import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
