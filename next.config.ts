import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

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
            // Note: 'unsafe-inline' and 'unsafe-eval' needed for Next.js dev mode
            // In production, consider using nonces for inline scripts
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
              : '', // Don't apply CSP in development (causes issues with hot reload)
          },
        ],
      },
    ];
  },
};

export default nextConfig;
