import { browserPool } from './browser-pool';
import { createClient } from '@/lib/supabase/server';
import { logAgentActivity } from '../monitoring';

interface ScraperTask {
    url: string;
    supplierId: string;
    dataType: 'epd' | 'products' | 'contact';
}

export class ScraperAgent {
    public queue: ScraperTask[] = []; // Changed to public to access length in scheduler

    async addTask(task: ScraperTask) {
        this.queue.push(task);
    }

    async processBatch(batchSize: number = 5) {
        const batch = this.queue.splice(0, batchSize);
        const results = await Promise.all(batch.map(task => this.scrapeUrl(task)));
        return results;
    }

    private async scrapeUrl(task: ScraperTask) {
        let browser;
        let page;
        try {
            browser = await browserPool.getBrowser();
            page = await browser.newPage();

            await page.goto(task.url, { waitUntil: 'networkidle2', timeout: 30000 });

            const data = await page.evaluate((dataType) => {
                // Extract data based on type
                if (dataType === 'epd') {
                    return {
                        epdLinks: Array.from(document.querySelectorAll('a[href*="epd"], a[href*="declaration"]'))
                            .map(a => (a as HTMLAnchorElement).href)
                    };
                }
                // Add other data type logic
                return {};
            }, task.dataType);

            // Store in Supabase
            const supabase = await createClient();
            await supabase.from('scraped_data').insert({
                supplier_id: task.supplierId,
                url: task.url,
                data_type: task.dataType,
                data: data,
                scraped_at: new Date().toISOString()
            });

            await logAgentActivity({
                agentType: 'scraper',
                action: 'scrape_url',
                status: 'success',
                metadata: { url: task.url, supplierId: task.supplierId }
            });

            return { success: true, supplierId: task.supplierId, data };
        } catch (error: any) {
            console.error(`Scrape failed for ${task.url}:`, error);

            await logAgentActivity({
                agentType: 'scraper',
                action: 'scrape_url',
                status: 'error',
                metadata: { url: task.url, supplierId: task.supplierId, error: error.message }
            });

            return { success: false, supplierId: task.supplierId, error };
        } finally {
            if (page) await page.close();
        }
    }
}

export const scraperAgent = new ScraperAgent();
