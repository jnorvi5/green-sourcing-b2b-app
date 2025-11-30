/**
 * Favorites API
 *
 * Manage saved products, suppliers, and collections
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface IFavoriteItem {
    itemId: string;
    itemType: 'product' | 'supplier';
    itemName: string;
    itemImage?: string;
    carbonScore?: number;
    addedAt: Date;
    notes?: string;
}

interface ICollection extends Document {
    userId: string;
    name: string;
    description?: string;
    isDefault: boolean;
    items: IFavoriteItem[];
    createdAt: Date;
    updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isDefault: { type: Boolean, default: false },
    items: [
        {
            itemId: { type: String, required: true },
            itemType: { type: String, enum: ['product', 'supplier'], required: true },
            itemName: { type: String, required: true },
            itemImage: { type: String },
            carbonScore: { type: Number },
            addedAt: { type: Date, default: Date.now },
            notes: { type: String },
        },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Ensure unique collection names per user
CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

const Collection: Model<ICollection> =
    mongoose.models.Collection ||
    mongoose.model<ICollection>('Collection', CollectionSchema);

// GET - Fetch favorites and collections
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const collectionId = searchParams.get('collectionId');
        const itemId = searchParams.get('itemId'); // Check if specific item is favorited

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Check if a specific item is favorited
        if (itemId) {
            const collection = await Collection.findOne({
                userId,
                'items.itemId': itemId,
            }).lean();

            return NextResponse.json({
                isFavorited: !!collection,
                collectionId: collection?._id,
                collectionName: collection?.name,
            });
        }

        // Fetch specific collection
        if (collectionId) {
            const collection = await Collection.findById(collectionId).lean();
            if (!collection) {
                return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
            }
            return NextResponse.json({ collection });
        }

        // Fetch all collections for user
        const collections = await Collection.find({ userId })
            .sort({ isDefault: -1, name: 1 })
            .lean();

        // Create default collection if none exists
        if (collections.length === 0) {
            const defaultCollection = new Collection({
                userId,
                name: 'My Favorites',
                description: 'Default collection for saved items',
                isDefault: true,
                items: [],
            });
            await defaultCollection.save();
            return NextResponse.json({
                collections: [defaultCollection.toObject()],
                totalItems: 0,
            });
        }

        // Calculate total items across all collections
        const totalItems = collections.reduce((sum, col) => sum + col.items.length, 0);

        // Get recent items
        const allItems = collections.flatMap((col) =>
            col.items.map((item) => ({
                ...item,
                collectionId: col._id,
                collectionName: col.name,
            }))
        );
        const recentItems = allItems.sort(
            (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        ).slice(0, 5);

        return NextResponse.json({
            collections,
            totalItems,
            recentItems,
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }
}

// POST - Create collection or add item to favorites
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { action, userId, ...data } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        if (action === 'createCollection') {
            // Create a new collection
            const { name, description } = data;

            if (!name) {
                return NextResponse.json(
                    { error: 'Collection name is required' },
                    { status: 400 }
                );
            }

            const collection = new Collection({
                userId,
                name,
                description,
                isDefault: false,
                items: [],
            });

            await collection.save();

            return NextResponse.json({
                success: true,
                collection,
            });
        }

        // Add item to collection
        const { collectionId, itemId, itemType, itemName, itemImage, carbonScore, notes } =
            data;

        if (!itemId || !itemType || !itemName) {
            return NextResponse.json(
                { error: 'itemId, itemType, and itemName are required' },
                { status: 400 }
            );
        }

        // Find target collection or default
        let collection;
        if (collectionId) {
            collection = await Collection.findById(collectionId);
        } else {
            collection = await Collection.findOne({ userId, isDefault: true });
        }

        if (!collection) {
            // Create default collection
            collection = new Collection({
                userId,
                name: 'My Favorites',
                description: 'Default collection for saved items',
                isDefault: true,
                items: [],
            });
        }

        // Check if item already exists
        const existingItem = collection.items.find(
            (item) => item.itemId === itemId && item.itemType === itemType
        );

        if (existingItem) {
            return NextResponse.json(
                { error: 'Item already in this collection' },
                { status: 400 }
            );
        }

        // Add item
        collection.items.push({
            itemId,
            itemType,
            itemName,
            itemImage,
            carbonScore,
            addedAt: new Date(),
            notes,
        });
        collection.updatedAt = new Date();

        await collection.save();

        return NextResponse.json({
            success: true,
            collection,
            message: `Added to ${collection.name}`,
        });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        return NextResponse.json({ error: 'Failed to add to favorites' }, { status: 500 });
    }
}

// PATCH - Update collection or move item
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { action, collectionId, ...data } = body;

        if (!collectionId) {
            return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
        }

        const collection = await Collection.findById(collectionId);
        if (!collection) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        if (action === 'rename') {
            collection.name = data.name;
            collection.description = data.description;
            collection.updatedAt = new Date();
            await collection.save();

            return NextResponse.json({
                success: true,
                collection,
            });
        }

        if (action === 'moveItem') {
            // Move item to another collection
            const { itemId, targetCollectionId } = data;

            const itemIndex = collection.items.findIndex((item) => item.itemId === itemId);
            if (itemIndex === -1) {
                return NextResponse.json(
                    { error: 'Item not found in collection' },
                    { status: 404 }
                );
            }

            const item = collection.items[itemIndex];
            collection.items.splice(itemIndex, 1);
            collection.updatedAt = new Date();
            await collection.save();

            const targetCollection = await Collection.findById(targetCollectionId);
            if (targetCollection) {
                targetCollection.items.push(item);
                targetCollection.updatedAt = new Date();
                await targetCollection.save();
            }

            return NextResponse.json({
                success: true,
                message: 'Item moved successfully',
            });
        }

        if (action === 'updateNote') {
            // Update item notes
            const { itemId, notes } = data;
            const item = collection.items.find((item) => item.itemId === itemId);
            if (item) {
                item.notes = notes;
                collection.updatedAt = new Date();
                await collection.save();
            }

            return NextResponse.json({
                success: true,
                collection,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error updating favorites:', error);
        return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 });
    }
}

// DELETE - Remove item or collection
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const collectionId = searchParams.get('collectionId');
        const itemId = searchParams.get('itemId');
        const userId = searchParams.get('userId');

        if (!collectionId) {
            return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
        }

        const collection = await Collection.findById(collectionId);
        if (!collection) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        // Delete entire collection
        if (!itemId) {
            if (collection.isDefault) {
                return NextResponse.json(
                    { error: 'Cannot delete default collection' },
                    { status: 400 }
                );
            }

            await Collection.findByIdAndDelete(collectionId);

            return NextResponse.json({
                success: true,
                message: 'Collection deleted',
            });
        }

        // Remove item from collection
        const itemIndex = collection.items.findIndex((item) => item.itemId === itemId);
        if (itemIndex === -1) {
            return NextResponse.json(
                { error: 'Item not found in collection' },
                { status: 404 }
            );
        }

        collection.items.splice(itemIndex, 1);
        collection.updatedAt = new Date();
        await collection.save();

        return NextResponse.json({
            success: true,
            message: 'Item removed from favorites',
            collection,
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        return NextResponse.json(
            { error: 'Failed to remove from favorites' },
            { status: 500 }
        );
    }
}
