/**
 * Products API Routes with Auto-Verification
 * 
 * When a product is created or updated, it automatically triggers
 * certification verification against FSC, EPD, and EC3 databases.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { mailerLite } = require('../services/mailerLite');

/**
 * POST /api/v1/products
 * Create a new product with automatic verification
 */
router.post('/', authenticateToken, authorizeRoles('Supplier', 'Admin'), async (req, res) => {
    const pool = req.app.locals.pool;
    const autoVerifier = req.app.locals.autoVerifier;

    try {
        const {
            name,
            description,
            category,
            materials,
            epdUrl,
            fscCertNumber,
            recycledContent,
            gwpValue,
            unit,
            pricePerUnit
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Product name is required' });
        }

        // Get supplier ID from authenticated user
        const userCheck = await pool.query(`
      SELECT s.SupplierID, u.Email, u.FirstName, c.CompanyName
      FROM Users u
      JOIN Suppliers s ON u.CompanyID = s.CompanyID
      JOIN Companies c ON u.CompanyID = c.CompanyID
      WHERE u.UserID = $1
    `, [req.user.userId]);

        if (userCheck.rows.length === 0) {
            return res.status(400).json({ error: 'No supplier account linked to your user' });
        }

        const { supplierid, email, firstname, companyname } = userCheck.rows[0];

        // Insert product
        const result = await pool.query(`
      INSERT INTO Products (
        SupplierID, Name, Description, Category, 
        EPD_URL, FSC_Cert_Number, RecycledContent, 
        GWP_Value, Unit, PricePerUnit, CreatedAt
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING ProductID, Name, Description, Category, SupplierID, CreatedAt
    `, [
            supplierid, name, description, category,
            epdUrl, fscCertNumber, recycledContent,
            gwpValue, unit, pricePerUnit
        ]);

        const product = result.rows[0];

        // Insert materials if provided
        if (materials && Array.isArray(materials) && materials.length > 0) {
            for (const material of materials) {
                const materialName = typeof material === 'string' ? material : material.name;
                const percentage = typeof material === 'object' ? material.percentage : null;

                await pool.query(`
          INSERT INTO Product_Materials_Composition (ProductID, MaterialName, Percentage)
          VALUES ($1, $2, $3)
        `, [product.productid, materialName, percentage]);
            }
        }

        // ==========================================
        // AUTO-VERIFICATION TRIGGER
        // ==========================================
        let verificationResult = null;
        if (autoVerifier) {
            console.log(`[Products] Triggering auto-verification for product ${product.productid}`);

            verificationResult = await autoVerifier.onProductCreated(product.productid, {
                productName: name,
                description,
                materials: materials || [],
                fscCertNumber,
                epdUrl
            });

            // Notify supplier via MailerLite if verification complete
            if (verificationResult && verificationResult.verified) {
                try {
                    await mailerLite.onProductVerified(
                        { email },
                        { productName: name, productId: product.productid },
                        verificationResult.results || []
                    );
                } catch (emailErr) {
                    console.warn('[Products] MailerLite notification failed:', emailErr.message);
                }
            }
        }

        res.status(201).json({
            message: 'Product created successfully',
            product,
            verification: verificationResult || { pending: true, reason: 'Auto-verifier not available' }
        });

    } catch (err) {
        console.error('[Products] Create error:', err);
        res.status(500).json({ error: 'Failed to create product', details: err.message });
    }
});

/**
 * PUT /api/v1/products/:id
 * Update a product and re-verify
 */
