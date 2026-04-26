import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16: Turbopack is default; webpack config kept for canvas polyfill
  turbopack: {},
  serverExternalPackages: ["pdfjs-dist", "canvas"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "kfmjhoiropvyevykvqey.supabase.co",
      },
      {
        protocol: "https",
        hostname: "buesoinchausti-rein.com",
      },
    ],
  },
};

export default nextConfig;
