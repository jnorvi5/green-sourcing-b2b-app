/**
 * Invoices API
 *
 * Invoice generation and management for orders
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface ILineItem {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
}

interface IPayment {
    amount: number;
    date: Date;
    method: string;
    reference?: string;
    notes?: string;
}

interface IInvoice extends Document {
    invoiceNumber: string;
    orderId: string;
    orderNumber: string;
    buyerId: string;
    buyerName: string;
    buyerCompany: string;
    buyerAddress: string;
    supplierId: string;
    supplierName: string;
    supplierCompany: string;
    supplierAddress: string;
    lineItems: ILineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    shippingCost: number;
    discount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    paymentTerms: string;
    dueDate: Date;
    issueDate: Date;
    paidDate?: Date;
    payments: IPayment[];
    notes?: string;
    termsAndConditions?: string;
    createdAt: Date;
    updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
    invoiceNumber: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true },
    buyerCompany: { type: String, required: true },
    buyerAddress: { type: String },
    supplierId: { type: String, required: true, index: true },
    supplierName: { type: String, required: true },
    supplierCompany: { type: String, required: true },
    supplierAddress: { type: String },
    lineItems: [
        {
            description: String,
            quantity: Number,
            unit: String,
            unitPrice: Number,
            total: Number,
        },
    ],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, required: true },
    status: {
        type: String,
        enum: ['draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled'],
        default: 'draft',
    },
    paymentTerms: { type: String, default: 'Net 30' },
    dueDate: { type: Date, required: true },
    issueDate: { type: Date, default: Date.now },
    paidDate: { type: Date },
    payments: [
        {
            amount: Number,
            date: { type: Date, default: Date.now },
            method: String,
            reference: String,
            notes: String,
        },
    ],
    notes: { type: String },
    termsAndConditions: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Invoice: Model<IInvoice> =
    mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

// Generate unique invoice number
function generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `INV-${year}${month}-${random}`;
}

// Calculate due date based on payment terms
function calculateDueDate(paymentTerms: string): Date {
    const dueDate = new Date();
    switch (paymentTerms) {
        case 'Due on Receipt':
            break;
        case 'Net 15':
            dueDate.setDate(dueDate.getDate() + 15);
            break;
        case 'Net 30':
            dueDate.setDate(dueDate.getDate() + 30);
            break;
        case 'Net 45':
            dueDate.setDate(dueDate.getDate() + 45);
            break;
        case 'Net 60':
            dueDate.setDate(dueDate.getDate() + 60);
            break;
        case 'Net 90':
            dueDate.setDate(dueDate.getDate() + 90);
            break;
        default:
            dueDate.setDate(dueDate.getDate() + 30);
    }
    return dueDate;
}

// GET - Fetch invoices
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const userType = searchParams.get('userType');
        const invoiceId = searchParams.get('invoiceId');
        const orderId = searchParams.get('orderId');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Fetch single invoice
        if (invoiceId) {
            const invoice = await Invoice.findById(invoiceId).lean();
            if (!invoice) {
                return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            }
            return NextResponse.json({ invoice });
        }

        // Fetch invoice by order
        if (orderId) {
            const invoice = await Invoice.findOne({ orderId }).lean();
            return NextResponse.json({ invoice });
        }

        if (!userId || !userType) {
            return NextResponse.json(
                { error: 'userId and userType are required' },
                { status: 400 }
            );
        }

        // Build query
        const query: Record<string, unknown> = {};
        if (userType === 'buyer') {
            query.buyerId = userId;
        } else {
            query.supplierId = userId;
        }
        if (status) {
            query.status = status;
        }

        const [invoices, total] = await Promise.all([
            Invoice.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
            Invoice.countDocuments(query),
        ]);

        // Calculate stats
        const baseQuery = userType === 'buyer' ? { buyerId: userId } : { supplierId: userId };
        const totalAmount = await Invoice.aggregate([
            { $match: baseQuery },
            { $group: { _id: null, total: { $sum: '$total' }, paid: { $sum: '$amountPaid' } } },
        ]);

        const stats = {
            total: await Invoice.countDocuments(baseQuery),
            draft: await Invoice.countDocuments({ ...baseQuery, status: 'draft' }),
            sent: await Invoice.countDocuments({ ...baseQuery, status: 'sent' }),
            paid: await Invoice.countDocuments({ ...baseQuery, status: 'paid' }),
            overdue: await Invoice.countDocuments({ ...baseQuery, status: 'overdue' }),
            totalAmount: totalAmount[0]?.total || 0,
            paidAmount: totalAmount[0]?.paid || 0,
            outstandingAmount: (totalAmount[0]?.total || 0) - (totalAmount[0]?.paid || 0),
        };

        return NextResponse.json({
            invoices,
            total,
            stats,
            hasMore: offset + invoices.length < total,
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

// POST - Create a new invoice
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            orderId,
            orderNumber,
            buyerId,
            buyerName,
            buyerCompany,
            buyerAddress,
            supplierId,
            supplierName,
            supplierCompany,
            supplierAddress,
            lineItems,
            taxRate,
            shippingCost,
            discount,
            paymentTerms,
            notes,
            termsAndConditions,
        } = body;

        if (!orderId || !buyerId || !supplierId || !lineItems || lineItems.length === 0) {
            return NextResponse.json(
                { error: 'orderId, buyerId, supplierId, and lineItems are required' },
                { status: 400 }
            );
        }

        // Calculate totals
        const subtotal = lineItems.reduce(
            (sum: number, item: ILineItem) => sum + item.total,
            0
        );
        const taxAmount = subtotal * ((taxRate || 0) / 100);
        const total = subtotal + taxAmount + (shippingCost || 0) - (discount || 0);
        const terms = paymentTerms || 'Net 30';

        const invoice = new Invoice({
            invoiceNumber: generateInvoiceNumber(),
            orderId,
            orderNumber: orderNumber || orderId,
            buyerId,
            buyerName: buyerName || 'Unknown',
            buyerCompany: buyerCompany || 'Unknown',
            buyerAddress,
            supplierId,
            supplierName: supplierName || 'Unknown',
            supplierCompany: supplierCompany || 'Unknown',
            supplierAddress,
            lineItems,
            subtotal,
            taxRate: taxRate || 0,
            taxAmount,
            shippingCost: shippingCost || 0,
            discount: discount || 0,
            total,
            amountPaid: 0,
            amountDue: total,
            status: 'draft',
            paymentTerms: terms,
            dueDate: calculateDueDate(terms),
            notes,
            termsAndConditions:
                termsAndConditions ||
                'Payment is due within the specified terms. Late payments may be subject to interest charges.',
        });

        await invoice.save();

        return NextResponse.json({
            success: true,
            invoice,
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}

// PATCH - Update invoice status or record payment
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { invoiceId, status, payment } = body;

        if (!invoiceId) {
            return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const updates: Record<string, unknown> = { updatedAt: new Date() };

        // Record a payment
        if (payment) {
            const newPayment: IPayment = {
                amount: payment.amount,
                date: new Date(payment.date || Date.now()),
                method: payment.method,
                reference: payment.reference,
                notes: payment.notes,
            };

            invoice.payments.push(newPayment);
            updates.payments = invoice.payments;

            const newAmountPaid = invoice.amountPaid + payment.amount;
            updates.amountPaid = newAmountPaid;
            updates.amountDue = invoice.total - newAmountPaid;

            // Update status based on payment
            if (newAmountPaid >= invoice.total) {
                updates.status = 'paid';
                updates.paidDate = new Date();
            } else if (newAmountPaid > 0) {
                updates.status = 'partial';
            }
        }

        // Direct status update
        if (status && !payment) {
            updates.status = status;
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, updates, {
            new: true,
        }).lean();

        return NextResponse.json({
            success: true,
            invoice: updatedInvoice,
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
}
