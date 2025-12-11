'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 1. Inner component that uses searchParams
function DashboardContent() {
  const searchParams = useSearchParams();
  // Logic using searchParams goes here
  

  const loadDashboard = useCallback(async () => {
    try {
      // Check if using test token
      const token = localStorage.getItem('auth-token');
      const isTest = token?.startsWith('test_');
      setIsTestMode(isTest || false);

      if (isTest) {
        // Demo data for test mode
        const userType = localStorage.getItem('user-type');
        setUser({
          id: 'test-user',
          email:
            userType === 'supplier'
              ? 'demo@supplier.com'
              : 'demo@architect.com',
        });
        setProfile({
          id: 'test-user',
          full_name:
            userType === 'supplier' ? 'Demo Supplier' : 'Demo Architect',
          role: 'architect',
        });
        setSentRFQs([
          {
            id: '1',
            created_at: new Date().toISOString(),
            message: 'This is a demo RFQ in test mode',
            status: 'Pending',
            profiles: { company_name: 'Demo Supplier' },
          },
        ]);
        setLoading(false);
        return;
      }

      // Production: Use real Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData?.role !== 'architect') {
        router.push('/');
        return;
      }
      setProfile(profileData);

      // Load sent RFQs
      const { data: rfqsData } = await supabase
        .from('rfqs')
        .select(`
          *,
          profiles!rfqs_supplier_id_fkey(company_name)
        `)
        .eq('architect_id', user.id)
        .order('created_at', { ascending: false });

      setSentRFQs(rfqsData || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadDashboard();

    // Check for success message
    if (searchParams && searchParams.get('rfq') === 'created') {
      setShowSuccessMessage(true);
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [loadDashboard, searchParams]);

  async function handleLogout() {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-type');
    if (!isTestMode) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Architect Dashboard</h1>
      {/* Your existing dashboard JSX */}
    </div>
  );
}

// 2. Default export wrapped in Suspense to satisfy Next.js build
export default function ArchitectDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 1. Inner component that uses searchParams
function DashboardContent() {
  const searchParams = useSearchParams();
  // Logic using searchParams goes here
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Architect Dashboard</h1>
      {/* Your existing dashboard JSX */}
    </div>
  );
}

// 2. Default export wrapped in Suspense to satisfy Next.js build
export default function ArchitectDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
