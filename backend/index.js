const path = require('path');
// Load .env from the backend directory (supports running from different working directories)
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('./config/passport');
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('./middleware/auth');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const FSCMockProvider = require('./providers/fscMock');
const {
  computeSupplierScore,
  computeAllSupplierScores,
  persistSupplierScore,
  persistAllSupplierScores,
  getPersistedOrLiveScore
} = require('./services/verificationScore');
const { sendEmail, notificationsEnabled, setPool: setMailerPool } = require('./services/mailer');
const errorMonitoring = require('./services/errorMonitoring');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

// Enterprise middleware imports
const {
  helmetConfig,
  defaultLimiter,
  authLimiter,
  passwordResetLimiter,
  signupLimiter,
  apiLimiter,
  compressionMiddleware,
  sanitizeRequest,
  apiSecurityHeaders
} = require('./middleware/security');
const { logger, httpLogger, requestLogger, errorLogger } = require('./middleware/logger');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { initRedis, healthCheck: redisHealthCheck } = require('./services/redis');

// Supabase Auth Middleware (RBAC)
const {
  authenticateSupabase,
  ensureRole,
  ensureOwnership,
  adminOnly,
  supplierOnly,
  buyerOnly,
  authenticated
} = require('./middleware/supabaseAuth');

const app = express();

// Make db pool available to routes via app.locals
app.locals.pool = pool;

// ==========================================
// ENTERPRISE SECURITY MIDDLEWARE (First!)
// ==========================================

// Helmet security headers
app.use(helmetConfig);

// Compression
app.use(compressionMiddleware);

// Request sanitization
app.use(sanitizeRequest);

// API security headers
app.use(apiSecurityHeaders);

// HTTP request logging
app.use(httpLogger);

// Detailed request logging
app.use(requestLogger);

// Default rate limiting (all routes)
app.use(defaultLimiter);

// ==========================================
// END SECURITY MIDDLEWARE
// ==========================================

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

// Only create Supabase client if credentials are available
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('⚠️ Supabase credentials not configured - some features will be disabled');
}

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Startup logging
logger.info('GreenChainz API starting...', {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001
});

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'greenchainz-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static admin dashboard
app.use('/admin/dashboard', express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'GreenChainz Backend API is running!' });
});

// Enhanced health check with service status
app.get('/health', async (req, res) => {
  const redisStatus = await redisHealthCheck();
  let dbStatus = { status: 'unknown' };

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    dbStatus = { status: 'healthy', latency: `${Date.now() - start}ms` };
  } catch (err) {
    dbStatus = { status: 'unhealthy', error: err.message };
  }

  const health = {
    status: dbStatus.status === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Serve OpenAPI spec (YAML)
app.get('/api/docs', (req, res) => {
  try {
    const specPath = path.join(__dirname, 'openapi.yaml');
    const yaml = fs.readFileSync(specPath, 'utf8');
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml);
  } catch (e) {
    res.status(500).json({ error: 'Spec not found' });
  }
});

// Request password reset (with rate limiting)
app.post('/api/v1/auth/request-password-reset', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query('SELECT UserID, Email, FirstName as first_name FROM Users WHERE Email = $1', [email]);
    if (result.rows.length === 0) {
      // We don't want to reveal if an email exists or not for security reasons
      return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await pool.query(
      'UPDATE Users SET ResetToken = $1, ResetTokenExpiresAt = $2 WHERE UserID = $3',
      [resetToken, resetTokenExpires, user.userid]
    );

    // Trigger the password reset email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;
    if (supabase) {
      const { error: emailError } = await supabase.functions.invoke('handle-transactional-email', {
        body: {
          emailType: 'password-reset',
          payload: {
            to: user.email,
            userName: user.firstname || 'User',
            resetLink: resetLink,
          },
        },
      });

      if (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // We don't want to fail the request if the email fails to send
      }
    }

    res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });

  } catch (err) {
    console.error('Request password reset error:', err);
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Swagger UI at /docs (parses YAML once)
try {
  const specPath = path.join(__dirname, 'openapi.yaml');
  if (fs.existsSync(specPath)) {
    const raw = fs.readFileSync(specPath, 'utf8');
    const openapiDoc = YAML.parse(raw);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
    console.log('✅ Swagger UI available at /docs');
  } else {
    console.log('⚠️  openapi.yaml not found, skipping Swagger UI');
  }
} catch (e) {
  console.error('❌ Failed to initialize Swagger UI:', e.message);
}

// Upload Routes
// Upload Routes
// const uploadRouter = require('./routes/upload'); // Legacy direct upload
const presignedUploadRouter = require('./routes/presigned-upload');
app.use('/api/v1/upload', presignedUploadRouter); // Switched to S3 Presigned URLs
// app.use('/api/v1/presigned-upload', presignedUploadRouter); // Redundant

// Certification Verification Routes (Automated Cross-Reference)
const verifyRouter = require('./routes/verify');
app.use('/api/v1/verify', verifyRouter);

// MailerLite Routes (Email Automation)
const mailerliteRouter = require('./routes/mailerlite');
app.use('/api/v1/mailerlite', mailerliteRouter);

// Products Routes (with Auto-Verification)
const productsRouter = require('./routes/products');
app.use('/api/v1/products', productsRouter);

// ============================================
// SUPABASE AUTH PROTECTED ROUTES
// ============================================
// Note: These routes use Supabase JWT verification and role-based access control
// The verifySupabaseToken middleware validates the JWT from Supabase Auth
// The ensureRole middleware checks if user has required role from profiles table

// Protected Supplier Routes (Supabase Auth)
const supplierProtectedRouter = express.Router();
supplierProtectedRouter.use(authenticateSupabase);
supplierProtectedRouter.use(ensureRole('supplier', 'admin'));

// Supplier-only endpoints that require Supabase auth
supplierProtectedRouter.get('/my-products', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM Products p
       JOIN Suppliers s ON p.SupplierID = s.SupplierID
       JOIN Companies c ON s.CompanyID = c.CompanyID
       WHERE c.CompanyID = (
         SELECT company_id FROM public.profiles WHERE id = $1
       )`,
      [req.user.userId]
    );
    res.json({ products: result.rows });
  } catch (e) {
    logger.error('Get supplier products error:', e);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

supplierProtectedRouter.get('/my-rfqs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.* FROM RFQs r
       JOIN Suppliers s ON r.SupplierID = s.SupplierID
       JOIN Companies c ON s.CompanyID = c.CompanyID
       WHERE c.CompanyID = (
         SELECT company_id FROM public.profiles WHERE id = $1
       )
       ORDER BY r.CreatedAt DESC`,
      [req.user.userId]
    );
    res.json({ rfqs: result.rows });
  } catch (e) {
    logger.error('Get supplier RFQs error:', e);
    res.status(500).json({ error: 'Failed to get RFQs' });
  }
});

