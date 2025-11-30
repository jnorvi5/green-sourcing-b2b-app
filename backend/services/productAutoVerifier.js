/**
 * Product Auto-Verification Service
 * 
 * Automatically triggers certification verification when:
 * - A new product is added
 * - A product is updated with new materials
 * - Scheduled re-verification (cron job)
 * 
 * This service hooks into the product lifecycle and ensures
 * all materials are cross-referenced against certification databases.
 */

const CertificationVerifier = require('./certificationVerifier');

class ProductAutoVerifier {
    constructor(dbPool) {
        this.dbPool = dbPool;
        this.verifier = new CertificationVerifier(dbPool);
    }

    /**
     * Automatically verify a product after creation/update
     * Call this from the product routes after INSERT/UPDATE
     */
    async onProductCreated(productId, productData) {
        console.log(`[AutoVerify] Product ${productId} created, starting verification...`);

        try {
            // Extract materials from product data
            const materials = this.extractMaterials(productData);

            if (materials.length === 0) {
                console.log(`[AutoVerify] No materials found for product ${productId}`);
                return { verified: false, reason: 'No materials to verify' };
            }

            // Verify each material
            const verificationResults = [];
            for (const material of materials) {
                const result = await this.verifier.quickLookup(material);
                verificationResults.push({
                    material,
                    ...result
                });
            }

            // Store verification results
            await this.storeVerificationResults(productId, verificationResults);

            // Update product verification status
            await this.updateProductVerificationStatus(productId, verificationResults);

            // Log event
            await this.logVerificationEvent(productId, 'AUTO_VERIFIED', verificationResults);

            console.log(`[AutoVerify] Product ${productId} verification complete`);

            return {
                verified: true,
                productId,
                materials: materials.length,
                results: verificationResults
            };
        } catch (error) {
            console.error(`[AutoVerify] Error verifying product ${productId}:`, error);
            await this.logVerificationEvent(productId, 'VERIFICATION_FAILED', { error: error.message });
            return { verified: false, error: error.message };
        }
    }

    /**
     * Re-verify a product (for updates or scheduled checks)
     */
    async onProductUpdated(productId) {
        console.log(`[AutoVerify] Product ${productId} updated, re-verifying...`);

        try {
            // Get current product data
            const productQuery = await this.dbPool.query(
                `SELECT p.*, 
                array_agg(DISTINCT pmc.MaterialName) FILTER (WHERE pmc.MaterialName IS NOT NULL) as materials
         FROM Products p
         LEFT JOIN Product_Materials_Composition pmc ON p.ProductID = pmc.ProductID
         WHERE p.ProductID = $1
         GROUP BY p.ProductID`,
                [productId]
            );

            if (productQuery.rows.length === 0) {
                return { verified: false, reason: 'Product not found' };
            }

            const product = productQuery.rows[0];
            return this.onProductCreated(productId, {
                productName: product.productname,
                materials: product.materials || []
            });
        } catch (error) {
            console.error(`[AutoVerify] Error re-verifying product ${productId}:`, error);
            return { verified: false, error: error.message };
        }
    }

    /**
     * Extract material names from product data
     */
    extractMaterials(productData) {
        const materials = new Set();

        // From materials array
        if (Array.isArray(productData.materials)) {
            productData.materials.forEach(m => {
                if (m && typeof m === 'string') materials.add(m.trim());
                else if (m && m.name) materials.add(m.name.trim());
                else if (m && m.materialName) materials.add(m.materialName.trim());
            });
        }

        // From product name (extract keywords)
        if (productData.productName) {
            const keywords = this.extractMaterialKeywords(productData.productName);
            keywords.forEach(k => materials.add(k));
        }

        // From description
        if (productData.description) {
            const keywords = this.extractMaterialKeywords(productData.description);
            keywords.forEach(k => materials.add(k));
        }

        return Array.from(materials);
    }

    /**
     * Extract material keywords from text
     */
    extractMaterialKeywords(text) {
        const materialKeywords = [
            'steel', 'aluminum', 'aluminium', 'concrete', 'cement', 'wood', 'timber',
            'lumber', 'plywood', 'bamboo', 'glass', 'brick', 'insulation', 'gypsum',
            'drywall', 'rebar', 'copper', 'carpet', 'flooring', 'paint', 'coating',
            'clt', 'mass timber', 'mineral wool', 'spray foam', 'cellulose', 'fsc',
            'recycled', 'reclaimed', 'sustainable', 'low carbon', 'green'
        ];

        const found = [];
        const lower = text.toLowerCase();

        for (const keyword of materialKeywords) {
            if (lower.includes(keyword)) {
                found.push(keyword);
            }
        }

        return found;
    }

