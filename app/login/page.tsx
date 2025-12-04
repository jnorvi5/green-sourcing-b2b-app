'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-black text-2xl">
            GC
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GreenChainz</h1>
          <p className="text-gray-400">Private Access Required</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Access Code
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 outline-none text-white placeholder-gray-500 transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50 shadow-lg shadow-teal-500/25"
            >
              {loading ? 'Authenticating...' : 'Access Site'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              Pre-launch access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
