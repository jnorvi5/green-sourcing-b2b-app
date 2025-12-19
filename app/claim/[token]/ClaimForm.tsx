'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ClaimForm({
  supplierName,
  productCount,
  epdCount,
  token
}: {
  supplierName: string;
  productCount: number;
  epdCount: number;
  token: string;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Send Magic Link for verification/signup
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // In production, this should match a valid redirect URL configured in Supabase
          // We append claim_token so the callback handler can process the claim
          emailRedirectTo: `${window.location.origin}/auth/callback?claim_token=${token}`,
          data: {
            claim_token: token,
          }
        },
      });

      if (authError) throw authError;

      setSubmitted(true);
    } catch (err: any) {
      console.error('Claim error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8 px-6">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
        <p className="text-gray-600 mb-6">
          We've sent a verification link to <span className="font-semibold text-gray-900">{email}</span>.
          <br />
          Click the link to unlock your profile.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Claim {supplierName}
        </h2>
        <p className="text-gray-600">
          We found <span className="font-semibold text-green-700">{productCount} products</span> and <span className="font-semibold text-green-700">{epdCount} EPDs</span> for your company.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Verify your work email to unlock this profile
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-gray-50"
            placeholder="name@company.com"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </>
          ) : (
            'Unlock Profile'
          )}
        </button>
      </form>
    </div>
  );
}
