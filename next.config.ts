import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Discord gateway client runs in the Node server (instrumentation.ts); keep it out of the bundle.
  serverExternalPackages: ["discord.js"],
  // Room for a 2 MB product image upload plus the rest of the form.
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
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
