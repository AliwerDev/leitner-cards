import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the production image small: only the traced
  // dependencies are copied instead of the whole node_modules tree.
  output: "standalone",
  reactStrictMode: true,
  // The API address is a server secret (see lib/api/config.ts). No rewrites
  // here on purpose: every call goes through a route handler we control.
  eslint: {
    dirs: ["src"],
  },
};

export default nextConfig;
