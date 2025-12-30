import { withSentryConfig } from "@sentry/nextjs";

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

const nextConfig = {
    // 0. Build optimizations
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    // 1. Standalone output reduces the size of the deployment significantly
    output: "standalone",

    // 2. Critical: Exclude heavy scraping libraries from the main server bundle
    // These should run in your Azure Functions, not Vercel
    experimental: {
        serverComponentsExternalPackages: [
            "puppeteer",
            "playwright",
            "puppeteer-core",
            "@sparticuz/chromium",
            "chrome-aws-lambda",
            "@supabase/supabase-js",
            "@supabase/ssr"
        ],
        optimizePackageImports: ['lucide-react', 'framer-motion', '@heroicons/react', 'react-icons', 'recharts'],
        instrumentationHook: true,
    },

    // 3. Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            // Safe list from previous config
           { protocol: 'https', hostname: 'images.unsplash.com' },
           { protocol: 'https', hostname: 'tailwindui.com' },
           { protocol: 'https', hostname: 'plus.unsplash.com' },
           { protocol: 'https', hostname: 'res.cloudinary.com' },
           { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
           { protocol: 'https', hostname: 'ui-avatars.com' },
        ],
    },

    // 4. Build-time environment handling
    env: {
        NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000",
    },

    // 5. Security Headers
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

    // 6. Rewrites for PostHog
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

    // 7. Webpack configuration to fix Edge Runtime __import_unsupported redefinition bug
    // This workaround prevents the TypeError when Next.js tries to redefine the non-configurable property
    webpack: (config, { isServer, webpack }) => {
        if (isServer) {
            class SafeImportUnsupportedPlugin {
                apply(compiler) {
                    compiler.hooks.thisCompilation.tap(
                        'SafeImportUnsupportedPlugin',
                        (compilation) => {
                            compilation.hooks.processAssets.tap(
                                {
                                    name: 'SafeImportUnsupportedPlugin',
                                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
                                },
                                () => {
                                    for (const [filename, asset] of Object.entries(compilation.assets)) {
                                        // Only process middleware and edge-runtime bundle files
                                        if (filename.includes('middleware') || filename.includes('edge-runtime')) {
                                            const source = typeof asset.source === 'function' 
                                                ? asset.source() 
                                                : asset.source;
                                            
                                            if (typeof source === 'string') {
                                                // Match Object.defineProperty calls for __import_unsupported with configurable:false
                                                // This pattern matches the minified code from Next.js Edge Runtime setup
                                                const unsafePattern = /Object\.defineProperty\s*\(\s*globalThis\s*,\s*["']__import_unsupported["']\s*,\s*\{([^}]*configurable\s*:\s*!1[^}]*)\}\s*\)/g;
                                                
                                                if (unsafePattern.test(source)) {
                                                    const safeSource = source.replace(
                                                        unsafePattern,
                                                        (match, descriptorContent) => {
                                                            // Wrap in a safe check that prevents redefinition
                                                            return `(function() {
                                                                try {
                                                                    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "__import_unsupported");
                                                                    if (!descriptor) {
                                                                        Object.defineProperty(globalThis, "__import_unsupported", {${descriptorContent}});
                                                                    }
                                                                } catch (e) {
                                                                    // Property already exists or cannot be defined, ignore
                                                                }
                                                            })()`;
                                                        }
                                                    );
                                                    
                                                    compilation.updateAsset(
                                                        filename,
                                                        {
                                                            source: () => safeSource,
                                                            size: () => Buffer.byteLength(safeSource, 'utf8'),
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            );
                        }
                    );
                }
            }

            config.plugins.push(new SafeImportUnsupportedPlugin());
        }

        return config;
    },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT || "greenchainz-production",

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Webpack-specific options (replacing deprecated top-level options)
  webpack: {
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,
  },
});
