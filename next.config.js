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
  silent: !process.env.CI,
  org: "your-org",
  project: "greenchainz-production",
  widenClientFileUpload: true,
  autoInstrumentServerFunctions: true,
  hideSourceMaps: true,
  disableLogger: true,
});
