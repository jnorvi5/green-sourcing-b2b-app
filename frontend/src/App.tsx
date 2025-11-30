// frontend/src/App.tsx
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
<<<<<<< HEAD
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
import VerifyPage from './pages/VerifyPage';

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
import SavedMaterials from './pages/BuyerDashboard/SavedMaterials';
import AccountSettings from './pages/BuyerDashboard/AccountSettings';
import CarbonAnalytics from './pages/BuyerDashboard/CarbonAnalytics';
import ProductComparison from './pages/ProductComparison';
import SupplierAnalytics from './pages/SupplierDashboard/SupplierAnalytics';
import SupplierRFQs from './pages/SupplierDashboard/SupplierRFQs';
import AdminAnalytics from './pages/AdminDashboard/AdminAnalytics';
import OrderTracking from './pages/BuyerDashboard/OrderTracking';
import Messages from './pages/Messages';
import Favorites from './pages/BuyerDashboard/Favorites';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import Reports from './pages/BuyerDashboard/Reports';
import QuoteDetails from './pages/QuoteDetails';
import SupplierOnboarding from './pages/SupplierDashboard/SupplierOnboarding';
import TeamManagement from './pages/TeamManagement';
import ApiIntegrations from './pages/ApiIntegrations';
import Invoices from './pages/Invoices';
import Quotes from './pages/Quotes';
import KPIDashboard from './pages/KPIDashboard';
import Payments from './pages/Payments';
import Documents from './pages/Documents';
import AuditLogs from './pages/Admin/AuditLogs';
import UserManagement from './pages/Admin/UserManagement';
import SystemSettings from './pages/Admin/SystemSettings';
import PlatformAnalytics from './pages/Admin/PlatformAnalytics';
import Notifications from './pages/Notifications';
import SupplierLeaderboard from './pages/SupplierLeaderboard';
import CarbonCalculator from './pages/CarbonCalculator';
import Contracts from './pages/Contracts';
import SustainabilityReports from './pages/SustainabilityReports';
import Inventory from './pages/Inventory';
import Shipments from './pages/Shipments';
import Budgets from './pages/Budgets';
import SupplierQualification from './pages/SupplierQualification';
import OutreachDashboard from './pages/OutreachDashboard';
=======
import { ProjectProvider } from './context/ProjectContext';
>>>>>>> 2c33f886418b712f805be96dba93afdc6bc1346b
import { Toaster } from './components/ui/sonner';
import { HelmetProvider } from 'react-helmet-async';
import { initGA, trackPageView } from './lib/analytics';

<<<<<<< HEAD
// Import ProtectedRoute with role guard variants
import ProtectedRoute, {
  SupplierRoute,
  BuyerRoute,
  AdminRoute,
  AuthenticatedRoute,
  SupplierOrAdminRoute,
  BuyerOrAdminRoute
} from './components/ProtectedRoute';

=======
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
>>>>>>> 2c33f886418b712f805be96dba93afdc6bc1346b


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
<<<<<<< HEAD
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
              <Route path="product/:id" element={<ProductDetailPage />} />
              <Route path="supplier/:id" element={<SupplierProfilePage />} />
              <Route path="suppliers/:id" element={<SupplierProfile />} />
              <Route path="dashboard/buyer/projects" element={<Projects />} />
              <Route path="dashboard/buyer/projects/:projectId" element={<ProjectDetail />} />
              <Route path="test/s3" element={<S3Test />} />
              <Route path="verify" element={<VerifyPage />} />
            </Route>


            {/* Dashboard Routes - All Public */}
            <Route path="dashboard" element={<BuyerDashboard />} />
            <Route path="/search" element={<SearchPage />} />
=======
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
>>>>>>> 2c33f886418b712f805be96dba93afdc6bc1346b

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

<<<<<<< HEAD
            {/* Buyer Dashboard Routes */}
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
            <Route path="/outreach" element={<OutreachDashboard />} />
=======
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
>>>>>>> 2c33f886418b712f805be96dba93afdc6bc1346b

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


