/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build optimization
  reactStrictMode: true,
  swcMinify: true,
  
  // Prevent build hangs
  experimental: {
    // Disable problematic features during build
    workerThreads: false,
    cpus: 1, // Single thread for stability
  },
  
  // TypeScript configuration
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Only run during dev, not build
    ignoreDuringBuilds: false,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
    // Prevent image optimization timeouts
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
  
  // Webpack configuration for stability
  webpack: (config, { isServer }) => {
    // Prevent memory leaks during build
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: isServer ? undefined : 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
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

    // Prevent circular dependency warnings from halting build
    config.stats = {
      ...config.stats,
      warningsFilter: [
        /Circular dependency/,
      ],
    };

    return config;
  },
  
  // Output configuration
 
  
  // Disable telemetry
  telemetry: false,
};

module.exports = nextConfig;
