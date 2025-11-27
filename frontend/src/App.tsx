// frontend/src/App.tsx
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import { LandingPage } from './pages/LandingPage';
import BuyerDashboard from './pages/BuyerDashboard';
import { ArchitectSurvey } from './components/ArchitectSurvey';
import Features from './pages/Features';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import SupplierAgreement from './pages/SupplierAgreement';
import Unauthorized from './pages/Unauthorized';
import RFQHistoryPage from './pages/RFQHistoryPage';
import Layout from './components/Layout';
import Charter175 from './pages/Charter175';
import SearchPage from './pages/SearchPage';

import ProductDetailPage from './pages/ProductDetailPage';
import SupplierProfilePage from './pages/SupplierProfilePage';

import SupplierProfile from './pages/SupplierProfile';
import S3Test from './pages/S3Test';

import SupplierDashboard from './pages/SupplierDashboard/index';
import ProductsPage from './pages/SupplierDashboard/ProductsPage';
import HelpButton from './components/HelpButton';
import AddProductPage from './pages/SupplierDashboard/AddProductPage';
import EditProductPage from './pages/SupplierDashboard/EditProductPage';
import AdminDashboard from './pages/Admin';
import ContentModerationPage from './pages/Admin/ContentModerationPage';
import { ProjectProvider } from './context/ProjectContext';
import Projects from './pages/BuyerDashboard/Projects';
import ProjectDetail from './pages/BuyerDashboard/ProjectDetail';
import { Toaster } from './components/ui/sonner';
import NotFound from './pages/NotFound';
import { HelmetProvider } from 'react-helmet-async';
import { initGA, trackPageView } from './lib/analytics';



function App() {
  const location = useLocation();

  // Initialize Google Analytics on app mount
  useEffect(() => {
    initGA();
  }, []);

  // Track pageview on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ProjectProvider>
          <Routes>
            {/* Routes with the main Layout (Header, Footer, etc.) */}
            <Route path="/" element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="features" element={<Features />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy-policy" element={<Privacy />} />
              <Route path="terms-of-service" element={<Terms />} />
              <Route path="supplier-agreement" element={<SupplierAgreement />} />
              <Route path="unauthorized" element={<Unauthorized />} />
              <Route path="survey/architect" element={<ArchitectSurvey />} />
              <Route path="badges/charter175" element={<Charter175 />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="product/:id" element={<ProductDetailPage />} />
              <Route path="supplier/:id" element={<SupplierProfilePage />} />
              <Route path="suppliers/:id" element={<SupplierProfile />} />
              <Route path="dashboard/buyer/projects" element={<Projects />} />
              <Route path="dashboard/buyer/projects/:projectId" element={<ProjectDetail />} />
              <Route path="test/s3" element={<S3Test />} />
            </Route>


            {/* Protected Routes - Temporarily disabled until demo pages are fixed */}
            {/* <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}> */}
            <Route
              path="dashboard"
              element={
                <BuyerDashboard />
              }
            />
            <Route path="/search" element={<SearchPage />} />

            {/* Supplier Dashboard Routes */}
            <Route path="/dashboard/supplier" element={<SupplierDashboard />} />
            <Route path="/dashboard/supplier/products" element={<ProductsPage />} />
            <Route path="/dashboard/supplier/products/new" element={<AddProductPage />} />
            <Route path="/dashboard/supplier/products/:id/edit" element={<EditProductPage />} />

            {/* Buyer Dashboard */}
            <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
            <Route path="/rfq-history" element={<RFQHistoryPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />}>
              <Route path="content" element={<ContentModerationPage />} />
            </Route>


            {/* Standalone Routes (no main Layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ProjectProvider>
        <Toaster />
        <HelpButton variant="floating" />
      </HelmetProvider>
    </ErrorBoundary >
  );
}

export default App;
