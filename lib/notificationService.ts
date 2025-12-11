/**
 * Notification Service
 * 
 * Handles all platform notifications:
 * - In-app notifications
 * - Email notifications
 * - Push notifications (future)
 * - WebSocket real-time updates
 */
import { getAnalyticsDB } from './databases';
import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== Notification Types ====================
export type NotificationType =
    | 'order_created'
    | 'order_shipped'
    | 'order_delivered'
    | 'order_cancelled'
    | 'rfq_received'
    | 'rfq_response'
    | 'rfq_awarded'
    | 'quote_received'
    | 'quote_expired'
    | 'payment_received'
    | 'payment_failed'
    | 'invoice_created'
    | 'message_received'
    | 'review_received'
    | 'product_approved'
    | 'product_rejected'
    | 'low_stock'
    | 'price_alert'
    | 'carbon_milestone'
    | 'system_alert'
    | 'promotion'
    | 'welcome'
    | 'account_update';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

// ==================== Interfaces ====================
export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    link?: string;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    read: boolean;
    readAt?: Date;
    emailSent: boolean;
    emailSentAt?: Date;
    pushSent: boolean;
    pushSentAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface INotificationPreferences extends Document {
    userId: mongoose.Types.ObjectId;
    email: {
        enabled: boolean;
        digest: 'instant' | 'daily' | 'weekly' | 'none';
        types: NotificationType[];
    };
    push: {
        enabled: boolean;
        types: NotificationType[];
    };
    inApp: {
        enabled: boolean;
        sound: boolean;
    };
    quietHours: {
        enabled: boolean;
        start: string; // "22:00"
        end: string;   // "08:00"
        timezone: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// ==================== Schemas ====================
const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        type: {
            type: String,
            required: true,
            enum: [
                'order_created', 'order_shipped', 'order_delivered', 'order_cancelled',
                'rfq_received', 'rfq_response', 'rfq_awarded',
                'quote_received', 'quote_expired',
                'payment_received', 'payment_failed',
                'invoice_created',
                'message_received',
                'review_received',
                'product_approved', 'product_rejected',
                'low_stock', 'price_alert',
                'carbon_milestone',
                'system_alert', 'promotion', 'welcome', 'account_update',
            ],
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: Schema.Types.Mixed },
        link: String,
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal',
        },
        channels: [{
            type: String,
            enum: ['in_app', 'email', 'push', 'sms'],
        }],
        read: { type: Boolean, default: false, index: true },
        readAt: Date,
        emailSent: { type: Boolean, default: false },
        emailSentAt: Date,
        pushSent: { type: Boolean, default: false },
        pushSentAt: Date,
        expiresAt: { type: Date, index: true },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const NotificationPreferencesSchema = new Schema<INotificationPreferences>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, unique: true },
        email: {
            enabled: { type: Boolean, default: true },
            digest: { type: String, enum: ['instant', 'daily', 'weekly', 'none'], default: 'instant' },
            types: [{ type: String }],
        },
        push: {
            enabled: { type: Boolean, default: true },
            types: [{ type: String }],
        },
        inApp: {
            enabled: { type: Boolean, default: true },
            sound: { type: Boolean, default: true },
        },
        quietHours: {
            enabled: { type: Boolean, default: false },
            start: { type: String, default: '22:00' },
            end: { type: String, default: '08:00' },
            timezone: { type: String, default: 'UTC' },
        },
    },
    {
        timestamps: true,
    }
);

// ==================== Model Getters ====================
let NotificationModel: Model<INotification> | null = null;
let NotificationPreferencesModel: Model<INotificationPreferences> | null = null;

export async function getNotificationModels() {
    const db = await getAnalyticsDB();

    if (!NotificationModel) {
        NotificationModel = db.model<INotification>('Notification', NotificationSchema);
    }
    if (!NotificationPreferencesModel) {
        NotificationPreferencesModel = db.model<INotificationPreferences>('NotificationPreferences', NotificationPreferencesSchema);
    }

    return {
        Notification: NotificationModel,
        NotificationPreferences: NotificationPreferencesModel,
    };
}