router.put('/:id', authenticateToken, authorizeRoles('Supplier', 'Admin'), async (req, res) => {
    const pool = req.app.locals.pool;
    const autoVerifier = req.app.locals.autoVerifier;
    const productId = parseInt(req.params.id);

    try {
        const {
            name,
            description,
            category,
            materials,
            epdUrl,
            fscCertNumber,
            recycledContent,
            gwpValue,
            unit,
            pricePerUnit
        } = req.body;

        // Verify product belongs to this supplier (or admin)
        const ownerCheck = await pool.query(`
      SELECT p.ProductID, p.SupplierID, u.Email
      FROM Products p
      JOIN Suppliers s ON p.SupplierID = s.SupplierID
      JOIN Users u ON u.CompanyID = s.CompanyID
      WHERE p.ProductID = $1 AND (u.UserID = $2 OR $3 = 'Admin')
    `, [productId, req.user.userId, req.user.role]);

        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found or access denied' });
        }

        const { email } = ownerCheck.rows[0];

        // Update product
        const result = await pool.query(`
      UPDATE Products SET
        Name = COALESCE($1, Name),
        Description = COALESCE($2, Description),
        Category = COALESCE($3, Category),
        EPD_URL = COALESCE($4, EPD_URL),
        FSC_Cert_Number = COALESCE($5, FSC_Cert_Number),
        RecycledContent = COALESCE($6, RecycledContent),
        GWP_Value = COALESCE($7, GWP_Value),
        Unit = COALESCE($8, Unit),
        PricePerUnit = COALESCE($9, PricePerUnit),
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE ProductID = $10
      RETURNING ProductID, Name, Description, Category, SupplierID, UpdatedAt
    `, [
            name, description, category,
            epdUrl, fscCertNumber, recycledContent,
            gwpValue, unit, pricePerUnit, productId
        ]);

        const product = result.rows[0];

        // Update materials if provided
        if (materials && Array.isArray(materials)) {
            // Clear existing materials
            await pool.query('DELETE FROM Product_Materials_Composition WHERE ProductID = $1', [productId]);

            // Insert new materials
            for (const material of materials) {
                const materialName = typeof material === 'string' ? material : material.name;
                const percentage = typeof material === 'object' ? material.percentage : null;

                await pool.query(`
          INSERT INTO Product_Materials_Composition (ProductID, MaterialName, Percentage)
          VALUES ($1, $2, $3)
        `, [productId, materialName, percentage]);
            }
        }

        // ==========================================
        // RE-VERIFICATION TRIGGER
        // ==========================================
        let verificationResult = null;
        if (autoVerifier) {
            console.log(`[Products] Triggering re-verification for product ${productId}`);
            verificationResult = await autoVerifier.onProductUpdated(productId);

            // Notify supplier
            if (verificationResult && verificationResult.verified) {
                try {
                    await mailerLite.onProductVerified(
                        { email },
                        { productName: product.name, productId: product.productid },
                        verificationResult.results || []
                    );
                } catch (emailErr) {
                    console.warn('[Products] MailerLite notification failed:', emailErr.message);
                }
            }
        }

        res.json({
            message: 'Product updated successfully',
            product,
            verification: verificationResult || { pending: true }
        });

    } catch (err) {
        console.error('[Products] Update error:', err);
        res.status(500).json({ error: 'Failed to update product', details: err.message });
    }
});

/**
 * GET /api/v1/products
 * List all products with verification status
 */