app.use('/api/v2/supplier', supplierProtectedRouter);

// Protected Buyer Routes (Supabase Auth)
const buyerProtectedRouter = express.Router();
buyerProtectedRouter.use(authenticateSupabase);
buyerProtectedRouter.use(ensureRole('buyer', 'admin'));

// Buyer-only endpoints
buyerProtectedRouter.get('/my-rfqs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, c.CompanyName as SupplierCompany
       FROM RFQs r
       JOIN Buyers b ON r.BuyerID = b.BuyerID
       LEFT JOIN Suppliers s ON r.SupplierID = s.SupplierID
       LEFT JOIN Companies c ON s.CompanyID = c.CompanyID
       WHERE b.UserID = (
         SELECT user_id FROM public.profiles WHERE id = $1
       )
       ORDER BY r.CreatedAt DESC`,
      [req.user.userId]
    );
    res.json({ rfqs: result.rows });
  } catch (e) {
    logger.error('Get buyer RFQs error:', e);
    res.status(500).json({ error: 'Failed to get RFQs' });
  }
});

buyerProtectedRouter.get('/saved-materials', async (req, res) => {
  try {
    // Placeholder for saved materials feature
    res.json({
      saved: [],
      message: 'Saved materials feature coming soon'
    });
  } catch (e) {
    logger.error('Get saved materials error:', e);
    res.status(500).json({ error: 'Failed to get saved materials' });
  }
});

app.use('/api/v2/buyer', buyerProtectedRouter);

// Protected Admin Routes (Supabase Auth)
const adminProtectedRouter = express.Router();
adminProtectedRouter.use(authenticateSupabase);
adminProtectedRouter.use(ensureRole('admin'));

// Admin-only endpoints
adminProtectedRouter.get('/all-users', async (req, res) => {
  try {
    // Get all profiles from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ users: data });
  } catch (e) {
    logger.error('Get all users error:', e);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

adminProtectedRouter.patch('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['buyer', 'supplier', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Role updated', user: data });
  } catch (e) {
    logger.error('Update user role error:', e);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

adminProtectedRouter.patch('/users/:userId/verification', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ verification_status: status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Verification status updated', user: data });
  } catch (e) {
    logger.error('Update verification status error:', e);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
});

app.use('/api/v2/admin', adminProtectedRouter);

// ============================================
// END SUPABASE AUTH PROTECTED ROUTES
// ============================================

// Auto-Verification Service (for product lifecycle hooks)
const ProductAutoVerifier = require('./services/productAutoVerifier');
const autoVerifier = new ProductAutoVerifier(pool);
app.locals.autoVerifier = autoVerifier; // Make available to routes

// Outreach Agent Service (AI-powered lead outreach) - Uses MongoDB
const OutreachService = require('./services/outreach');
const outreachService = new OutreachService(); // No pool needed - uses MongoDB
app.locals.outreachService = outreachService;

// Outreach Routes
const outreachRouter = require('./routes/outreach');
app.use('/api/v1/outreach', outreachRouter);

// Newsletter Route
const { subscribeToNewsletter } = require('./services/mailerLite');
app.post('/api/v1/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await subscribeToNewsletter(email);
    res.json({ message: 'Successfully subscribed to newsletter', ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
});

// ============================================
// AUTH ENDPOINTS
// ============================================

// Register new user (with signup rate limiting)
app.post('/api/v1/auth/register', signupLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Default role: Buyer if not specified
    const userRole = role || 'Buyer';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, CreatedAt)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING UserID, Email, FirstName, LastName, Role`,
      [email, passwordHash, firstName, lastName, userRole]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.userid, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email via Supabase Edge Function
    if (notificationsEnabled && supabase) {
      const emailType = userRole === 'Supplier' ? 'supplier-welcome-pending' : 'buyer-welcome';
      const { error: emailError } = await supabase.functions.invoke('handle-transactional-email', {
        body: {
          emailType: emailType,
          payload: {
            to: user.email,
            firstName: user.firstname || 'there',
            supplierName: user.firstname || 'Supplier',
          },
        },
      });

      if (emailError) {
        console.warn(`Welcome email failed to send for ${user.email}:`, emailError);
      }
    }

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login (with auth rate limiting)
app.post('/api/v1/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT UserID, Email, PasswordHash, FirstName, LastName, Role FROM Users WHERE Email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.passwordhash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE Users SET LastLogin = NOW() WHERE UserID = $1',
      [user.userid]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: user.userid, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        userId: user.userid,
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Reset password with token
app.post('/api/v1/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const result = await pool.query(
      'SELECT UserID, ResetTokenExpiresAt FROM Users WHERE ResetToken = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];
    if (new Date() > new Date(user.resettokenexpiresat)) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE Users SET PasswordHash = $1, ResetToken = NULL, ResetTokenExpiresAt = NULL WHERE UserID = $2',
      [passwordHash, user.userid]
    );

    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});


// Get current user profile (protected)
app.get('/api/v1/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT UserID, Email, FirstName, LastName, Role, CreatedAt FROM Users WHERE UserID = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============================================
// SUPPLIER ENDPOINTS
// ============================================

// Create new supplier
app.post('/api/v1/suppliers', async (req, res) => {
  try {
    const { companyName, address, description, esgSummary } = req.body;

    // Insert Company (schema: CompanyName, Address, Industry, Website)
    const companyResult = await pool.query(
      `INSERT INTO Companies (CompanyName, Address) 
       VALUES ($1, $2) 
       RETURNING CompanyID`,
      [companyName, address]
    );

    const companyId = companyResult.rows[0].companyid;

    // Insert Supplier for the company and get SupplierID
    const supplierResult = await pool.query(
      `INSERT INTO Suppliers (CompanyID) VALUES ($1) RETURNING SupplierID`,
      [companyId]
    );
    const supplierId = supplierResult.rows[0].supplierid;

    // Insert Supplier Profile (schema: SupplierID, Description, ESG_Summary)
    await pool.query(
      `INSERT INTO Supplier_Profiles (SupplierID, Description, ESG_Summary) 
       VALUES ($1, $2, $3)`,
      [supplierId, description || null, esgSummary || null]
    );

    res.status(201).json({
      message: 'Supplier created successfully',
      // For backward-compatibility, keep supplierId as companyId, and also return record ids
      supplierId: companyId,
      companyId,
      supplierRecordId: supplierId
    });
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ error: 'Failed to create supplier', details: err.message });
  }
});

