import { NextRequest, NextResponse } from 'next/server';
import { scraperAgent } from '@/lib/agents/scraper/scraper-agent';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    const { supplierId, urls, dataType } = await req.json();

    // Add tasks to queue
    for (const url of urls) {
        await scraperAgent.addTask({ url, supplierId, dataType });
    }

    // Process batch
    const results = await scraperAgent.processBatch(5);

    return NextResponse.json({
        success: true,
        processed: results.length,
        results
    });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('scraped_data')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('scraped_at', { ascending: false });

    return NextResponse.json({ data, error });
}
