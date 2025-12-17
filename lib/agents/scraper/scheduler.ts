import { createClient } from '@/lib/supabase/server';
import { scraperAgent } from './scraper-agent';

export async function runDailyScrape() {
    const supabase = await createClient();

    // Get all active suppliers with websites
    const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, website')
        .eq('status', 'active')
        .not('website', 'is', null);

    if (!suppliers) return;

    // Queue scrape tasks in parallel
    await Promise.all(
        suppliers
            .filter(supplier => supplier.website)
            .map(supplier =>
                scraperAgent.addTask({
                    url: supplier.website,
                    supplierId: supplier.id,
                    dataType: 'epd'
                })
            )
    );

    // Process in batches to avoid overwhelming
    while (scraperAgent.queue.length > 0) {
        await scraperAgent.processBatch(10);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5s delay between batches
    }
}