    /**
     * Store verification results in database
     */
    async storeVerificationResults(productId, results) {
        for (const result of results) {
            await this.dbPool.query(
                `INSERT INTO API_Verification_Log 
         (EntityType, EntityID, APIProvider, RequestPayload, ResponsePayload, VerificationStatus, Timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
                [
                    'Product',
                    productId,
                    'CertificationVerifier',
                    JSON.stringify({ material: result.material }),
                    JSON.stringify(result),
                    result.found ? 'VERIFIED' : 'PENDING'
                ]
            );
        }
    }

    /**
     * Update product's verification status
     */
    async updateProductVerificationStatus(productId, results) {
        const verifiedCount = results.filter(r => r.found).length;
        const totalCount = results.length;
        const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / totalCount;

        // Check if Products table has verification columns, add them if not
        try {
            await this.dbPool.query(`
        ALTER TABLE Products 
        ADD COLUMN IF NOT EXISTS VerificationStatus VARCHAR(50),
        ADD COLUMN IF NOT EXISTS VerificationScore INTEGER,
        ADD COLUMN IF NOT EXISTS LastVerifiedAt TIMESTAMP
      `);
        } catch (e) {
            // Columns may already exist
        }

        await this.dbPool.query(
            `UPDATE Products SET 
         VerificationStatus = $1,
         VerificationScore = $2,
         LastVerifiedAt = CURRENT_TIMESTAMP,
         UpdatedAt = CURRENT_TIMESTAMP
       WHERE ProductID = $3`,
            [
                verifiedCount === totalCount ? 'VERIFIED' :
                    verifiedCount > 0 ? 'PARTIAL' : 'UNVERIFIED',
                Math.round(avgConfidence),
                productId
            ]
        );
    }

    /**
     * Log verification event for audit trail
     */
    async logVerificationEvent(productId, eventType, data) {
        try {
            await this.dbPool.query(
                `INSERT INTO Product_Events 
         (ProductID, EventType, EventData, Timestamp)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                [productId, eventType, JSON.stringify(data)]
            );
        } catch (error) {
            console.error(`[AutoVerify] Failed to log event:`, error.message);
        }
    }

    /**
     * Batch verify all unverified products
     */
    async batchVerifyUnverified(limit = 50) {
        console.log(`[AutoVerify] Starting batch verification of unverified products...`);

        const unverifiedQuery = await this.dbPool.query(
            `SELECT ProductID FROM Products 
       WHERE VerificationStatus IS NULL OR VerificationStatus = 'UNVERIFIED'
       ORDER BY CreatedAt DESC
       LIMIT $1`,
            [limit]
        );

        const results = [];
        for (const row of unverifiedQuery.rows) {
            const result = await this.onProductUpdated(row.productid);
            results.push({ productId: row.productid, ...result });

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`[AutoVerify] Batch verification complete. Processed ${results.length} products.`);
        return results;
    }

    /**
     * Re-verify products with expiring certifications
     */
    async verifyExpiringCertifications(daysAhead = 30) {
        console.log(`[AutoVerify] Checking for expiring certifications in next ${daysAhead} days...`);

        // Find products with certifications expiring soon
        const expiringQuery = await this.dbPool.query(
            `SELECT DISTINCT p.ProductID, p.ProductName
       FROM Products p
       JOIN API_Verification_Log avl ON avl.EntityID = p.ProductID AND avl.EntityType = 'Product'
       WHERE avl.ResponsePayload::jsonb->'bestMatch'->>'validUntil' IS NOT NULL
         AND (avl.ResponsePayload::jsonb->'bestMatch'->>'validUntil')::date 
             BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::interval`,
            [`${daysAhead} days`]
        );

        const results = [];
        for (const row of expiringQuery.rows) {
            console.log(`[AutoVerify] Re-verifying product ${row.productid} (${row.productname}) - cert expiring soon`);
            const result = await this.onProductUpdated(row.productid);
            results.push({ productId: row.productid, productName: row.productname, ...result });
        }

        return results;
    }

    /**
     * Get verification summary for a supplier
     */
    async getSupplierVerificationSummary(supplierId) {
        const summaryQuery = await this.dbPool.query(
            `SELECT 
         COUNT(*) as total_products,
         COUNT(*) FILTER (WHERE VerificationStatus = 'VERIFIED') as verified_products,
         COUNT(*) FILTER (WHERE VerificationStatus = 'PARTIAL') as partial_products,
         COUNT(*) FILTER (WHERE VerificationStatus = 'UNVERIFIED' OR VerificationStatus IS NULL) as unverified_products,
         AVG(VerificationScore) as avg_score
       FROM Products
       WHERE SupplierID = $1`,
            [supplierId]
        );

        return summaryQuery.rows[0];
    }
}

module.exports = ProductAutoVerifier;
