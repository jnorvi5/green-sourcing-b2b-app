const { withSentryConfig } = require("@sentry/nextjs");

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
  silent: true,
  org: "your-org",
  project: "greenchainz-production",
});
