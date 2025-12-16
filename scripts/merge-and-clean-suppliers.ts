import fs from 'fs';
import levenshtein from 'fast-levenshtein';
import { createClient } from '@supabase/supabase-js';

// Configuration
const isProduction = process.env['NODE_ENV'] === 'production';
const CONFIG = {
    similarityThreshold: 0.85,
    paths: {
        ec3: isProduction ? 'verification/ec3_suppliers.json' : 'verification/ec3_suppliers_mock.json',
        websites: isProduction ? 'verification/supplier_websites.json' : 'verification/supplier_websites_mock.json',
        gap: isProduction ? 'verification/gap_analysis.csv' : 'verification/gap_analysis_mock.csv',
        target: 'scripts/target-suppliers.csv',
        output: 'verification/cleaned_suppliers.json',
        report: 'verification/cleaning_report.md',
        invalidEpd: 'verification/invalid_epd_urls.csv'
    },
    supabase: {
        url: process.env['NEXT_PUBLIC_SUPABASE_URL'],
        key: process.env['SUPABASE_SERVICE_ROLE_KEY']
    },
    validateUrls: isProduction // Only validate URLs in production/real mode to save time/bandwidth in dev
};

// Types
interface SupplierRecord {
    supplier_name: string;
    website?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    headquarters_city?: string;
    headquarters_state?: string;
    masterformat_codes?: string[];
    has_epd: boolean;
    epd_url?: string;
    epd_url_valid?: boolean;
    certifications: string[];
    is_founding_50: boolean;
    quality_score: number;
    source: string;
    scraped_at?: string;
    description?: string;
    raw_data_sources: string[];
}

// Helpers
const cleanString = (str: string): string => {
    if (!str) return '';
    // Remove common legal entity suffixes and generic business words
    return str.toLowerCase()
        .replace(/\b(inc|llc|ltd|co|corp|corporation|company|solutions|technologies|group|international|global|systems|industries|products)\b\.?/g, '')
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
};

const getDomain = (url: string): string => {
    try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        return u.hostname.replace('www.', '');
    } catch {
        return '';
    }
};

// Main Class
class SupplierCleaner {
    suppliers: Map<string, SupplierRecord> = new Map(); // Key: Cleaned Name
    targetDomains: Set<string> = new Set();
    stats = {
        totalRaw: 0,
        duplicatesMerged: 0,
        finalCount: 0,
        founding50Matches: 0,
        invalidEpds: 0
    };

    async run() {
        console.log('🚀 Starting Supplier Cleaning & Deduplication...');
        console.log(`Environment: ${isProduction ? 'Production' : 'Development/Mock'}`);

        await this.loadTargetList();
        await this.processSources();
        await this.validateEpds();
        await this.calculateScores();
        await this.generateOutput();
        await this.syncToSupabase();

        console.log('✅ Done!');
    }

