import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Off for now: almost every page depends on the logged-in user and renders per request.
  // Worth turning on once there are public pages.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
