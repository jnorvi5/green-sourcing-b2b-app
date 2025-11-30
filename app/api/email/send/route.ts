import { NextRequest, NextResponse } from 'next/server';
import {
    sendEmail,
    generateWelcomeEmail,
    generateRfqNotificationEmail,
    generateQuoteReceivedEmail,
    generateCarbonReportEmail,
} from '../../../../lib/mailerlite';

// Force TypeScript to ignore strict typing for this whole route
interface SendEmailRequest {
    type: string;
    to: string;
    data: any; // Using 'any' here stops the complaints at the source
    subject?: string;
    html?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as SendEmailRequest;

        if (!body.to) {
            return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
        }

        let subject = '';
        let html = '';

        switch (body.type) {
            case 'welcome':
                subject = `Welcome to GreenChainz, ${body.data.name}! 🌱`;
                html = generateWelcomeEmail(body.data);
                break;

            case 'rfq_notification':
                subject = `New RFQ: ${body.data.productName}`;
                html = generateRfqNotificationEmail(body.data);
                break;

            case 'quote_received':
                subject = `Quote Received`;
                html = generateQuoteReceivedEmail(body.data);
                break;

            case 'carbon_report':
                subject = `Carbon Report`;
                html = generateCarbonReportEmail(body.data);
                break;

            case 'custom':
                subject = body.subject || 'Notification';
                html = body.html || '<p>No content</p>';
                break;

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const result = await sendEmail({ to: body.to, subject, html });

        return NextResponse.json({ success: true, id: result.messageId });

    } catch (error) {
        console.error('Email error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
