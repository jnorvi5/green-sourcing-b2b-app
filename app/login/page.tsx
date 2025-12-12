'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaLinkedin, FaMicrosoft } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [useTestLogin, setUseTestLogin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      router.push('/architect/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (debugMode) {
      console.log('🔍 Login attempt:', { testMode: useTestLogin });
    }

    try {
      // Use test endpoint if toggled, otherwise production auth
      const endpoint = useTestLogin ? '/api/auth/test-login' : '/api/auth/login';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (debugMode) {
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response body:', data);
      }

      if (response.ok) {
        localStorage.setItem('auth-token', data.token);
        localStorage.setItem('user-type', data.user.user_type);
        
        if (data.user.user_type === 'supplier') {
          router.push('/supplier/dashboard');
        } else {
          router.push('/architect/dashboard');
        }
      } else {
        let errorMsg = data.error || 'Login failed';
        if (data.details) {
          if (data.details.msg) errorMsg = data.details.msg;
          if (data.details.error) errorMsg = data.details.error;
          if (data.details.error_code) errorMsg += ` (${data.details.error_code})`;
        }
        setError(errorMsg);
        if (debugMode) {
          console.log('🔍 Error details:', data.details);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type: 'architect' | 'supplier') => {
    if (type === 'architect') {
      setFormData({
        email: 'demo@architect.com',
        password: 'demo123',
      });
    } else {
      setFormData({
        email: 'demo@supplier.com',
        password: 'demo123',
      });
    }
  };

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) {
      console.error('Google login error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithGitHub() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error('GitHub login error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithLinkedIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error('LinkedIn login error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithMicrosoft() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile openid',
      }
    });
    if (error) {
      console.error('Microsoft login error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to GreenChainz</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Test Mode Banner */}
        {useTestLogin && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-xs font-medium">⚠️ Test Mode Active (Bypassing Supabase)</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={signInWithMicrosoft}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaMicrosoft className="h-5 w-5 text-[#00A4EF]" />
            Continue with Microsoft (Azure)
          </button>

          <button
            type="button"
            onClick={signInWithLinkedIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#0A66C2] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#004182] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaLinkedin className="h-5 w-5" />
            Continue with LinkedIn
          </button>

          <button
            type="button"
            onClick={signInWithGitHub}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGithub className="h-5 w-5" />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="demo@architect.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-green-600 hover:text-green-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3 font-medium">DEMO ACCOUNTS</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fillDemo('architect')}
              disabled={loading}
              className="text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium text-gray-700"
            >
              📐 Architect
            </button>
            <button
              type="button"
              onClick={() => fillDemo('supplier')}
              disabled={loading}
              className="text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium text-gray-700"
            >
              🏭 Supplier
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">demo123</p>
        </div>

        {/* Debug & Test Mode Toggles */}
        <div className="mt-6 flex items-center justify-between text-center gap-2">
          <button
            type="button"
            onClick={() => setDebugMode(!debugMode)}
            className="text-xs text-gray-400 hover:text-gray-600 flex-1"
          >
            {debugMode ? '🔍 Debug ON' : '🔍 Debug'}
          </button>
          <button
            type="button"
            onClick={() => setUseTestLogin(!useTestLogin)}
            className="text-xs text-blue-400 hover:text-blue-600 flex-1"
          >
            {useTestLogin ? '✅ Test Mode' : '⚪ Test'}
          </button>
        </div>
      </div>
    </div>
  );
}
