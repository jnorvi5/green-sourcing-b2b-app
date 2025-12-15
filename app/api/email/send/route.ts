import { NextRequest, NextResponse } from 'next/server';
import {
    sendEmail,
    generateWelcomeEmail,
    generateRfqNotificationEmail,
    generateQuoteReceivedEmail,
    generateCarbonReportEmail,
} from '../../../../lib/mailerlite';

// Email data types for different email types - match the function signatures in mailerlite.ts
interface WelcomeEmailData {
    name: string;
    email: string;
    role: 'buyer' | 'supplier';
    company?: string;
}

interface RfqNotificationData {
    supplierName: string;
    rfqNumber: string;
    productName: string;
    quantity: number;
    unit: string;
    buyerCompany: string;
    project: string;
    deliveryLocation: string;
    deliveryDate: string;
    expiresIn: string;
    viewUrl: string;
}

interface QuoteReceivedData {
    buyerName: string;
    rfqNumber: string;
    productName: string;
    supplierName: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    leadTime: number;
    validUntil: string;
    viewUrl: string;
}

interface CarbonReportData {
    userName: string;
    reportPeriod: string;
    totalCo2e: number;
    comparison: number;
    projectCount: number;
    topCategory: string;
    downloadUrl: string;
}

type EmailData = WelcomeEmailData | RfqNotificationData | QuoteReceivedData | CarbonReportData | Record<string, unknown>;

interface SendEmailRequest {
    type: string;
    to: string;
    data: EmailData;
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
                subject = `Welcome to GreenChainz, ${(body.data as WelcomeEmailData).name}! 🌱`;
                html = generateWelcomeEmail(body.data as WelcomeEmailData);
                break;

            case 'rfq_notification':
                subject = `New RFQ: ${(body.data as RfqNotificationData).productName}`;
                html = generateRfqNotificationEmail(body.data as RfqNotificationData);
                break;

            case 'quote_received':
                subject = `Quote Received`;
                html = generateQuoteReceivedEmail(body.data as QuoteReceivedData);
                break;

            case 'carbon_report':
                subject = `Carbon Report`;
                html = generateCarbonReportEmail(body.data as CarbonReportData);
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
