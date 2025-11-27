/**
 * Orders API
 *
 * Full order management - create, track, update orders
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface IOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    carbonPerUnit: number;
}

interface IShippingInfo {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactName: string;
    contactPhone: string;
    instructions?: string;
}

interface IStatusUpdate {
    status: string;
    timestamp: Date;
    note?: string;
    updatedBy?: string;
}

interface IOrder extends Document {
    orderNumber: string;
    buyerId: string;
    buyerName: string;
    buyerCompany: string;
    supplierId: string;
    supplierName: string;
    rfqId?: string;
    quoteId?: string;
    items: IOrderItem[];
    subtotal: number;
    shipping: number;
    taxes: number;
    total: number;
    totalCarbon: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    paymentTerms: string;
    shippingInfo: IShippingInfo;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    statusHistory: IStatusUpdate[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
    orderNumber: { type: String, required: true, unique: true },
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true },
    buyerCompany: { type: String, required: true },
    supplierId: { type: String, required: true, index: true },
    supplierName: { type: String, required: true },
    rfqId: { type: String },
    quoteId: { type: String },
    items: [
        {
            productId: String,
            productName: String,
            quantity: Number,
            unit: String,
            unitPrice: Number,
            totalPrice: Number,
            carbonPerUnit: Number,
        },
    ],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    total: { type: Number, required: true },
    totalCarbon: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
    },
    paymentTerms: { type: String },
    shippingInfo: {
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        contactName: String,
        contactPhone: String,
        instructions: String,
    },
    trackingNumber: { type: String },
    carrier: { type: String },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    statusHistory: [
        {
            status: String,
            timestamp: { type: Date, default: Date.now },
            note: String,
            updatedBy: String,
        },
    ],
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Order: Model<IOrder> =
    mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

// Generate unique order number
function generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `ORD-${year}${month}-${random}`;
}

// GET - Fetch orders
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const userType = searchParams.get('userType'); // 'buyer' or 'supplier'
        const orderId = searchParams.get('orderId');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Fetch single order by ID
        if (orderId) {
            const order = await Order.findById(orderId).lean();
            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }
            return NextResponse.json({ order });
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

        const [orders, total] = await Promise.all([
            Order.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
            Order.countDocuments(query),
        ]);

        // Calculate stats
        const stats = {
            total: await Order.countDocuments(
                userType === 'buyer' ? { buyerId: userId } : { supplierId: userId }
            ),
            pending: await Order.countDocuments({
                ...(userType === 'buyer' ? { buyerId: userId } : { supplierId: userId }),
                status: 'pending',
            }),
            shipped: await Order.countDocuments({
                ...(userType === 'buyer' ? { buyerId: userId } : { supplierId: userId }),
                status: 'shipped',
            }),
            delivered: await Order.countDocuments({
                ...(userType === 'buyer' ? { buyerId: userId } : { supplierId: userId }),
                status: 'delivered',
            }),
        };

        return NextResponse.json({
            orders,
            total,
            stats,
            hasMore: offset + orders.length < total,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            buyerId,
            buyerName,
            buyerCompany,
            supplierId,
            supplierName,
            rfqId,
            quoteId,
            items,
            paymentTerms,
            shippingInfo,
            notes,
        } = body;

        if (!buyerId || !supplierId || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'buyerId, supplierId, and items are required' },
                { status: 400 }
            );
        }

        // Calculate totals
        const subtotal = items.reduce(
            (sum: number, item: IOrderItem) => sum + item.totalPrice,
            0
        );
        const totalCarbon = items.reduce(
            (sum: number, item: IOrderItem) => sum + item.carbonPerUnit * item.quantity,
            0
        );

        const order = new Order({
            orderNumber: generateOrderNumber(),
            buyerId,
            buyerName: buyerName || 'Unknown',
            buyerCompany: buyerCompany || 'Unknown',
            supplierId,
            supplierName: supplierName || 'Unknown',
            rfqId,
            quoteId,
            items,
            subtotal,
            shipping: body.shipping || 0,
            taxes: body.taxes || 0,
            total: subtotal + (body.shipping || 0) + (body.taxes || 0),
            totalCarbon,
            status: 'pending',
            paymentStatus: 'pending',
            paymentTerms: paymentTerms || 'Net 30',
            shippingInfo,
            statusHistory: [
                {
                    status: 'pending',
                    timestamp: new Date(),
                    note: 'Order created',
                },
            ],
            notes,
        });

        await order.save();

        return NextResponse.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            orderId,
            status,
            trackingNumber,
            carrier,
            estimatedDelivery,
            note,
            updatedBy,
        } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Update fields
        const updates: Record<string, unknown> = { updatedAt: new Date() };

        if (status) {
            updates.status = status;
            order.statusHistory.push({
                status,
                timestamp: new Date(),
                note,
                updatedBy,
            });
            updates.statusHistory = order.statusHistory;

            if (status === 'delivered') {
                updates.actualDelivery = new Date();
            }
        }

        if (trackingNumber) updates.trackingNumber = trackingNumber;
        if (carrier) updates.carrier = carrier;
        if (estimatedDelivery) updates.estimatedDelivery = new Date(estimatedDelivery);

        const updatedOrder = await Order.findByIdAndUpdate(orderId, updates, {
            new: true,
        }).lean();

        return NextResponse.json({
            success: true,
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
