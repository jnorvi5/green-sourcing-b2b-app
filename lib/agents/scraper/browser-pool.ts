// Puppeteer pool for concurrent scraping
import puppeteer, { Browser } from 'puppeteer';

class BrowserPool {
    private browsers: Browser[] = [];
    private maxBrowsers = 3;

    async getBrowser(): Promise<Browser> {
        if (this.browsers.length < this.maxBrowsers) {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            });
            this.browsers.push(browser);
            return browser;
        }
        return this.browsers[0]; // Reuse existing, round-robin would be better but this is simple reuse
    }

    async closeBrowsers() {
        await Promise.all(this.browsers.map(b => b.close()));
        this.browsers = [];
    }
}

export const browserPool = new BrowserPool();
