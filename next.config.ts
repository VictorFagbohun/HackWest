import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
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
