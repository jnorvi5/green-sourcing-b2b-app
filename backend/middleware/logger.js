/**
 * Enterprise Logger
 * 
 * Structured logging with Winston for:
 * - Console output (development)
 * - File output (production)
 * - JSON format for log aggregation (CloudWatch, DataDog, etc.)
 * - Request/response logging with Morgan
 * - Audit trail for sensitive operations
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// ==========================================
// CUSTOM FORMATS
// ==========================================

// Format for console output (colored, readable)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

// Format for file/JSON output (structured, parseable)
const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// ==========================================
// MAIN LOGGER
// ==========================================

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    defaultMeta: {
        service: 'greenchainz-api',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '0.1.0'
    },
    transports: [
        // Console transport (always enabled)
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat
        }),

        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: jsonFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),

        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: jsonFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: jsonFormat
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            format: jsonFormat
        })
    ]
});

// ==========================================
// SPECIALIZED LOGGERS
// ==========================================

// Audit logger for sensitive operations
const auditLogger = winston.createLogger({
    level: 'info',
    defaultMeta: { type: 'audit' },
    format: jsonFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
        })
    ]
});

// Security logger for auth/security events
const securityLogger = winston.createLogger({
    level: 'info',
    defaultMeta: { type: 'security' },
    format: jsonFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'security.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

// ==========================================
// LOGGING HELPERS
// ==========================================

/**
 * Log an audit event (data changes, sensitive operations)
 */
const logAudit = (action, details = {}) => {
    auditLogger.info(action, {
        timestamp: new Date().toISOString(),
        ...details
    });
};

/**
 * Log a security event (login, auth failure, etc.)
 */
const logSecurity = (event, details = {}) => {
    securityLogger.info(event, {
        timestamp: new Date().toISOString(),
        ...details
    });
};

/**
 * Log an API request
 */
const logRequest = (req, res, duration) => {
    const log = {
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.userId,
        contentLength: res.get('content-length')
    };

    if (res.statusCode >= 500) {
        logger.error('Request failed', log);
    } else if (res.statusCode >= 400) {
        logger.warn('Request error', log);
    } else {
        logger.info('Request completed', log);
    }
};

/**
 * Log a database query (for debugging)
 */
const logQuery = (query, params, duration) => {
    if (process.env.LOG_QUERIES === 'true') {
        logger.debug('Database query', {
            query: query.substring(0, 200),
            params: params?.length,
            duration: `${duration}ms`
        });
    }
};

/**
 * Log an error with context
 */
const logError = (error, context = {}) => {
    logger.error(error.message, {
        stack: error.stack,
        code: error.code,
        ...context
    });
};

// ==========================================
// MORGAN INTEGRATION
// ==========================================

const morgan = require('morgan');

// Custom Morgan token for user ID
morgan.token('user-id', (req) => req.user?.userId || 'anonymous');

// Custom Morgan token for response time with 'ms' suffix
morgan.token('response-time-ms', (req, res) => {
    const time = morgan['response-time'](req, res);
    return time ? `${time}ms` : '-';
});

// Morgan stream to Winston
const morganStream = {
    write: (message) => {
        // Remove newline
        logger.http(message.trim());
    }
};

// Morgan middleware for HTTP request logging
const httpLogger = morgan(
    process.env.NODE_ENV === 'production'
        ? ':remote-addr :method :url :status :response-time-ms - :user-id'
        : 'dev',
    { stream: morganStream }
);

// Detailed Morgan format for debugging
const detailedHttpLogger = morgan(
    ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time-ms',
    { stream: morganStream }
);

// ==========================================
// EXPRESS MIDDLEWARE
// ==========================================

/**
 * Request logging middleware with timing
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logRequest(req, res, duration);
    });

    next();
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
    logError(err, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.userId
    });
    next(err);
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    // Main logger
    logger,

    // Specialized loggers
    auditLogger,
    securityLogger,

    // Logging functions
    logAudit,
    logSecurity,
    logRequest,
    logQuery,
    logError,

    // Morgan middleware
    httpLogger,
    detailedHttpLogger,

    // Express middleware
    requestLogger,
    errorLogger
};
