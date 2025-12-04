'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClaimPage() {
  const [supplier, setSupplier] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'verify' | 'confirm'>('verify')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (token) {
      loadSupplier()
    }
  }, [token])

  async function loadSupplier() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('claim_token', token)
        .eq('is_claimed', false)
        .single()

      if (error || !data) {
        setError('Invalid or expired claim link')
        return
      }

      setSupplier(data)
    } catch (err) {
      setError('Failed to load supplier profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendVerification() {
    setLoading(true)
    setError('')

    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Store claim request
      const { error: insertError } = await supabase
        .from('claim_requests')
        .insert({
          supplier_id: supplier.id,
          email,
          verification_code: code,
          status: 'pending'
        })

      if (insertError) throw insertError

      // Send verification email via Edge Function
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Verify ${supplier.company_name} - GreenChainz`,
          html: `
            <h2>Claim Your GreenChainz Profile</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 8px; font-weight: bold;">${code}</h1>
            <p>Enter this code to claim your supplier profile.</p>
          `
        })
      })

      setStep('confirm')
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode() {
    setLoading(true)
    setError('')

    try {
      // Verify code
      const { data: claim, error: claimError } = await supabase
        .from('claim_requests')
        .select('*')
        .eq('supplier_id', supplier.id)
        .eq('email', email)
        .eq('verification_code', verificationCode)
        .eq('status', 'pending')
        .single()

      if (claimError || !claim) {
        setError('Invalid verification code')
        setLoading(false)
        return
      }

      // Mark as claimed
      await supabase
        .from('profiles')
        .update({ is_claimed: true, email, data_quality_score: 60 })
        .eq('id', supplier.id)

      // Update claim request
      await supabase
        .from('claim_requests')
        .update({ status: 'verified', claimed_at: new Date().toISOString() })
        .eq('id', claim.id)

      // Redirect to setup
      router.push(`/supplier/setup?id=${supplier.id}`)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !supplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !supplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-400">Invalid Link</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link href="/" className="px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Warning Banner */}
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-red-400">Your Profile is Flagged as HIGH RISK</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Architects viewing <strong>{supplier?.company_name}</strong> see unverified data and missing certifications.
              This affects your project eligibility for LEED and Buy Clean programs.
            </p>
          </div>

          {/* Claim Form */}
          <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h1 className="text-3xl font-bold mb-2">Claim Your Profile</h1>
            <p className="text-gray-400 mb-8">Verify your email to take control of your GreenChainz listing</p>

            {step === 'verify' && (
              <div>
                <label className="block text-sm font-medium mb-2">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-teal-500 outline-none mb-4"
                />
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <button
                  onClick={handleSendVerification}
                  disabled={loading || !email}
                  className="w-full px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {step === 'confirm' && (
              <div>
                <p className="text-gray-400 mb-4">Enter the 6-digit code sent to <strong>{email}</strong></p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-teal-500 outline-none text-center text-2xl tracking-widest mb-4"
                />
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Claim Profile'}
                </button>
                <button
                  onClick={() => setStep('verify')}
                  className="w-full mt-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                >
                  Resend Code
                </button>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-2">✅ Verify Your Data</h3>
              <p className="text-sm text-gray-400">Upload EPDs and certifications</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-2">✅ Improve Your Score</h3>
              <p className="text-sm text-gray-400">Go from red flag to verified</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-2">✅ Get Discovered</h3>
              <p className="text-sm text-gray-400">200+ architects searching</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
