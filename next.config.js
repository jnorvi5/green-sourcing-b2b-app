/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Externalize pdfkit to prevent webpack bundling issues with font files
    serverComponentsExternalPackages: ['pdfkit'],
  },
};

module.exports = nextConfig;
