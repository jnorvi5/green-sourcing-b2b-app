import { NextRequest, NextResponse } from 'next/server';
import { runDailyScrape } from '@/lib/agents/scraper/scheduler';

export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await runDailyScrape();
    return NextResponse.json({ success: true });
}