router.get('/', async (req, res) => {
    const pool = req.app.locals.pool;

    try {
        const { supplierId, category, verified, limit = 50, offset = 0 } = req.query;

        let whereConditions = ['1=1'];
        const params = [];
        let paramIndex = 1;

        if (supplierId) {
            whereConditions.push(`p.SupplierID = $${paramIndex}`);
            params.push(supplierId);
            paramIndex++;
        }

        if (category) {
            whereConditions.push(`p.Category ILIKE $${paramIndex}`);
            params.push(`%${category}%`);
            paramIndex++;
        }

        if (verified !== undefined) {
            if (verified === 'true') {
                whereConditions.push(`p.VerificationStatus = 'VERIFIED'`);
            } else {
                whereConditions.push(`(p.VerificationStatus IS NULL OR p.VerificationStatus != 'VERIFIED')`);
            }
        }

        params.push(parseInt(limit));
        params.push(parseInt(offset));

        const query = `
      SELECT 
        p.ProductID, p.Name, p.Description, p.Category,
        p.EPD_URL, p.FSC_Cert_Number, p.RecycledContent,
        p.GWP_Value, p.Unit, p.PricePerUnit,
        p.VerificationStatus, p.VerificationScore, p.LastVerifiedAt,
        p.CreatedAt, p.UpdatedAt,
        c.CompanyName as SupplierName,
        array_agg(DISTINCT pmc.MaterialName) FILTER (WHERE pmc.MaterialName IS NOT NULL) as materials
      FROM Products p
      JOIN Suppliers s ON p.SupplierID = s.SupplierID
      JOIN Companies c ON s.CompanyID = c.CompanyID
      LEFT JOIN Product_Materials_Composition pmc ON p.ProductID = pmc.ProductID
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY p.ProductID, c.CompanyName
      ORDER BY p.CreatedAt DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        const result = await pool.query(query, params);

        const countQuery = await pool.query(
            `SELECT COUNT(DISTINCT p.ProductID) FROM Products p WHERE ${whereConditions.join(' AND ')}`,
            params.slice(0, paramIndex - 1)
        );

        res.json({
            total: parseInt(countQuery.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset),
            products: result.rows
        });

    } catch (err) {
        console.error('[Products] List error:', err);
        res.status(500).json({ error: 'Failed to list products' });
    }
});

/**
 * GET /api/v1/products/:id
 * Get single product with full verification details
 */
router.get('/:id', async (req, res) => {
    const pool = req.app.locals.pool;
    const productId = parseInt(req.params.id);

    try {
        const result = await pool.query(`
      SELECT 
        p.*,
        c.CompanyName as SupplierName,
        c.Address as SupplierAddress,
        array_agg(DISTINCT pmc.MaterialName) FILTER (WHERE pmc.MaterialName IS NOT NULL) as materials
      FROM Products p
      JOIN Suppliers s ON p.SupplierID = s.SupplierID
      JOIN Companies c ON s.CompanyID = c.CompanyID
      LEFT JOIN Product_Materials_Composition pmc ON p.ProductID = pmc.ProductID
      WHERE p.ProductID = $1
      GROUP BY p.ProductID, c.CompanyName, c.Address
    `, [productId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = result.rows[0];

        // Get verification history
        const verificationHistory = await pool.query(`
      SELECT APIProvider, VerificationStatus, ResponsePayload, Timestamp
      FROM API_Verification_Log
      WHERE EntityType = 'Product' AND EntityID = $1
      ORDER BY Timestamp DESC
      LIMIT 10
    `, [productId]);

        res.json({
            product,
            verificationHistory: verificationHistory.rows
        });

    } catch (err) {
        console.error('[Products] Get error:', err);
        res.status(500).json({ error: 'Failed to get product' });
    }
});

/**
 * POST /api/v1/products/:id/verify
 * Manually trigger verification for a product
 */
router.post('/:id/verify', authenticateToken, async (req, res) => {
    const pool = req.app.locals.pool;
    const autoVerifier = req.app.locals.autoVerifier;
    const productId = parseInt(req.params.id);

    try {
        if (!autoVerifier) {
            return res.status(503).json({ error: 'Auto-verification service not available' });
        }

        const result = await autoVerifier.onProductUpdated(productId);

        res.json({
            message: 'Verification triggered',
            productId,
            result
        });

    } catch (err) {
        console.error('[Products] Manual verify error:', err);
        res.status(500).json({ error: 'Failed to verify product' });
    }
});

/**
 * POST /api/v1/products/batch-verify
 * Batch verify unverified products (Admin only)
 */
router.post('/batch-verify', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    const autoVerifier = req.app.locals.autoVerifier;

    try {
        if (!autoVerifier) {
            return res.status(503).json({ error: 'Auto-verification service not available' });
        }

        const { limit = 50 } = req.body;
        const results = await autoVerifier.batchVerifyUnverified(limit);

        res.json({
            message: 'Batch verification complete',
            processed: results.length,
            results
        });

    } catch (err) {
        console.error('[Products] Batch verify error:', err);
        res.status(500).json({ error: 'Failed to batch verify products' });
    }
});

/**
 * DELETE /api/v1/products/:id
 * Delete a product
 */
router.delete('/:id', authenticateToken, authorizeRoles('Supplier', 'Admin'), async (req, res) => {
    const pool = req.app.locals.pool;
    const productId = parseInt(req.params.id);

    try {
        // Verify ownership
        const ownerCheck = await pool.query(`
      SELECT p.ProductID
      FROM Products p
      JOIN Suppliers s ON p.SupplierID = s.SupplierID
      JOIN Users u ON u.CompanyID = s.CompanyID
      WHERE p.ProductID = $1 AND (u.UserID = $2 OR $3 = 'Admin')
    `, [productId, req.user.userId, req.user.role]);

        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found or access denied' });
        }

        // Delete materials composition
        await pool.query('DELETE FROM Product_Materials_Composition WHERE ProductID = $1', [productId]);

        // Delete verification logs
        await pool.query('DELETE FROM API_Verification_Log WHERE EntityType = $1 AND EntityID = $2', ['Product', productId]);

        // Delete product
        await pool.query('DELETE FROM Products WHERE ProductID = $1', [productId]);

        res.json({ message: 'Product deleted successfully', productId });

    } catch (err) {
        console.error('[Products] Delete error:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
