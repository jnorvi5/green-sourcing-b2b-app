import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Disable body parsing for webhooks - we need raw body


interface PaymentMetadata {
    orderId?: string;
    userId?: string;
    type?: string;
}

async function buffer(readable: ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = readable.getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await buffer(request.body as unknown as ReadableStream);
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            );
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object as Stripe.Charge);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const metadata = paymentIntent.metadata as PaymentMetadata;
    console.log('Payment succeeded:', paymentIntent.id);

    if (metadata.orderId) {
        // Update order status
        // const order = await Order.findByIdAndUpdate(metadata.orderId, {
        //   paymentStatus: 'paid',
        //   paidAt: new Date(),
        //   stripePaymentIntentId: paymentIntent.id,
        // });
    }

    // Create notification for supplier
    if (metadata.userId) {
        // await notificationService.createNotification({
        //   userId: metadata.userId,
        //   type: 'payment',
        //   title: 'Payment Received',
        //   message: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} received for order ${metadata.orderId}`,
        //   priority: 'medium',
        // });
    }

    // Log audit event
    // await auditLogService.logAction({
    //   action: 'payment',
    //   entity: 'order',
    //   entityId: metadata.orderId,
    //   details: { amount: paymentIntent.amount, paymentIntentId: paymentIntent.id },
    // });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const metadata = paymentIntent.metadata as PaymentMetadata;
    console.log('Payment failed:', paymentIntent.id);

    if (metadata.orderId) {
        // Update order status
        // await Order.findByIdAndUpdate(metadata.orderId, {
        //   paymentStatus: 'failed',
        //   paymentError: paymentIntent.last_payment_error?.message,
        // });
    }

    // Notify buyer about failed payment
    if (metadata.userId) {
        // await notificationService.createNotification({
        //   userId: metadata.userId,
        //   type: 'payment',
        //   title: 'Payment Failed',
        //   message: `Your payment for order ${metadata.orderId} could not be processed. Please try again.`,
        //   priority: 'high',
        // });
    }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
    console.log('Charge refunded:', charge.id);

    const paymentIntent = charge.payment_intent as string;
    // Update related records
    // await Payment.findOneAndUpdate(
    //   { stripePaymentIntentId: paymentIntent },
    //   {
    //     status: charge.refunded ? 'refunded' : 'partially_refunded',
    //     refundAmount: charge.amount_refunded,
    //   }
    // );
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    console.log('Subscription created:', subscription.id);

    // const customerId = subscription.customer as string;
    // const priceId = subscription.items.data[0]?.price.id;

    // Update user subscription status
    // await User.findOneAndUpdate(
    //   { stripeCustomerId: customerId },
    //   {
    //     subscriptionId: subscription.id,
    //     subscriptionStatus: subscription.status,
    //     subscriptionPlan: getPlanFromPriceId(priceId),
    //   }
    // );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('Subscription updated:', subscription.id);

    // Update user subscription status
    // const customerId = subscription.customer as string;
    // await User.findOneAndUpdate(
    //   { stripeCustomerId: customerId },
    //   {
    //     subscriptionStatus: subscription.status,
    //     currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    //   }
    // );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log('Subscription cancelled:', subscription.id);

    // Downgrade user to free plan
    // const customerId = subscription.customer as string;
    // await User.findOneAndUpdate(
    //   { stripeCustomerId: customerId },
    //   {
    //     subscriptionId: null,
    //     subscriptionStatus: 'cancelled',
    //     subscriptionPlan: 'free',
    //   }
    // );
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    console.log('Invoice paid:', invoice.id);

    // Record invoice in database
    // await Invoice.create({
    //   stripeInvoiceId: invoice.id,
    //   customerId: invoice.customer,
    //   amount: invoice.amount_paid,
    //   status: 'paid',
    //   paidAt: new Date(),
    //   invoiceUrl: invoice.hosted_invoice_url,
    //   pdfUrl: invoice.invoice_pdf,
    // });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log('Invoice payment failed:', invoice.id);

    // Notify user
    // const customerId = invoice.customer as string;
    // const user = await User.findOne({ stripeCustomerId: customerId });
    // if (user) {
    //   await notificationService.createNotification({
    //     userId: user._id,
    //     type: 'payment',
    //     title: 'Invoice Payment Failed',
    //     message: 'Your subscription payment could not be processed. Please update your payment method.',
    //     priority: 'high',
    //   });
    // }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    console.log('Checkout session completed:', session.id);

    // Handle different checkout modes
    if (session.mode === 'subscription') {
        // Subscription checkout completed - handled by subscription events
    } else if (session.mode === 'payment') {
        // One-time payment checkout completed
        const metadata = session.metadata as PaymentMetadata;
        if (metadata.orderId) {
            // Update order status
        }
    }
}
