import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },

  allowedDevOrigins: ['192.168.31.237', 'localhost', '127.0.0.1'],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
      allowedOrigins: ['localhost:3000', '192.168.31.237:3000', 'mishra-classes.vercel.app'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
