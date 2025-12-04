#!/usr/bin/env node

/**
 * PROFILE GENERATION SCRIPT
 * 
 * Quick CLI tool to generate unclaimed profiles from a list
 * 
 * Usage:
 *   node scripts/generateProfiles.js companies.json
 *   node scripts/generateProfiles.js --csv companies.csv
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { connect } = require('../services/outreach/mongoDb');
const autoProfileGenerator = require('../services/autoProfileGenerator');

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node generateProfiles.js <file.json|file.csv>');
        console.log('\nExample JSON format:');
        console.log('[');
        console.log('  {');
        console.log('    "companyName": "EcoTimber Inc",');
        console.log('    "website": "https://ecotimber.com",');
        console.log('    "contactEmail": "sales@ecotimber.com",');
        console.log('    "contactName": "John Smith",');
        console.log('    "categories": ["Mass Timber", "Flooring"]');
        console.log('  }');
        console.log(']');
        console.log('\nExample CSV format:');
        console.log('companyName,website,contactEmail,contactName,categories');
        console.log('EcoTimber Inc,https://ecotimber.com,sales@ecotimber.com,John Smith,"Mass Timber,Flooring"');
        process.exit(1);
    }

    const filePath = args[0];
    
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
    }

    console.log('🚀 Starting profile generation...');
    console.log('File:', filePath);

    // Connect to MongoDB
    await connect();
    await autoProfileGenerator.initialize();

    let companies = [];

    // Parse input file
    if (filePath.endsWith('.json')) {
        const data = fs.readFileSync(filePath, 'utf8');
        companies = JSON.parse(data);
    } else if (filePath.endsWith('.csv')) {
        const data = fs.readFileSync(filePath, 'utf8');
        const records = parse(data, {
            columns: true,
            skip_empty_lines: true
        });
        
        companies = records.map(row => ({
            companyName: row.companyName,
            website: row.website,
            contactEmail: row.contactEmail,
            contactName: row.contactName,
            categories: row.categories ? row.categories.split(',').map(c => c.trim()) : []
        }));
    } else {
        console.error('Error: File must be .json or .csv');
        process.exit(1);
    }

    console.log(`Found ${companies.length} companies to process\n`);

    // Generate profiles
    const results = await autoProfileGenerator.bulkGenerateProfiles(companies);

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log(`Total: ${results.total}`);
    console.log(`✅ Success: ${results.success.length}`);
    console.log(`⚠️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.success.length > 0) {
        console.log('\n✅ Successfully created profiles:');
        results.success.forEach((r, i) => {
            console.log(`${i + 1}. ${r.company}`);
            console.log(`   Profile: ${r.profileUrl}`);
            console.log(`   Claim: ${r.claimUrl}`);
        });
    }

    if (results.skipped.length > 0) {
        console.log('\n⚠️  Skipped (already exists):');
        results.skipped.forEach((r, i) => {
            console.log(`${i + 1}. ${r.company} - ${r.reason}`);
        });
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed:');
        results.failed.forEach((r, i) => {
            console.log(`${i + 1}. ${r.company}: ${r.error}`);
        });
    }

    // Ask if user wants to send emails
    console.log('\n' + '='.repeat(60));
    console.log('Send "Your page is live" emails to all new profiles? (y/n)');
    
    process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
            console.log('\n📧 Sending emails...');
            const emailResults = await autoProfileGenerator.bulkSendEmails({ resend: false });
            console.log(`✅ Sent: ${emailResults.sent}`);
            console.log(`❌ Failed: ${emailResults.failed}`);
        }
        
        console.log('\n✨ Done!');
        process.exit(0);
    });
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
