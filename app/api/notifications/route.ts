/**
 * Notifications API
 *
 * Manages user notifications for RFQs, orders, messages, etc.
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface INotification extends Document {
    userId: string;
    type: 'rfq' | 'order' | 'message' | 'system' | 'alert';
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: Date;
    expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['rfq', 'order', 'message', 'system', 'alert'] },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
});

const Notification: Model<INotification> = mongoose.models.Notification ||
    mongoose.model<INotification>('Notification', NotificationSchema);

interface NotificationBody {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    expiresAt?: string;
    notificationIds?: string[];
    markAllRead?: boolean;
}

// GET - Fetch notifications for a user
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const query: Record<string, unknown> = { userId };
        if (unreadOnly) {
            query.read = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ userId }),
            Notification.countDocuments({ userId, read: false }),
        ]);

        return NextResponse.json({
            notifications,
            total,
            unreadCount,
            hasMore: offset + notifications.length < total,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json() as NotificationBody;
        const { userId, type, title, message, data, expiresAt } = body;

        if (!userId || !type || !title || !message) {
            return NextResponse.json(
                { error: 'userId, type, title, and message are required' },
                { status: 400 }
            );
        }

        const validTypes = ['rfq', 'order', 'message', 'system', 'alert'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        const notification = new Notification({
            userId,
            type,
            title,
            message,
            data: data || {},
            read: false,
            createdAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        });

        await notification.save();

        return NextResponse.json({
            success: true,
            notificationId: notification._id,
            notification,
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json() as NotificationBody;
        const { userId, notificationIds, markAllRead } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        let result;

        if (markAllRead) {
            // Mark all notifications as read for this user
            result = await Notification.updateMany(
                { userId, read: false },
                { $set: { read: true } }
            );
        } else if (notificationIds && notificationIds.length > 0) {
            // Mark specific notifications as read
            result = await Notification.updateMany(
                { _id: { $in: notificationIds }, userId },
                { $set: { read: true } }
            );
        } else {
            return NextResponse.json(
                { error: 'Either notificationIds or markAllRead must be provided' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json(
            { error: 'Failed to update notifications' },
            { status: 500 }
        );
    }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const notificationId = searchParams.get('notificationId');
        const deleteAll = searchParams.get('deleteAll') === 'true';

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        let result;

        if (deleteAll) {
            result = await Notification.deleteMany({ userId });
        } else if (notificationId) {
            result = await Notification.deleteOne({
                _id: notificationId,
                userId,
            });
        } else {
            return NextResponse.json(
                { error: 'Either notificationId or deleteAll must be provided' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Error deleting notifications:', error);
        return NextResponse.json(
            { error: 'Failed to delete notifications' },
            { status: 500 }
        );
    }
}
