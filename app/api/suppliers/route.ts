/**
 * Suppliers API
 * 
 * GET /api/suppliers - List suppliers with filters
 * GET /api/suppliers/[id] - Get supplier details
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import mongoose, { Schema, Document, Model } from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * Supplier Interface
 */
interface ISupplier extends Document {
    userId: string;           // Supabase user ID
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    website?: string;
    description?: string;
    logo?: string;
    coverImage?: string;
    location: {
        address?: string;
        city?: string;
        state?: string;
        country: string;
        zipCode?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    categories: string[];
    certifications: string[];
    sustainabilityScore?: number;
    verified: boolean;
    featured: boolean;
    rating: {
        average: number;
        count: number;
    };
    metrics: {
        totalProducts: number;
        totalRFQs: number;
        responseRate: number;
        avgResponseTime: number;  // hours
    };
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Supplier Schema
 */
const SupplierSchema = new Schema<ISupplier>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        companyName: { type: String, required: true, index: true },
        contactName: { type: String, required: true },
        email: { type: String, required: true },
        phone: String,
        website: String,
        description: { type: String, maxlength: 2000 },
        logo: String,
        coverImage: String,
        location: {
            address: String,
            city: String,
            state: String,
            country: { type: String, required: true },
            zipCode: String,
            coordinates: {
                lat: Number,
                lng: Number,
            },
        },
        categories: [{ type: String }],
        certifications: [{ type: String }],
        sustainabilityScore: { type: Number, min: 0, max: 100 },
        verified: { type: Boolean, default: false, index: true },
        featured: { type: Boolean, default: false, index: true },
        rating: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0 },
        },
        metrics: {
            totalProducts: { type: Number, default: 0 },
            totalRFQs: { type: Number, default: 0 },
            responseRate: { type: Number, default: 0 },
            avgResponseTime: { type: Number, default: 0 },
        },
        socialLinks: {
            linkedin: String,
            twitter: String,
        },
    },
    { timestamps: true }
);

// Text search index
SupplierSchema.index(
    { companyName: 'text', description: 'text', categories: 'text' },
    { weights: { companyName: 10, categories: 5, description: 1 } }
);

// Geospatial index for location-based queries
SupplierSchema.index({ 'location.coordinates': '2dsphere' });

const Supplier: Model<ISupplier> = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

/**
 * GET /api/suppliers
 * 
 * Query params:
 * - search: text search
 * - category: filter by category
 * - certification: filter by certification
 * - country: filter by country
 * - verified: filter verified suppliers
 * - featured: filter featured suppliers
 * - lat/lng/radius: location-based search (radius in km)
 * - limit/offset: pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);

        const query: Record<string, unknown> = {};

        // Text search
        const search = searchParams.get('search');
        if (search && search.length >= 2) {
            query.$text = { $search: search };
        }

        // Category filter
        const category = searchParams.get('category');
        if (category) {
            query.categories = category;
        }

        // Certification filter
        const certification = searchParams.get('certification');
        if (certification) {
            query.certifications = certification;
        }

        // Country filter
        const country = searchParams.get('country');
        if (country) {
            query['location.country'] = country;
        }

        // Verified filter
        const verified = searchParams.get('verified');
        if (verified === 'true') {
            query.verified = true;
        }

        // Featured filter
        const featured = searchParams.get('featured');
        if (featured === 'true') {
            query.featured = true;
        }

        // Location-based search
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const radius = searchParams.get('radius');
        if (lat && lng && radius) {
            query['location.coordinates'] = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
                },
            };
        }

        // Pagination
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        // Sorting
        const sortField = searchParams.get('sort') || 'rating.average';
        const sortOrder = searchParams.get('order') === 'asc' ? 1 : -1;
        const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

        const [suppliers, total] = await Promise.all([
            Supplier.find(query)
                .sort(sort)
                .skip(offset)
                .limit(limit)
                .lean(),
            Supplier.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: suppliers,
            pagination: { total, limit, offset, hasMore: offset + suppliers.length < total },
        });

    } catch (error) {
        console.error('[Suppliers API] GET Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch suppliers' },
            { status: 500 }
        );
    }
}