// ==================== Notification Templates ====================
export const NOTIFICATION_TEMPLATES: Record<NotificationType, {
    title: string;
    message: string;
    priority: NotificationPriority;
    channels: NotificationChannel[];
}> = {
    order_created: {
        title: 'New Order Placed',
        message: 'Order #{orderId} has been placed for ${amount}',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    order_shipped: {
        title: 'Order Shipped',
        message: 'Order #{orderId} has been shipped. Tracking: {trackingNumber}',
        priority: 'normal',
        channels: ['in_app', 'email', 'push'],
    },
    order_delivered: {
        title: 'Order Delivered',
        message: 'Order #{orderId} has been delivered',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    order_cancelled: {
        title: 'Order Cancelled',
        message: 'Order #{orderId} has been cancelled',
        priority: 'high',
        channels: ['in_app', 'email'],
    },
    rfq_received: {
        title: 'New RFQ Received',
        message: 'You received a new RFQ from {buyerName} for {productName}',
        priority: 'high',
        channels: ['in_app', 'email', 'push'],
    },
    rfq_response: {
        title: 'RFQ Response',
        message: '{supplierName} has responded to your RFQ',
        priority: 'high',
        channels: ['in_app', 'email', 'push'],
    },
    rfq_awarded: {
        title: 'RFQ Awarded!',
        message: 'Congratulations! You won the RFQ from {buyerName}',
        priority: 'urgent',
        channels: ['in_app', 'email', 'push'],
    },
    quote_received: {
        title: 'New Quote Received',
        message: 'You received a quote from {supplierName} for ${amount}',
        priority: 'high',
        channels: ['in_app', 'email'],
    },
    quote_expired: {
        title: 'Quote Expired',
        message: 'Your quote from {supplierName} has expired',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    payment_received: {
        title: 'Payment Received',
        message: 'Payment of ${amount} received for order #{orderId}',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    payment_failed: {
        title: 'Payment Failed',
        message: 'Payment failed for order #{orderId}. Please update your payment method.',
        priority: 'urgent',
        channels: ['in_app', 'email', 'push'],
    },
    invoice_created: {
        title: 'Invoice Created',
        message: 'Invoice #{invoiceId} for ${amount} has been created',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    message_received: {
        title: 'New Message',
        message: '{senderName}: {preview}',
        priority: 'normal',
        channels: ['in_app', 'push'],
    },
    review_received: {
        title: 'New Review',
        message: '{reviewerName} left a {rating}-star review',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    product_approved: {
        title: 'Product Approved',
        message: 'Your product "{productName}" has been approved',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    product_rejected: {
        title: 'Product Rejected',
        message: 'Your product "{productName}" was rejected. Reason: {reason}',
        priority: 'high',
        channels: ['in_app', 'email'],
    },
    low_stock: {
        title: 'Low Stock Alert',
        message: '{productName} is running low ({quantity} remaining)',
        priority: 'high',
        channels: ['in_app', 'email'],
    },
    price_alert: {
        title: 'Price Alert',
        message: '{productName} price dropped to ${newPrice}',
        priority: 'normal',
        channels: ['in_app', 'push'],
    },
    carbon_milestone: {
        title: 'Carbon Milestone Achieved! 🌱',
        message: 'You\'ve saved {amount} kg CO2e this month!',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    system_alert: {
        title: 'System Alert',
        message: '{message}',
        priority: 'high',
        channels: ['in_app'],
    },
    promotion: {
        title: 'Special Offer',
        message: '{message}',
        priority: 'low',
        channels: ['in_app', 'email'],
    },
    welcome: {
        title: 'Welcome to GreenChainz! 🎉',
        message: 'Your account is ready. Start exploring sustainable materials.',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
    account_update: {
        title: 'Account Updated',
        message: '{message}',
        priority: 'normal',
        channels: ['in_app', 'email'],
    },
};

// ==================== Notification Service Class ====================
export class NotificationService {

    /**
     * Create and send a notification
     */
    async send(
        userId: string | mongoose.Types.ObjectId,
        type: NotificationType,
        data?: Record<string, unknown>,
        options?: {
            link?: string;
            priority?: NotificationPriority;
            channels?: NotificationChannel[];
            expiresIn?: number; // hours
        }
    ): Promise<INotification> {
        const { Notification, NotificationPreferences } = await getNotificationModels();

        // Get template
        const template = NOTIFICATION_TEMPLATES[type];

        // Get user preferences
        const prefs = await NotificationPreferences.findOne({ userId });

        // Check if user has disabled this type
        if (prefs?.email.types && !prefs.email.types.includes(type)) {
            // User has disabled email for this type
        }

        // Interpolate template with data
        const title = this.interpolate(template.title, data || {});
        const message = this.interpolate(template.message, data || {});

        // Create notification
        const notification = new Notification({
            userId: new mongoose.Types.ObjectId(userId.toString()),
            type,
            title,
            message,
            data,
            link: options?.link,
            priority: options?.priority || template.priority,
            channels: options?.channels || template.channels,
            expiresAt: options?.expiresIn
                ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
                : undefined,
        });

        await notification.save();

        // Send to channels asynchronously
        this.processChannels(notification, prefs).catch(console.error);

        return notification;
    }

    /**
     * Send to multiple users
     */
    async sendBulk(
        userIds: Array<string | mongoose.Types.ObjectId>,
        type: NotificationType,
        data?: Record<string, unknown>,
        options?: {
            link?: string;
            priority?: NotificationPriority;
        }
    ): Promise<number> {
        let sent = 0;
        for (const userId of userIds) {
            try {
                await this.send(userId, type, data, options);
                sent++;
            } catch (error) {
                console.error(`Failed to send notification to ${userId}:`, error);
            }
        }
        return sent;
    }

    /**
     * Get notifications for a user
     */
    async getForUser(
        userId: string,
        options?: {
            unreadOnly?: boolean;
            type?: NotificationType;
            limit?: number;
            skip?: number;
        }
    ): Promise<{ notifications: INotification[]; unreadCount: number }> {
        const { Notification } = await getNotificationModels();

        const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
        if (options?.unreadOnly) query['read'] = false;
        if (options?.type) query['type'] = options.type;

        const [notifications, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(options?.skip || 0)
                .limit(options?.limit || 50)
                .lean() as any,
            Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), read: false }),
        ]);

        return { notifications, unreadCount };
    }

    /**
     * Mark notification as read
     */
    async markRead(notificationId: string, userId: string): Promise<boolean> {
        const { Notification } = await getNotificationModels();

        const result = await Notification.findOneAndUpdate(
            { _id: notificationId, userId: new mongoose.Types.ObjectId(userId) },
            { read: true, readAt: new Date() }
        );

        return !!result;
    }

    /**
     * Mark all notifications as read
     */
    async markAllRead(userId: string): Promise<number> {
        const { Notification } = await getNotificationModels();

        const result = await Notification.updateMany(
            { userId: new mongoose.Types.ObjectId(userId), read: false },
            { read: true, readAt: new Date() }
        );

        return result.modifiedCount;
    }

    /**
     * Delete a notification
     */
    async delete(notificationId: string, userId: string): Promise<boolean> {
        const { Notification } = await getNotificationModels();

        const result = await Notification.findOneAndDelete({
            _id: notificationId,
            userId: new mongoose.Types.ObjectId(userId),
        });

        return !!result;
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(
        userId: string,
        preferences: Partial<INotificationPreferences>
    ): Promise<INotificationPreferences> {
        const { NotificationPreferences } = await getNotificationModels();

        const result = await NotificationPreferences.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $set: preferences },
            { upsert: true, new: true }
        );

        return result;
    }

    /**
     * Get notification preferences
     */
    async getPreferences(userId: string): Promise<INotificationPreferences | null> {
        const { NotificationPreferences } = await getNotificationModels();
        return NotificationPreferences.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    }

    // ==================== Private Methods ====================

    private interpolate(template: string, data: Record<string, unknown>): string {
        return template.replace(/{(\w+)}/g, (_, key) => {
            return data[key]?.toString() || `{${key}}`;
        });
    }

    private async processChannels(
        notification: INotification,
        preferences: INotificationPreferences | null
    ): Promise<void> {
        // Check quiet hours
        if (preferences?.quietHours.enabled && this.isQuietHours(preferences.quietHours)) {
            // Skip push notifications during quiet hours
            notification.channels = notification.channels.filter(c => c !== 'push');
        }

        for (const channel of notification.channels) {
            switch (channel) {
                case 'email':
                    if (!preferences || preferences.email.enabled) {
                        await this.sendEmail(notification);
                    }
                    break;
                case 'push':
                    if (!preferences || preferences.push.enabled) {
                        await this.sendPush(notification);
                    }
                    break;
                case 'in_app':
                    // Already saved, just emit WebSocket event
                    this.emitWebSocket(notification);
                    break;
            }
        }
    }

    private async sendEmail(notification: INotification): Promise<void> {
        // TODO: Integrate with email service
        const { Notification } = await getNotificationModels();
        await Notification.findByIdAndUpdate(notification._id, {
            emailSent: true,
            emailSentAt: new Date(),
        });
        console.log(`📧 Email notification: ${notification.title}`);
    }

    private async sendPush(notification: INotification): Promise<void> {
        // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
        const { Notification } = await getNotificationModels();
        await Notification.findByIdAndUpdate(notification._id, {
            pushSent: true,
            pushSentAt: new Date(),
        });
        console.log(`🔔 Push notification: ${notification.title}`);
    }

    private emitWebSocket(notification: INotification): void {
        // TODO: Emit to WebSocket server
        console.log(`🔌 WebSocket notification: ${notification.title}`);
    }

    private isQuietHours(quietHours: INotificationPreferences['quietHours']): boolean {
        const now = new Date();
        // Simple check - would need timezone handling in production
        const currentHour = now.getHours();
        const startHour = parseInt(quietHours.start.split(':')[0]);
        const endHour = parseInt(quietHours.end.split(':')[0]);

        if (startHour > endHour) {
            // Overnight quiet hours (e.g., 22:00 - 08:00)
            return currentHour >= startHour || currentHour < endHour;
        }
        return currentHour >= startHour && currentHour < endHour;
    }
}

// Singleton instance
export const notificationService = new NotificationService();

export default notificationService;
