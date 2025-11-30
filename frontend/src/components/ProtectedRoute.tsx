// frontend/src/components/ProtectedRoute.tsx
/**
 * Enhanced Protected Route Component
 * 
 * Handles route protection based on authentication and role.
 * Works with the enhanced AuthContext that provides profile-based RBAC.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

// Define the props for the ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required role(s) to access this route - uses profile.role from database */
  allowedRoles?: UserRole | UserRole[];
  /** Redirect path for unauthenticated users */
  loginPath?: string;
  /** Redirect path for unauthorized users (wrong role) */
  unauthorizedPath?: string;
}

/**
 * Loading spinner component matching GreenChainz design
 */
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center">
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-4">
        <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm">Verifying access...</p>
    </div>
  </div>
);

/**
 * Protected Route wrapper
 * 
 * Usage:
 * <ProtectedRoute allowedRoles="supplier">
 *   <SupplierDashboard />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute allowedRoles={['buyer', 'admin']}>
 *   <BuyerDashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  loginPath = '/login',
  unauthorizedPath = '/unauthorized'
}: ProtectedRouteProps) {
  const { user, profile, loading, hasRole } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return <LoadingSpinner />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    // Save the attempted URL for redirect after login
    return (
      <Navigate
        to={loginPath}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check role if required
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Wait for profile to load if we need role checking
    if (!profile) {
      return <LoadingSpinner />;
    }

    // Check if user has required role using AuthContext's hasRole
    if (!hasRole(roles)) {
      console.warn(
        `[ProtectedRoute] Access denied: User role '${profile.role}' not in allowed roles [${roles.join(', ')}]`
      );
      return (
        <Navigate
          to={unauthorizedPath}
          state={{
            from: location.pathname,
            requiredRoles: roles,
            userRole: profile.role
          }}
          replace
        />
      );
    }
  }

  // Authorized - render children
  return <>{children}</>;
}

/**
 * Shorthand for supplier-only routes
 */
export const SupplierRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles="supplier">{children}</ProtectedRoute>
);

/**
 * Shorthand for buyer-only routes
 */
export const BuyerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles="buyer">{children}</ProtectedRoute>
);

/**
 * Shorthand for admin-only routes
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles="admin">{children}</ProtectedRoute>
);

/**
 * Route accessible by any authenticated user
 */
export const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

/**
 * Route accessible by suppliers and admins
 */
export const SupplierOrAdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['supplier', 'admin']}>{children}</ProtectedRoute>
);

/**
 * Route accessible by buyers and admins
 */
export const BuyerOrAdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['buyer', 'admin']}>{children}</ProtectedRoute>
);
