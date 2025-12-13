'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BuyCleanActCountdown from '@/components/BuyCleanActCountdown'

function ArchitectDashboardInner() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [savedSuppliers, setSavedSuppliers] = useState<any[]>([])
  const [sentRFQs, setSentRFQs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

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
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Test Mode Banner */}
        {isTestMode && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            ⚠️ Test Mode Active - Using demo data (not real Supabase)
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>RFQ sent successfully!</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Architect Dashboard
            </h1>
            <p className="text-gray-400">
              Welcome back, {profile?.full_name || user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Compliance Countdown */}
        <BuyCleanActCountdown />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/search"
            className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-teal-500 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Search Products</h3>
                <p className="text-sm text-gray-400">
                  Find green materials
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/architect/rfqs"
            className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-teal-500 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">My RFQs</h3>
                <p className="text-sm text-gray-400">
                  View all requests
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/projects"
            className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-teal-500 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">My Projects</h3>
                <p className="text-sm text-gray-400">
                  Manage projects
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent RFQs */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Recent RFQs
          </h2>
          {sentRFQs.length === 0 ? (
            <p className="text-gray-400">No RFQs sent yet.</p>
          ) : (
            <div className="space-y-4">
              {sentRFQs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-medium">
                        {rfq.profiles?.company_name || 'Unknown Supplier'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(rfq.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rfq.status === 'Pending'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : rfq.status === 'Answered'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {rfq.status}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{rfq.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ArchitectDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center"><div className="text-center"><div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-gray-400">Loading dashboard...</p></div></div>}>
      <ArchitectDashboardInner />
    </Suspense>
  );
}

