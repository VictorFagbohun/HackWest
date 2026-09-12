import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Phaser expects a browser environment; keep it out of the server bundle.
    config.resolve.alias = {
      ...config.resolve.alias,
      phaser: "phaser/dist/phaser.js",
    };
    return config;
  },
};

export default nextConfig;
