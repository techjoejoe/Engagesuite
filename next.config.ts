import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build optimization
  reactStrictMode: true,
  swcMinify: true,
  
  // Prevent build hangs
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  
  // TypeScript configuration  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },

  // Webpack optimization for stability
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: isServer ? undefined : 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };

    config.stats = {
      ...config.stats,
      warningsFilter: [/Circular dependency/],
    };

    return config;
  },
  
  output: 'standalone',
  telemetry: false,

  // Security headers for production
  async headers() {
    // KEEP YOUR EXISTING HEADERS CODE BELOW THIS LINE
