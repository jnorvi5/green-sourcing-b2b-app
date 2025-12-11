import mongoose, { Schema, Document, Model } from 'mongoose';
import { getDatabase } from './databases';

// Supplier Performance Metrics
export interface ISupplierPerformance extends Document {
    supplierId: mongoose.Types.ObjectId;
    period: string; // YYYY-MM
    metrics: {
        totalOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        averageLeadTime: number; // days
        onTimeDeliveryRate: number; // percentage
        qualityScore: number; // 0-100
        returnRate: number; // percentage
        responseTime: number; // hours
        totalRevenue: number;
        averageOrderValue: number;
    };
    reviews: {
        totalReviews: number;
        averageRating: number;
        breakdown: {
            fiveStars: number;
            fourStars: number;
            threeStars: number;
            twoStars: number;
            oneStar: number;
        };
    };
    sustainability: {
        averageGWP: number;
        carbonSaved: number;
        epdProductsCount: number;
        certifications: string[];
    };
    calculatedAt: Date;
}

const SupplierPerformanceSchema = new Schema<ISupplierPerformance>({
    supplierId: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier' },
    period: { type: String, required: true, index: true },
    metrics: {
        totalOrders: { type: Number, default: 0 },
        completedOrders: { type: Number, default: 0 },
        cancelledOrders: { type: Number, default: 0 },
        averageLeadTime: { type: Number, default: 0 },
        onTimeDeliveryRate: { type: Number, default: 100 },
        qualityScore: { type: Number, default: 0 },
        returnRate: { type: Number, default: 0 },
        responseTime: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
    },
    reviews: {
        totalReviews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        breakdown: {
            fiveStars: { type: Number, default: 0 },
            fourStars: { type: Number, default: 0 },
            threeStars: { type: Number, default: 0 },
            twoStars: { type: Number, default: 0 },
            oneStar: { type: Number, default: 0 },
        },
    },
    sustainability: {
        averageGWP: { type: Number, default: 0 },
        carbonSaved: { type: Number, default: 0 },
        epdProductsCount: { type: Number, default: 0 },
        certifications: [{ type: String }],
    },
    calculatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

// Compound index for efficient queries
SupplierPerformanceSchema.index({ supplierId: 1, period: -1 });

// Supplier Scorecard
export interface ISupplierScorecard extends Document {
    supplierId: mongoose.Types.ObjectId;
    overallScore: number; // 0-100
    tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'new';
    scores: {
        quality: number;
        delivery: number;
        responsiveness: number;
        sustainability: number;
        value: number;
    };
    badges: string[];
    achievements: {
        name: string;
        description: string;
        earnedAt: Date;
    }[];
    warnings: {
        type: string;
        message: string;
        issuedAt: Date;
        expiresAt?: Date;
    }[];
    lastUpdated: Date;
}

const SupplierScorecardSchema = new Schema<ISupplierScorecard>({
    supplierId: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier', unique: true },
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    tier: {
        type: String,
        enum: ['platinum', 'gold', 'silver', 'bronze', 'new'],
        default: 'new',
    },
    scores: {
        quality: { type: Number, default: 0, min: 0, max: 100 },
        delivery: { type: Number, default: 0, min: 0, max: 100 },
        responsiveness: { type: Number, default: 0, min: 0, max: 100 },
        sustainability: { type: Number, default: 0, min: 0, max: 100 },
        value: { type: Number, default: 0, min: 0, max: 100 },
    },
    badges: [{ type: String }],
    achievements: [{
        name: { type: String, required: true },
        description: { type: String },
        earnedAt: { type: Date, default: Date.now },
    }],
    warnings: [{
        type: { type: String, required: true },
        message: { type: String, required: true },
        issuedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
    }],
    lastUpdated: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

// Service for calculating and managing supplier performance
class SupplierPerformanceService {
    private SupplierPerformance: Model<ISupplierPerformance>;
    private SupplierScorecard: Model<ISupplierScorecard>;

    constructor() {
        // These will be initialized when methods are called
        this.SupplierPerformance = null as unknown as Model<ISupplierPerformance>;
        this.SupplierScorecard = null as unknown as Model<ISupplierScorecard>;
    }

    private async getModels() {
        const db = await getDatabase('suppliers');

        if (!this.SupplierPerformance) {
            this.SupplierPerformance = db.models.SupplierPerformance ||
                db.model<ISupplierPerformance>('SupplierPerformance', SupplierPerformanceSchema);
        }

        if (!this.SupplierScorecard) {
            this.SupplierScorecard = db.models.SupplierScorecard ||
                db.model<ISupplierScorecard>('SupplierScorecard', SupplierScorecardSchema);
        }

        return {
            SupplierPerformance: this.SupplierPerformance,
            SupplierScorecard: this.SupplierScorecard,
        };
    }

    // Calculate overall supplier score
    calculateOverallScore(scores: ISupplierScorecard['scores']): number {
        const weights = {
            quality: 0.25,
            delivery: 0.25,
            responsiveness: 0.15,
            sustainability: 0.20,
            value: 0.15,
        };

        return Math.round(
            scores.quality * weights.quality +
            scores.delivery * weights.delivery +
            scores.responsiveness * weights.responsiveness +
            scores.sustainability * weights.sustainability +
            scores.value * weights.value
        );
    }

    // Determine supplier tier based on score
    determineTier(score: number, monthsActive: number): ISupplierScorecard['tier'] {
        if (monthsActive < 3) return 'new';
        if (score >= 90) return 'platinum';
        if (score >= 75) return 'gold';
        if (score >= 60) return 'silver';
        return 'bronze';
    }

    // Calculate performance for a specific period
    async calculatePeriodPerformance(
        supplierId: string,
        period: string,
        orderData: {
            total: number;
            completed: number;
            cancelled: number;
            avgLeadTime: number;
            onTimeCount: number;
            revenue: number;
        },
        reviewData: {
            ratings: number[];
        },
        sustainabilityData: {
            avgGWP: number;
            carbonSaved: number;
            epdProducts: number;
            certifications: string[];
        }
    ): Promise<ISupplierPerformance> {
        const { SupplierPerformance } = await this.getModels();

        const ratingBreakdown = {
            fiveStars: reviewData.ratings.filter(r => r === 5).length,
            fourStars: reviewData.ratings.filter(r => r === 4).length,
            threeStars: reviewData.ratings.filter(r => r === 3).length,
            twoStars: reviewData.ratings.filter(r => r === 2).length,
            oneStar: reviewData.ratings.filter(r => r === 1).length,
        };

        const avgRating = reviewData.ratings.length > 0
            ? reviewData.ratings.reduce((a, b) => a + b, 0) / reviewData.ratings.length
            : 0;

        const performance = await SupplierPerformance.findOneAndUpdate(
            { supplierId, period },
            {
                metrics: {
                    totalOrders: orderData.total,
                    completedOrders: orderData.completed,
                    cancelledOrders: orderData.cancelled,
                    averageLeadTime: orderData.avgLeadTime,
                    onTimeDeliveryRate: orderData.total > 0
                        ? (orderData.onTimeCount / orderData.total) * 100
                        : 100,
                    qualityScore: 0, // Calculated separately
                    returnRate: 0, // Calculated from returns data
                    responseTime: 0, // Calculated from message data
                    totalRevenue: orderData.revenue,
                    averageOrderValue: orderData.total > 0
                        ? orderData.revenue / orderData.total
                        : 0,
                },
                reviews: {
                    totalReviews: reviewData.ratings.length,
                    averageRating: avgRating,
                    breakdown: ratingBreakdown,
                },
                sustainability: {
                    averageGWP: sustainabilityData.avgGWP,
                    carbonSaved: sustainabilityData.carbonSaved,
                    epdProductsCount: sustainabilityData.epdProducts,
                    certifications: sustainabilityData.certifications,
                },
                calculatedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        return performance;
    }

    // Update supplier scorecard
    async updateScorecard(supplierId: string): Promise<ISupplierScorecard> {
        const { SupplierPerformance, SupplierScorecard } = await this.getModels();

        // Get last 6 months of performance data
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const periodStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

        const performances = await SupplierPerformance.find({
            supplierId,
            period: { $gte: periodStart },
        }).sort({ period: -1 });

        if (performances.length === 0) {
            // New supplier with no data
            return SupplierScorecard.findOneAndUpdate(
                { supplierId },
                {
                    overallScore: 0,
                    tier: 'new',
                    scores: { quality: 0, delivery: 0, responsiveness: 0, sustainability: 0, value: 0 },
                    lastUpdated: new Date(),
                },
                { upsert: true, new: true }
            );
        }

        // Calculate weighted averages (more recent periods weighted higher)
        const weights = [0.3, 0.25, 0.2, 0.15, 0.07, 0.03];
        let qualityScore = 0;
        let deliveryScore = 0;
        let responsivenessScore = 0;
        let sustainabilityScore = 0;
        let valueScore = 0;
        let totalWeight = 0;

        performances.forEach((perf, i) => {
            const weight = weights[i] || 0.01;
            totalWeight += weight;

            // Quality: Based on reviews and return rate
            qualityScore += weight * (
                (perf.reviews.averageRating / 5) * 80 +
                (1 - perf.metrics.returnRate / 100) * 20
            );

            // Delivery: On-time delivery rate
            deliveryScore += weight * perf.metrics.onTimeDeliveryRate;

            // Responsiveness: Based on response time (lower is better)
            const respScore = Math.max(0, 100 - (perf.metrics.responseTime / 24) * 10);
            responsivenessScore += weight * respScore;

            // Sustainability: EPD products, certifications, carbon saved
            const epdBonus = Math.min(30, perf.sustainability.epdProductsCount * 3);
            const certBonus = Math.min(30, perf.sustainability.certifications.length * 10);
            const carbonBonus = Math.min(40, (perf.sustainability.carbonSaved / 100) * 40);
            sustainabilityScore += weight * (epdBonus + certBonus + carbonBonus);

            // Value: Order completion rate and consistency
            const completionRate = perf.metrics.totalOrders > 0
                ? (perf.metrics.completedOrders / perf.metrics.totalOrders) * 100
                : 100;
            valueScore += weight * completionRate;
        });

        // Normalize by total weight
        const scores = {
            quality: Math.round(qualityScore / totalWeight),
            delivery: Math.round(deliveryScore / totalWeight),
            responsiveness: Math.round(responsivenessScore / totalWeight),
            sustainability: Math.round(sustainabilityScore / totalWeight),
            value: Math.round(valueScore / totalWeight),
        };

        const overallScore = this.calculateOverallScore(scores);
        const tier = this.determineTier(overallScore, performances.length);

        // Determine badges
        const badges: string[] = [];
        if (scores.sustainability >= 80) badges.push('eco-champion');
        if (scores.delivery >= 95) badges.push('on-time-delivery');
        if (scores.quality >= 90) badges.push('quality-assured');
        if (performances.some(p => p.reviews.totalReviews >= 50)) badges.push('highly-reviewed');

        const scorecard = await SupplierScorecard.findOneAndUpdate(
            { supplierId },
            {
                overallScore,
                tier,
                scores,
                badges,
                lastUpdated: new Date(),
            },
            { upsert: true, new: true }
        );

        return scorecard;
    }

    // Get supplier scorecard
    async getScorecard(supplierId: string): Promise<ISupplierScorecard | null> {
        const { SupplierScorecard } = await this.getModels();
        return (SupplierScorecard.findOne as any)({ supplierId });
    }

    // Get performance history
    async getPerformanceHistory(
        supplierId: string,
        months: number = 12
    ): Promise<ISupplierPerformance[]> {
        const { SupplierPerformance } = await this.getModels();

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        const periodStart = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

        return SupplierPerformance.find({
            supplierId,
            period: { $gte: periodStart },
        }).sort({ period: -1 });
    }

    // Add achievement
    async addAchievement(
        supplierId: string,
        achievement: { name: string; description: string }
    ): Promise<ISupplierScorecard> {
        const { SupplierScorecard } = await this.getModels();

        return SupplierScorecard.findOneAndUpdate(
            { supplierId },
            {
                $push: {
                    achievements: {
                        ...achievement,
                        earnedAt: new Date(),
                    },
                },
            },
            { upsert: true, new: true }
        );
    }

    // Add warning
    async addWarning(
        supplierId: string,
        warning: { type: string; message: string; expiresAt?: Date }
    ): Promise<ISupplierScorecard> {
        const { SupplierScorecard } = await this.getModels();

        return SupplierScorecard.findOneAndUpdate(
            { supplierId },
            {
                $push: {
                    warnings: {
                        ...warning,
                        issuedAt: new Date(),
                    },
                },
            },
            { upsert: true, new: true }
        );
    }

    // Get top performing suppliers
    async getTopSuppliers(
        limit: number = 10,
        category?: string
    ): Promise<ISupplierScorecard[]> {
        const { SupplierScorecard } = await this.getModels();

        const query: Record<string, unknown> = {
            tier: { $ne: 'new' },
        };

        return (SupplierScorecard.find as any)(query)
            .sort({ overallScore: -1 })
            .limit(limit)
            .lean() as any;
    }

    // Get suppliers by tier
    async getSuppliersByTier(tier: ISupplierScorecard['tier']): Promise<ISupplierScorecard[]> {
        const { SupplierScorecard } = await this.getModels();
        return (SupplierScorecard.find as any)({ tier }).sort({ overallScore: -1 }).lean() as any;
    }
}

export const supplierPerformanceService = new SupplierPerformanceService();
