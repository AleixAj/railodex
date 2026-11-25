import type { NextConfig } from "next";

// Basic hardening that costs nothing: other sites can't embed the app (clickjacking; our
// own pages still can, which is handy for testing at phone width), no MIME sniffing,
// no full URLs leaked to other sites, and the camera only for our own pages.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Off for now: almost every page depends on the logged-in user and renders per request.
  // Worth turning on once there are public pages.
  cacheComponents: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
