const path = require('path');
const { withSentryConfig } = require("@sentry/nextjs");

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.vercel.app https://*.supabase.co https://*.sentry.io https://*.posthog.com https://us.i.posthog.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.posthog.com https://us.i.posthog.com;
  upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    instrumentationHook: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', '@heroicons/react', 'react-icons', 'recharts'],
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
       { protocol: 'https', hostname: 'images.unsplash.com' },
       { protocol: 'https', hostname: 'tailwindui.com' },
       { protocol: 'https', hostname: 'plus.unsplash.com' },
       { protocol: 'https', hostname: 'res.cloudinary.com' },
       { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
       { protocol: 'https', hostname: 'ui-avatars.com' },
    ]
  },
  compress: true,
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    
    // Ignore Supabase module resolution errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Fix Supabase ESM wrapper issue - alias to main CJS build
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js/dist/main/index.js'),
    // };
    
    // Suppress the Supabase wrapper.mjs error
    const originalWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings = [
      ...originalWarnings,
      // { module: /@supabase\/supabase-js/ },
      /Failed to parse source map/,
    ];
    
    return config;
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          }
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
}

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT || "greenchainz-production",
});
