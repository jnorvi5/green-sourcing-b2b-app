'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  UserRole,
  AdminStats,
  SupplierDashboardStats,
  ArchitectDashboardStats,
  IncomingRfq,
  SupplierQuote,
  ArchitectRfq,
  Profile,
  SupplierProfile,
  Product,
} from '@/types/admin-dashboard';

export default function UnifiedDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role-specific states
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [supplierStats, setSupplierStats] = useState<SupplierDashboardStats | null>(null);
  const [architectStats, setArchitectStats] = useState<ArchitectDashboardStats | null>(null);
  
  // Supplier-specific data
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null);
  const [incomingRfqs, setIncomingRfqs] = useState<IncomingRfq[]>([]);
  const [myQuotes, setMyQuotes] = useState<SupplierQuote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Architect-specific data
  const [architectRfqs, setArchitectRfqs] = useState<ArchitectRfq[]>([]);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboard() {
    try {
      setError(null);

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      // Get user profile with role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, role, email')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        setError('Failed to load user profile');
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      // Load role-specific data
      switch (profileData.role) {
        case 'admin':
          await loadAdminDashboard();
          break;
        case 'supplier':
          await loadSupplierDashboard(user.id);
          break;
        case 'architect':
          await loadArchitectDashboard(user.id);
          break;
        default:
          setError('Invalid user role');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('An unexpected error occurred while loading the dashboard.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminDashboard() {
    try {
      // Count total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Count suppliers
      const { count: suppliersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'supplier');

      // Count architects
      const { count: architectsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'architect');

      // Count total RFQs
      const { count: rfqsCount } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true });

      // Count pending verifications (suppliers without verified status)
      const { count: pendingVerifications } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .is('verification_status', null);

      setAdminStats({
        totalUsers: usersCount || 0,
        totalSuppliers: suppliersCount || 0,
        totalArchitects: architectsCount || 0,
        totalRfqs: rfqsCount || 0,
        pendingVerifications: pendingVerifications || 0,
      });
    } catch (err) {
      console.error('Error loading admin stats:', err);
    }
  }

  async function loadSupplierDashboard(userId: string) {
    try {
      // Load supplier profile
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (supplierError) {
        setError('Failed to load supplier profile. Please ensure your account is set up correctly.');
        return;
      }

      setSupplierProfile(supplierData);

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, supplier_id, product_name, material_type, description')
        .eq('supplier_id', supplierData.id);

      setProducts(productsData || []);

      // Calculate profile completeness
      const completeness = calculateProfileCompleteness(supplierData, productsData || []);

      // Load incoming RFQs (where supplier is matched but hasn't quoted yet)
      const { data: rfqsData } = await supabase
        .from('rfqs')
        .select(`
          id,
          project_name,
          material_specs,
          delivery_deadline,
          created_at,
          architect_id,
          users!rfqs_architect_id_fkey(full_name, company_name)
        `)
        .contains('matched_suppliers', [supplierData.id])
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Filter out RFQs that already have responses
      const { data: existingResponses } = await supabase
        .from('rfq_responses')
        .select('rfq_id')
        .eq('supplier_id', supplierData.id);

      const respondedRfqIds = new Set(existingResponses?.map(r => r.rfq_id) || []);
      const unquotedRfqs = (rfqsData || []).filter(rfq => !respondedRfqIds.has(rfq.id));

      // Transform RFQs data
      const transformedRfqs: IncomingRfq[] = unquotedRfqs.map(rfq => ({
        id: rfq.id,
        project_name: rfq.project_name,
        material_type: (rfq.material_specs as { material_type?: string })?.material_type || 'N/A',
        delivery_deadline: rfq.delivery_deadline,
        match_score: 85,
        created_at: rfq.created_at,
        architect: {
          full_name: (rfq.users as { full_name: string | null } | null)?.full_name || null,
          company_name: (rfq.users as { company_name: string | null } | null)?.company_name || null,
        },
      }));

      setIncomingRfqs(transformedRfqs);

      // Load my quotes
      const { data: quotesData } = await supabase
        .from('rfq_responses')
        .select(`
          id,
          rfq_id,
          quote_amount,
          status,
          responded_at,
          rfqs!rfq_responses_rfq_id_fkey(project_name)
        `)
        .eq('supplier_id', supplierData.id)
        .order('responded_at', { ascending: false });

      const transformedQuotes: SupplierQuote[] = (quotesData || []).map(quote => ({
        id: quote.id,
        rfq_id: quote.rfq_id,
        quote_amount: quote.quote_amount,
        status: quote.status as 'submitted' | 'accepted' | 'rejected',
        responded_at: quote.responded_at,
        rfq: {
          project_name: (quote.rfqs as { project_name: string })?.project_name || 'Unknown Project',
        },
      }));

      setMyQuotes(transformedQuotes);

      // Calculate stats
      const pendingQuotes = transformedQuotes.filter(q => q.status === 'submitted').length;
      const acceptedQuotes = transformedQuotes.filter(q => q.status === 'accepted').length;

      setSupplierStats({
        totalRfqMatches: transformedRfqs.length + transformedQuotes.length,
        pendingQuotes,
        acceptedQuotes,
        profileCompleteness: completeness,
      });
    } catch (err) {
      console.error('Error loading supplier dashboard:', err);
    }
  }

  async function loadArchitectDashboard(userId: string) {
    try {
      // Load architect's RFQs
      const { data: rfqsData } = await supabase
        .from('rfqs')
        .select(`
          id,
          project_name,
          material_specs,
          delivery_deadline,
          created_at,
          status,
          matched_suppliers
        `)
        .eq('architect_id', userId)
        .order('created_at', { ascending: false });

      // Get response counts for each RFQ
      const rfqsWithResponses: ArchitectRfq[] = await Promise.all(
        (rfqsData || []).map(async (rfq) => {
          const { count } = await supabase
            .from('rfq_responses')
            .select('*', { count: 'exact', head: true })
            .eq('rfq_id', rfq.id);

          return {
            id: rfq.id,
            project_name: rfq.project_name,
            material_specs: rfq.material_specs as Record<string, unknown>,
            delivery_deadline: rfq.delivery_deadline,
            created_at: rfq.created_at,
            status: rfq.status,
            matched_suppliers: rfq.matched_suppliers || [],
            response_count: count || 0,
          };
        })
      );

      setArchitectRfqs(rfqsWithResponses);

      // Calculate stats
      const totalRfqs = rfqsWithResponses.length;
      const pendingResponses = rfqsWithResponses.filter(
        rfq => rfq.status === 'pending' && rfq.response_count === 0
      ).length;
      
      // Count accepted quotes across all RFQs
      const { count: acceptedCount } = await supabase
        .from('rfq_responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .in('rfq_id', rfqsWithResponses.map(r => r.id));

      setArchitectStats({
        totalRfqs,
        pendingResponses,
        acceptedQuotes: acceptedCount || 0,
        savedSuppliers: 0, // TODO: Implement saved suppliers feature
      });
    } catch (err) {
      console.error('Error loading architect dashboard:', err);
    }
  }

  function calculateProfileCompleteness(
    supplier: SupplierProfile,
    products: Product[]
  ): number {
    let score = 0;

    // Company name (20 points)
    if (supplier.company_name) score += 20;

    // Description (20 points)
    if (supplier.description && supplier.description.length > 50) score += 20;

    // Certifications (30 points)
    if (supplier.certifications && Array.isArray(supplier.certifications) && supplier.certifications.length > 0) {
      score += 30;
    }

    // Products (30 points)
    if (products.length > 0) score += 30;

    return Math.round(score);
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function isNewRfq(createdAt: string): boolean {
    const now = new Date();
    const rfqDate = new Date(createdAt);
    const hoursDiff = (now.getTime() - rfqDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'accepted':
        return 'bg-green-500/10 text-green-400';
      case 'rejected':
        return 'bg-red-500/10 text-red-400';
      case 'pending':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'submitted':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-xl bg-red-500/10 border border-red-500/20">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-300 mb-4">{error || 'Failed to load profile'}</p>
          <button
            onClick={() => loadDashboard()}
            className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  if (profile.role === 'admin') {
    return <AdminDashboardView stats={adminStats} />;
  } else if (profile.role === 'supplier') {
    return (
      <SupplierDashboardView
        profile={supplierProfile}
        stats={supplierStats}
        incomingRfqs={incomingRfqs}
        myQuotes={myQuotes}
        products={products}
        formatDate={formatDate}
        isNewRfq={isNewRfq}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />
    );
  } else if (profile.role === 'architect') {
    return (
      <ArchitectDashboardView
        stats={architectStats}
        rfqs={architectRfqs}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
      />
    );
  }

  return null;
}

// Admin Dashboard View
function AdminDashboardView({ stats }: { stats: AdminStats | null }) {
  if (!stats) {
    return (
      <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-gray-400">Loading admin stats...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Suppliers"
          value={stats.totalSuppliers}
          icon={
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Architects"
          value={stats.totalArchitects}
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title="Total RFQs"
          value={stats.totalRfqs}
          icon={
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="teal"
        />
        <StatCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="Analytics"
            description="View platform metrics"
            href="/admin/analytics"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <ActionCard
            title="Outreach"
            description="Manage supplier outreach"
            href="/admin/outreach"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <ActionCard
            title="Email Logs"
            description="Review email activity"
            href="/admin/emails"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <ActionCard
            title="Verify Certs"
            description="Review certifications"
            href="/admin/verify"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

// Supplier Dashboard View
function SupplierDashboardView({
  profile,
  stats,
  incomingRfqs,
  myQuotes,
  products,
  formatDate,
  isNewRfq,
  getStatusColor,
  getStatusLabel,
}: {
  profile: SupplierProfile | null;
  stats: SupplierDashboardStats | null;
  incomingRfqs: IncomingRfq[];
  myQuotes: SupplierQuote[];
  products: Product[];
  formatDate: (date: string | null) => string;
  isNewRfq: (date: string) => boolean;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}) {
  if (!stats) {
    return (
      <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-gray-400">Loading supplier stats...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Supplier Dashboard
      </h1>
      <p className="text-gray-400 mb-6">
        Welcome back, {profile?.company_name || 'Supplier'}
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="RFQ Matches"
          value={stats.totalRfqMatches}
          icon={
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="teal"
        />
        <StatCard
          title="Pending Quotes"
          value={stats.pendingQuotes}
          icon={
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="yellow"
        />
        <StatCard
          title="Accepted Quotes"
          value={stats.acceptedQuotes}
          icon={
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Profile"
          value={`${stats.profileCompleteness}%`}
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          color="blue"
        />
      </div>

      {/* Incoming RFQs */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Incoming RFQs</h2>
        {incomingRfqs.length === 0 ? (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-gray-400">No new RFQs at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingRfqs.slice(0, 5).map((rfq) => (
              <div key={rfq.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isNewRfq(rfq.created_at) && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500 text-black text-xs font-bold">
                          NEW
                        </span>
                      )}
                      <h3 className="font-semibold">{rfq.project_name}</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      {rfq.architect.full_name || rfq.architect.company_name || 'Architect'} • {rfq.material_type}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Deadline: {formatDate(rfq.delivery_deadline)}
                    </p>
                  </div>
                  <Link
                    href={`/rfq/${rfq.id}`}
                    className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition text-sm"
                  >
                    Submit Quote
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Quotes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Quotes</h2>
        {myQuotes.length === 0 ? (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-gray-400">No quotes submitted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myQuotes.slice(0, 5).map((quote) => (
              <div key={quote.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{quote.rfq.project_name}</h3>
                    <p className="text-sm text-gray-400">
                      ${quote.quote_amount.toLocaleString()} • {formatDate(quote.responded_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {getStatusLabel(quote.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Architect Dashboard View
function ArchitectDashboardView({
  stats,
  rfqs,
  formatDate,
  getStatusColor,
}: {
  stats: ArchitectDashboardStats | null;
  rfqs: ArchitectRfq[];
  formatDate: (date: string | null) => string;
  getStatusColor: (status: string) => string;
}) {
  if (!stats) {
    return (
      <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-gray-400">Loading architect stats...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Architect Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="Total RFQs"
          value={stats.totalRfqs}
          icon={
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="teal"
        />
        <StatCard
          title="Pending Responses"
          value={stats.pendingResponses}
          icon={
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="yellow"
        />
        <StatCard
          title="Accepted Quotes"
          value={stats.acceptedQuotes}
          icon={
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Saved Suppliers"
          value={stats.savedSuppliers}
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          }
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <ActionCard
            title="Create RFQ"
            description="Start a new request for quote"
            href="/architect/rfq/new"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <ActionCard
            title="Find Suppliers"
            description="Browse verified suppliers"
            href="/search"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <ActionCard
            title="My RFQs"
            description="View all your requests"
            href="/admin/my-rfqs"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Recent RFQs */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your RFQs</h2>
        {rfqs.length === 0 ? (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-gray-400 mb-4">No RFQs created yet</p>
            <Link
              href="/architect/rfq/new"
              className="inline-block px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition"
            >
              Create Your First RFQ
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rfqs.slice(0, 5).map((rfq) => (
              <div key={rfq.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{rfq.project_name}</h3>
                    <p className="text-sm text-gray-400">
                      {rfq.matched_suppliers.length} suppliers matched • {rfq.response_count} responses
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Deadline: {formatDate(rfq.delivery_deadline)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                    {rfq.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Components
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: JSX.Element;
  color: 'blue' | 'green' | 'purple' | 'teal' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    teal: 'bg-teal-500/10 border-teal-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
  };

  return (
    <div className={`p-4 sm:p-6 rounded-xl backdrop-blur-sm border ${colorClasses[color]} hover:border-${color}-500/50 transition`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-2xl sm:text-3xl font-bold">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: JSX.Element;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/50 hover:bg-white/10 transition group"
    >
      <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition">
        {icon}
      </div>
      <div>
        <p className="font-semibold mb-1">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
