import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build optimization
  reactStrictMode: true,

  // Prevent build hangs
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // TypeScript configuration  
  typescript: {
    ignoreBuildErrors: false,
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

  // Turbopack configuration (Next.js 16+)
  turbopack: {},

  output: 'standalone',

  // Security headers for production
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            // Prevent clickjacking
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Enable XSS protection
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Control referrer information
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Permissions Policy (formerly Feature Policy)
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Strict Transport Security (HTTPS only)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            // Content Security Policy
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.firebase.com https://*.googleapis.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "img-src 'self' data: blob: https: http:",
                "font-src 'self' https://fonts.gstatic.com",
                "connect-src 'self' https://*.firebaseio.com https://*.firebase.com https://*.googleapis.com wss://*.firebaseio.com",
                "frame-src 'self' https://*.firebaseapp.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
              ].join('; ')
              : '',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
