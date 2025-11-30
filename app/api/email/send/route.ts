/**
 * Email Send API
 * * POST /api/email/send
 * Sends transactional emails via MailerLite
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    sendEmail,
    generateWelcomeEmail,
    generateRfqNotificationEmail,
    generateQuoteReceivedEmail,
    generateCarbonReportEmail,
} from '../../../../lib/mailerlite';

interface SendEmailRequest {
    type: 'welcome' | 'rfq_notification' | 'quote_received' | 'carbon_report' | 'custom';
    to: string;
    data: Record<string, any>;
    // For custom emails
    subject?: string;
    html?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as SendEmailRequest;

        if (!body.to) {
            return NextResponse.json(
                { error: 'Missing recipient email address' },
                { status: 400 }
            );
        }

        let subject: string;
        let html: string;

        switch (body.type) {
            case 'welcome':
                subject = `Welcome to GreenChainz, ${body.data.name}! 🌱`;
                // FIX: Force TypeScript to accept the data object
                html = generateWelcomeEmail(body.data as any);
                break;

            case 'rfq_notification':
                subject = `New RFQ Request: ${body.data.productName} - ${body.data.rfqNumber}`;
                // FIX: Force TypeScript to accept the data object
                html = generateRfqNotificationEmail(body.data as any);
                break;

            case 'quote_received':
                subject = `Quote Received for ${body.data.productName} - ${body.data.rfqNumber}`;
                // FIX: Force TypeScript to accept the data object
                html = generateQuoteReceivedEmail(body.data as any);
                break;

            case 'carbon_report':
                subject = `Your Carbon Report - ${body.data.reportPeriod} 🌍`;
                // FIX: Force TypeScript to accept the data object
                html = generateCarbonReportEmail(body.data as any);
                break;

            case 'custom':
                if (!body.subject || !body.html) {
                    return NextResponse.json(
                        { error: 'Custom emails require subject and html' },
                        { status: 400 }
                    );
                }
                subject = body.subject;
                html = body.html;
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid email type' },
                    { status: 400 }
                );
        }

        const result = await sendEmail({
            to: body.to,
            subject,
            html,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to send email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
        });

    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
