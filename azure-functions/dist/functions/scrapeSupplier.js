"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeSupplier = scrapeSupplier;
const functions_1 = require("@azure/functions");
const playwright_chromium_1 = require("playwright-chromium");
/**
 * Azure Function: scrapeSupplier
 * Purpose: Offloads heavy browser automation from Vercel to Azure.
 * Triggers: HTTP POST request from Next.js Dashboard.
 */
async function scrapeSupplier(request, context) {
    context.log(`Http function processed request for url "${request.url}"`);
    try {
        const body = await request.json();
        const { targetUrl, supplierId } = body;
        if (!targetUrl) {
            return { status: 400, body: "Please pass a 'targetUrl' in the request body" };
        }
        context.log(`Starting scrape for: ${targetUrl}`);
        // Launch browser (Chromium) - This is what crashes Vercel (150MB+), but runs fine on Azure
        const browser = await playwright_chromium_1.chromium.launch({
            headless: true
        });
        const page = await browser.newPage();
        await page.goto(targetUrl, { waitUntil: 'networkidle' });
        // Basic Metadata Extraction
        const pageTitle = await page.title();
        const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
        // Extract Product Links (Heuristic: checks for common product URL patterns)
        const productLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return links
                .map(link => link.href)
                .filter(href => href.includes('/product/') || href.includes('/item/') || href.includes('/catalog/'))
                .slice(0, 10); // Limit to top 10 for MVP
        });
        // Screenshot for verification (Optional - good for debugging)
        // const screenshot = await page.screenshot({ encoding: "base64" });
        await browser.close();
        context.log(`Scrape successful. Found ${productLinks.length} products.`);
        // Return structured data to Vercel
        return {
            status: 200,
            jsonBody: {
                success: true,
                data: {
                    supplierId,
                    url: targetUrl,
                    title: pageTitle,
                    description: metaDescription || "No description found",
                    detectedProducts: productLinks,
                    scrapedAt: new Date().toISOString()
                }
            }
        };
    }
    catch (error) {
        context.error(`Scrape failed: ${error.message}`);
        return {
            status: 500,
            jsonBody: {
                success: false,
                error: error.message
            }
        };
    }
}
// Register the function
functions_1.app.http('scrapeSupplier', {
    methods: ['POST'],
    authLevel: 'function', // Requires a function key for security
    handler: scrapeSupplier
});
//# sourceMappingURL=scrapeSupplier.js.map