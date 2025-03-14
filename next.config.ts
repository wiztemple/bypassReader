// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

// ==== next.config.js ====
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable any experimental features in Next.js 15
  },
  async rewrites() {
    return [
      {
        source: '/proxy',
        destination: '/api/proxy',
      },
      {
        source: '/bypass/:path*',
        destination: '/client-bypass?url=:path*',
      }
    ];
  },
};
