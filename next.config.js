const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Sentry configuration options
  silent: !process.env.CI,
  org: "your-org",
  project: "greenchainz-production",
  
  // Upload source maps during build
  widenClientFileUpload: true,
  
  // Automatically annotate errors with build information
  autoInstrumentServerFunctions: true,
  
  // Hide source maps from being publicly accessible
  hideSourceMaps: true,
  
  // Disable automatic telemetry
  disableLogger: true,
});
