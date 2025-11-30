const jwt = require('jsonwebtoken');

// JWT secret from environment or default (change in production!)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Check if auth should be skipped (evaluated at runtime)
 */
function shouldSkipAuth() {
    const skip = process.env.SKIP_AUTH === 'true' || process.env.NODE_ENV === 'development';
    // Debug: log on first call
    if (shouldSkipAuth._firstCall !== false) {
        console.log('[Auth] Skip auth check:', { SKIP_AUTH: process.env.SKIP_AUTH, NODE_ENV: process.env.NODE_ENV, skip });
        shouldSkipAuth._firstCall = false;
    }
    return skip;
}

/**
 * Middleware to authenticate JWT token from Authorization header
 * Sets req.user with decoded token payload
 * In development mode (SKIP_AUTH=true), allows unauthenticated access with mock user
 */
function authenticateToken(req, res, next) {
    // Skip auth in development mode
    if (shouldSkipAuth()) {
        req.user = {
            userId: 1,
            email: 'dev@greenchainz.com',
            role: 'Admin',
            companyId: 1
        };
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Middleware to authorize specific roles
 * Must be used after authenticateToken
 * @param {...string} roles - Allowed roles (e.g., 'Admin', 'Supplier')
 */
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRoles,
    JWT_SECRET
};
