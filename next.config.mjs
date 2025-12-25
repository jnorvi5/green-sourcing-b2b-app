
const nextConfig = {
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
            "chrome-aws-lambda"
        ],
    },

    // 3. Image optimization (Standard best practice)
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },

    // 4. Build-time environment handling
    // This ensures your env.ts validation doesn't fail the build if keys are missing
    env: {
        NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000",
    },
};

export default nextConfig;
