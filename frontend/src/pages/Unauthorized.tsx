// frontend/src/pages/Unauthorized.tsx
/**
 * Unauthorized Page
 * 
 * Displayed when a user tries to access a route they don't have permission for.
 * Shows helpful context about why access was denied and what to do.
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Home, ArrowLeft, LogOut } from 'lucide-react';

interface LocationState {
  from?: string;
  requiredRoles?: string[];
  userRole?: string;
}

const Unauthorized: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const state = location.state as LocationState | undefined;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleGoBack = () => {
    // Navigate to role-appropriate dashboard
    if (profile?.role === 'supplier') {
      navigate('/supplier-dashboard');
    } else if (profile?.role === 'buyer') {
      navigate('/buyer-dashboard');
    } else if (profile?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6">
          You don't have permission to access this page.
        </p>

        {/* Context Info */}
        {state && (
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
            {state.userRole && (
              <p className="text-sm text-slate-300 mb-2">
                <span className="text-slate-500">Your role:</span>{' '}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                  {state.userRole}
                </span>
              </p>
            )}
            {state.requiredRoles && state.requiredRoles.length > 0 && (
              <p className="text-sm text-slate-300 mb-2">
                <span className="text-slate-500">Required role(s):</span>{' '}
                {state.requiredRoles.map((role, i) => (
                  <span key={role}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                      {role}
                    </span>
                    {i < state.requiredRoles!.length - 1 && <span className="text-slate-500 mx-1">or</span>}
                  </span>
                ))}
              </p>
            )}
            {state.from && (
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Attempted path:</span>{' '}
                <code className="text-xs bg-slate-700 px-2 py-0.5 rounded">{state.from}</code>
              </p>
            )}
          </div>
        )}

        {/* Help Text */}
        <p className="text-sm text-slate-500 mb-6">
          If you believe this is an error, please contact your administrator
          or sign in with a different account.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to My Dashboard
          </button>

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
