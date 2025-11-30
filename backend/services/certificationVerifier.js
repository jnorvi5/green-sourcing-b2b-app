/**
 * Automated Certification Verification Service
 * 
 * Cross-references materials against multiple certification databases:
 * - FSC (Forest Stewardship Council)
 * - EPD International (Environmental Product Declarations)
 * - EC3 (Building Transparency)
 * - EcoPlatform (European EPDs)
 * 
 * Usage:
 *   const verifier = new CertificationVerifier(dbPool);
 *   const results = await verifier.verifyMaterial('recycled steel rebar');
 */

const EC3Provider = require('../providers/ec3');
const EPDInternationalProvider = require('../providers/epdInternational');
const FSCProvider = require('../providers/fsc');

class CertificationVerifier {
    constructor(dbPool) {
        this.dbPool = dbPool;

        // Initialize all providers (real APIs with mock fallback)
        this.providers = [
            new EPDInternationalProvider(),  // Priority 1 (most authoritative for EPDs)
            new EC3Provider(),                // Priority 2 (Building Transparency)
            new FSCProvider(),                // Priority 3 (Wood certifications)
        ];

        // Material -> Certification mapping (expandable)
        this.certificationMapping = {
            // Wood products
            'wood': ['FSC', 'PEFC', 'SFI'],
            'timber': ['FSC', 'PEFC', 'SFI'],
            'lumber': ['FSC', 'PEFC', 'SFI'],
            'plywood': ['FSC', 'PEFC', 'CARB'],
            'bamboo': ['FSC', 'USDA Organic'],

            // Metals
            'steel': ['EPD', 'ISO 14025', 'Cradle to Cradle'],
            'aluminum': ['EPD', 'ASI', 'ISO 14025'],
            'copper': ['EPD', 'ISO 14025'],
            'recycled steel': ['EPD', 'ISO 14025', 'SCS Recycled Content'],

            // Concrete & Cement
            'concrete': ['EPD', 'LEED', 'ISO 14025'],
            'cement': ['EPD', 'ISO 14025'],
            'rebar': ['EPD', 'ISO 14025'],

            // Insulation
            'insulation': ['EPD', 'GREENGUARD', 'Natureplus'],
            'cellulose': ['EPD', 'Natureplus', 'USDA BioPreferred'],
            'mineral wool': ['EPD', 'EUCEB', 'ISO 14025'],

            // Plastics & Composites
            'plastic': ['EPD', 'SCS Recycled Content', 'Ocean Bound Plastic'],
            'composite': ['EPD', 'FSC', 'ISO 14025'],

            // Glass
            'glass': ['EPD', 'Cradle to Cradle', 'ISO 14025'],

            // Textiles
            'textile': ['GOTS', 'OEKO-TEX', 'GRS'],
            'cotton': ['GOTS', 'BCI', 'USDA Organic'],
            'wool': ['RWS', 'GOTS', 'OEKO-TEX'],
        };
    }

    /**
     * Main verification method - searches all providers
     * @param {string} materialName - The material to verify (e.g., "recycled steel rebar")
     * @param {Object} options - Optional filters
     * @returns {Promise<Object>} - Aggregated verification results
     */
    async verifyMaterial(materialName, options = {}) {
        const startTime = Date.now();
        const results = {
            query: materialName,
            timestamp: new Date().toISOString(),
            suggestedCertifications: this.getSuggestedCertifications(materialName),
            providers: [],
            aggregatedResults: [],
            bestMatch: null,
            verificationScore: 0,
            processingTimeMs: 0
        };

        // Query all providers in parallel
        const providerPromises = this.providers.map(async (provider) => {
            try {
                let data = [];

                if (provider.search) {
                    // EPD/EC3 style search
                    data = await provider.search(materialName);
                } else if (provider.fetch) {
                    // FSC style fetch + filter
                    const allData = await provider.fetch();
                    data = allData.filter(item =>
                        item.certificate_holder?.toLowerCase().includes(materialName.toLowerCase()) ||
                        item.products?.some(p => p.toLowerCase().includes(materialName.toLowerCase()))
                    );
                }

                return {
                    provider: provider.name,
                    priority: provider.priority || 99,
                    found: data.length > 0,
                    count: data.length,
                    results: data,
                    error: null
                };
            } catch (error) {
                console.error(`[${provider.name}] Error:`, error.message);
                return {
                    provider: provider.name,
                    priority: provider.priority || 99,
                    found: false,
                    count: 0,
                    results: [],
                    error: error.message
                };
            }
        });

        const providerResults = await Promise.all(providerPromises);
        results.providers = providerResults;

        // Aggregate and deduplicate results
        results.aggregatedResults = this.aggregateResults(providerResults);

        // Find best match (highest confidence from highest priority provider)
        results.bestMatch = this.findBestMatch(results.aggregatedResults);

        // Calculate verification score
        results.verificationScore = this.calculateVerificationScore(results);

        results.processingTimeMs = Date.now() - startTime;

        return results;
    }

    /**
     * Get suggested certifications based on material type
     */
    getSuggestedCertifications(materialName) {
        const normalized = materialName.toLowerCase();
        const suggestions = new Set();

        for (const [keyword, certs] of Object.entries(this.certificationMapping)) {
            if (normalized.includes(keyword)) {
                certs.forEach(cert => suggestions.add(cert));
            }
        }

        return Array.from(suggestions);
    }

