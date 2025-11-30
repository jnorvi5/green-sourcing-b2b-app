/**
 * Supabase Auth Middleware
 * 
 * Enhanced RBAC middleware that verifies Supabase JWT tokens
 * and checks user roles from the profiles table.
 */

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Service role client for admin operations
const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// JWT secret for Supabase (from project settings)
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

// Valid roles
const VALID_ROLES = ['buyer', 'supplier', 'admin'];

/**
 * Verify Supabase JWT token and attach user to request
 */
async function authenticateSupabase(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_TOKEN_MISSING'
            });
        }

        // Verify JWT
        let decoded;
        try {
            decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    code: 'AUTH_TOKEN_EXPIRED'
                });
            }
            return res.status(401).json({
                error: 'Invalid token',
                code: 'AUTH_TOKEN_INVALID'
            });
        }

        // Extract user info from JWT
        const userId = decoded.sub;
        const email = decoded.email;

        // Get user profile with role from database
        let userProfile = null;
        if (supabaseAdmin) {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('id, email, role, first_name, last_name, company_name, onboarding_completed')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('[SupabaseAuth] Profile fetch error:', error.message);
            } else {
                userProfile = data;
            }
        }

        // Fallback to JWT metadata if profile not found
        const role = userProfile?.role || decoded.user_metadata?.role || 'buyer';

        // Attach user to request
        req.user = {
            userId,
            email,
            role,
            firstName: userProfile?.first_name || decoded.user_metadata?.first_name,
            lastName: userProfile?.last_name || decoded.user_metadata?.last_name,
            companyName: userProfile?.company_name || decoded.user_metadata?.company_name,
            onboardingCompleted: userProfile?.onboarding_completed || false,
            supabaseToken: token,
            tokenPayload: decoded
        };

        // Update last login (non-blocking)
        if (supabaseAdmin) {
            supabaseAdmin
                .from('profiles')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', userId)
                .then(() => { })
                .catch(() => { });
        }

        next();
    } catch (err) {
        console.error('[SupabaseAuth] Authentication error:', err);
        return res.status(500).json({
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
}

/**
 * Middleware factory to ensure user has required role(s)
 * @param {...string} allowedRoles - Roles that can access the route
 */
function ensureRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;

        // Validate role
        if (!VALID_ROLES.includes(userRole)) {
            console.warn(`[SupabaseAuth] Invalid role: ${userRole} for user ${req.user.userId}`);
            return res.status(403).json({
                error: 'Invalid user role',
                code: 'AUTH_INVALID_ROLE'
            });
        }

        // Admin always has access
        if (userRole === 'admin') {
            return next();
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(userRole)) {
            console.warn(`[SupabaseAuth] Access denied: ${userRole} tried to access route requiring ${allowedRoles.join('/')}`);
            return res.status(403).json({
                error: 'Access denied',
                message: `This action requires ${allowedRoles.join(' or ')} role`,
                code: 'AUTH_INSUFFICIENT_ROLE',
                requiredRoles: allowedRoles,
                userRole
            });
        }

        next();
    };
}

/**
 * Shorthand for supplier-only routes
 */
const supplierOnly = ensureRole('supplier');

/**
 * Shorthand for buyer-only routes
 */
const buyerOnly = ensureRole('buyer');

/**
 * Shorthand for admin-only routes
 */
const adminOnly = ensureRole('admin');

/**
 * Allow both suppliers and buyers (but not anonymous)
 */
const authenticated = ensureRole('supplier', 'buyer', 'admin');

/**
 * Check if user owns a resource
 * @param {Function} getOwnerId - Function that returns owner ID from request
 */
function ensureOwnership(getOwnerId) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Admins can access anything
        if (req.user.role === 'admin') {
            return next();
        }

        try {
            const ownerId = await getOwnerId(req);

            if (ownerId !== req.user.userId) {
                return res.status(403).json({
                    error: 'You do not have permission to access this resource',
                    code: 'AUTH_NOT_OWNER'
                });
            }

            next();
        } catch (err) {
            console.error('[SupabaseAuth] Ownership check error:', err);
            return res.status(500).json({
                error: 'Authorization check failed',
                code: 'AUTH_ERROR'
            });
        }
    };
}

/**
 * Get user profile by ID
 */
async function getUserProfile(userId) {
    if (!supabaseAdmin) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('[SupabaseAuth] Get profile error:', error);
        return null;
    }

    return data;
}

/**
 * Update user role (admin only)
 */
async function updateUserRole(userId, newRole) {
    if (!supabaseAdmin) {
        throw new Error('Admin client not configured');
    }

    if (!VALID_ROLES.includes(newRole)) {
        throw new Error(`Invalid role: ${newRole}`);
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

module.exports = {
    authenticateSupabase,
    ensureRole,
    supplierOnly,
    buyerOnly,
    adminOnly,
    authenticated,
    ensureOwnership,
    getUserProfile,
    updateUserRole,
    VALID_ROLES,
    supabaseAdmin
};