    async loadTargetList() {
        if (fs.existsSync(CONFIG.paths.target)) {
            const content = fs.readFileSync(CONFIG.paths.target, 'utf-8');
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                // Extract URL from lines like "https://www.roxul.com" or just domains if any
                if (trimmed && !trimmed.startsWith('#')) {
                    const domain = getDomain(trimmed);
                    if (domain) {
                        this.targetDomains.add(domain);
                        // Also add "base" domain (e.g. armstrong.com from www.armstrong.com)
                        const parts = domain.split('.');
                        if (parts.length > 2) {
                            // simplistic TLD handling, risky for .co.uk but ok for MVP
                            this.targetDomains.add(parts.slice(parts.length - 2).join('.'));
                        }
                    }
                }
            }
            console.log(`📋 Loaded ${this.targetDomains.size} Founding 50 target domains (including variations).`);
        } else {
            console.warn('⚠️ Target list not found.');
        }
    }

    async processSources() {
        // 1. Agent 2: Website Scrapes (Highest Priority)
        if (fs.existsSync(CONFIG.paths.websites)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.paths.websites, 'utf-8'));
            console.log(`📥 Processing ${data.length} website records...`);
            for (const record of data) {
                this.mergeRecord({
                    supplier_name: record.supplier_name,
                    website: record.website,
                    contact_email: record.contact_email,
                    contact_phone: record.contact_phone,
                    address: record.address,
                    description: record.description,
                    certifications: record.certifications || [],
                    has_epd: false, // Will be updated by EC3 data
                    is_founding_50: false,
                    quality_score: 0,
                    source: 'website_scrape',
                    scraped_at: new Date().toISOString(),
                    raw_data_sources: ['website_scrape'],
                    masterformat_codes: []
                });
            }
        }

        // 2. Agent 1: EC3 Data
        if (fs.existsSync(CONFIG.paths.ec3)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.paths.ec3, 'utf-8'));
            console.log(`📥 Processing ${data.length} EC3 records...`);
            for (const record of data) {
                this.mergeRecord({
                    supplier_name: record.supplier_name,
                    has_epd: true,
                    epd_url: record.epd_url,
                    certifications: ['EPD'], // Implicit
                    is_founding_50: false,
                    quality_score: 0,
                    source: 'ec3',
                    raw_data_sources: ['ec3'],
                    masterformat_codes: [], // Could infer from material_type
                    description: `Supplier of ${record.material_type} materials.`
                });
            }
        }

        // 3. Agent 3: Gap Analysis
        if (fs.existsSync(CONFIG.paths.gap)) {
            const content = fs.readFileSync(CONFIG.paths.gap, 'utf-8');
            const lines = content.split('\n').slice(1); // Skip header
            console.log(`📥 Processing ${lines.length} gap analysis records...`);
            for (const line of lines) {
                if (!line.trim()) continue;
                // Simple CSV parse (handling quotes roughly)
                const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (parts && parts.length >= 3) {
                    const name = parts[0].replace(/"/g, '');
                    const category = parts[1].replace(/"/g, '');
                    const code = parts[2].replace(/"/g, '');

                    this.mergeRecord({
                        supplier_name: name,
                        masterformat_codes: [code],
                        description: `Identified gap supplier for ${category}`,
                        certifications: [],
                        has_epd: false,
                        is_founding_50: false,
                        quality_score: 0,
                        source: 'gap_analysis',
                        raw_data_sources: ['gap_analysis']
                    });
                }
            }
        }
    }

    mergeRecord(newRecord: SupplierRecord) {
        this.stats.totalRaw++;

        // 1. Exact Name Match
        let matchKey = Object.keys(Object.fromEntries(this.suppliers)).find(k => k === newRecord.supplier_name);

        // 2. Fuzzy Match
        if (!matchKey) {
            const cleanNew = cleanString(newRecord.supplier_name);
            for (const [name, existing] of this.suppliers) {
                const cleanExisting = cleanString(name);
                const distance = levenshtein.get(cleanNew, cleanExisting);
                const maxLength = Math.max(cleanNew.length, cleanExisting.length);
                const similarity = 1 - (distance / maxLength);

                if (similarity >= CONFIG.similarityThreshold) {
                    matchKey = name;
                    break;
                }
            }
        }

        if (matchKey) {
            // MERGE
            this.stats.duplicatesMerged++;
            const existing = this.suppliers.get(matchKey)!;

            // Prefer Website data for core fields
            if (newRecord.source === 'website_scrape') {
                existing.website = newRecord.website || existing.website;
                existing.contact_email = newRecord.contact_email || existing.contact_email;
                existing.contact_phone = newRecord.contact_phone || existing.contact_phone;
                existing.address = newRecord.address || existing.address;
                existing.description = newRecord.description || existing.description;
            }

            // Append Arrays
            if (newRecord.certifications) {
                existing.certifications = [...new Set([...existing.certifications, ...newRecord.certifications])];
            }
            if (newRecord.masterformat_codes) {
                existing.masterformat_codes = [...new Set([...(existing.masterformat_codes || []), ...newRecord.masterformat_codes])];
            }

            // Flags
            existing.has_epd = existing.has_epd || newRecord.has_epd;
            existing.epd_url = existing.epd_url || newRecord.epd_url; // Prefer existing if present? No, usually EC3 is later or specific.

            existing.raw_data_sources.push(newRecord.source);

            this.suppliers.set(matchKey, existing);
        } else {
            // NEW
            this.suppliers.set(newRecord.supplier_name, newRecord);
        }
    }

    async validateEpds() {
        console.log('🔍 Validating EPD URLs...');
        const checkList: {name: string, url: string}[] = [];

        for (const [name, record] of this.suppliers) {
            if (record.epd_url) {
                checkList.push({ name, url: record.epd_url });
            }
        }

        let processed = 0;
        for (const item of checkList) {
            let isValid = false;

            if (CONFIG.validateUrls) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                    const response = await fetch(item.url, {
                        method: 'HEAD',
                        signal: controller.signal,
                        headers: { 'User-Agent': 'GreenChainz-Verifier/1.0' }
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        isValid = true;
                    } else if (response.status === 405) {
                        // Some servers block HEAD, try GET with range
                         const getRes = await fetch(item.url, {
                            method: 'GET',
                            headers: { 'Range': 'bytes=0-10' },
                            signal: controller.signal
                        });
                        isValid = getRes.ok;
                    }
                } catch (e) {
                    // console.warn(`Failed to validate ${item.url}:`, e);
                    isValid = false;
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                // Mock logic for dev
                isValid = !item.url.includes('invalid');
            }

            const record = this.suppliers.get(item.name)!;
            record.epd_url_valid = isValid;
            if (!isValid) this.stats.invalidEpds++;

            processed++;
            if (processed % 50 === 0) process.stdout.write('.');
        }
        process.stdout.write('\n');
    }

    async calculateScores() {
        console.log('📊 Calculating Quality Scores...');
        for (const [name, record] of this.suppliers) {
            let score = 0;
            if (record.website) score += 20;
            if (record.has_epd) score += 30;
            if (record.epd_url_valid) score += 10;
            if (record.contact_phone) score += 10;
            if (record.contact_email) score += 15;
            if (record.address) score += 10;
            if (record.certifications && record.certifications.length > 0) score += 5;

            record.quality_score = Math.min(score, 100);

            // Founding 50 Check
            if (record.website) {
                const domain = getDomain(record.website);
                let isMatch = this.targetDomains.has(domain);

                // Try base domain check too
                if (!isMatch) {
                     const parts = domain.split('.');
                     if (parts.length > 2) {
                         const base = parts.slice(parts.length - 2).join('.');
                         isMatch = this.targetDomains.has(base);
                     }
                }

                if (isMatch) {
                    record.is_founding_50 = true;
                    this.stats.founding50Matches++;
                }
            }
        }
    }

    async generateOutput() {
        const sortedSuppliers = Array.from(this.suppliers.values())
            .sort((a, b) => b.quality_score - a.quality_score);

        this.stats.finalCount = sortedSuppliers.length;

        // JSON
        fs.writeFileSync(CONFIG.paths.output, JSON.stringify(sortedSuppliers, null, 2));

        // CSV Invalid EPDs
        const invalidEpds = sortedSuppliers
            .filter(s => s.has_epd && !s.epd_url_valid && s.epd_url)
            .map(s => `${s.supplier_name},${s.epd_url}`)
            .join('\n');
        fs.writeFileSync(CONFIG.paths.invalidEpd, `supplier_name,epd_url\n${invalidEpds}`);

        // Markdown Report
        const report = `
# Supplier Data Cleaning Report

- **Date:** ${new Date().toISOString()}
- **Total Raw Records:** ${this.stats.totalRaw}
- **Duplicates Merged:** ${this.stats.duplicatesMerged}
- **Final Unique Suppliers:** ${this.stats.finalCount}
- **Founding 50 Matches:** ${this.stats.founding50Matches}
- **Invalid EPD URLs:** ${this.stats.invalidEpds}

## Top 10 Suppliers by Quality Score
${sortedSuppliers.slice(0, 10).map((s, i) => `${i+1}. **${s.supplier_name}** (Score: ${s.quality_score}) - ${s.source}`).join('\n')}
`;
        fs.writeFileSync(CONFIG.paths.report, report);
    }

    async syncToSupabase() {
        if (!CONFIG.supabase.url || !CONFIG.supabase.key) {
            console.log('⚠️ Skipping Supabase sync (Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
            return;
        }

        console.log('☁️ Syncing to Supabase...');
        const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key);

        const suppliers = JSON.parse(fs.readFileSync(CONFIG.paths.output, 'utf-8'));

        // Batch insert to avoid timeouts
        const BATCH_SIZE = 100;
        for (let i = 0; i < suppliers.length; i += BATCH_SIZE) {
            const batch = suppliers.slice(i, i + BATCH_SIZE).map((s: any) => ({
                // Mapping strictly to the requested "public.suppliers" table format
                // as per user instructions, even if it differs from other schema parts.

                supplier_name: s.supplier_name,
                website: s.website,
                contact_email: s.contact_email,
                contact_phone: s.contact_phone,
                headquarters_city: s.headquarters_city,   // Should be extracted if available
                headquarters_state: s.headquarters_state, // Should be extracted if available
                address: s.address, // Fallback/Additional
                description: s.description,

                // Arrays/JSONB fields
                masterformat_codes: s.masterformat_codes,
                certifications: s.certifications,

                // Flags and Scores
                has_epd: s.has_epd,
                epd_url: s.epd_url,
                epd_url_valid: s.epd_url_valid,
                is_founding_50: s.is_founding_50,
                quality_score: s.quality_score,
                source: s.source,
                scraped_at: s.scraped_at,

                // Ensure update timestamp
                updated_at: new Date().toISOString()
            }));

            // Insert into 'suppliers' table
            const { error } = await supabase
                .from('suppliers')
                .upsert(batch, { onConflict: 'supplier_name' });

            if (error) {
                console.error(`❌ Batch ${i} failed:`, error.message);
                // Fallback: Try 'suppliers' table if 'profiles' fails or is wrong target
                // console.log('Retrying with suppliers table...');
            } else {
                process.stdout.write(`+${batch.length}`);
            }
        }
        console.log('\n✅ Sync complete.');
    }
}

// Run
new SupplierCleaner().run().catch(console.error);
