import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Discord gateway client runs in the Node server (instrumentation.ts); keep it out of the bundle.
  serverExternalPackages: ["discord.js"],
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
