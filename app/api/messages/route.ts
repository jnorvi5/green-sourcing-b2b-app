/**
 * Messages/Chat API
 *
 * Real-time messaging between buyers and suppliers
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface IMessage extends Document {
    conversationId: string;
    senderId: string;
    senderType: 'buyer' | 'supplier';
    senderName: string;
    receiverId: string;
    content: string;
    attachments?: {
        name: string;
        url: string;
        type: string;
        size: number;
    }[];
    read: boolean;
    createdAt: Date;
}

interface IConversation extends Document {
    participants: {
        id: string;
        type: 'buyer' | 'supplier';
        name: string;
        company: string;
    }[];
    rfqId?: string;
    orderId?: string;
    lastMessage?: string;
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderType: { type: String, required: true, enum: ['buyer', 'supplier'] },
    senderName: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: true },
    attachments: [
        {
            name: String,
            url: String,
            type: String,
            size: Number,
        },
    ],
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const ConversationSchema = new Schema<IConversation>({
    participants: [
        {
            id: String,
            type: { type: String, enum: ['buyer', 'supplier'] },
            name: String,
            company: String,
        },
    ],
    rfqId: { type: String },
    orderId: { type: String },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Message: Model<IMessage> =
    mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

const Conversation: Model<IConversation> =
    mongoose.models.Conversation ||
    mongoose.model<IConversation>('Conversation', ConversationSchema);

interface MessageBody {
    conversationId?: string;
    senderId: string;
    senderType: 'buyer' | 'supplier';
    senderName: string;
    receiverId: string;
    receiverName?: string;
    receiverCompany?: string;
    content: string;
    attachments?: { name: string; url: string; type: string; size: number }[];
    rfqId?: string;
    orderId?: string;
}

// GET - Fetch messages or conversations
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const conversationId = searchParams.get('conversationId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // If conversationId provided, fetch messages for that conversation
        if (conversationId) {
            const messages = await Message.find({ conversationId })
                .sort({ createdAt: 1 })
                .skip(offset)
                .limit(limit)
                .lean();

            const total = await Message.countDocuments({ conversationId });

            // Mark messages as read
            await Message.updateMany(
                { conversationId, receiverId: userId, read: false },
                { $set: { read: true } }
            );

            return NextResponse.json({
                messages,
                total,
                hasMore: offset + messages.length < total,
            });
        }

        // Otherwise, fetch all conversations for user
        const conversations = await Conversation.find({
            'participants.id': userId,
        })
            .sort({ lastMessageAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean();

        // Get unread counts for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversationId: conv._id?.toString(),
                    receiverId: userId,
                    read: false,
                });
                return { ...conv, unreadCount };
            })
        );

        const total = await Conversation.countDocuments({
            'participants.id': userId,
        });

        return NextResponse.json({
            conversations: conversationsWithUnread,
            total,
            hasMore: offset + conversations.length < total,
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = (await request.json()) as MessageBody;
        const {
            conversationId,
            senderId,
            senderType,
            senderName,
            receiverId,
            receiverName,
            receiverCompany,
            content,
            attachments,
            rfqId,
            orderId,
        } = body;

        if (!senderId || !senderType || !senderName || !receiverId || !content) {
            return NextResponse.json(
                { error: 'senderId, senderType, senderName, receiverId, and content are required' },
                { status: 400 }
            );
        }

        let finalConversationId = conversationId;

        // Create or get conversation
        if (!conversationId) {
            // Check if conversation exists between these participants
            let conversation = await Conversation.findOne({
                'participants.id': { $all: [senderId, receiverId] },
            });

            if (!conversation) {
                // Create new conversation
                conversation = new Conversation({
                    participants: [
                        {
                            id: senderId,
                            type: senderType,
                            name: senderName,
                            company: '', // Would come from user profile
                        },
                        {
                            id: receiverId,
                            type: senderType === 'buyer' ? 'supplier' : 'buyer',
                            name: receiverName || 'Unknown',
                            company: receiverCompany || '',
                        },
                    ],
                    rfqId,
                    orderId,
                    lastMessage: content.substring(0, 100),
                    lastMessageAt: new Date(),
                });
                await conversation.save();
            }

            finalConversationId = conversation._id?.toString();
        }

        // Create message
        const message = new Message({
            conversationId: finalConversationId,
            senderId,
            senderType,
            senderName,
            receiverId,
            content,
            attachments: attachments || [],
            read: false,
            createdAt: new Date(),
        });

        await message.save();

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(finalConversationId, {
            lastMessage: content.substring(0, 100),
            lastMessageAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message,
            conversationId: finalConversationId,
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

// PATCH - Mark messages as read
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = (await request.json()) as {
            conversationId: string;
            userId: string;
        };
        const { conversationId, userId } = body;

        if (!conversationId || !userId) {
            return NextResponse.json(
                { error: 'conversationId and userId are required' },
                { status: 400 }
            );
        }

        const result = await Message.updateMany(
            { conversationId, receiverId: userId, read: false },
            { $set: { read: true } }
        );

        return NextResponse.json({
            success: true,
            markedAsRead: result.modifiedCount,
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json({ error: 'Failed to update messages' }, { status: 500 });
    }
}
