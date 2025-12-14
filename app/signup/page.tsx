'use client';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaLinkedin, FaMicrosoft } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'architect',
    companyName: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/login?signup=success');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
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
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 relative overflow-hidden">
       {/* Background decoration */}
       <div className="absolute top-0 left-0 p-12 opacity-5">
        <div className="w-96 h-96 rounded-full bg-primary blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 right-0 p-12 opacity-5">
        <div className="w-96 h-96 rounded-full bg-emerald-600 blur-3xl"></div>
      </div>

      <Card className="max-w-md w-full shadow-2xl border-border/50 relative z-10">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-foreground mb-2">Create Account</CardTitle>
          <CardDescription>Join GreenChainz Marketplace</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm font-medium">{error}</p>
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
              Sign up with Google
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={signInWithMicrosoft}
              disabled={loading}
              className="w-full justify-start gap-3 h-11"
            >
              <FaMicrosoft className="h-5 w-5 text-[#00A4EF]" />
              Sign up with Microsoft (Azure)
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={signInWithLinkedIn}
              disabled={loading}
              className="w-full justify-start gap-3 h-11 bg-[#0A66C2] text-white hover:bg-[#004182] border-transparent hover:text-white"
            >
              <FaLinkedin className="h-5 w-5" />
              Sign up with LinkedIn
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={signInWithGitHub}
              disabled={loading}
              className="w-full justify-start gap-3 h-11 bg-slate-900 text-white hover:bg-slate-800 border-transparent hover:text-white"
            >
              <FaGithub className="h-5 w-5" />
              Sign up with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3 text-foreground">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, userType: 'architect'})}
                  className={`p-4 border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                    formData.userType === 'architect'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div className="text-2xl">🏗️</div>
                  <div className="font-medium text-sm">Architect</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, userType: 'supplier'})}
                  className={`p-4 border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                    formData.userType === 'supplier'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div className="text-2xl">🏭</div>
                  <div className="font-medium text-sm">Supplier</div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="fullName">Full Name</label>
              <Input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Jerit Norville"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="companyName">Company Name</label>
              <Input
                id="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                placeholder="Your company"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">Email Address</label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@company.com"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                minLength={8}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">Confirm Password</label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                minLength={8}
                className="bg-background"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 text-lg mt-4">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="py-6 bg-muted/20 border-t border-border justify-center">
             <p className="text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
