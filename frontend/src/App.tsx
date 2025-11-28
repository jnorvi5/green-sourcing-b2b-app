// frontend/src/App.tsx
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ProjectProvider } from './context/ProjectContext';
import { Toaster } from './components/ui/sonner';
import { HelmetProvider } from 'react-helmet-async';
import { initGA, trackPageView } from './lib/analytics';

// OPTIMIZED: Code splitting with React.lazy for route-based chunking
// Core pages that are always needed (keep as regular imports)
import Layout from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';
import HelpButton from './components/HelpButton';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// OPTIMIZED: Lazy load all non-critical pages to reduce initial bundle size
// Public pages
const Features = lazy(() => import('./pages/Features'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const SupplierAgreement = lazy(() => import('./pages/SupplierAgreement'));
const Sustainability = lazy(() => import('./pages/Sustainability'));
const Investors = lazy(() => import('./pages/Investors'));
const Network = lazy(() => import('./pages/Network'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// Search & Browse
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BuyerExplorationPage = lazy(() => import('./pages/BuyerExplorationPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const SupplierProfilePage = lazy(() => import('./pages/SupplierProfilePage'));
const SupplierProfile = lazy(() => import('./pages/SupplierProfile'));
const ProductComparison = lazy(() => import('./pages/ProductComparison'));
const SupplierLeaderboard = lazy(() => import('./pages/SupplierLeaderboard'));

// Buyer Dashboard pages
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const Projects = lazy(() => import('./pages/BuyerDashboard/Projects'));
const ProjectDetail = lazy(() => import('./pages/BuyerDashboard/ProjectDetail'));
const SavedMaterials = lazy(() => import('./pages/BuyerDashboard/SavedMaterials'));
const AccountSettings = lazy(() => import('./pages/BuyerDashboard/AccountSettings'));
const CarbonAnalytics = lazy(() => import('./pages/BuyerDashboard/CarbonAnalytics'));
const OrderTracking = lazy(() => import('./pages/BuyerDashboard/OrderTracking'));
const Favorites = lazy(() => import('./pages/BuyerDashboard/Favorites'));
const Reports = lazy(() => import('./pages/BuyerDashboard/Reports'));
const RFQHistoryPage = lazy(() => import('./pages/RFQHistoryPage'));

// Supplier Dashboard pages
const SupplierDashboard = lazy(() => import('./pages/SupplierDashboard/index'));
const ProductsPage = lazy(() => import('./pages/SupplierDashboard/ProductsPage'));
const AddProductPage = lazy(() => import('./pages/SupplierDashboard/AddProductPage'));
const EditProductPage = lazy(() => import('./pages/SupplierDashboard/EditProductPage'));
const SupplierAnalytics = lazy(() => import('./pages/SupplierDashboard/SupplierAnalytics'));
const SupplierRFQs = lazy(() => import('./pages/SupplierDashboard/SupplierRFQs'));
const SupplierOnboarding = lazy(() => import('./pages/SupplierDashboard/SupplierOnboarding'));

// Admin Dashboard pages
const AdminDashboard = lazy(() => import('./pages/Admin'));
const ContentModerationPage = lazy(() => import('./pages/Admin/ContentModerationPage'));
const AdminAnalytics = lazy(() => import('./pages/AdminDashboard/AdminAnalytics'));
const AuditLogs = lazy(() => import('./pages/Admin/AuditLogs'));
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const SystemSettings = lazy(() => import('./pages/Admin/SystemSettings'));
const PlatformAnalytics = lazy(() => import('./pages/Admin/PlatformAnalytics'));

// Utility pages
const Messages = lazy(() => import('./pages/Messages'));
const Settings = lazy(() => import('./pages/Settings'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Notifications = lazy(() => import('./pages/Notifications'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const ApiIntegrations = lazy(() => import('./pages/ApiIntegrations'));

// Financial & Business pages
const QuoteDetails = lazy(() => import('./pages/QuoteDetails'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Quotes = lazy(() => import('./pages/Quotes'));
const KPIDashboard = lazy(() => import('./pages/KPIDashboard'));
const Payments = lazy(() => import('./pages/Payments'));
const Documents = lazy(() => import('./pages/Documents'));
const Contracts = lazy(() => import('./pages/Contracts'));
const Budgets = lazy(() => import('./pages/Budgets'));

// Sustainability & Operations pages
const CarbonCalculator = lazy(() => import('./pages/CarbonCalculator'));
const SustainabilityReports = lazy(() => import('./pages/SustainabilityReports'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Shipments = lazy(() => import('./pages/Shipments'));
const SupplierQualification = lazy(() => import('./pages/SupplierQualification'));

// Other pages
const ArchitectSurvey = lazy(() => import('./components/ArchitectSurvey').then(m => ({ default: m.ArchitectSurvey })));
const Charter175 = lazy(() => import('./pages/Charter175'));
const S3Test = lazy(() => import('./pages/S3Test'));


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
          {/* OPTIMIZED: Wrap Routes with Suspense for lazy-loaded components */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Routes with the main Layout (Header, Footer, etc.) */}
              <Route path="/" element={<Layout />}>
                <Route index element={<LandingPage />} />
                <Route path="features" element={<Features />} />
                <Route path="contact" element={<Contact />} />
                <Route path="privacy-policy" element={<Privacy />} />
                <Route path="terms-of-service" element={<Terms />} />
                <Route path="supplier-agreement" element={<SupplierAgreement />} />
                <Route path="sustainability" element={<Sustainability />} />
                <Route path="investors" element={<Investors />} />
                <Route path="network" element={<Network />} />
                <Route path="unauthorized" element={<Unauthorized />} />
                <Route path="survey/architect" element={<ArchitectSurvey />} />
                <Route path="badges/charter175" element={<Charter175 />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="explore" element={<BuyerExplorationPage />} />
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
              <Route path="/dashboard/supplier/analytics" element={<SupplierAnalytics />} />
              <Route path="/dashboard/supplier/rfqs" element={<SupplierRFQs />} />
              <Route path="/dashboard/supplier/onboarding" element={<SupplierOnboarding />} />
              <Route path="/team" element={<TeamManagement />} />
              <Route path="/integrations" element={<ApiIntegrations />} />

              {/* Buyer Dashboard */}
              <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
              <Route path="/dashboard/buyer/saved" element={<SavedMaterials />} />
              <Route path="/dashboard/buyer/settings" element={<AccountSettings />} />
              <Route path="/dashboard/buyer/analytics" element={<CarbonAnalytics />} />
              <Route path="/dashboard/buyer/orders" element={<OrderTracking />} />
              <Route path="/dashboard/buyer/favorites" element={<Favorites />} />
              <Route path="/compare" element={<ProductComparison />} />
              <Route path="/rfq-history" element={<RFQHistoryPage />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/dashboard/buyer/reports" element={<Reports />} />
              <Route path="/quote/:quoteId" element={<QuoteDetails />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/kpi" element={<KPIDashboard />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/leaderboard" element={<SupplierLeaderboard />} />
              <Route path="/carbon-calculator" element={<CarbonCalculator />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/sustainability-reports" element={<SustainabilityReports />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/shipments" element={<Shipments />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/supplier-qualification" element={<SupplierQualification />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />}>
                <Route path="content" element={<ContentModerationPage />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="audit" element={<AuditLogs />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="platform" element={<PlatformAnalytics />} />
              </Route>


              {/* Standalone Routes (no main Layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ProjectProvider>
        <Toaster />
        <HelpButton variant="floating" />
      </HelmetProvider>
    </ErrorBoundary >
  );
}

export default App;


