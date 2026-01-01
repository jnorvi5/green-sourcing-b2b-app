
import { NextRequest, NextResponse } from 'next/server';
import { triggerLogicApp } from '@/lib/azure-logic-app';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workflowName, payload } = body;

        // You might have multiple logic apps, mapped by name
        let logicAppUrl = process.env['AZURE_LOGIC_APP_URL']; // Default

        if (workflowName === 'document-review') {
            logicAppUrl = process.env['AZURE_LOGIC_APP_DOC_REVIEW_URL'] || logicAppUrl;
        }

        if (!logicAppUrl) {
             return NextResponse.json({ error: "Logic App URL not configured" }, { status: 500 });
        }

        const result = await triggerLogicApp(logicAppUrl, payload);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("Logic App Agent Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