// Get supplier sustainability passport
app.get('/api/v1/suppliers/:id/profile', async (req, res) => {
  try {
    const { id } = req.params; // id = CompanyID

    const result = await pool.query(
      `SELECT 
        c.CompanyName,
        c.Address,
        sp.Description,
        sp.ESG_Summary
      FROM Companies c
      JOIN Suppliers s ON s.CompanyID = c.CompanyID
      LEFT JOIN Supplier_Profiles sp ON sp.SupplierID = s.SupplierID
      WHERE c.CompanyID = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching supplier profile:', err);
    res.status(500).json({ error: 'Failed to fetch supplier profile' });
  }
});

// Add certification to supplier (Admin only)
app.post('/api/v1/suppliers/:id/certifications', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params; // id = CompanyID
    const { certificationName, issuingBody, issuedDate, expiryDate } = req.body;

    // Upsert or insert certification (schema: Name, CertifyingBody)
    const certResult = await pool.query(
      `INSERT INTO Certifications (Name, CertifyingBody) 
       VALUES ($1, $2) 
       ON CONFLICT (Name, CertifyingBody) DO UPDATE SET Name = EXCLUDED.Name 
       RETURNING CertificationID`,
      [certificationName, issuingBody]
    );

    const certId = certResult.rows[0].certificationid;

    // Link to supplier with dates (schema: SupplierID, CertificationID, IssueDate, ExpiryDate, Status)
    await pool.query(
      `INSERT INTO Supplier_Certifications (SupplierID, CertificationID, IssueDate, ExpiryDate, Status)
       VALUES ((SELECT SupplierID FROM Suppliers WHERE CompanyID = $1), $2, $3, $4, 'Valid')`,
      [id, certId, issuedDate || null, expiryDate || null]
    );

    res.status(201).json({
      message: 'Certification added successfully',
      certificationId: certId
    });
  } catch (err) {
    console.error('Error adding certification:', err);
    res.status(500).json({ error: 'Failed to add certification' });
  }
});

// List all suppliers with basic info and certification count
app.get('/api/v1/suppliers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.CompanyID,
        c.CompanyName,
        c.Address,
        sp.Description,
        sp.ESG_Summary,
        COUNT(DISTINCT sc.CertificationID) as certification_count,
        c.CreatedAt
      FROM Companies c
      JOIN Suppliers s ON s.CompanyID = c.CompanyID
      LEFT JOIN Supplier_Profiles sp ON sp.SupplierID = s.SupplierID
      LEFT JOIN Supplier_Certifications sc ON sc.SupplierID = s.SupplierID
      GROUP BY c.CompanyID, c.CompanyName, c.Address, sp.Description, sp.ESG_Summary, c.CreatedAt
      ORDER BY c.CreatedAt DESC
    `);

    res.json({
      count: result.rows.length,
      suppliers: result.rows
    });
  } catch (err) {
    console.error('Error listing suppliers:', err);
    res.status(500).json({ error: 'Failed to list suppliers' });
  }
});

// Search/filter suppliers by certification or location  
app.get('/api/v1/suppliers/search', async (req, res) => {
  try {
    const { certification, location } = req.query;

    // Build base query without JSON aggregation in WHERE clause
    let whereConditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (certification) {
      whereConditions.push(`cert.Name ILIKE $${paramIndex}`);
      params.push(`%${certification}%`);
      paramIndex++;
    }

    if (location) {
      whereConditions.push(`c.Address ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        c.CompanyID,
        c.CompanyName,
        c.Address,
        sp.Description,
        sp.ESG_Summary,
        jsonb_agg(
          jsonb_build_object(
            'name', cert.Name,
            'certifyingBody', cert.CertifyingBody,
            'issueDate', sc.IssueDate,
            'expiryDate', sc.ExpiryDate,
            'status', sc.Status
          )
        ) FILTER (WHERE cert.CertificationID IS NOT NULL) as certifications
      FROM Companies c
      JOIN Suppliers s ON s.CompanyID = c.CompanyID
      LEFT JOIN Supplier_Profiles sp ON sp.SupplierID = s.SupplierID
      LEFT JOIN Supplier_Certifications sc ON sc.SupplierID = s.SupplierID
      LEFT JOIN Certifications cert ON cert.CertificationID = sc.CertificationID
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY c.CompanyID, c.CompanyName, c.Address, sp.Description, sp.ESG_Summary
      ORDER BY c.CompanyName
    `;

    const result = await pool.query(query, params);

    res.json({
      count: result.rows.length,
      filters: { certification, location },
      suppliers: result.rows
    });
  } catch (err) {
    console.error('Error searching suppliers:', err);
    res.status(500).json({ error: 'Failed to search suppliers', details: err.message });
  }
});

// ============================================
// DATABASE INITIALIZATION
// ============================================

async function initSchema() {
  try {
    const schemaPath = path.join(__dirname, 'database-schemas', 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSQL);
      console.log('✅ Schema initialized successfully');
    } else {
      console.log('⚠️  Schema file not found, skipping initialization');
    }
    // Initialize mailer with pool for logging
    setMailerPool(pool);
    // Initialize error monitoring
    errorMonitoring.init(pool, sendEmail);
  } catch (err) {
    console.error('❌ Schema init failed:', err.message);
    await errorMonitoring.notifyDatabaseError(err, 'Schema initialization');
  }
}

// ============================================
// RFQ (REQUEST FOR QUOTE) ENDPOINTS
// Legacy RFQ endpoint removed
// ============================================
// DATA PROVIDER INTEGRATION ENDPOINTS
// ============================================

// Sync FSC certifications (Admin only)
app.post('/api/v1/admin/providers/sync/fsc', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { status, country } = req.body; // Optional filters

    const fscProvider = new FSCMockProvider();
    const syncResults = await fscProvider.sync({ status, country }, pool);

    res.json({
      message: 'FSC sync completed',
      results: syncResults
    });
  } catch (e) {
    console.error('❌ FSC sync error:', e);
    res.status(500).json({
      error: 'FSC sync failed',
      details: e.message
    });
  }
});

// Supplier verification score
app.get('/api/v1/suppliers/:id/score', async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }
    const scoreData = await getPersistedOrLiveScore(pool, supplierId);
    res.json(scoreData);
  } catch (e) {
    console.error('❌ Supplier score error:', e);
    res.status(500).json({ error: 'Failed to compute supplier score' });
  }
});

