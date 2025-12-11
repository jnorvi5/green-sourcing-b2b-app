/**
 * Payment Service (Stripe Integration)
 * 
 * Handles all payment processing:
 * - Customer management
 * - Payment intents
 * - Invoices
 * - Subscriptions (future)
 * - Webhooks
 */
import { getMainDB } from './databases';
import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== Types ====================
export type PaymentStatus =
    | 'pending'
    | 'processing'
    | 'requires_action'
    | 'succeeded'
    | 'failed'
    | 'cancelled'
    | 'refunded'
    | 'partially_refunded';

export type PaymentMethod =
    | 'card'
    | 'bank_transfer'
    | 'ach'
    | 'wire'
    | 'check'
    | 'terms';

// ==================== Interfaces ====================
export interface IPayment extends Document {
    orderId: mongoose.Types.ObjectId;
    invoiceId?: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    supplierId: mongoose.Types.ObjectId;

    amount: number;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod;

    // Stripe fields
    stripePaymentIntentId?: string;
    stripeCustomerId?: string;
    stripeChargeId?: string;
    stripeRefundId?: string;

    // Card details (masked)
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;

    // Bank details
    bankName?: string;
    bankAccountLast4?: string;

    // Fees
    platformFee: number;
    platformFeePercent: number;
    processingFee: number;
    netAmount: number;

    // Refund info
    refundAmount?: number;
    refundReason?: string;
    refundedAt?: Date;

    // Metadata
    metadata?: Record<string, unknown>;
    notes?: string;

    // Timestamps
    paidAt?: Date;
    failedAt?: Date;
    cancelledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPaymentMethod extends Document {
    customerId: mongoose.Types.ObjectId;
    stripePaymentMethodId: string;
    type: 'card' | 'bank_account';
    isDefault: boolean;

    // Card details
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;

    // Bank details
    bankName?: string;
    bankAccountLast4?: string;
    bankAccountType?: 'checking' | 'savings';

    billingAddress?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };

    createdAt: Date;
    updatedAt: Date;
}

export interface IPayoutAccount extends Document {
    userId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;

    stripeConnectId: string;
    status: 'pending' | 'active' | 'restricted' | 'disabled';

    bankName: string;
    bankAccountLast4: string;
    bankRoutingNumber: string;

    payoutSchedule: 'daily' | 'weekly' | 'monthly';
    payoutDelayDays: number;

    totalPaidOut: number;
    pendingBalance: number;
    availableBalance: number;

    createdAt: Date;
    updatedAt: Date;
}

// ==================== Schemas ====================
const PaymentSchema = new Schema<IPayment>(
    {
        orderId: { type: Schema.Types.ObjectId, required: true, index: true },
        invoiceId: { type: Schema.Types.ObjectId, index: true },
        customerId: { type: Schema.Types.ObjectId, required: true, index: true },
        supplierId: { type: Schema.Types.ObjectId, required: true, index: true },

        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        status: {
            type: String,
            enum: ['pending', 'processing', 'requires_action', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
            default: 'pending',
            index: true,
        },
        method: {
            type: String,
            enum: ['card', 'bank_transfer', 'ach', 'wire', 'check', 'terms'],
            required: true,
        },

        stripePaymentIntentId: { type: String, index: true },
        stripeCustomerId: String,
        stripeChargeId: String,
        stripeRefundId: String,

        cardLast4: String,
        cardBrand: String,
        cardExpMonth: Number,
        cardExpYear: Number,

        bankName: String,
        bankAccountLast4: String,

        platformFee: { type: Number, default: 0 },
        platformFeePercent: { type: Number, default: 2.5 },
        processingFee: { type: Number, default: 0 },
        netAmount: { type: Number, required: true },

        refundAmount: Number,
        refundReason: String,
        refundedAt: Date,

        metadata: Schema.Types.Mixed,
        notes: String,

        paidAt: Date,
        failedAt: Date,
        cancelledAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ customerId: 1, status: 1 });
PaymentSchema.index({ supplierId: 1, paidAt: -1 });

const PaymentMethodSchema = new Schema<IPaymentMethod>(
    {
        customerId: { type: Schema.Types.ObjectId, required: true, index: true },
        stripePaymentMethodId: { type: String, required: true, unique: true },
        type: { type: String, enum: ['card', 'bank_account'], required: true },
        isDefault: { type: Boolean, default: false },

        cardLast4: String,
        cardBrand: String,
        cardExpMonth: Number,
        cardExpYear: Number,

        bankName: String,
        bankAccountLast4: String,
        bankAccountType: { type: String, enum: ['checking', 'savings'] },

        billingAddress: {
            line1: String,
            line2: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
        },
    },
    {
        timestamps: true,
    }
);

const PayoutAccountSchema = new Schema<IPayoutAccount>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        companyId: { type: Schema.Types.ObjectId, required: true, index: true },

        stripeConnectId: { type: String, required: true, unique: true },
        status: {
            type: String,
            enum: ['pending', 'active', 'restricted', 'disabled'],
            default: 'pending',
        },

        bankName: String,
        bankAccountLast4: String,
        bankRoutingNumber: String,

        payoutSchedule: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
        payoutDelayDays: { type: Number, default: 7 },

        totalPaidOut: { type: Number, default: 0 },
        pendingBalance: { type: Number, default: 0 },
        availableBalance: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

// ==================== Model Getters ====================
let PaymentModel: Model<IPayment> | null = null;
let PaymentMethodModel: Model<IPaymentMethod> | null = null;
let PayoutAccountModel: Model<IPayoutAccount> | null = null;

export async function getPaymentModels() {
    const db = await getMainDB();

    if (!PaymentModel) {
        PaymentModel = db.model<IPayment>('Payment', PaymentSchema);
    }
    if (!PaymentMethodModel) {
        PaymentMethodModel = db.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);
    }
    if (!PayoutAccountModel) {
        PayoutAccountModel = db.model<IPayoutAccount>('PayoutAccount', PayoutAccountSchema);
    }

    return {
        Payment: PaymentModel,
        PaymentMethod: PaymentMethodModel,
        PayoutAccount: PayoutAccountModel,
    };
}

