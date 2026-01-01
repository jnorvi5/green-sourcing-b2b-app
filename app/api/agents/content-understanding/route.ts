
import { NextRequest, NextResponse } from 'next/server';
import { extractEPDLayout } from '@/lib/azure-content-understanding';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { fileUrl } = await request.json();

        if (!fileUrl) {
            return NextResponse.json({ error: "Missing 'fileUrl' in request body" }, { status: 400 });
        }

        const result = await extractEPDLayout(fileUrl);

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("Content Understanding Agent Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