// Platform metrics endpoint (optimized with parallel queries)
app.get('/api/v1/metrics', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    // Optimized: Run all count queries in parallel instead of sequentially
    const [suppliersRes, productsRes, rfqsRes, responsesRes, fscValidRes, fscExpiredRes] = await Promise.all([
      pool.query('SELECT COUNT(*) AS suppliers FROM Suppliers'),
      pool.query('SELECT COUNT(*) AS products FROM Products'),
      pool.query('SELECT COUNT(*) AS rfqs FROM RFQs'),
      pool.query('SELECT COUNT(*) AS responses FROM RFQ_Responses'),
      pool.query("SELECT COUNT(*) AS fsc_valid FROM FSC_Certifications WHERE CertificateStatus = 'Valid'"),
      pool.query("SELECT COUNT(*) AS fsc_expired FROM FSC_Certifications WHERE CertificateStatus = 'Expired'")
    ]);

    // Optimized: Use persisted scores if available for faster response
    const scoresRes = await pool.query('SELECT Score FROM Supplier_Verification_Scores');
    let avgScore = 0;
    let scoreList = [];

    if (scoresRes.rows.length > 0) {
      // Use cached scores
      const scores = scoresRes.rows.map(r => r.score);
      avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      scoreList = scoresRes.rows.map(r => ({ score: r.score }));
    } else {
      // Fallback to live computation if no cached scores
      scoreList = await computeAllSupplierScores(pool);
      avgScore = scoreList.length ? (scoreList.reduce((sum, s) => sum + s.score, 0) / scoreList.length) : 0;
    }

    res.json({
      totals: {
        suppliers: Number(suppliersRes.rows[0].suppliers),
        products: Number(productsRes.rows[0].products),
        rfqs: Number(rfqsRes.rows[0].rfqs),
        rfqResponses: Number(responsesRes.rows[0].responses),
        fscValid: Number(fscValidRes.rows[0].fsc_valid),
        fscExpired: Number(fscExpiredRes.rows[0].fsc_expired)
      },
      verification: {
        averageSupplierScore: Math.round(avgScore),
        scoreCount: scoreList.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('❌ Metrics error:', e);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// Recompute and persist verification scores (Admin)
app.post('/api/v1/admin/verification/recompute', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const result = await persistAllSupplierScores(pool);
    res.json({ message: 'Verification scores recomputed', ...result });
  } catch (e) {
    console.error('❌ Recompute verification scores error:', e);
    res.status(500).json({ error: 'Failed to recompute verification scores' });
  }
});

// Get all available providers
app.get('/api/v1/admin/providers', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const fscProvider = new FSCMockProvider();

    res.json({
      providers: [
        {
          id: 'fsc',
          name: fscProvider.providerName,
          type: fscProvider.providerType,
          status: fscProvider.getStatus(),
          syncEndpoint: '/api/v1/admin/providers/sync/fsc',
          description: 'Forest Stewardship Council - Chain of Custody and Forest Management certifications'
        }
        // Future: Add MBDC, Building Transparency, B Corp, etc.
      ]
    });
  } catch (e) {
    console.error('❌ Get providers error:', e);
    res.status(500).json({ error: 'Failed to retrieve providers' });
  }
});

