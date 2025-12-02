#!/usr/bin/env node

/**
 * FOLLOW-UP EMAIL AUTOMATION SCRIPT
 * 
 * Sends automated follow-up emails to unclaimed profiles based on:
 * - Days since profile created
 * - Whether initial email was sent
 * - Current status
 * 
 * Schedule this with cron:
 *   0 9 * * * node scripts/sendFollowUps.js
 */

const { connect, getCollection } = require('../services/outreach/mongoDb');
const EmailSender = require('../services/outreach/emailSender');

const emailSender = new EmailSender();

const FOLLOW_UP_SEQUENCES = [
    {
        name: 'Day 1 Reminder',
        daysAfterCreated: 1,
        requiresInitialEmail: true,
        subject: 'Quick reminder: Claim your GreenChainz profile',
        getContent: (profile) => `
Hi${profile.contactName ? ' ' + profile.contactName : ''},

I saw you checked out your GreenChainz profile yesterday but haven't claimed it yet.

Just curious - is there something you'd like to see different?

Your profile: ${process.env.FRONTEND_URL || 'https://greenchainz.com'}/supplier/${profile.slug}

Or would you rather we just keep it as-is?

Either way is cool, but I wanted to make sure you had first dibs on controlling your brand presence.

Claim it here: ${process.env.FRONTEND_URL || 'https://greenchainz.com'}/claim/${profile.claimToken}

Let me know if you have questions!

Best,
Jerit Norville
Founder, GreenChainz
        `
    },
    {
        name: 'Day 3 Competitor FOMO',
        daysAfterCreated: 3,
        requiresInitialEmail: true,
        subject: 'Heads up: Your competitor just claimed their profile',
        getContent: (profile) => `
Hi${profile.contactName ? ' ' + profile.contactName : ''},

Quick update - we just accepted several ${profile.categories[0] || 'sustainable materials'} suppliers to our Founding 50 program.

They're getting:
✓ Zero fees for 6 months
✓ Lifetime Founding Partner badge
✓ Priority in search results

Meanwhile your profile is still unclaimed: ${process.env.FRONTEND_URL || 'https://greenchainz.com'}/supplier/${profile.slug}

Want to secure your spot?

👉 ${process.env.FRONTEND_URL || 'https://greenchainz.com'}/claim/${profile.claimToken}

Only 27 Founding Partner spots left.

Best,
Jerit Norville
GreenChainz
        `
    },
    {
        name: 'Day 7 Last Call',
        daysAfterCreated: 7,
        requiresInitialEmail: true,
        subject: '[URGENT] Your profile goes public in 48 hours',
        getContent: (profile) => `
Hi${profile.contactName ? ' ' + profile.contactName : ''},

Your GreenChainz profile has been in "preview mode" for a week.

In 48 hours, it goes fully public and architects can start requesting quotes.

If you want to control your messaging, add products, or join the Founding 50 program, now's the time.

After Friday, the profile stays as-is and Founding 50 closes.

Your call.

👉 Claim profile: ${process.env.FRONTEND_URL || 'https://greenchainz.com'}/claim/${profile.claimToken}

or

👉 Remove my profile: ${process.env.FRONTEND_URL || 'https://greenchainz.com'}/claim/${profile.claimToken}?action=remove

Best,
Jerit Norville
GreenChainz
        `
    },
    {
        name: 'Day 14 Leads Waiting',
        daysAfterCreated: 14,
        requiresInitialEmail: true,
        subject: 'You have (3) quote requests waiting',
        getContent: (profile) => `
Hi${profile.contactName ? ' ' + profile.contactName : ''},

Just FYI - you've got 3 architects who requested quotes from ${profile.companyName} through your GreenChainz profile.

Since you haven't claimed it yet, we're holding these leads.

Want us to send them to you?

👉 Claim profile to receive leads: ${process.env.FRONTEND_URL || 'https://greenchainz.com'}/claim/${profile.claimToken}

Best,
Jerit Norville
GreenChainz

P.S. These are real architects working on projects right now. Don't miss out.
        `
    }
];

async function sendFollowUps() {
    console.log('🤖 Starting follow-up automation...');

    await connect();
    const profiles = getCollection('unclaimed_profiles');

    let totalSent = 0;
    let totalFailed = 0;

    for (const sequence of FOLLOW_UP_SEQUENCES) {
        console.log(`\n📧 Processing: ${sequence.name}`);

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - sequence.daysAfterCreated);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find profiles that match criteria
        const query = {
            status: 'unclaimed',
            createdAt: {
                $gte: targetDate,
                $lt: nextDay
            },
            contactEmail: { $exists: true, $ne: '' },
            [`followUps.${sequence.name}`]: { $exists: false }
        };

        if (sequence.requiresInitialEmail) {
            query.emailSentAt = { $ne: null };
        }

        const matchingProfiles = await profiles.find(query).toArray();
        
        console.log(`   Found ${matchingProfiles.length} profiles`);

        for (const profile of matchingProfiles) {
            try {
                await emailSender.send({
                    to: profile.contactEmail,
                    subject: sequence.subject,
                    text: sequence.getContent(profile)
                });

                // Mark follow-up as sent
                await profiles.updateOne(
                    { _id: profile._id },
                    { 
                        $set: { 
                            [`followUps.${sequence.name}`]: new Date() 
                        }
                    }
                );

                totalSent++;
                console.log(`   ✅ Sent to ${profile.companyName}`);

                // Rate limit
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (err) {
                totalFailed++;
                console.error(`   ❌ Failed for ${profile.companyName}:`, err.message);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('FOLLOW-UP RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Sent: ${totalSent}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log('\n✨ Done!');
}

sendFollowUps()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
