/**
 * Settings API
 *
 * User and company settings management
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface INotificationSettings {
    email: {
        rfqUpdates: boolean;
        orderUpdates: boolean;
        newMessages: boolean;
        weeklyDigest: boolean;
        marketingEmails: boolean;
    };
    push: {
        rfqUpdates: boolean;
        orderUpdates: boolean;
        newMessages: boolean;
    };
    sms: {
        criticalAlerts: boolean;
        orderShipments: boolean;
    };
}

interface ISecuritySettings {
    twoFactorEnabled: boolean;
    twoFactorMethod?: 'app' | 'sms' | 'email';
    sessionTimeout: number; // minutes
    ipWhitelist: string[];
    lastPasswordChange?: Date;
    loginNotifications: boolean;
}

interface IPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    measurementUnit: 'metric' | 'imperial';
}

interface IBillingInfo {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    billingEmail: string;
    paymentMethod?: {
        type: 'card' | 'bank' | 'invoice';
        last4?: string;
        expiryDate?: string;
    };
    billingAddress?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    taxId?: string;
    nextBillingDate?: Date;
}

interface IUserSettings extends Document {
    userId: string;
    email: string;
    profile: {
        firstName: string;
        lastName: string;
        jobTitle?: string;
        phone?: string;
        avatar?: string;
        bio?: string;
    };
    company: {
        companyId: string;
        companyName: string;
        industry?: string;
        website?: string;
        address?: string;
        logo?: string;
    };
    notifications: INotificationSettings;
    security: ISecuritySettings;
    preferences: IPreferences;
    billing: IBillingInfo;
    createdAt: Date;
    updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>({
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    profile: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        jobTitle: { type: String },
        phone: { type: String },
        avatar: { type: String },
        bio: { type: String },
    },
    company: {
        companyId: { type: String },
        companyName: { type: String },
        industry: { type: String },
        website: { type: String },
        address: { type: String },
        logo: { type: String },
    },
    notifications: {
        email: {
            rfqUpdates: { type: Boolean, default: true },
            orderUpdates: { type: Boolean, default: true },
            newMessages: { type: Boolean, default: true },
            weeklyDigest: { type: Boolean, default: true },
            marketingEmails: { type: Boolean, default: false },
        },
        push: {
            rfqUpdates: { type: Boolean, default: true },
            orderUpdates: { type: Boolean, default: true },
            newMessages: { type: Boolean, default: true },
        },
        sms: {
            criticalAlerts: { type: Boolean, default: false },
            orderShipments: { type: Boolean, default: false },
        },
    },
    security: {
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorMethod: { type: String, enum: ['app', 'sms', 'email'] },
        sessionTimeout: { type: Number, default: 60 },
        ipWhitelist: [{ type: String }],
        lastPasswordChange: { type: Date },
        loginNotifications: { type: Boolean, default: true },
    },
    preferences: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'America/New_York' },
        dateFormat: { type: String, default: 'MM/DD/YYYY' },
        currency: { type: String, default: 'USD' },
        measurementUnit: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    },
    billing: {
        plan: {
            type: String,
            enum: ['free', 'starter', 'professional', 'enterprise'],
            default: 'free',
        },
        billingEmail: { type: String },
        paymentMethod: {
            type: { type: String, enum: ['card', 'bank', 'invoice'] },
            last4: { type: String },
            expiryDate: { type: String },
        },
        billingAddress: {
            line1: { type: String },
            line2: { type: String },
            city: { type: String },
            state: { type: String },
            zipCode: { type: String },
            country: { type: String },
        },
        taxId: { type: String },
        nextBillingDate: { type: Date },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const UserSettings: Model<IUserSettings> =
    mongoose.models.UserSettings ||
    mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);

// GET - Fetch user settings
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const section = searchParams.get('section'); // profile, company, notifications, security, preferences, billing

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const settings = await UserSettings.findOne({ userId }).lean();

        if (!settings) {
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }

        // Return specific section if requested
        if (section && section in settings) {
            return NextResponse.json({
                [section]: settings[section as keyof typeof settings],
            });
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST - Create initial settings for a new user
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { userId, email, firstName, lastName, companyId, companyName } = body;

        if (!userId || !email) {
            return NextResponse.json(
                { error: 'userId and email are required' },
                { status: 400 }
            );
        }

        // Check if settings already exist
        const existingSettings = await UserSettings.findOne({ userId });
        if (existingSettings) {
            return NextResponse.json(
                { error: 'Settings already exist for this user' },
                { status: 400 }
            );
        }

        const settings = new UserSettings({
            userId,
            email,
            profile: {
                firstName: firstName || 'User',
                lastName: lastName || '',
            },
            company: {
                companyId: companyId || '',
                companyName: companyName || '',
            },
            billing: {
                plan: 'free',
                billingEmail: email,
            },
        });

        await settings.save();

        return NextResponse.json({
            success: true,
            settings,
        });
    } catch (error) {
        console.error('Error creating settings:', error);
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
    }
}

// PATCH - Update settings
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { userId, section, data } = body;

        if (!userId || !section || !data) {
            return NextResponse.json(
                { error: 'userId, section, and data are required' },
                { status: 400 }
            );
        }

        const validSections = [
            'profile',
            'company',
            'notifications',
            'security',
            'preferences',
            'billing',
        ];
        if (!validSections.includes(section)) {
            return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
        }

        const settings = await UserSettings.findOne({ userId });
        if (!settings) {
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }

        // Update the specific section
        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        // Merge existing section data with new data
        const existingSection = settings[section as keyof typeof settings];
        if (typeof existingSection === 'object' && existingSection !== null) {
            updateData[section] = { ...existingSection, ...data };
        } else {
            updateData[section] = data;
        }

        const updatedSettings = await UserSettings.findOneAndUpdate(
            { userId },
            updateData,
            { new: true }
        ).lean();

        return NextResponse.json({
            success: true,
            settings: updatedSettings,
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

// PUT - Full settings update (for bulk changes)
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { userId, settings: newSettings } = body;

        if (!userId || !newSettings) {
            return NextResponse.json(
                { error: 'userId and settings are required' },
                { status: 400 }
            );
        }

        const existingSettings = await UserSettings.findOne({ userId });
        if (!existingSettings) {
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }

        // Update all fields
        Object.assign(existingSettings, {
            ...newSettings,
            userId, // Preserve userId
            email: newSettings.email || existingSettings.email,
            updatedAt: new Date(),
        });

        await existingSettings.save();

        return NextResponse.json({
            success: true,
            settings: existingSettings,
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