// Get notification log (Admin)
app.get('/api/v1/admin/notifications', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    let whereConditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`Status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (type) {
      whereConditions.push(`NotificationType = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const query = `
      SELECT NotificationID, NotificationType, Recipient, Subject, Status, ErrorMessage, CreatedAt
      FROM Notification_Log
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY CreatedAt DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(query, params);
    const countRes = await pool.query(`SELECT COUNT(*) FROM Notification_Log WHERE ${whereConditions.join(' AND ')}`, params.slice(0, paramIndex - 1));

    res.json({
      total: Number(countRes.rows[0].count),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      notifications: result.rows
    });
  } catch (e) {
    console.error('❌ Get notifications error:', e);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// Test email endpoint (Admin)
app.post('/api/v1/admin/notifications/test', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Recipient email (to) required' });
    }

    const result = await sendEmail({
      to,
      subject: 'GreenChainz Test Email',
      text: 'This is a test email from GreenChainz backend. If you received this, SMTP is working correctly.',
      notificationType: 'test_email'
    });

    res.json({ message: 'Test email attempted', result });
  } catch (e) {
    console.error('❌ Test email error:', e);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});
// ============================================

// Create Buyer profile (extends existing User)
app.post('/api/v1/buyers', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, projectTypes, preferredContactMethod } = req.body;
    const userId = req.user.userId;

    // Verify user has Buyer role
    const userCheck = await pool.query('SELECT Role, CompanyID FROM Users WHERE UserID = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userCheck.rows[0].role !== 'Buyer') {
      return res.status(403).json({ error: 'Only users with Buyer role can create buyer profiles' });
    }

    const companyId = userCheck.rows[0].companyid;

    // Create buyer profile
    const result = await pool.query(
      `INSERT INTO Buyers (UserID, CompanyID, JobTitle, ProjectTypes, PreferredContactMethod)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (UserID) DO UPDATE SET
         JobTitle = EXCLUDED.JobTitle,
         ProjectTypes = EXCLUDED.ProjectTypes,
         PreferredContactMethod = EXCLUDED.PreferredContactMethod,
         UpdatedAt = CURRENT_TIMESTAMP
       RETURNING BuyerID, UserID, CompanyID, JobTitle, ProjectTypes, PreferredContactMethod, CreatedAt`,
      [userId, companyId, jobTitle, projectTypes, preferredContactMethod || 'Email']
    );

    res.status(201).json({
      message: 'Buyer profile created',
      buyer: result.rows[0]
    });
  } catch (e) {
    console.error('❌ Create buyer error:', e);
    res.status(500).json({ error: 'Failed to create buyer profile' });
  }
});

// ============================================
// DATA SCOUT ENDPOINTS
// ============================================

const dataScoutService = require('./services/dataScoutService');

// Search for EPDs across multiple sources
app.get('/api/v1/data-scout/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await dataScoutService.aggregateSearch(q);

    res.json({
      query: q,
      count: results.length,
      results: results
    });
  } catch (err) {
    console.error('Data Scout search error:', err);
    res.status(500).json({ error: 'Failed to perform Data Scout search' });
  }
});

// ============================================
// MATCHMAKER ENDPOINTS
// ============================================

const matchmakerService = require('./services/matchmakerService');

// Find matches for a project
app.post('/api/v1/matchmaker/matches', async (req, res) => {
  try {
    const criteria = req.body;

    // Basic validation
    if (!criteria.material_needed || !criteria.location) {
      return res.status(400).json({ error: 'Material needed and location are required' });
    }

    const matches = await matchmakerService.findMatches(criteria);

    res.json({
      count: matches.length,
      matches: matches
    });
  } catch (err) {
    console.error('Matchmaker error:', err);
    res.status(500).json({ error: 'Failed to find matches' });
  }
});

// ============================================
// CERTIFIER ENDPOINTS
// ============================================

const certifierService = require('./services/certifierService');

// Assess EPD readiness
app.post('/api/v1/certifier/assess', async (req, res) => {
  try {
    const input = req.body;

    // Basic validation
    if (!input.product_name || !input.manufacturer) {
      return res.status(400).json({ error: 'Product name and manufacturer are required' });
    }

    const assessment = certifierService.assessReadiness(input);

    res.json(assessment);
  } catch (err) {
    console.error('Certifier error:', err);
    res.status(500).json({ error: 'Failed to assess readiness' });
  }
});

// ============================================
// COMPLIANCE ORACLE ENDPOINTS
// ============================================

const complianceOracleService = require('./services/complianceOracleService');

// Generate Compliance Report
app.post('/api/v1/compliance/report', async (req, res) => {
  try {
    const projectData = req.body;

    // Basic validation
    if (!projectData.project_name || !projectData.materials_selected) {
      return res.status(400).json({ error: 'Project name and materials are required' });
    }

    const report = complianceOracleService.generateComplianceReport(projectData);

    res.json(report);
  } catch (err) {
    console.error('Compliance Oracle error:', err);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

// ============================================
// RFQ ROUTER ENDPOINTS
// ============================================

const rfqRouterService = require('./services/rfqRouterService');

// Route RFQ
app.post('/api/v1/rfq-router/route', async (req, res) => {
  try {
    const rfqDetails = req.body;

    // Basic validation
    if (!rfqDetails.material_needed || !rfqDetails.location) {
      return res.status(400).json({ error: 'Material needed and location are required' });
    }

    const routingAnalysis = await rfqRouterService.routeRFQ(rfqDetails);

    res.json(routingAnalysis);
  } catch (err) {
    console.error('RFQ Router error:', err);
    res.status(500).json({ error: 'Failed to route RFQ' });
  }
});

// ============================================
// MARKET INTEL ENDPOINTS
// ============================================

const marketIntelService = require('./services/marketIntelService');

// Analyze Competitiveness
app.post('/api/v1/market-intel/analyze', async (req, res) => {
  try {
    const input = req.body;

    // Basic validation
    if (!input.supplier_name || !input.product_category || !input.current_price_per_sqft) {
      return res.status(400).json({ error: 'Supplier name, category, and price are required' });
    }

    const analysis = marketIntelService.analyzeCompetitiveness(input);

    res.json(analysis);
  } catch (err) {
    console.error('Market Intel error:', err);
    res.status(500).json({ error: 'Failed to analyze market' });
  }
});

// Send RFQ to a supplier
app.post('/api/v1/rfqs', authenticateToken, authorizeRoles('Buyer'), async (req, res) => {
  try {
    const { supplierId, productId, projectName, message, quantityNeeded, unit, budgetRange, deadlineDate } = req.body;
    const userId = req.user.userId;

    if (!supplierId || !message) {
      return res.status(400).json({ error: 'Supplier ID and message are required' });
    }

    // Get BuyerID from user
    const buyerResult = await pool.query('SELECT BuyerID FROM Buyers WHERE UserID = $1', [userId]);
    if (buyerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Buyer profile not found. Create one first at POST /api/v1/buyers' });
    }
    const buyerId = buyerResult.rows[0].buyerid;

    // Create RFQ
    const result = await pool.query(
      `INSERT INTO RFQs (BuyerID, SupplierID, ProductID, ProjectName, Message, QuantityNeeded, Unit, BudgetRange, DeadlineDate, Status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
       RETURNING RFQID, BuyerID, SupplierID, ProductID, ProjectName, Message, QuantityNeeded, Unit, BudgetRange, DeadlineDate, Status, CreatedAt`,
      [buyerId, supplierId, productId || null, projectName, message, quantityNeeded, unit, budgetRange, deadlineDate]
    );

    // Notifications
    if (notificationsEnabled) {
      // 1. Notify Supplier of new RFQ
      const supplierEmailRes = await pool.query(`
        SELECT u.Email, u.FirstName FROM Users u
        JOIN Suppliers s ON u.CompanyID = s.CompanyID
        WHERE s.SupplierID = $1 AND u.Role = 'Supplier' LIMIT 1`, [supplierId]);

      // 1. Notify Supplier of new RFQ
      const supplierInfoRes = await pool.query(`
        SELECT u.Email, u.FirstName, c.CompanyName
        FROM Users u
        JOIN Companies c ON u.CompanyID = c.CompanyID
        WHERE u.UserID IN (SELECT UserID FROM Suppliers WHERE SupplierID = $1)`,
        [supplierId]);

      const productInfoRes = await pool.query('SELECT Name FROM Products WHERE ProductID = $1', [productId]);

      if (supplierInfoRes.rows.length && supabase) {
        const supplier = supplierInfoRes.rows[0];
        const productName = productInfoRes.rows.length ? productInfoRes.rows[0].name : 'a product';

        const { error } = await supabase.functions.invoke('handle-transactional-email', {
          body: {
            emailType: 'supplier-new-rfq',
            payload: {
              to: supplier.email,
              supplierName: supplier.firstname || 'Supplier',
              buyerCompany: req.user.companyName || 'A Buyer',
              productName: productName,
              quantity: `${result.rows[0].quantityneeded} ${result.rows[0].unit}`,
              buyerMessage: result.rows[0].message,
            },
          },
        });
        if (error) console.warn('Supplier RFQ notification email failed:', error);

        // 2. Notify Buyer of RFQ confirmation
        const { error: buyerError } = await supabase.functions.invoke('handle-transactional-email', {
          body: {
            emailType: 'buyer-rfq-confirmation',
            payload: {
              to: req.user.email,
              buyerName: req.user.firstName || 'Buyer',
              supplierCompany: supplier.companyname,
              productName: productName,
              quantity: `${result.rows[0].quantityneeded} ${result.rows[0].unit}`,
              message: result.rows[0].message,
            },
          },
        });
        if (buyerError) console.warn('Buyer RFQ confirmation email failed:', buyerError);
      }
    }

    res.status(201).json({ message: 'RFQ sent successfully', rfq: result.rows[0], notificationsAttempted: notificationsEnabled });
  } catch (e) {
    console.error('❌ Create RFQ error:', e);
    res.status(500).json({ error: 'Failed to send RFQ' });
  }
});

// Get RFQs for a supplier (incoming quote requests)
app.get('/api/v1/suppliers/:id/rfqs', authenticateToken, async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    const { status } = req.query; // optional filter by status

    let query = `
      SELECT 
        r.RFQID, r.BuyerID, r.SupplierID, r.ProductID, r.ProjectName, r.Message,
        r.QuantityNeeded, r.Unit, r.BudgetRange, r.DeadlineDate, r.Status, r.CreatedAt,
        u.Email AS BuyerEmail, u.FirstName AS BuyerFirstName, u.LastName AS BuyerLastName,
        c.CompanyName AS BuyerCompany
      FROM RFQs r
      JOIN Buyers b ON r.BuyerID = b.BuyerID
      JOIN Users u ON b.UserID = u.UserID
      LEFT JOIN Companies c ON b.CompanyID = c.CompanyID
      WHERE r.SupplierID = $1
    `;
    const params = [supplierId];

    if (status) {
      query += ' AND r.Status = $2';
      params.push(status);
    }

    query += ' ORDER BY r.CreatedAt DESC';

    const result = await pool.query(query, params);

    res.json({
      supplierId,
      rfqCount: result.rows.length,
      rfqs: result.rows
    });
  } catch (e) {
    console.error('❌ Get supplier RFQs error:', e);
    res.status(500).json({ error: 'Failed to retrieve RFQs' });
  }
});

// Respond to an RFQ (supplier provides quote)
app.post('/api/v1/rfqs/:id/respond', authenticateToken, authorizeRoles('Supplier', 'Admin'), async (req, res) => {
  try {
    const rfqId = parseInt(req.params.id);
    const { quotedPrice, leadTimeDays, message, attachmentURLs } = req.body;
    const userId = req.user.userId;

    if (!quotedPrice) {
      return res.status(400).json({ error: 'Quoted price is required' });
    }

    // Get supplier ID from authenticated user's company
    const userCheck = await pool.query(`
      SELECT u.CompanyID, s.SupplierID 
      FROM Users u
      JOIN Suppliers s ON u.CompanyID = s.CompanyID
      WHERE u.UserID = $1
    `, [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: 'No supplier account linked to your user. Contact admin.' });
    }

    const supplierId = userCheck.rows[0].supplierid;

    // Verify RFQ exists and belongs to this supplier
    const rfqCheck = await pool.query('SELECT SupplierID, Status FROM RFQs WHERE RFQID = $1', [rfqId]);
    if (rfqCheck.rows.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    if (rfqCheck.rows[0].supplierid !== supplierId) {
      return res.status(403).json({ error: 'This RFQ is not for your supplier account' });
    }
    if (rfqCheck.rows[0].status === 'Cancelled' || rfqCheck.rows[0].status === 'Expired') {
      return res.status(400).json({ error: 'Cannot respond to cancelled or expired RFQ' });
    }

    // Create response
    const result = await pool.query(
      `INSERT INTO RFQ_Responses (RFQID, SupplierID, QuotedPrice, LeadTimeDays, Message, AttachmentURLs, Status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING ResponseID, RFQID, SupplierID, QuotedPrice, Currency, LeadTimeDays, Message, AttachmentURLs, Status, CreatedAt`,
      [rfqId, supplierId, quotedPrice, leadTimeDays, message, attachmentURLs || []]
    );

    // Update RFQ status to 'Responded'
    await pool.query('UPDATE RFQs SET Status = $1, UpdatedAt = CURRENT_TIMESTAMP WHERE RFQID = $2', ['Responded', rfqId]);

    // Notify buyer
    if (notificationsEnabled) {
      const rfqDetailsRes = await pool.query(`
        SELECT
          u.Email,
          u.FirstName,
          s.SupplierID,
          p.Name as ProductName,
          r.Unit
        FROM RFQs r
        JOIN Buyers b ON r.BuyerID = b.BuyerID
        JOIN Users u ON b.UserID = u.UserID
        LEFT JOIN Products p ON r.ProductID = p.ProductID
        LEFT JOIN Suppliers s ON r.SupplierID = s.SupplierID
        WHERE r.RFQID = $1`, [rfqId]
      );

      if (rfqDetailsRes.rows.length && supabase) {
        const details = rfqDetailsRes.rows[0];
        const supplierCompanyRes = await pool.query('SELECT CompanyName FROM Companies WHERE CompanyID = (SELECT CompanyID FROM Suppliers WHERE SupplierID = $1)', [details.supplierid]);
        const supplierCompany = supplierCompanyRes.rows.length ? supplierCompanyRes.rows[0].companyname : 'A Supplier';

        const { error } = await supabase.functions.invoke('handle-transactional-email', {
          body: {
            emailType: 'buyer-quote-response',
            payload: {
              to: details.email,
              buyerName: details.firstname || 'Buyer',
              supplierCompany: supplierCompany,
              productName: details.productname || 'a product',
              price: result.rows[0].quotedprice,
              unit: details.unit || 'unit',
              availability: 'N/A',
              timeline: `${result.rows[0].leadtinedays} days`,
              message: result.rows[0].message,
              rfqId: rfqId,
            },
          },
        });
        if (error) console.warn('RFQ response email failed:', error);
      }
    }

    res.status(201).json({ message: 'Quote submitted successfully', response: result.rows[0], notificationsAttempted: notificationsEnabled });
  } catch (e) {
    console.error('❌ Respond to RFQ error:', e);
    res.status(500).json({ error: 'Failed to submit quote' });
  }
});

// Update RFQ response status (Accept / Decline) - Buyer who owns RFQ or Admin
app.post('/api/v1/rfqs/:rfqId/responses/:responseId/status', authenticateToken, authorizeRoles('Buyer', 'Admin'), async (req, res) => {
  try {
    const rfqId = parseInt(req.params.rfqId);
    const responseId = parseInt(req.params.responseId);
    const { action } = req.body; // 'accept' | 'decline'
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'accept' or 'decline'" });
    }

    // Verify RFQ ownership
    const ownership = await pool.query(`
      SELECT r.RFQID, r.Status, b.UserID AS BuyerUserID
      FROM RFQs r
      JOIN Buyers b ON r.BuyerID = b.BuyerID
      WHERE r.RFQID = $1
    `, [rfqId]);
    if (ownership.rows.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    const rfqRow = ownership.rows[0];
    if (req.user.role !== 'Admin' && req.user.userId !== rfqRow.buyeruserid) {
      return res.status(403).json({ error: 'Not authorized to modify this RFQ' });
    }

    if (rfqRow.status === 'Cancelled' || rfqRow.status === 'Expired') {
      return res.status(400).json({ error: 'Cannot modify a cancelled or expired RFQ' });
    }

    // Fetch response
    const respRes = await pool.query('SELECT ResponseID, RFQID, Status FROM RFQ_Responses WHERE ResponseID = $1 AND RFQID = $2', [responseId, rfqId]);
    if (respRes.rows.length === 0) {
      return res.status(404).json({ error: 'Response not found for this RFQ' });
    }
    const responseRow = respRes.rows[0];
    if (responseRow.status !== 'Pending') {
      return res.status(400).json({ error: 'Response already finalized' });
    }

    if (action === 'accept') {
      // Accept chosen response; decline others; update RFQ
      await pool.query('UPDATE RFQ_Responses SET Status = CASE WHEN ResponseID = $1 THEN ' + "'Accepted'" + ' ELSE ' + "'Declined'" + ' END WHERE RFQID = $2', [responseId, rfqId]);
      await pool.query('UPDATE RFQs SET Status = $1, UpdatedAt = CURRENT_TIMESTAMP WHERE RFQID = $2', ['Accepted', rfqId]);
      // Notify supplier of acceptance
      if (notificationsEnabled) {
        try {
          const supplierEmailRes = await pool.query(`
            SELECT u.Email FROM Users u
            JOIN Suppliers s ON u.CompanyID = s.COMPANYID
            JOIN RFQ_Responses rr ON rr.SupplierID = s.SupplierID
            WHERE rr.ResponseID = $1 LIMIT 1`, [responseId]);
          if (supplierEmailRes.rows.length) {
            await sendEmail({
              to: supplierEmailRes.rows[0].email,
              subject: 'RFQ Response Accepted',
              text: `Your response (${responseId}) for RFQ #${rfqId} was accepted.`,
              notificationType: 'rfq_response_accepted'
            });
          }
        } catch (e) {
          console.warn('Acceptance email failed:', e.message);
        }
      }
      return res.json({ message: 'Response accepted', rfqId, acceptedResponseId: responseId, notificationsAttempted: notificationsEnabled });
    } else {
      // Decline single response; RFQ remains Responded if other pending responses exist
      await pool.query('UPDATE RFQ_Responses SET Status = $1 WHERE ResponseID = $2', ['Declined', responseId]);
      // Check if any pending remain; if none and RFQ not accepted, keep status Responded
      const pendingLeft = await pool.query('SELECT COUNT(*) FROM RFQ_Responses WHERE RFQID = $1 AND Status = $2', [rfqId, 'Pending']);
      if (pendingLeft.rows[0].count === '0') {
        // If no pending and not accepted, leave as Responded
        await pool.query('UPDATE RFQs SET UpdatedAt = CURRENT_TIMESTAMP WHERE RFQID = $1', [rfqId]);
      }
      // Notify supplier of decline
      if (notificationsEnabled) {
        try {
          const supplierEmailRes = await pool.query(`
            SELECT u.Email FROM Users u
            JOIN Suppliers s ON u.CompanyID = s.COMPANYID
            JOIN RFQ_Responses rr ON rr.SupplierID = s.SupplierID
            WHERE rr.ResponseID = $1 LIMIT 1`, [responseId]);
          if (supplierEmailRes.rows.length) {
            await sendEmail({
              to: supplierEmailRes.rows[0].email,
              subject: 'RFQ Response Declined',
              text: `Your response (${responseId}) for RFQ #${rfqId} was declined.`,
              notificationType: 'rfq_response_declined'
            });
          }
        } catch (e) {
          console.warn('Decline email failed:', e.message);
        }
      }
      return res.json({ message: 'Response declined', rfqId, declinedResponseId: responseId, notificationsAttempted: notificationsEnabled });
    }
  } catch (e) {
    console.error('❌ RFQ response status error:', e);
    res.status(500).json({ error: 'Failed to update response status' });
  }
});

