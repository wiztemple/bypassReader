/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable any experimental features in Next.js 15
  },
  async rewrites() {
    return [
      {
        source: "/proxy",
        destination: "/api/proxy",
      },
      {
        source: "/bypass/:path*",
        destination: "/client-bypass?url=:path*",
      },
    ];
  },
};
