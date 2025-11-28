/**
 * Reviews API
 *
 * Product and supplier reviews with ratings
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface IAspectRating {
    aspect: string;
    rating: number;
}

interface IHelpfulVote {
    userId: string;
    vote: 'helpful' | 'not-helpful';
    timestamp: Date;
}

interface IReview extends Document {
    type: 'product' | 'supplier';
    targetId: string;
    targetName: string;
    reviewerId: string;
    reviewerName: string;
    reviewerCompany: string;
    orderId?: string;
    rating: number;
    title: string;
    content: string;
    aspectRatings: IAspectRating[];
    pros?: string[];
    cons?: string[];
    images?: string[];
    verified: boolean;
    status: 'pending' | 'published' | 'rejected' | 'flagged';
    helpfulCount: number;
    notHelpfulCount: number;
    votes: IHelpfulVote[];
    response?: {
        content: string;
        responderId: string;
        responderName: string;
        timestamp: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
    type: { type: String, enum: ['product', 'supplier'], required: true },
    targetId: { type: String, required: true, index: true },
    targetName: { type: String, required: true },
    reviewerId: { type: String, required: true, index: true },
    reviewerName: { type: String, required: true },
    reviewerCompany: { type: String },
    orderId: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    content: { type: String, required: true },
    aspectRatings: [
        {
            aspect: String,
            rating: { type: Number, min: 1, max: 5 },
        },
    ],
    pros: [{ type: String }],
    cons: [{ type: String }],
    images: [{ type: String }],
    verified: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['pending', 'published', 'rejected', 'flagged'],
        default: 'pending',
    },
    helpfulCount: { type: Number, default: 0 },
    notHelpfulCount: { type: Number, default: 0 },
    votes: [
        {
            userId: String,
            vote: { type: String, enum: ['helpful', 'not-helpful'] },
            timestamp: { type: Date, default: Date.now },
        },
    ],
    response: {
        content: String,
        responderId: String,
        responderName: String,
        timestamp: Date,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Compound index for fetching reviews by target
ReviewSchema.index({ type: 1, targetId: 1 });

const Review: Model<IReview> =
    mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

// GET - Fetch reviews
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type'); // 'product' or 'supplier'
        const targetId = searchParams.get('targetId');
        const reviewerId = searchParams.get('reviewerId');
        const reviewId = searchParams.get('reviewId');
        const status = searchParams.get('status');
        const sortBy = searchParams.get('sortBy') || 'recent'; // recent, helpful, rating-high, rating-low
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Fetch single review
        if (reviewId) {
            const review = await Review.findById(reviewId).lean();
            if (!review) {
                return NextResponse.json({ error: 'Review not found' }, { status: 404 });
            }
            return NextResponse.json({ review });
        }

        // Build query
        const query: Record<string, unknown> = {};
        if (type) query.type = type;
        if (targetId) query.targetId = targetId;
        if (reviewerId) query.reviewerId = reviewerId;
        if (status) query.status = status;

        // If fetching public reviews, only show published
        if (!reviewerId && !status) {
            query.status = 'published';
        }

        // Build sort
        let sort: Record<string, 1 | -1> = { createdAt: -1 };
        switch (sortBy) {
            case 'helpful':
                sort = { helpfulCount: -1, createdAt: -1 };
                break;
            case 'rating-high':
                sort = { rating: -1, createdAt: -1 };
                break;
            case 'rating-low':
                sort = { rating: 1, createdAt: -1 };
                break;
        }

        const [reviews, total] = await Promise.all([
            Review.find(query).sort(sort).skip(offset).limit(limit).lean(),
            Review.countDocuments(query),
        ]);

        // Calculate rating distribution if fetching for a target
        let ratingDistribution = null;
        let averageRating = null;
        if (targetId) {
            const stats = await Review.aggregate([
                { $match: { targetId, status: 'published' } },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 },
                        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                    },
                },
            ]);

            if (stats.length > 0) {
                averageRating = Math.round(stats[0].avgRating * 10) / 10;
                ratingDistribution = {
                    5: stats[0].rating5,
                    4: stats[0].rating4,
                    3: stats[0].rating3,
                    2: stats[0].rating2,
                    1: stats[0].rating1,
                };
            }
        }

        return NextResponse.json({
            reviews,
            total,
            averageRating,
            ratingDistribution,
            hasMore: offset + reviews.length < total,
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            type,
            targetId,
            targetName,
            reviewerId,
            reviewerName,
            reviewerCompany,
            orderId,
            rating,
            title,
            content,
            aspectRatings,
            pros,
            cons,
            images,
        } = body;

        if (!type || !targetId || !reviewerId || !rating || !title || !content) {
            return NextResponse.json(
                { error: 'type, targetId, reviewerId, rating, title, and content are required' },
                { status: 400 }
            );
        }

        // Check if user already reviewed this target
        const existingReview = await Review.findOne({ type, targetId, reviewerId });
        if (existingReview) {
            return NextResponse.json(
                { error: 'You have already reviewed this item' },
                { status: 400 }
            );
        }

        // Check if there's a valid order (for verified reviews)
        const verified = !!orderId; // Would normally check the order exists

        const review = new Review({
            type,
            targetId,
            targetName: targetName || 'Unknown',
            reviewerId,
            reviewerName: reviewerName || 'Anonymous',
            reviewerCompany,
            orderId,
            rating,
            title,
            content,
            aspectRatings: aspectRatings || [],
            pros: pros || [],
            cons: cons || [],
            images: images || [],
            verified,
            status: 'pending', // Requires moderation
        });

        await review.save();

        return NextResponse.json({
            success: true,
            review,
        });
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}

// PATCH - Update review, vote, or respond
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { reviewId, action, ...data } = body;

        if (!reviewId) {
            return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        const updates: Record<string, unknown> = { updatedAt: new Date() };

        switch (action) {
            case 'vote':
                // Add helpful vote
                const { userId, vote } = data;
                const existingVote = review.votes.find((v) => v.userId === userId);

                if (existingVote) {
                    // Update existing vote
                    existingVote.vote = vote;
                    existingVote.timestamp = new Date();
                } else {
                    // Add new vote
                    review.votes.push({ userId, vote, timestamp: new Date() });
                }

                // Recalculate counts
                updates.votes = review.votes;
                updates.helpfulCount = review.votes.filter((v) => v.vote === 'helpful').length;
                updates.notHelpfulCount = review.votes.filter(
                    (v) => v.vote === 'not-helpful'
                ).length;
                break;

            case 'respond':
                // Supplier response to review
                updates.response = {
                    content: data.content,
                    responderId: data.responderId,
                    responderName: data.responderName,
                    timestamp: new Date(),
                };
                break;

            case 'moderate':
                // Admin moderation
                updates.status = data.status;
                break;

            default:
                // Direct field updates
                if (data.title) updates.title = data.title;
                if (data.content) updates.content = data.content;
                if (data.rating) updates.rating = data.rating;
        }

        const updatedReview = await Review.findByIdAndUpdate(reviewId, updates, {
            new: true,
        }).lean();

        return NextResponse.json({
            success: true,
            review: updatedReview,
        });
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}

// DELETE - Remove a review
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const reviewId = searchParams.get('reviewId');
        const reviewerId = searchParams.get('reviewerId');

        if (!reviewId) {
            return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Verify ownership if reviewerId provided
        if (reviewerId && review.reviewerId !== reviewerId) {
            return NextResponse.json(
                { error: 'Not authorized to delete this review' },
                { status: 403 }
            );
        }

        await Review.findByIdAndDelete(reviewId);

        return NextResponse.json({
            success: true,
            message: 'Review deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}
