import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const SupplierDashboard = lazy(() => import('./pages/SupplierDashboard'));
const AdminConsole = lazy(() => import('./pages/AdminConsole'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-center"><div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600">Loading...</p></div></div>}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/verify" element={<VerifyPage />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/buyer/dashboard" element={<ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>} />
                  <Route path="/supplier/dashboard" element={<ProtectedRoute requiredRole="supplier"><SupplierDashboard /></ProtectedRoute>} />
                  <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminConsole /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </Router>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;