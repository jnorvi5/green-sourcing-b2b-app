// SignUpForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaLinkedin, FaMicrosoft } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Provider } from '@supabase/supabase-js';

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
    return text.split('\n').some(line => line.split(':')[0].trim() === suffix);
  } catch {
    return false;
  }
}

export default function SignUpForm() {
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

  const handleOAuthSignIn = async (provider: Provider) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with social provider');
      setLoading(false);
    }
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
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(mapSupabaseError(signUpError));
        return;
      }

      // Notify Admin
      try {
        await fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (notifyErr) {
        console.error('Failed to notify admin:', notifyErr);
      }

      setSuccess('Sign-up successful — check your email to confirm your account.');
      setEmail('');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
        <Card className="w-full max-w-md mx-auto shadow-xl bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">Check your email</CardTitle>
                <CardDescription className="text-center text-slate-600 dark:text-slate-400">
                Sign-up successful! We&apos;ve sent a confirmation link to your email.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 rounded-md bg-green-50 text-green-700 border border-green-200 text-center">
                    Please verify your email address to continue.
                </div>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href="/login" className="text-sm text-emerald-600 hover:underline">
                    Back to login
                </Link>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl bg-white dark:bg-slate-900 border-0 ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">Create an account</CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
                Enter your email below to create your account
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" disabled={loading} onClick={() => handleOAuthSignIn('google')} className="w-full bg-white text-slate-900 border-slate-200 hover:bg-slate-50">
                    <FcGoogle className="h-5 w-5" />
                    <span className="sr-only">Google</span>
                </Button>
                <Button variant="outline" disabled={loading} onClick={() => handleOAuthSignIn('linkedin')} className="w-full bg-white text-slate-900 border-slate-200 hover:bg-slate-50">
                    <FaLinkedin className="h-5 w-5 text-[#0077b5]" />
                    <span className="sr-only">LinkedIn</span>
                </Button>
                <Button variant="outline" disabled={loading} onClick={() => handleOAuthSignIn('azure')} className="w-full bg-white text-slate-900 border-slate-200 hover:bg-slate-50">
                    <FaMicrosoft className="h-5 w-5 text-[#00a4ef]" />
                    <span className="sr-only">Microsoft</span>
                </Button>
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or continue with</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Email</label>
                    <Input
                        id="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                        required
                        placeholder="m@example.com"
                        className="bg-white text-slate-900 border-slate-300 dark:bg-slate-950 dark:text-white dark:border-slate-700 placeholder:text-slate-400"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Password</label>
                    <div className="relative">
                        <Input
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            type={showPassword ? "text" : "password"}
                            required
                            className="pr-10 bg-white text-slate-900 border-slate-300 dark:bg-slate-950 dark:text-white dark:border-slate-700 placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="confirm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Confirm password</label>
                    <div className="relative">
                        <Input
                            id="confirm"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            type={showConfirm ? "text" : "password"}
                            required
                            className="pr-10 bg-white text-slate-900 border-slate-300 dark:bg-slate-950 dark:text-white dark:border-slate-700 placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                        >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {hint && <div role="alert" aria-live="polite" className="text-orange-600 text-sm">{hint}</div>}
                {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                    </>
                    ) : 'Create account'}
                </Button>
            </form>
        </CardContent>
        <CardFooter>
            <div className="text-sm text-slate-600 dark:text-slate-400 text-center w-full">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-600 hover:underline">
                    Login
                </Link>
            </div>
        </CardFooter>
    </Card>
  );
}
