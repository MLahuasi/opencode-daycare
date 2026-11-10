import type { NextConfig } from "next";

/**
 * Reads the build-time Server Action limit without importing the server-only
 * runtime environment module into Next.js configuration.
 *
 * This is the only intentional process.env read outside environment.ts: Next
 * loads next.config.ts before the application runtime is available.
 */
function readServerActionBodySizeBytes(): number {
  const rawValue = process.env.HTTP_SERVER_ACTION_BODY_SIZE_BYTES?.trim();
  const value = Number(rawValue);

  if (!rawValue || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      "[next.config] HTTP_SERVER_ACTION_BODY_SIZE_BYTES must be a positive integer",
    );
  }

  return value;
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allows the request overhead while keeping Server Action bodies below
      // the HTTP boundary agreed by SPEC 36.
      bodySizeLimit: readServerActionBodySizeBytes(),
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
