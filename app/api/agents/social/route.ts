import { NextRequest, NextResponse } from 'next/server';
import { socialAgent } from '@/lib/agents/social/social-agent';

export async function POST(req: NextRequest) {
    const { type, metadata } = await req.json();

    await socialAgent.addTask({
        platform: 'linkedin',
        type,
        metadata
    });

    const results = await socialAgent.processBatch();
    return NextResponse.json({ success: true, results });
}
