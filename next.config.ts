import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiOrigin = process.env.ADMIN_API_INTERNAL_URL || "http://127.0.0.1:4001";
    return [
      { source: "/api/admin-data/:path*", destination: `${apiOrigin}/:path*` },
      { source: "/api/user-data/:path*", destination: `${apiOrigin}/:path*` },
    ];
  },
  async headers() { return [
    { source: "/:path*", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ...(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
    ] },
    { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
  ]; },
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
