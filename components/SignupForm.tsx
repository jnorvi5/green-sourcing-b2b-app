// SignUpForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaLinkedin, FaMicrosoft } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { FiEye, FiEyeOff } from 'react-icons/fi';

async function hibpPasswordPwned(password: string): Promise<boolean> {
  if (!password) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false;
    const text = await res.text();
    return text.split('\n').some(line => line.split(':')[0]?.trim() === suffix);
  } catch {
    return false;
  }
}

export default function SignUpForm() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setError(null);
    setHint(null);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      if (password.length === 0) {
        setHint(null);
        return;
      }
      if (password.length < 8) {
        setHint('Password must be at least 8 characters.');
        return;
      }
      const pwned = await hibpPasswordPwned(password);
      if (pwned) setHint('This password has appeared in a known data breach. Choose another.');
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [password]);

  const validate = () => {
    if (!email) return 'Email is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const mapSupabaseError = (err: unknown) => {
    if (!err) return null;
    const msg = err instanceof Error ? err.message : String(err);
    if (/leaked|pwned|compromis/i.test(msg)) {
      return 'This password has been found in a known data breach. Please choose a different, unique password.';
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(mapSupabaseError(signUpError));
        return;
      }
      setSuccess('Sign-up successful — check your email to confirm your account.');
      setEmail('');
      setPassword('');
      setConfirm('');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OAuth Sign-in functions
  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      console.error('Google signup error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithGitHub() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('GitHub signup error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithLinkedIn() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('LinkedIn signup error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithMicrosoft() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile openid',
      },
    });
    if (error) {
      console.error('Microsoft signup error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md w-full shadow-2xl border-border/50 relative z-10">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-3xl font-bold text-foreground mb-2">
          Create Account
        </CardTitle>
        <CardDescription>Join GreenChainz — the B2B green sourcing marketplace</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full justify-start gap-3 h-11"
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </Button>

          <Button
            variant="outline"
            type="button"
            onClick={signInWithMicrosoft}
            disabled={loading}
            className="w-full justify-start gap-3 h-11"
          >
            <FaMicrosoft className="h-5 w-5 text-[#00A4EF]" />
            Continue with Microsoft
          </Button>

          <Button
            variant="outline"
            type="button"
            onClick={signInWithLinkedIn}
            disabled={loading}
            className="w-full justify-start gap-3 h-11 bg-[#0A66C2] text-white hover:bg-[#004182] border-transparent hover:text-white"
          >
            <FaLinkedin className="h-5 w-5" />
            Continue with LinkedIn
          </Button>

          <Button
            variant="outline"
            type="button"
            onClick={signInWithGitHub}
            disabled={loading}
            className="w-full justify-start gap-3 h-11 bg-slate-900 text-white hover:bg-slate-800 border-transparent hover:text-white"
          >
            <FaGithub className="h-5 w-5" />
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="email"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
            {hint && (
              <p className="text-orange-600 text-xs" role="alert" aria-live="polite">
                {hint}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="confirm"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md"
                disabled={loading}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-lg"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Use a unique password of at least 8 characters. Avoid reusing passwords from other sites.
          </p>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t border-border p-6 bg-muted/20">
        <div className="text-center w-full">
          <p className="text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}