/**
 * Enterprise Security Middleware
 * 
 * Implements:
 * - Helmet for security headers (XSS, clickjacking, MIME sniffing protection)
 * - Rate limiting (configurable per endpoint)
 * - Request validation
 * - Compression
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, param, query, validationResult } = require('express-validator');

// ==========================================
// HELMET - Security Headers
// ==========================================

const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://widget.intercom.io", "https://js.intercomcdn.com"],
            connectSrc: ["'self'", "https://api.intercom.io", "wss://nexus-websocket-a.intercom.io", process.env.FRONTEND_URL || "http://localhost:5173"],
            frameSrc: ["'self'", "https://intercom-sheets.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for Swagger UI
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
    noSniff: true,
    ieNoOpen: true,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: { permittedPolicies: "none" }
});

// ==========================================
// RATE LIMITING
// ==========================================

// Default rate limiter (100 requests per 15 minutes)
const defaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`[RateLimit] IP ${req.ip} exceeded limit on ${req.path}`);
        res.status(429).json(options.message);
    }
});

// Strict rate limiter for auth endpoints (10 per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        error: 'Too many authentication attempts',
        message: 'Please wait 15 minutes before trying again.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
    handler: (req, res, next, options) => {
        console.warn(`[RateLimit:Auth] IP ${req.ip} exceeded auth limit`);
        res.status(429).json(options.message);
    }
});

// Password reset limiter (3 per hour)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        error: 'Too many password reset requests',
        message: 'Please wait an hour before requesting another password reset.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// API rate limiter (1000 per 15 minutes for authenticated users)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        error: 'API rate limit exceeded',
        message: 'Too many API requests. Please slow down.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise use default IP handling
        if (req.user?.userId) {
            return String(req.user.userId);
        }
        // Let express-rate-limit handle IP by returning undefined
        return undefined;
    },
    // Skip validation warning for custom keyGenerator
    validate: { xForwardedForHeader: false }
});

// Signup/Registration limiter (5 per hour per IP)
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        error: 'Too many accounts created',
        message: 'Please wait an hour before creating another account.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ==========================================
// INPUT VALIDATION HELPERS
// ==========================================

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Common validation chains
const validations = {
    // Email validation
    email: body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),

    // Password validation
    password: body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/\d/)
        .withMessage('Password must contain a number')
        .matches(/[a-zA-Z]/)
        .withMessage('Password must contain a letter'),

    // UUID validation
    uuid: (field) => param(field)
        .isUUID()
        .withMessage(`${field} must be a valid UUID`),

    // Integer ID validation
    id: (field) => param(field)
        .isInt({ min: 1 })
        .toInt()
        .withMessage(`${field} must be a positive integer`),

    // Pagination
    pagination: [
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be 1-100')
    ],

    // Search query
    search: query('search')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .escape()
        .withMessage('Search query too long'),

    // Company name
    companyName: body('companyName')
        .trim()
        .isLength({ min: 2, max: 255 })
        .escape()
        .withMessage('Company name must be 2-255 characters'),

    // Generic string field
    string: (field, min = 1, max = 255) => body(field)
        .trim()
        .isLength({ min, max })
        .escape()
        .withMessage(`${field} must be ${min}-${max} characters`)
};

// ==========================================
// COMPRESSION
// ==========================================

const compressionMiddleware = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6, // Balanced compression
    threshold: 1024 // Only compress responses > 1KB
});

// ==========================================
// REQUEST SANITIZATION
// ==========================================

/**
 * Sanitize common injection patterns
 */
const sanitizeRequest = (req, res, next) => {
    // Remove null bytes
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            return value.replace(/\0/g, '');
        }
        return value;
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeValue(obj[key]);
            } else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

// ==========================================
// SECURITY HEADERS FOR API RESPONSES
// ==========================================

const apiSecurityHeaders = (req, res, next) => {
    // Prevent caching of sensitive data
    if (req.path.includes('/auth/') || req.path.includes('/user')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }

    // Add security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');

    next();
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    // Helmet
    helmetConfig,

    // Rate limiters
    defaultLimiter,
    authLimiter,
    passwordResetLimiter,
    apiLimiter,
    signupLimiter,

    // Validation
    validate,
    validations,

    // Compression
    compressionMiddleware,

    // Sanitization
    sanitizeRequest,
    apiSecurityHeaders,

    // Express-validator re-exports for convenience
    body,
    param,
    query,
    validationResult
};
