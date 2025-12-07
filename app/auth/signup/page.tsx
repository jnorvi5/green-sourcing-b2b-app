'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub, FaLinkedin } from 'react-icons/fa'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const supabase = createClient()

  // Real-time password validation
  function validatePassword(pwd: string) {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
    }
    
    const strength = Object.values(checks).filter(Boolean).length
    setPasswordStrength(strength)
    
    return checks
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate password
    const checks = validatePassword(password)
    
    if (!checks.length) {
      setError(`Password must be at least 8 characters. You entered ${password.length} characters.`)
      return
    }

    setLoading(true)

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    // Success message
    setError('')
    alert('Success! Check your email to confirm your account.')
    setLoading(false)
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  async function signInWithGitHub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  async function signInWithLinkedIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the verified sustainable materials marketplace
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#21808D] focus:ring-offset-2 transition"
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </button>

          <button
            onClick={signInWithLinkedIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#0A66C2] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:ring-offset-2 transition"
          >
            <FaLinkedin className="h-5 w-5" />
            Continue with LinkedIn
          </button>

          <button
            onClick={signInWithGitHub}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition"
          >
            <FaGithub className="h-5 w-5" />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#21808D] focus:outline-none focus:ring-[#21808D]"
              placeholder="founder@greenchainz.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                validatePassword(e.target.value)
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#21808D] focus:outline-none focus:ring-[#21808D]"
              placeholder="••••••••"
            />
            
            {/* Real-time password requirements feedback */}
            <div className="mt-2 space-y-1 text-xs">
              <div className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                {password.length >= 8 ? '✓' : '○'} At least 8 characters
              </div>
              <div className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter (recommended)
              </div>
              <div className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                {/[0-9]/.test(password) ? '✓' : '○'} One number (recommended)
              </div>
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      passwordStrength === 1 ? 'bg-red-500 w-1/4' :
                      passwordStrength === 2 ? 'bg-yellow-500 w-2/4' :
                      passwordStrength === 3 ? 'bg-blue-500 w-3/4' :
                      passwordStrength === 4 ? 'bg-green-500 w-full' :
                      'w-0'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {passwordStrength === 1 && 'Weak password'}
                  {passwordStrength === 2 && 'Fair password'}
                  {passwordStrength === 3 && 'Good password'}
                  {passwordStrength === 4 && 'Strong password'}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#21808D] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1a6570] focus:outline-none focus:ring-2 focus:ring-[#21808D] focus:ring-offset-2 disabled:opacity-50 transition"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/auth/login" className="font-medium text-[#21808D] hover:text-[#1a6570]">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
