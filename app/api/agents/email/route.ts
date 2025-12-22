import { NextRequest, NextResponse } from 'next/server';
import { emailAgent } from '@/lib/agents/email/email-agent';
import { createClient } from '@/lib/supabase/server';

interface Supplier {
    id: string;
    name: string;
    contact_email: string;
    contact_name: string;
}

export async function POST(req: NextRequest) {
    const { campaignType, supplierIds } = await req.json();

    const supabase = await createClient();
    const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name, contact_email, contact_name')
        .in('id', supplierIds);

    // Queue emails in parallel
    await Promise.all(
        (suppliers || []).map((supplier: Supplier) =>
            emailAgent.addTask({
                type: campaignType,
                recipientEmail: supplier.contact_email,
                recipientName: supplier.contact_name,
                companyName: supplier.name,
                supplierId: supplier.id
            })
        )
    );

    // Process batch
    const results = await emailAgent.processBatch(10);

    return NextResponse.json({ success: true, sent: results.length, results });
}

export async function GET() {
    await emailAgent.checkResponses();
    return NextResponse.json({ success: true });
}