// Get RFQs for a buyer (outgoing requests)
app.get('/api/v1/buyers/rfqs', authenticateToken, authorizeRoles('Buyer'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    // Get BuyerID
    const buyerResult = await pool.query('SELECT BuyerID FROM Buyers WHERE UserID = $1', [userId]);
    if (buyerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Buyer profile not found' });
    }
    const buyerId = buyerResult.rows[0].buyerid;

    // OPTIMIZED: Replaced correlated subquery with LEFT JOIN + GROUP BY
    // Before: (SELECT COUNT(*) FROM RFQ_Responses WHERE RFQID = r.RFQID) - O(n) queries
    // After: Single query with aggregation - O(1) query
    let query = `
      SELECT 
        r.RFQID, r.SupplierID, r.ProductID, r.ProjectName, r.Message,
        r.QuantityNeeded, r.Unit, r.BudgetRange, r.DeadlineDate, r.Status, r.CreatedAt,
        c.CompanyName AS SupplierCompany,
        COUNT(rr.ResponseID) AS ResponseCount
      FROM RFQs r
      JOIN Suppliers s ON r.SupplierID = s.SupplierID
      LEFT JOIN Companies c ON s.COMPANYID = c.COMPANYID
      LEFT JOIN RFQ_Responses rr ON r.RFQID = rr.RFQID
      WHERE r.BuyerID = $1
    `;
    const params = [buyerId];

    if (status) {
      query += ' AND r.Status = $2';
      params.push(status);
    }

    query += ' GROUP BY r.RFQID, r.SupplierID, r.ProductID, r.ProjectName, r.Message, r.QuantityNeeded, r.Unit, r.BudgetRange, r.DeadlineDate, r.Status, r.CreatedAt, c.CompanyName';
    query += ' ORDER BY r.CreatedAt DESC';

    const result = await pool.query(query, params);

    res.json({
      buyerId,
      rfqCount: result.rows.length,
      rfqs: result.rows
    });
  } catch (e) {
    console.error('❌ Get buyer RFQs error:', e);
    res.status(500).json({ error: 'Failed to retrieve RFQs' });
  }
});

