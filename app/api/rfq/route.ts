/**
 * RFQ (Request for Quote) API
 * 
 * POST /api/rfq - Create new quote request
 * GET /api/rfq - List user's quote requests
 * 
 * Sends email notifications via Resend
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * RFQ Document Interface
 */
interface IRFQ extends Document {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany?: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unit: string;
  message?: string;
  deliveryLocation?: string;
  deliveryDate?: Date;
  status: 'pending' | 'responded' | 'accepted' | 'declined' | 'expired';
  response?: {
    message: string;
    quotedPrice?: number;
    leadTime?: number;
    respondedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RFQ Schema
 */
const RFQSchema = new Schema<IRFQ>(
  {
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerCompany: { type: String },
    supplierId: { type: String, required: true, index: true },
    supplierName: { type: String, required: true },
    supplierEmail: { type: String },
    productId: { type: String, required: true },
    productTitle: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'units' },
    message: { type: String, maxlength: 2000 },
    deliveryLocation: { type: String },
    deliveryDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'responded', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    response: {
      message: String,
      quotedPrice: Number,
      leadTime: Number,
      respondedAt: Date,
    },
  },
  { timestamps: true }
);

// Compound indexes
RFQSchema.index({ buyerId: 1, status: 1 });
RFQSchema.index({ supplierId: 1, status: 1 });
RFQSchema.index({ createdAt: -1 });

const RFQ: Model<IRFQ> = mongoose.models.RFQ || mongoose.model<IRFQ>('RFQ', RFQSchema);

/**
 * GET /api/rfq
 * 
 * Query params:
 * - buyerId: Filter by buyer
 * - supplierId: Filter by supplier
 * - status: Filter by status
 * - limit/offset: Pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    const query: Record<string, unknown> = {};

    const buyerId = searchParams.get('buyerId');
    if (buyerId) query.buyerId = buyerId;

    const supplierId = searchParams.get('supplierId');
    if (supplierId) query.supplierId = supplierId;

    const status = searchParams.get('status');
    if (status) query.status = status;

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const [rfqs, total] = await Promise.all([
      RFQ.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      RFQ.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: rfqs,
      pagination: { total, limit, offset, hasMore: offset + rfqs.length < total },
    });

  } catch (error) {
    console.error('[RFQ API] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RFQs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rfq
 * 
 * Create a new RFQ and send email notifications
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['buyerId', 'buyerName', 'buyerEmail', 'supplierId', 'supplierName', 'productId', 'productTitle', 'quantity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create RFQ
    const rfq = new RFQ({
      buyerId: body.buyerId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerCompany: body.buyerCompany,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      supplierEmail: body.supplierEmail,
      productId: body.productId,
      productTitle: body.productTitle,
      quantity: body.quantity,
      unit: body.unit || 'units',
      message: body.message,
      deliveryLocation: body.deliveryLocation,
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      status: 'pending',
    });

    await rfq.save();

    // Send email notification to supplier (if email provided)
    if (body.supplierEmail && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'GreenChainz <noreply@greenchainz.com>',
          to: body.supplierEmail,
          subject: `New Quote Request: ${body.productTitle}`,
          html: `
            <h2>New Quote Request</h2>
            <p><strong>From:</strong> ${body.buyerName}${body.buyerCompany ? ` (${body.buyerCompany})` : ''}</p>
            <p><strong>Product:</strong> ${body.productTitle}</p>
            <p><strong>Quantity:</strong> ${body.quantity} ${body.unit || 'units'}</p>
            ${body.deliveryLocation ? `<p><strong>Delivery Location:</strong> ${body.deliveryLocation}</p>` : ''}
            ${body.deliveryDate ? `<p><strong>Requested Delivery:</strong> ${new Date(body.deliveryDate).toLocaleDateString()}</p>` : ''}
            ${body.message ? `<p><strong>Message:</strong></p><p>${body.message}</p>` : ''}
            <hr>
            <p><a href="https://greenchainz.com/dashboard/supplier/rfqs/${rfq._id}">View & Respond to Quote Request</a></p>
          `,
        });
      } catch (emailError) {
        console.error('[RFQ API] Email send failed:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send confirmation to buyer
    if (body.buyerEmail && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'GreenChainz <noreply@greenchainz.com>',
          to: body.buyerEmail,
          subject: `Quote Request Submitted: ${body.productTitle}`,
          html: `
            <h2>Quote Request Submitted</h2>
            <p>Your quote request has been sent to ${body.supplierName}.</p>
            <p><strong>Product:</strong> ${body.productTitle}</p>
            <p><strong>Quantity:</strong> ${body.quantity} ${body.unit || 'units'}</p>
            <p>You will receive a notification when the supplier responds.</p>
            <hr>
            <p><a href="https://greenchainz.com/rfq-history">View Your Quote Requests</a></p>
          `,
        });
      } catch (emailError) {
        console.error('[RFQ API] Buyer confirmation email failed:', emailError);
      }
    }

    return NextResponse.json(
      { success: true, data: rfq },
      { status: 201 }
    );

  } catch (error) {
    console.error('[RFQ API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create RFQ' },
      { status: 500 }
    );
  }
}
