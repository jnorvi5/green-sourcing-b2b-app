/**
 * AUTO-PROFILE GENERATOR SERVICE
 * 
 * Creates unclaimed supplier profiles automatically by:
 * 1. Scraping company websites for data
 * 2. Generating professional profile pages
 * 3. Sending "Your page is live" emails
 * 4. Tracking claims and conversions
 * 
 * THE STRATEGY: Make them come to YOU by showing them their profile already exists!
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { getCollection } = require('./outreach/mongoDb');
const EmailSender = require('./outreach/emailSender');

class AutoProfileGenerator {
    constructor() {
        this.emailSender = new EmailSender();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        console.log('[AutoProfileGen] 🚀 Initializing...');
        this.initialized = true;
    }

    /**
     * Generate unclaimed profile for a company
     */
    async generateProfile(companyData) {
        const profiles = getCollection('unclaimed_profiles');
        const slug = this.generateSlug(companyData.companyName);

        // Check if profile already exists
        const existing = await profiles.findOne({ slug });
        if (existing) {
            return { 
                success: false, 
                error: 'Profile already exists', 
                profileId: existing._id.toString(),
                profileUrl: `${process.env.FRONTEND_URL || 'https://greenchainz.com'}/supplier/${slug}`
            };
        }

        // Scrape company website if provided
        let scrapedData = {};
        if (companyData.website) {
            try {
                scrapedData = await this.scrapeCompanyWebsite(companyData.website);
                console.log(`[AutoProfileGen] ✅ Scraped data for ${companyData.companyName}`);
            } catch (err) {
                console.log(`[AutoProfileGen] ⚠️  Scraping failed for ${companyData.companyName}, using provided data only`);
            }
        }

        // Create profile
        const profile = {
            slug,
            status: 'unclaimed',
            companyName: companyData.companyName,
            website: companyData.website || scrapedData.website || '',
            contactEmail: companyData.contactEmail || '',
            contactName: companyData.contactName || '',
            
            description: scrapedData.description || companyData.description || 
                `${companyData.companyName} is a leading manufacturer in the sustainable building materials industry.`,
            logo: scrapedData.logo || companyData.logo || null,
            products: companyData.products || scrapedData.products || [],
            certifications: companyData.certifications || scrapedData.certifications || [],
            categories: companyData.categories || ['Sustainable Materials'],
            
            source: companyData.source || 'manual',
            claimToken: this.generateClaimToken(),
            
            // Analytics
            viewCount: 0,
            claimClickCount: 0,
            emailsSent: 0,
            
            createdAt: new Date(),
            updatedAt: new Date(),
            claimedAt: null,
            emailSentAt: null,
            lastViewedAt: null
        };

        const result = await profiles.insertOne(profile);
        const profileId = result.insertedId.toString();

        console.log(`[AutoProfileGen] ✅ Created unclaimed profile: ${slug}`);

        return {
            success: true,
            profileId,
            slug,
            claimUrl: `${process.env.FRONTEND_URL || 'https://greenchainz.com'}/claim/${profile.claimToken}`,
            profileUrl: `${process.env.FRONTEND_URL || 'https://greenchainz.com'}/supplier/${slug}`
        };
    }

    /**
     * Bulk generate profiles from list
     */
    async bulkGenerateProfiles(companiesList) {
        console.log(`[AutoProfileGen] 🎯 Starting bulk generation for ${companiesList.length} companies...`);
        
        const results = {
            success: [],
            failed: [],
            skipped: [],
            total: companiesList.length
        };

        for (let i = 0; i < companiesList.length; i++) {
            const company = companiesList[i];
            console.log(`[AutoProfileGen] Processing ${i + 1}/${companiesList.length}: ${company.companyName}`);
            
            try {
                const result = await this.generateProfile(company);
                
                if (result.success) {
                    results.success.push({
                        company: company.companyName,
                        profileUrl: result.profileUrl,
                        claimUrl: result.claimUrl
                    });
                } else if (result.error === 'Profile already exists') {
                    results.skipped.push({
                        company: company.companyName,
                        reason: 'Already exists'
                    });
                } else {
                    results.failed.push({
                        company: company.companyName,
                        error: result.error
                    });
                }

                // Rate limit: wait 2 seconds between companies
                await this.sleep(2000);
            } catch (err) {
                results.failed.push({
                    company: company.companyName,
                    error: err.message
                });
            }
        }

        console.log(`[AutoProfileGen] 🎉 Bulk generation complete: ${results.success.length}/${results.total} successful`);

        return results;
    }

    /**
     * Send "Your page is live" email
     */
    async sendProfileLiveEmail(profileId) {
        const profiles = getCollection('unclaimed_profiles');
        const { ObjectId } = require('mongodb');

        const profile = await profiles.findOne({ _id: new ObjectId(profileId) });
        if (!profile || !profile.contactEmail) {
            return { success: false, error: 'Profile not found or no email' };
        }

        if (profile.emailSentAt) {
            return { success: false, error: 'Email already sent' };
        }

        const emailContent = this.generateProfileLiveEmail(profile);

        try {
            await this.emailSender.send({
                to: profile.contactEmail,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text
            });

            // Update email sent timestamp
            await profiles.updateOne(
                { _id: new ObjectId(profileId) },
                { 
                    $set: { emailSentAt: new Date() },
                    $inc: { emailsSent: 1 }
                }
            );

            console.log(`[AutoProfileGen] 📧 Sent "page is live" email to ${profile.contactEmail}`);

            return { success: true };
        } catch (err) {
            console.error(`[AutoProfileGen] ❌ Failed to send email:`, err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Bulk send emails to all unclaimed profiles
     */
    async bulkSendEmails(options = {}) {
        const profiles = getCollection('unclaimed_profiles');
        
        const query = { 
            status: 'unclaimed',
            contactEmail: { $exists: true, $ne: '' }
        };

        if (!options.resend) {
            query.emailSentAt = null;
        }

        const unclaimedProfiles = await profiles.find(query).toArray();
        
        console.log(`[AutoProfileGen] 📨 Sending emails to ${unclaimedProfiles.length} profiles...`);

        let sent = 0;
        let failed = 0;

        for (const profile of unclaimedProfiles) {
            const result = await this.sendProfileLiveEmail(profile._id.toString());
            if (result.success) {
                sent++;
            } else {
                failed++;
            }

            // Rate limit
            await this.sleep(3000);
        }

        return { sent, failed, total: unclaimedProfiles.length };
    }

    /**
     * Generate "Your page is live" email content
     */
    generateProfileLiveEmail(profile) {
        const claimUrl = `${process.env.FRONTEND_URL || 'https://greenchainz.com'}/claim/${profile.claimToken}`;
        const profileUrl = `${process.env.FRONTEND_URL || 'https://greenchainz.com'}/supplier/${profile.slug}`;

        const subject = `Your GreenChainz profile is live (did you know?)`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content { 
            padding: 40px 30px; 
        }
        .content p {
            margin: 15px 0;
        }
        .cta-button { 
            display: inline-block; 
            background: #10b981; 
            color: white !important; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 700;
            font-size: 16px;
            margin: 25px 0;
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
            transition: all 0.3s;
        }
        .cta-button:hover {
            background: #059669;
            box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
        }
        .benefits { 
            background: #f0fdf4; 
            padding: 25px; 
            border-radius: 8px; 
            margin: 25px 0;
            border-left: 4px solid #10b981;
        }
        .benefits h3 {
            margin-top: 0;
            color: #059669;
            font-size: 18px;
        }
        .benefit-item { 
            margin: 12px 0; 
            padding-left: 30px; 
            position: relative;
            color: #1f2937;
        }
        .benefit-item:before { 
            content: "✓"; 
            position: absolute; 
            left: 0; 
            color: #10b981; 
            font-weight: bold;
            font-size: 20px;
        }
        .profile-preview { 
            border: 2px solid #10b981; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 25px 0; 
            background: #f9fafb;
            text-align: center;
        }
        .profile-preview a {
            color: #059669;
            text-decoration: none;
            font-weight: 600;
            word-break: break-all;
        }
        .footer { 
            text-align: center; 
            padding: 30px; 
            color: #6b7280; 
            font-size: 14px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
        }
        .footer a {
            color: #6b7280;
            text-decoration: underline;
        }
        ul {
            padding-left: 20px;
        }
        ul li {
            margin: 8px 0;
            color: #4b5563;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Your Profile is Live on GreenChainz</h1>
        </div>
        
        <div class="content">
            <p>Hi${profile.contactName ? ' ' + profile.contactName : ''},</p>
            
            <p>I noticed <strong>${profile.companyName}</strong> wasn't on GreenChainz yet, so I went ahead and created your profile.</p>
            
            <div class="profile-preview">
                <strong>📍 Your Profile:</strong><br>
                <a href="${profileUrl}" target="_blank">${profileUrl}</a>
            </div>
            
            <p>Right now it's pulling basic info from your website, but you can <strong>claim it and customize it</strong> however you want:</p>
            
            <ul>
                <li>Add more products & certifications</li>
                <li>Update your brand story & messaging</li>
                <li>Upload photos & documentation</li>
                <li>Control how architects find you</li>
            </ul>
            
            <p><strong>Here's the cool part:</strong></p>
            
            <div class="benefits">
                <h3>🎁 Founding Partner Benefits</h3>
                <div class="benefit-item">FREE for 6 months (zero fees, zero commissions)</div>
                <div class="benefit-item">Lifetime "Founding Partner" badge on your profile</div>
                <div class="benefit-item">Priority placement in architect searches</div>
                <div class="benefit-item">Direct quote requests from verified buyers</div>
                <div class="benefit-item">Exclusive input on platform features</div>
            </div>
            
            <p>We're inviting our first <strong>50 suppliers</strong> to be "Founding Partners" with these exclusive benefits.</p>
            
            <p><strong>Want to claim your profile and join the Founding 50?</strong></p>
            
            <center>
                <a href="${claimUrl}" class="cta-button">👉 CLAIM YOUR PROFILE NOW</a>
            </center>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Or just leave it as-is - your call. But architects are already finding you on our platform.
            </p>
            
            <p style="margin-top: 30px;">Best regards,<br>
            <strong>Jerit Norville</strong><br>
            Founder, GreenChainz<br>
            <a href="https://greenchainz.com" style="color: #10b981; text-decoration: none;">greenchainz.com</a></p>
        </div>
        
        <div class="footer">
            <p><strong>Questions?</strong> Just reply to this email.</p>
            <p style="font-size: 12px; margin-top: 15px;">
                Not interested? <a href="${claimUrl}?action=remove">Remove your profile</a>
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const text = `
Your GreenChainz Profile is Live!

Hi${profile.contactName ? ' ' + profile.contactName : ''},

I noticed ${profile.companyName} wasn't on GreenChainz yet, so I went ahead and created your profile.

Here it is: ${profileUrl}

Right now it's pulling basic info from your website, but you can claim it and customize it however you want:
- Add more products & certifications
- Update your brand story & messaging
- Upload photos & documentation
- Control how architects find you

Here's the cool part:

We're inviting our first 50 suppliers to be "Founding Partners" with exclusive benefits:

✓ FREE for 6 months (zero fees, zero commissions)
✓ Lifetime "Founding Partner" badge on your profile
✓ Priority placement in architect searches
✓ Direct quote requests from verified buyers
✓ Exclusive input on platform features

Want to claim your profile and join the Founding 50?

Claim your profile here: ${claimUrl}

Or just leave it as-is - your call. But architects are already finding you on our platform.

Best regards,
Jerit Norville
Founder, GreenChainz
greenchainz.com

---
Questions? Just reply to this email.
Not interested? Remove your profile: ${claimUrl}?action=remove
        `;

        return { subject, html, text };
    }

    /**
     * Track profile view
     */
    async trackProfileView(slug) {
        const profiles = getCollection('unclaimed_profiles');
        
        await profiles.updateOne(
            { slug },
            { 
                $inc: { viewCount: 1 },
                $set: { lastViewedAt: new Date() }
            }
        );
    }

    /**
     * Track claim button click
     */
    async trackClaimClick(slug) {
        const profiles = getCollection('unclaimed_profiles');
        
        await profiles.updateOne(
            { slug },
            { $inc: { claimClickCount: 1 } }
        );
    }

    /**
     * Process claim request - Step 1: Send verification code
     */
    async initiateClaimProcess(claimToken, claimData) {
        const profiles = getCollection('unclaimed_profiles');
        
        const profile = await profiles.findOne({ claimToken });
        
        if (!profile) {
            return { success: false, error: 'Invalid claim token' };
        }

        if (profile.status !== 'unclaimed') {
            return { success: false, error: 'Profile already claimed' };
        }

        // Generate verification code
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Update profile with verification code
        await profiles.updateOne(
            { claimToken },
            { 
                $set: { 
                    verificationCode,
                    verificationEmail: claimData.email,
                    verificationSentAt: new Date(),
                    verificationExpiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
                }
            }
        );

        // Send verification email
        try {
            await this.emailSender.send({
                to: claimData.email,
                subject: `Verify your GreenChainz profile claim`,
                html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 500px; margin: 40px auto; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .code-box { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #059669; font-family: monospace; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <h2 style="color: #059669;">🔐 Verification Code</h2>
        <p>Your verification code to claim <strong>${profile.companyName}</strong>'s profile is:</p>
        
        <div class="code-box">
            <div class="code">${verificationCode}</div>
        </div>
        
        <p>Enter this code to complete your claim.</p>
        <p style="font-size: 14px; color: #6b7280;">This code expires in 30 minutes.</p>
        
        <div class="footer">
            <p>Didn't request this? Ignore this email.</p>
        </div>
    </div>
</body>
</html>
                `,
                text: `
Verification Code for GreenChainz Profile Claim

Your verification code to claim ${profile.companyName}'s profile is:

${verificationCode}

Enter this code to complete your claim.
This code expires in 30 minutes.

Didn't request this? Ignore this email.
                `
            });

            console.log(`[AutoProfileGen] 📧 Sent verification code to ${claimData.email}`);

            return { 
                success: true, 
                message: 'Verification code sent',
                email: claimData.email
            };
        } catch (err) {
            console.error(`[AutoProfileGen] ❌ Failed to send verification email:`, err.message);
            return { success: false, error: 'Failed to send verification email' };
        }
    }

    /**
     * Verify claim with code - Step 2: Complete claim
     */
    async verifyClaim(claimToken, verificationCode, userData) {
        const profiles = getCollection('unclaimed_profiles');
        const suppliers = getCollection('suppliers');
        const { ObjectId } = require('mongodb');
        
        const profile = await profiles.findOne({ 
            claimToken,
            verificationCode: verificationCode.toUpperCase()
        });

        if (!profile) {
            return { success: false, error: 'Invalid verification code' };
        }

        // Check if verification code expired
        if (profile.verificationExpiresAt && profile.verificationExpiresAt < new Date()) {
            return { success: false, error: 'Verification code expired' };
        }

        // Create actual supplier account
        const supplier = {
            companyName: profile.companyName,
            slug: profile.slug,
            website: profile.website,
            description: profile.description,
            logo: profile.logo,
            products: profile.products,
            certifications: profile.certifications,
            categories: profile.categories,
            
            contactEmail: userData.email,
            contactName: userData.name || profile.contactName,
            contactPhone: userData.phone || '',
            
            // Founding Partner Benefits
            isFoundingPartner: true,
            foundingPartnerBadge: true,
            commissionFreeUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
            priorityPlacement: true,
            
            status: 'active',
            verified: true,
            
            claimedFrom: profile._id.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await suppliers.insertOne(supplier);
        const supplierId = result.insertedId.toString();

        // Update unclaimed profile
        await profiles.updateOne(
            { claimToken },
            { 
                $set: { 
                    status: 'claimed',
                    claimedAt: new Date(),
                    claimedBy: supplierId
                }
            }
        );

        console.log(`[AutoProfileGen] 🎉 Profile claimed: ${profile.companyName}`);

        // Send welcome email
        await this.sendWelcomeEmail(supplier, supplierId);

        return {
            success: true,
            supplierId,
            message: 'Profile claimed successfully!',
            isFoundingPartner: true,
            dashboardUrl: `${process.env.FRONTEND_URL || 'https://greenchainz.com'}/dashboard/supplier`
        };
    }

    /**
     * Send welcome email after successful claim
     */
    async sendWelcomeEmail(supplier, supplierId) {
        try {
            await this.emailSender.send({
                to: supplier.contactEmail,
                subject: '🎊 Welcome to the Founding 50!',
                html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; }
        .content { padding: 40px 30px; }
        .badge { display: inline-block; background: #f0fdf4; border: 2px solid #10b981; color: #059669; padding: 12px 20px; border-radius: 50px; font-weight: bold; margin: 15px 0; }
        .benefits { background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .benefit-item { margin: 12px 0; padding-left: 30px; position: relative; }
        .benefit-item:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 20px; }
        .cta { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to the Founding 50!</h1>
        </div>
        <div class="content">
            <p>Hi ${supplier.contactName || 'there'},</p>
            
            <p><strong>You're IN!</strong></p>
            
            <p>You are now officially one of the <strong>Founding 50 partners</strong> of GreenChainz.</p>
            
            <center>
                <div class="badge">💎 FOUNDING PARTNER</div>
            </center>
            
            <div class="benefits">
                <strong>Your Benefits Are Now Active:</strong>
                <div class="benefit-item">Lifetime Founding Partner badge on your profile</div>
                <div class="benefit-item">ZERO fees & commissions for 6 months</div>
                <div class="benefit-item">Priority placement in search results</div>
                <div class="benefit-item">Direct access to architect RFQs</div>
                <div class="benefit-item">Exclusive platform feature input</div>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Complete your profile (add products, photos, certifications)</li>
                <li>Set up your product catalog</li>
                <li>Review your first quote requests</li>
            </ol>
            
            <center>
                <a href="${process.env.FRONTEND_URL || 'https://greenchainz.com'}/dashboard/supplier" class="cta">GO TO YOUR DASHBOARD</a>
            </center>
            
            <p style="margin-top: 30px;">Need help getting started? Hit reply and I'll personally walk you through it.</p>
            
            <p>Welcome to the movement.</p>
            
            <p><strong>Jerit Norville</strong><br>
            Founder, GreenChainz</p>
        </div>
    </div>
</body>
</html>
                `
            });

            console.log(`[AutoProfileGen] 📧 Sent welcome email to ${supplier.contactEmail}`);
        } catch (err) {
            console.error(`[AutoProfileGen] ⚠️  Failed to send welcome email:`, err.message);
        }
    }

    /**
     * Get analytics for unclaimed profiles
     */
    async getAnalytics() {
        const profiles = getCollection('unclaimed_profiles');

        const [total, byStatus, topViewed, recentlyClaimed] = await Promise.all([
            profiles.countDocuments({}),
            profiles.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]).toArray(),
            profiles.find({})
                .sort({ viewCount: -1 })
                .limit(10)
                .toArray(),
            profiles.find({ status: 'claimed' })
                .sort({ claimedAt: -1 })
                .limit(10)
                .toArray()
        ]);

        const statusMap = byStatus.reduce((acc, s) => {
            acc[s._id] = s.count;
            return acc;
        }, {});

        const unclaimed = statusMap.unclaimed || 0;
        const claimed = statusMap.claimed || 0;

        return {
            totalProfiles: total,
            unclaimed,
            claimed,
            conversionRate: total > 0 ? parseFloat(((claimed / total) * 100).toFixed(1)) : 0,
            topViewedProfiles: topViewed.map(p => ({
                company: p.companyName,
                slug: p.slug,
                views: p.viewCount,
                claimClicks: p.claimClickCount,
                status: p.status,
                emailSent: !!p.emailSentAt
            })),
            recentlyClaimed: recentlyClaimed.map(p => ({
                company: p.companyName,
                claimedAt: p.claimedAt,
                daysSinceCreated: Math.floor((p.claimedAt - p.createdAt) / (1000 * 60 * 60 * 24))
            }))
        };
    }

    /**
     * Get profile by slug
     */
    async getProfile(slug) {
        const profiles = getCollection('unclaimed_profiles');
        return profiles.findOne({ slug });
    }

    /**
     * Get profile by claim token
     */
    async getProfileByClaimToken(claimToken) {
        const profiles = getCollection('unclaimed_profiles');
        return profiles.findOne({ claimToken });
    }

    /**
     * List all unclaimed profiles
     */
    async listProfiles(filters = {}) {
        const profiles = getCollection('unclaimed_profiles');
        
        const query = {};
        if (filters.status) query.status = filters.status;
        if (filters.emailSent !== undefined) {
            query.emailSentAt = filters.emailSent ? { $ne: null } : null;
        }

        const limit = parseInt(filters.limit) || 50;
        const skip = parseInt(filters.offset) || 0;

        const [results, total] = await Promise.all([
            profiles.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            profiles.countDocuments(query)
        ]);

        return {
            profiles: results,
            total,
            limit,
            offset: skip
        };
    }

    /**
     * Scrape company website for data
     */
    async scrapeCompanyWebsite(url) {
        try {
            // Add https if not present
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }

            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; GreenChainzBot/1.0; +https://greenchainz.com)'
                },
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);

            const data = {
                website: url,
                description: this.extractDescription($),
                logo: this.extractLogo($, url),
                products: this.extractProducts($),
                certifications: this.extractCertifications($)
            };

            return data;
        } catch (err) {
            console.error(`[AutoProfileGen] Scraping failed for ${url}:`, err.message);
            throw err;
        }
    }

    extractDescription($) {
        const metaDesc = $('meta[name="description"]').attr('content');
        if (metaDesc && metaDesc.length > 50) return metaDesc.substring(0, 500);

        const ogDesc = $('meta[property="og:description"]').attr('content');
        if (ogDesc && ogDesc.length > 50) return ogDesc.substring(0, 500);

        const firstP = $('p').first().text().trim();
        if (firstP && firstP.length > 50) {
            return firstP.substring(0, 500);
        }

        return '';
    }

    extractLogo($, baseUrl) {
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) return this.resolveUrl(ogImage, baseUrl);

        const headerLogo = $('header img[alt*="logo" i], .logo img, .header-logo img, .site-logo img').first().attr('src');
        if (headerLogo) return this.resolveUrl(headerLogo, baseUrl);

        const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').first().attr('href');
        if (favicon) return this.resolveUrl(favicon, baseUrl);

        return null;
    }

    extractProducts($) {
        const products = [];
        
        $('h2, h3, .product-name, .product-title, [class*="product"]').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.length > 5 && text.length < 150 && !products.includes(text)) {
                products.push(text);
            }
        });

        return products.slice(0, 10);
    }

    extractCertifications($) {
        const certs = [];
        const certKeywords = [
            'ISO 14001', 'ISO 9001',
            'LEED', 'BREEAM',
            'FSC', 'PEFC',
            'EPD', 'Environmental Product Declaration',
            'C2C', 'Cradle to Cradle',
            'B Corp', 'B Corporation',
            'Carbon Neutral', 'Carbon Negative',
            'Energy Star',
            'GreenGuard', 'Green Guard',
            'Living Building Challenge',
            'Passive House',
            'WELL Building'
        ];
        
        const bodyText = $('body').text();
        
        certKeywords.forEach(keyword => {
            if (bodyText.toLowerCase().includes(keyword.toLowerCase()) && !certs.includes(keyword)) {
                certs.push(keyword);
            }
        });

        return certs.slice(0, 10);
    }

    resolveUrl(url, baseUrl) {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('//')) return 'https:' + url;
        
        try {
            const base = new URL(baseUrl);
            return base.origin + (url.startsWith('/') ? url : '/' + url);
        } catch {
            return null;
        }
    }

    generateSlug(companyName) {
        return companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100);
    }

    generateClaimToken() {
        return Math.random().toString(36).substring(2) + 
               Date.now().toString(36) + 
               Math.random().toString(36).substring(2);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AutoProfileGenerator();