// Get responses for a specific RFQ
app.get('/api/v1/rfqs/:id/responses', authenticateToken, async (req, res) => {
  try {
    const rfqId = parseInt(req.params.id);

    // Verify RFQ exists and user has access (either buyer who created it or admin)
    const rfqCheck = await pool.query(`
      SELECT r.RFQID, r.BuyerID, b.UserID AS BuyerUserID
      FROM RFQs r
      JOIN Buyers b ON r.BuyerID = b.BuyerID
      WHERE r.RFQID = $1
    `, [rfqId]);

    if (rfqCheck.rows.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    // Check authorization
    if (req.user.role !== 'Admin' && req.user.userId !== rfqCheck.rows[0].buyeruserid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT 
        rr.ResponseID, rr.RFQID, rr.SupplierID, rr.QuotedPrice, rr.Currency,
        rr.LeadTimeDays, rr.Message, rr.AttachmentURLs, rr.Status, rr.CreatedAt,
        c.CompanyName AS SupplierCompany
      FROM RFQ_Responses rr
      JOIN Suppliers s ON rr.SupplierID = s.SupplierID
      LEFT JOIN Companies c ON s.COMPANYID = c.COMPANYID
      WHERE rr.RFQID = $1
      ORDER BY rr.CreatedAt DESC
    `, [rfqId]);

    res.json({
      rfqId,
      responseCount: result.rows.length,
      responses: result.rows
    });
  } catch (e) {
    console.error('❌ Get RFQ responses error:', e);
    res.status(500).json({ error: 'Failed to retrieve responses' });
  }
});

// Unified certifications view (internal + FSC)
app.get('/api/v1/suppliers/:id/certifications', async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    // OPTIMIZED: Combined two sequential queries into single UNION ALL query
    // Before: 2 round trips to database
    // After: 1 round trip with UNION ALL
    const combinedRes = await pool.query(`
      SELECT sc.SupplierCertificationID AS id,
             c.Name AS name,
             c.CertifyingBody AS body,
             sc.CertificateNumber AS number,
             sc.Status AS status,
             sc.IssueDate AS issueDate,
             sc.ExpiryDate AS expiryDate,
             'internal' AS source,
             NULL AS scope,
             NULL AS products,
             NULL AS certificateType
      FROM Supplier_Certifications sc
      JOIN Certifications c ON sc.CertificationID = c.CertificationID
      WHERE sc.SupplierID = $1
      
      UNION ALL
      
      SELECT f.FSCCertID AS id,
             'FSC Certification' AS name,
             f.CertifyingBody AS body,
             f.CertificateNumber AS number,
             f.CertificateStatus AS status,
             f.IssueDate AS issueDate,
             f.ExpiryDate AS expiryDate,
             'fsc' AS source,
             NULL AS scope,
             NULL AS products,
             f.CertificateType AS certificateType
      FROM FSC_Certifications f
      WHERE f.SupplierID = $1
    `, [supplierId]);

    res.json({
      supplierId,
      total: combinedRes.rows.length,
      certifications: combinedRes.rows
    });
  } catch (e) {
    console.error('❌ Unified certifications error:', e);
    res.status(500).json({ error: 'Failed to retrieve certifications' });
  }
});

// Supplier Analytics Dashboard (Supplier views their own data)
app.get('/api/v1/suppliers/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    // Authorization: Supplier can only view their own data, or Admin
    if (req.user.role !== 'Admin') {
      const supplierCheck = await pool.query(
        'SELECT s.SupplierID FROM Suppliers s JOIN Companies c ON s.CompanyID = c.CompanyID JOIN Users u ON u.CompanyID = c.CompanyID WHERE u.UserID = $1 AND s.SupplierID = $2',
        [req.user.userId, supplierId]
      );
      if (supplierCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized to view this supplier data' });
      }
    }

    // OPTIMIZED: Run all independent queries in parallel with Promise.all
    // Before: 5 sequential queries (~500ms total if each takes 100ms)
    // After: All queries run in parallel (~100ms total)
    const [rfqStats, responseStats, recentRFQs, notifications, scoreData] = await Promise.all([
      // RFQ statistics
      pool.query(`
        SELECT 
          COUNT(*) as total_rfqs,
          COUNT(*) FILTER (WHERE Status = 'Pending') as pending_rfqs,
          COUNT(*) FILTER (WHERE Status = 'Responded') as responded_rfqs,
          COUNT(*) FILTER (WHERE Status = 'Accepted') as accepted_rfqs,
          COUNT(*) FILTER (WHERE Status = 'Cancelled') as cancelled_rfqs
        FROM RFQs WHERE SupplierID = $1
      `, [supplierId]),

      // Response statistics
      pool.query(`
        SELECT 
          COUNT(*) as total_responses,
          COUNT(*) FILTER (WHERE Status = 'Pending') as pending_responses,
          COUNT(*) FILTER (WHERE Status = 'Accepted') as accepted_responses,
          COUNT(*) FILTER (WHERE Status = 'Declined') as declined_responses,
          AVG(QuotedPrice) as avg_quoted_price,
          AVG(LeadTimeDays) as avg_lead_time
        FROM RFQ_Responses WHERE SupplierID = $1
      `, [supplierId]),

      // Recent RFQs - OPTIMIZED: Replaced correlated subquery with LEFT JOIN
      pool.query(`
        SELECT 
          r.RFQID, r.ProjectName, r.Message, r.Status, r.CreatedAt,
          r.QuantityNeeded, r.Unit, r.BudgetRange,
          c.CompanyName as BuyerCompany,
          rr.Status as ResponseStatus
        FROM RFQs r
        LEFT JOIN Buyers b ON r.BuyerID = b.BuyerID
        LEFT JOIN Companies c ON b.CompanyID = c.CompanyID
        LEFT JOIN RFQ_Responses rr ON r.RFQID = rr.RFQID AND rr.SupplierID = $1
        WHERE r.SupplierID = $1
        ORDER BY r.CreatedAt DESC
        LIMIT 10
      `, [supplierId]),

      // Notification history for this supplier
      pool.query(`
        SELECT NotificationID, NotificationType, Subject, Status, CreatedAt
        FROM Notification_Log
        WHERE Recipient IN (
          SELECT u.Email FROM Users u
          JOIN Suppliers s ON u.CompanyID = s.COMPANYID
          WHERE s.SupplierID = $1
        )
        ORDER BY CreatedAt DESC
        LIMIT 20
      `, [supplierId]),

      // Verification score
      getPersistedOrLiveScore(pool, supplierId)
    ]);

    res.json({
      supplierId,
      rfqStats: rfqStats.rows[0],
      responseStats: responseStats.rows[0],
      recentRFQs: recentRFQs.rows,
      notifications: notifications.rows,
      verificationScore: scoreData,
      generatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('❌ Supplier analytics error:', e);
    res.status(500).json({ error: 'Failed to retrieve supplier analytics' });
  }
});

// Resend failed notification (Admin only)
app.post('/api/v1/admin/notifications/:id/resend', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    // Fetch original notification
    const notification = await pool.query(
      'SELECT * FROM Notification_Log WHERE NotificationID = $1',
      [notificationId]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const original = notification.rows[0];

    // Only allow resending failed or skipped notifications
    if (original.status === 'sent') {
      return res.status(400).json({ error: 'Cannot resend successfully sent notification' });
    }

    // Attempt to resend
    const result = await sendEmail({
      to: original.recipient,
      subject: original.subject,
      text: original.messagebody,
      notificationType: `${original.notificationtype}_resend`
    });

    res.json({
      message: 'Notification resend attempted',
      originalId: notificationId,
      result
    });
  } catch (e) {
    console.error('❌ Resend notification error:', e);
    res.status(500).json({ error: 'Failed to resend notification' });
  }
});

// ============================================
// OAUTH AUTHENTICATION ROUTES
// ============================================

// Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.userid, email: req.user.email, role: req.user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

// GitHub OAuth
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login?error=github_auth_failed' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.userid, email: req.user.email, role: req.user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

// LinkedIn OAuth
app.get('/auth/linkedin', passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] }));
app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login?error=linkedin_auth_failed' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.userid, email: req.user.email, role: req.user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

// Microsoft OAuth
app.get('/auth/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
app.get('/auth/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/login?error=microsoft_auth_failed' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.userid, email: req.user.email, role: req.user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

// ============================================
// ERROR HANDLING (Must be last!)
// ============================================

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use(globalErrorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  logger.info(`🚀 Backend server listening at http://localhost:${PORT}`);

  // Initialize Redis
  try {
    initRedis();
    logger.info('✅ Redis client initialized');
  } catch (err) {
    logger.warn('⚠️ Redis not available, continuing without cache:', err.message);
  }

  await initSchema();

  // Initialize Outreach Agent Service
  try {
    await outreachService.initialize();
    logger.info('✅ Outreach Agent Service initialized');
  } catch (err) {
    logger.error('⚠️ Outreach Agent Service initialization failed:', err.message);
  }

  logger.info('🏢 GreenChainz API ready with enterprise security enabled');
});
