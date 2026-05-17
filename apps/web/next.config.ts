import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// script-src needs 'unsafe-eval' in dev for React/Turbopack source-map reconstruction.
// connect-src must include the API origin and Turbopack's HMR websocket.
const csp = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  isDev
    ? "connect-src 'self' http://localhost:3001 ws://localhost:3000 ws://localhost:3001"
    : "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;
