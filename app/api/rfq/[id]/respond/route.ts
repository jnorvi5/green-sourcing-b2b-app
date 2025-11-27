/**
 * RFQ Response API - Supplier responds to quote request
 * 
 * PUT /api/rfq/[id]/respond
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import mongoose, { Schema, Model } from 'mongoose';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// Re-define RFQ schema for this route (in production, move to shared models)
interface IRFQ {
    _id: string;
    buyerId: string;
    buyerName: string;
    buyerEmail: string;
    supplierId: string;
    supplierName: string;
    productTitle: string;
    quantity: number;
    unit: string;
    status: string;
    response?: {
        message: string;
        quotedPrice?: number;
        leadTime?: number;
        respondedAt: Date;
    };
}

const RFQSchema = new Schema({
    buyerId: String,
    buyerName: String,
    buyerEmail: String,
    buyerCompany: String,
    supplierId: String,
    supplierName: String,
    supplierEmail: String,
    productId: String,
    productTitle: String,
    quantity: Number,
    unit: String,
    message: String,
    deliveryLocation: String,
    deliveryDate: Date,
    status: { type: String, default: 'pending' },
    response: {
        message: String,
        quotedPrice: Number,
        leadTime: Number,
        respondedAt: Date,
    },
}, { timestamps: true });

const RFQ: Model<IRFQ> = mongoose.models.RFQ || mongoose.model<IRFQ>('RFQ', RFQSchema);

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * PUT /api/rfq/[id]/respond
 * 
 * Body:
 * - message: Response message from supplier
 * - quotedPrice: Optional quoted price
 * - leadTime: Optional lead time in days
 * - accept: boolean - whether to accept or decline
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await dbConnect();

        const { id } = await params;
        const body = await request.json();

        // TODO: Verify supplier authentication

        const rfq = await RFQ.findById(id);

        if (!rfq) {
            return NextResponse.json(
                { success: false, error: 'RFQ not found' },
                { status: 404 }
            );
        }

        if (rfq.status !== 'pending') {
            return NextResponse.json(
                { success: false, error: 'RFQ has already been responded to' },
                { status: 400 }
            );
        }

        // Update RFQ with response
        const newStatus = body.accept === false ? 'declined' : 'responded';

        const updatedRfq = await RFQ.findByIdAndUpdate(
            id,
            {
                status: newStatus,
                response: {
                    message: body.message || (body.accept === false ? 'Quote declined' : ''),
                    quotedPrice: body.quotedPrice,
                    leadTime: body.leadTime,
                    respondedAt: new Date(),
                },
            },
            { new: true }
        );

        // Send email notification to buyer
        if (rfq.buyerEmail && process.env.RESEND_API_KEY) {
            try {
                const subject = body.accept === false
                    ? `Quote Request Declined: ${rfq.productTitle}`
                    : `Quote Response: ${rfq.productTitle}`;

                const html = body.accept === false
                    ? `
            <h2>Quote Request Declined</h2>
            <p>${rfq.supplierName} has declined your quote request for ${rfq.productTitle}.</p>
            ${body.message ? `<p><strong>Message:</strong> ${body.message}</p>` : ''}
            <p><a href="https://greenchainz.com/search">Browse other suppliers</a></p>
          `
                    : `
            <h2>Quote Response Received</h2>
            <p>${rfq.supplierName} has responded to your quote request.</p>
            <p><strong>Product:</strong> ${rfq.productTitle}</p>
            <p><strong>Quantity:</strong> ${rfq.quantity} ${rfq.unit}</p>
            ${body.quotedPrice ? `<p><strong>Quoted Price:</strong> $${body.quotedPrice.toLocaleString()}</p>` : ''}
            ${body.leadTime ? `<p><strong>Lead Time:</strong> ${body.leadTime} days</p>` : ''}
            ${body.message ? `<p><strong>Message:</strong></p><p>${body.message}</p>` : ''}
            <hr>
            <p><a href="https://greenchainz.com/rfq-history">View Full Quote Details</a></p>
          `;

                await resend.emails.send({
                    from: 'GreenChainz <noreply@greenchainz.com>',
                    to: rfq.buyerEmail,
                    subject,
                    html,
                });
            } catch (emailError) {
                console.error('[RFQ Respond API] Email failed:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            data: updatedRfq,
        });

    } catch (error) {
        console.error('[RFQ Respond API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to respond to RFQ' },
            { status: 500 }
        );
    }
}