// ==================== Payment Service Class ====================
export class PaymentService {
    private stripe: unknown; // Would be Stripe instance

    constructor() {
        // Initialize Stripe
        // this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    }

    /**
     * Create a payment intent
     */
    async createPaymentIntent(params: {
        orderId: string;
        customerId: string;
        supplierId: string;
        amount: number;
        currency?: string;
        method?: PaymentMethod;
        metadata?: Record<string, unknown>;
    }): Promise<IPayment> {
        const { Payment } = await getPaymentModels();

        // Calculate fees
        const platformFeePercent = 2.5;
        const platformFee = Math.round(params.amount * (platformFeePercent / 100));
        const processingFee = Math.round(params.amount * 0.029) + 30; // Stripe fees
        const netAmount = params.amount - platformFee - processingFee;

        // Create Stripe payment intent (mock for now)
        const stripePaymentIntentId = `pi_${Date.now()}_mock`;

        const payment = new Payment({
            orderId: new mongoose.Types.ObjectId(params.orderId),
            customerId: new mongoose.Types.ObjectId(params.customerId),
            supplierId: new mongoose.Types.ObjectId(params.supplierId),
            amount: params.amount,
            currency: params.currency || 'USD',
            status: 'pending',
            method: params.method || 'card',
            stripePaymentIntentId,
            platformFee,
            platformFeePercent,
            processingFee,
            netAmount,
            metadata: params.metadata,
        });

        await payment.save();

        return payment;
    }

    /**
     * Confirm a payment
     */
    async confirmPayment(paymentId: string): Promise<IPayment | null> {
        const { Payment } = await getPaymentModels();

        const payment = await Payment.findById(paymentId);
        if (!payment) return null;

        // Would call Stripe API here
        // const intent = await this.stripe.paymentIntents.confirm(payment.stripePaymentIntentId);

        payment.status = 'succeeded';
        payment.paidAt = new Date();
        await payment.save();

        return payment;
    }

    /**
     * Process a refund
     */
    async refund(
        paymentId: string,
        amount?: number,
        reason?: string
    ): Promise<IPayment | null> {
        const { Payment } = await getPaymentModels();

        const payment = await Payment.findById(paymentId);
        if (!payment || payment.status !== 'succeeded') return null;

        const refundAmount = amount || payment.amount;

        // Would call Stripe API here
        // const refund = await this.stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId, amount: refundAmount });

        payment.status = refundAmount === payment.amount ? 'refunded' : 'partially_refunded';
        payment.refundAmount = refundAmount;
        payment.refundReason = reason;
        payment.refundedAt = new Date();
        payment.stripeRefundId = `re_${Date.now()}_mock`;

        await payment.save();

        return payment;
    }

    /**
     * Get payment by ID
     */
    async getPayment(paymentId: string): Promise<IPayment | null> {
        const { Payment } = await getPaymentModels();
        return Payment.findById(paymentId).lean();
    }

    /**
     * Get payments for an order
     */
    async getOrderPayments(orderId: string): Promise<IPayment[]> {
        const { Payment } = await getPaymentModels();
        return Payment.find({ orderId: new mongoose.Types.ObjectId(orderId) })
            .sort({ createdAt: -1 })
            .lean();
    }

    /**
     * Get payments for a customer
     */
    async getCustomerPayments(
        customerId: string,
        options?: { limit?: number; skip?: number; status?: PaymentStatus }
    ): Promise<IPayment[]> {
        const { Payment } = await getPaymentModels();

        const query: Record<string, unknown> = { customerId: new mongoose.Types.ObjectId(customerId) };
        if (options?.status) query.status = options.status;

        return Payment.find(query)
            .sort({ createdAt: -1 })
            .skip(options?.skip || 0)
            .limit(options?.limit || 50)
            .lean();
    }

    /**
     * Get supplier earnings
     */
    async getSupplierEarnings(
        supplierId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<{
        totalEarnings: number;
        pendingPayouts: number;
        fees: number;
        paymentCount: number;
    }> {
        const { Payment } = await getPaymentModels();

        const matchStage: Record<string, unknown> = {
            supplierId: new mongoose.Types.ObjectId(supplierId),
            status: 'succeeded',
        };

        if (startDate || endDate) {
            matchStage.paidAt = {};
            if (startDate) (matchStage.paidAt as Record<string, Date>).$gte = startDate;
            if (endDate) (matchStage.paidAt as Record<string, Date>).$lte = endDate;
        }

        const result = await Payment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$netAmount' },
                    pendingPayouts: { $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, '$netAmount', 0] } },
                    fees: { $sum: { $add: ['$platformFee', '$processingFee'] } },
                    paymentCount: { $sum: 1 },
                },
            },
        ]);

        return result[0] || { totalEarnings: 0, pendingPayouts: 0, fees: 0, paymentCount: 0 };
    }

    // ==================== Payment Methods ====================

    /**
     * Add a payment method
     */
    async addPaymentMethod(
        customerId: string,
        stripePaymentMethodId: string,
        type: 'card' | 'bank_account',
        details: Partial<IPaymentMethod>
    ): Promise<IPaymentMethod> {
        const { PaymentMethod } = await getPaymentModels();

        // Check if this should be default
        const existingMethods = await PaymentMethod.countDocuments({
            customerId: new mongoose.Types.ObjectId(customerId),
        });

        const paymentMethod = new PaymentMethod({
            customerId: new mongoose.Types.ObjectId(customerId),
            stripePaymentMethodId,
            type,
            isDefault: existingMethods === 0,
            ...details,
        });

        await paymentMethod.save();

        return paymentMethod;
    }

    /**
     * Get customer payment methods
     */
    async getPaymentMethods(customerId: string): Promise<IPaymentMethod[]> {
        const { PaymentMethod } = await getPaymentModels();
        return PaymentMethod.find({ customerId: new mongoose.Types.ObjectId(customerId) })
            .sort({ isDefault: -1, createdAt: -1 })
            .lean();
    }

    /**
     * Remove a payment method
     */
    async removePaymentMethod(paymentMethodId: string, customerId: string): Promise<boolean> {
        const { PaymentMethod } = await getPaymentModels();

        const result = await PaymentMethod.findOneAndDelete({
            _id: paymentMethodId,
            customerId: new mongoose.Types.ObjectId(customerId),
        });

        return !!result;
    }

    /**
     * Set default payment method
     */
    async setDefaultPaymentMethod(paymentMethodId: string, customerId: string): Promise<boolean> {
        const { PaymentMethod } = await getPaymentModels();

        // Unset current default
        await PaymentMethod.updateMany(
            { customerId: new mongoose.Types.ObjectId(customerId) },
            { isDefault: false }
        );

        // Set new default
        const result = await PaymentMethod.findOneAndUpdate(
            { _id: paymentMethodId, customerId: new mongoose.Types.ObjectId(customerId) },
            { isDefault: true }
        );

        return !!result;
    }

    // ==================== Payout Accounts ====================

    /**
     * Create payout account (Stripe Connect)
     */
    async createPayoutAccount(
        userId: string,
        companyId: string,
        bankDetails: {
            bankName: string;
            accountNumber: string;
            routingNumber: string;
        }
    ): Promise<IPayoutAccount> {
        const { PayoutAccount } = await getPaymentModels();

        // Would create Stripe Connect account here
        const stripeConnectId = `acct_${Date.now()}_mock`;

        const payoutAccount = new PayoutAccount({
            userId: new mongoose.Types.ObjectId(userId),
            companyId: new mongoose.Types.ObjectId(companyId),
            stripeConnectId,
            status: 'pending',
            bankName: bankDetails.bankName,
            bankAccountLast4: bankDetails.accountNumber.slice(-4),
            bankRoutingNumber: bankDetails.routingNumber,
        });

        await payoutAccount.save();

        return payoutAccount;
    }

    /**
     * Get payout account
     */
    async getPayoutAccount(companyId: string): Promise<IPayoutAccount | null> {
        const { PayoutAccount } = await getPaymentModels();
        return PayoutAccount.findOne({ companyId: new mongoose.Types.ObjectId(companyId) }).lean();
    }

    // ==================== Webhooks ====================

    /**
     * Handle Stripe webhook events
     */
    async handleWebhook(event: { type: string; data: { object: Record<string, unknown> } }): Promise<void> {
        const { Payment } = await getPaymentModels();

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentId = event.data.object.id as string;
                await Payment.findOneAndUpdate(
                    { stripePaymentIntentId: paymentIntentId },
                    { status: 'succeeded', paidAt: new Date() }
                );
                break;

            case 'payment_intent.payment_failed':
                const failedIntentId = event.data.object.id as string;
                await Payment.findOneAndUpdate(
                    { stripePaymentIntentId: failedIntentId },
                    { status: 'failed', failedAt: new Date() }
                );
                break;

            // Handle more events...
        }
    }
}

// Singleton instance
export const paymentService = new PaymentService();

export default paymentService;