    /**
     * Aggregate results from multiple providers, deduplicate by EPD number
     */
    aggregateResults(providerResults) {
        const aggregated = new Map();

        for (const providerResult of providerResults) {
            if (!providerResult.found) continue;

            for (const item of providerResult.results) {
                const key = item.epd_number || item.certificate_code || item.certificateNumber;

                if (!key) continue;

                if (!aggregated.has(key)) {
                    aggregated.set(key, {
                        id: key,
                        sources: [],
                        data: item,
                        confidence: item.confidence_score || 0.5
                    });
                }

                aggregated.get(key).sources.push(providerResult.provider);

                // Use highest confidence score
                if ((item.confidence_score || 0.5) > aggregated.get(key).confidence) {
                    aggregated.get(key).confidence = item.confidence_score;
                    aggregated.get(key).data = item;
                }
            }
        }

        return Array.from(aggregated.values())
            .sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Find the best match from aggregated results
     */
    findBestMatch(aggregatedResults) {
        if (aggregatedResults.length === 0) return null;

        const best = aggregatedResults[0];

        return {
            id: best.id,
            productName: best.data.product_name || best.data.certificateHolder,
            manufacturer: best.data.manufacturer || best.data.certificate_holder,
            certifications: best.data.certifications || [],
            gwp: best.data.gwp_fossil_a1_a3,
            recycledContent: best.data.recycled_content_pct,
            validUntil: best.data.validity_end || best.data.expiryDate,
            confidence: best.confidence,
            verifiedBy: best.sources,
            dataSourceUrl: best.data.data_source_url
        };
    }

    /**
     * Calculate overall verification score (0-100)
     */
    calculateVerificationScore(results) {
        let score = 0;

        // Points for finding results
        if (results.aggregatedResults.length > 0) score += 30;
        if (results.aggregatedResults.length > 2) score += 10;

        // Points for multiple provider confirmation
        const multiSourceResults = results.aggregatedResults.filter(r => r.sources.length > 1);
        if (multiSourceResults.length > 0) score += 20;

        // Points for best match confidence
        if (results.bestMatch) {
            score += Math.round(results.bestMatch.confidence * 30);
        }

        // Points for valid certification dates
        if (results.bestMatch?.validUntil) {
            const validUntil = new Date(results.bestMatch.validUntil);
            if (validUntil > new Date()) score += 10;
        }

        return Math.min(score, 100);
    }

    /**
     * Verify a specific product by ID
     */
    async verifyProduct(productId) {
        // Get product details
        const productQuery = await this.dbPool.query(
            `SELECT p.*, c.CategoryName, 
              array_agg(pmc.MaterialName) as materials
       FROM Products p
       LEFT JOIN Product_Categories c ON p.CategoryID = c.CategoryID
       LEFT JOIN Product_Materials_Composition pmc ON p.ProductID = pmc.ProductID
       WHERE p.ProductID = $1
       GROUP BY p.ProductID, c.CategoryName`,
            [productId]
        );

        if (productQuery.rows.length === 0) {
            throw new Error(`Product ${productId} not found`);
        }

        const product = productQuery.rows[0];
        const verificationResults = [];

        // Verify each material
        const materials = product.materials?.filter(m => m) || [product.productname];

        for (const material of materials) {
            const result = await this.verifyMaterial(material);
            verificationResults.push({
                material,
                verification: result
            });
        }

        // Log verification event
        await this.logVerificationEvent(productId, verificationResults);

        return {
            product,
            verifications: verificationResults,
            overallScore: this.calculateOverallProductScore(verificationResults)
        };
    }

    /**
     * Log verification to API_Verification_Log
     */
    async logVerificationEvent(productId, results) {
        const bestResult = results.find(r => r.verification.bestMatch);

        await this.dbPool.query(
            `INSERT INTO API_Verification_Log 
       (EntityType, EntityID, APIProvider, RequestPayload, ResponsePayload, VerificationStatus)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'Product',
                productId,
                'CertificationVerifier',
                JSON.stringify({ materials: results.map(r => r.material) }),
                JSON.stringify(results),
                bestResult ? 'VERIFIED' : 'PENDING'
            ]
        );
    }

    /**
     * Calculate overall product verification score
     */
    calculateOverallProductScore(verificationResults) {
        if (verificationResults.length === 0) return 0;

        const scores = verificationResults.map(r => r.verification.verificationScore);
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    /**
     * Batch verify multiple products
     */
    async batchVerify(productIds) {
        const results = [];

        for (const productId of productIds) {
            try {
                const result = await this.verifyProduct(productId);
                results.push({ productId, success: true, result });
            } catch (error) {
                results.push({ productId, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Quick lookup - just returns certifications for a material name
     * (The "fill in the blank" method)
     */
    async quickLookup(materialName) {
        const result = await this.verifyMaterial(materialName);

        return {
            material: materialName,
            found: result.aggregatedResults.length > 0,
            certifications: result.suggestedCertifications,
            bestMatch: result.bestMatch ? {
                name: result.bestMatch.productName,
                manufacturer: result.bestMatch.manufacturer,
                epdNumber: result.bestMatch.id,
                gwp: result.bestMatch.gwp,
                recycledContent: result.bestMatch.recycledContent,
                validUntil: result.bestMatch.validUntil,
                link: result.bestMatch.dataSourceUrl
            } : null,
            confidence: result.verificationScore
        };
    }
}

module.exports = CertificationVerifier;
