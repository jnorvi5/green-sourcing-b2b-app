/**
 * Payment API Routes
 * 
 * Endpoints for:
 * - POST /api/payments - Create payment intent
 * - GET /api/payments - List payments
 * - GET /api/payments?id=xxx - Get payment details
 * - POST /api/payments/confirm - Confirm payment
 * - POST /api/payments/refund - Process refund
 * - POST /api/payments/webhook - Stripe webhook
 */
import { NextRequest, NextResponse } from 'next/server';
import { paymentService, PaymentStatus } from '../../../lib/paymentService';

export const dynamic = 'force-dynamic';

interface PaymentRequestBody {
    action?: string;
    orderId?: string;
    customerId?: string;
    supplierId?: string;
    amount?: number;
    currency?: string;
    method?: string;
    paymentId?: string;
    refundAmount?: number;
    refundReason?: string;
    metadata?: Record<string, unknown>;
}

// GET - List or retrieve payments
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const customerId = searchParams.get('customerId');
        const orderId = searchParams.get('orderId');
        const supplierId = searchParams.get('supplierId');
        const status = searchParams.get('status') as PaymentStatus | null;
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        // Get single payment
        if (id) {
            const payment = await paymentService.getPayment(id);
            if (!payment) {
                return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
            }
            return NextResponse.json(payment);
        }

        // Get payments for order
        if (orderId) {
            const payments = await paymentService.getOrderPayments(orderId);
            return NextResponse.json({ payments, count: payments.length });
        }

        // Get customer payments
        if (customerId) {
            const payments = await paymentService.getCustomerPayments(customerId, {
                limit,
                skip,
                status: status || undefined,
            });
            return NextResponse.json({ payments, count: payments.length });
        }

        // Get supplier earnings
        if (supplierId) {
            const earnings = await paymentService.getSupplierEarnings(supplierId);
            return NextResponse.json(earnings);
        }

        return NextResponse.json({ error: 'customerId, orderId, or id required' }, { status: 400 });
    } catch (error) {
        console.error('Payment API Error:', error);
        return NextResponse.json({ error: 'Failed to retrieve payments' }, { status: 500 });
    }
}

// POST - Create payment or process actions
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as PaymentRequestBody;
        const { action = 'create' } = body;

        switch (action) {
            case 'create':
                // Create payment intent
                if (!body.orderId || !body.customerId || !body.supplierId || !body.amount) {
                    return NextResponse.json(
                        { error: 'orderId, customerId, supplierId, and amount required' },
                        { status: 400 }
                    );
                }

                const payment = await paymentService.createPaymentIntent({
                    orderId: body.orderId,
                    customerId: body.customerId,
                    supplierId: body.supplierId,
                    amount: body.amount,
                    currency: body.currency,
                    metadata: body.metadata,
                });

                return NextResponse.json({
                    success: true,
                    payment,
                    clientSecret: `${payment.stripePaymentIntentId}_secret_mock`,
                });

            case 'confirm':
                // Confirm payment
                if (!body.paymentId) {
                    return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
                }

                const confirmed = await paymentService.confirmPayment(body.paymentId);
                if (!confirmed) {
                    return NextResponse.json({ error: 'Payment not found or cannot be confirmed' }, { status: 400 });
                }

                return NextResponse.json({ success: true, payment: confirmed });

            case 'refund':
                // Process refund
                if (!body.paymentId) {
                    return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
                }

                const refunded = await paymentService.refund(
                    body.paymentId,
                    body.refundAmount,
                    body.refundReason
                );

                if (!refunded) {
                    return NextResponse.json({ error: 'Cannot refund this payment' }, { status: 400 });
                }

                return NextResponse.json({ success: true, payment: refunded });

            case 'webhook':
                // Handle Stripe webhook (would verify signature in production)
                const event = body as unknown as { type: string; data: { object: Record<string, unknown> } };
                await paymentService.handleWebhook(event);
                return NextResponse.json({ received: true });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Payment API Error:', error);
        return NextResponse.json({ error: 'Payment operation failed' }, { status: 500 });
    }
}
