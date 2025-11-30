/**
 * Global Error Handler Middleware
 * 
 * Provides:
 * - Centralized error handling
 * - User-friendly error messages
 * - Error code system
 * - Production vs development error responses
 */

const { logger, logError } = require('./logger');

// ==========================================
// ERROR CODES
// ==========================================

const ErrorCodes = {
    // Authentication (1xxx)
    AUTH_REQUIRED: { code: 1001, status: 401, message: 'Authentication required' },
    AUTH_INVALID_TOKEN: { code: 1002, status: 401, message: 'Invalid or expired token' },
    AUTH_INSUFFICIENT_PERMISSIONS: { code: 1003, status: 403, message: 'Insufficient permissions' },
    AUTH_INVALID_CREDENTIALS: { code: 1004, status: 401, message: 'Invalid email or password' },
    AUTH_ACCOUNT_LOCKED: { code: 1005, status: 403, message: 'Account is locked. Please contact support.' },
    AUTH_EMAIL_NOT_VERIFIED: { code: 1006, status: 403, message: 'Please verify your email address' },

    // Validation (2xxx)
    VALIDATION_ERROR: { code: 2001, status: 400, message: 'Validation failed' },
    INVALID_INPUT: { code: 2002, status: 400, message: 'Invalid input data' },
    MISSING_FIELD: { code: 2003, status: 400, message: 'Required field is missing' },
    INVALID_FORMAT: { code: 2004, status: 400, message: 'Invalid data format' },

    // Resource (3xxx)
    NOT_FOUND: { code: 3001, status: 404, message: 'Resource not found' },
    ALREADY_EXISTS: { code: 3002, status: 409, message: 'Resource already exists' },
    CONFLICT: { code: 3003, status: 409, message: 'Resource conflict' },
    GONE: { code: 3004, status: 410, message: 'Resource no longer available' },

    // Rate Limiting (4xxx)
    RATE_LIMITED: { code: 4001, status: 429, message: 'Too many requests. Please try again later.' },
    QUOTA_EXCEEDED: { code: 4002, status: 429, message: 'API quota exceeded' },

    // Server (5xxx)
    INTERNAL_ERROR: { code: 5001, status: 500, message: 'An unexpected error occurred' },
    DATABASE_ERROR: { code: 5002, status: 500, message: 'Database operation failed' },
    EXTERNAL_SERVICE_ERROR: { code: 5003, status: 502, message: 'External service unavailable' },
    SERVICE_UNAVAILABLE: { code: 5004, status: 503, message: 'Service temporarily unavailable' },
    TIMEOUT: { code: 5005, status: 504, message: 'Request timeout' }
};

// ==========================================
// CUSTOM ERROR CLASS
// ==========================================

class AppError extends Error {
    constructor(errorType, details = null, originalError = null) {
        const errorDef = ErrorCodes[errorType] || ErrorCodes.INTERNAL_ERROR;
        super(errorDef.message);

        this.name = 'AppError';
        this.code = errorDef.code;
        this.status = errorDef.status;
        this.errorType = errorType;
        this.details = details;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: true,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp
        };
    }
}

// ==========================================
// ERROR HANDLER MIDDLEWARE
// ==========================================

/**
 * Global error handler - must be last middleware
 */
const globalErrorHandler = (err, req, res, next) => {
    // If headers already sent, delegate to default handler
    if (res.headersSent) {
        return next(err);
    }

    // Determine if it's our custom error
    const isAppError = err instanceof AppError;

    // Log the error
    logError(err, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.userId,
        isAppError
    });

    // Determine status code
    let status = err.status || err.statusCode || 500;
    let code = err.code || 5001;
    let message = err.message || 'An unexpected error occurred';
    let details = err.details || null;

    // Handle specific error types
    if (err.name === 'JsonWebTokenError') {
        status = 401;
        code = 1002;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        status = 401;
        code = 1002;
        message = 'Token has expired';
    } else if (err.name === 'ValidationError') {
        status = 400;
        code = 2001;
        message = 'Validation failed';
        details = err.errors;
    } else if (err.code === '23505') {
        // PostgreSQL unique violation
        status = 409;
        code = 3002;
        message = 'Resource already exists';
    } else if (err.code === '23503') {
        // PostgreSQL foreign key violation
        status = 400;
        code = 2002;
        message = 'Referenced resource does not exist';
    } else if (err.code === 'ECONNREFUSED') {
        status = 503;
        code = 5004;
        message = 'Service temporarily unavailable';
    }

    // Build response
    const response = {
        error: true,
        code,
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        path: req.path
    };

    // Include stack trace in development
    if (process.env.NODE_ENV !== 'production' && err.stack) {
        response.stack = err.stack.split('\n').slice(0, 5);
    }

    // Include request ID if available
    if (req.id) {
        response.requestId = req.id;
    }

    res.status(status).json(response);
};

// ==========================================
// 404 HANDLER
// ==========================================

/**
 * Handle 404 Not Found
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: true,
        code: 3001,
        message: 'Endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
};

// ==========================================
// ASYNC HANDLER WRAPPER
// ==========================================

/**
 * Wrap async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// ERROR FACTORY
// ==========================================

/**
 * Create an AppError from error type
 */
const createError = (errorType, details = null, originalError = null) => {
    return new AppError(errorType, details, originalError);
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    ErrorCodes,
    AppError,
    globalErrorHandler,
    notFoundHandler,
    asyncHandler,
    createError
};
