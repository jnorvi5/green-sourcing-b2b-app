'use client';

export const dynamic = 'force-dynamic'

/**
 * Admin Certification Verification Dashboard
 * Dark theme with Tailwind + glassmorphism
 * Admin-only route for "White Glove" manual verification
 */

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  fetchPendingCertifications,
  fetchVerificationStats,
  verifyCertification,
  rejectCertification,
} from '@/app/actions/certificationVerification';
import type {
  CertificationPendingSupplier,
  VerificationStats,
} from '@/types/certification-verification';

export default function AdminCertificationsPage() {
  const [certifications, setCertifications] = useState<CertificationPendingSupplier[]>([]);
  const [stats, setStats] = useState<VerificationStats>({
    totalPending: 0,
    verifiedToday: 0,
    rejectedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectSupplierId, setRejectSupplierId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Check admin auth and load data
   */
  async function checkAuthAndLoadData() {
    try {
      setError(null);

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      // Check admin role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || !userData || userData.role !== 'admin') {
        setError('Unauthorized: Admin access required');
        setLoading(false);
        return;
      }

      // Load data
      await loadData();
    } catch (err) {
      console.error('Auth check error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  }

  /**
   * Load certifications and stats
   */
  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [certificationsResult, statsResult] = await Promise.all([
        fetchPendingCertifications(),
        fetchVerificationStats(),
      ]);

      if (certificationsResult.error) {
        throw new Error(certificationsResult.error);
      }

      if (statsResult.error) {
        throw new Error(statsResult.error);
      }

      setCertifications(certificationsResult.data || []);
      setStats(statsResult.data || { totalPending: 0, verifiedToday: 0, rejectedToday: 0 });
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle verify action
   */
  async function handleVerify(supplierId: string) {
    try {
      setProcessingId(supplierId);
      const result = await verifyCertification({ supplierId });

      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }

      alert(result.message || 'Certification verified successfully');
      await loadData();
    } catch (err) {
      console.error('Error verifying certification:', err);
      alert('Failed to verify certification');
    } finally {
      setProcessingId(null);
    }
  }

  /**
   * Open reject modal
   */
  function openRejectModal(supplierId: string) {
    setRejectSupplierId(supplierId);
    setRejectReason('');
    setRejectModalOpen(true);
  }

  /**
   * Close reject modal
   */
  function closeRejectModal() {
    setRejectModalOpen(false);
    setRejectSupplierId(null);
    setRejectReason('');
  }

  /**
   * Handle reject action
   */
  async function handleReject() {
    if (!rejectSupplierId || !rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(rejectSupplierId);
      const result = await rejectCertification({
        supplierId: rejectSupplierId,
        reason: rejectReason,
      });

      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }

      alert(result.message || 'Certification rejected successfully');
      closeRejectModal();
      await loadData();
    } catch (err) {
      console.error('Error rejecting certification:', err);
      alert('Failed to reject certification');
    } finally {
      setProcessingId(null);
    }
  }

  /**
   * Filter certifications by search term
   */
  const filteredCertifications = useMemo(() => {
    if (!searchTerm.trim()) {
      return certifications;
    }

    const term = searchTerm.toLowerCase();
    return certifications.filter((cert) =>
      cert.company_name.toLowerCase().includes(term)
    );
  }, [certifications, searchTerm]);

  /**
   * Loading state
   */
  if (loading && certifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading certifications...</p>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-red-400 text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">
            🛡️ Certification Verification
          </h1>
          <p className="text-gray-400 mt-2">
            Review and verify supplier certifications
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Pending */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Pending</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalPending}</p>
              </div>
              <div className="bg-teal-500/20 rounded-full p-3">
                <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Verified Today */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Verified Today</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{stats.verifiedToday}</p>
              </div>
              <div className="bg-green-500/20 rounded-full p-3">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Rejected Today</p>
                <p className="text-3xl font-bold text-red-400 mt-2">{stats.rejectedToday}</p>
              </div>
              <div className="bg-red-500/20 rounded-full p-3">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Certifications Table */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
          {filteredCertifications.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-lg">
                {searchTerm ? 'No certifications match your search' : 'No certifications to review'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Certification Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCertifications.map((cert) => (
                    <tr key={cert.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{cert.company_name}</p>
                          {cert.users?.email && (
                            <p className="text-gray-400 text-sm">{cert.users.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {cert.cert_type || 'Not specified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {cert.cert_uploaded_at
                          ? new Date(cert.cert_uploaded_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        {cert.cert_verified ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                            ✓ Verified
                          </span>
                        ) : cert.cert_rejection_reason ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                            ✗ Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View PDF Button */}
                          <a
                            href={cert.cert_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View PDF
                          </a>

                          {/* Verify Button */}
                          {!cert.cert_verified && (
                            <button
                              onClick={() => handleVerify(cert.id)}
                              disabled={processingId === cert.id}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === cert.id ? (
                                <>
                                  <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Verify
                                </>
                              )}
                            </button>
                          )}

                          {/* Reject Button */}
                          {!cert.cert_rejection_reason && (
                            <button
                              onClick={() => openRejectModal(cert.id)}
                              disabled={processingId === cert.id}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Reject Certification</h3>
            <p className="text-gray-300 mb-4">
              Please provide a reason for rejecting this certification. This will be sent to the supplier via email.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processingId !== null}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId ? 'Processing...' : 'Reject & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
