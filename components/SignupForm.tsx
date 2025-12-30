// SignUpForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

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
      const supabase = createClient();
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
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          type="email" 
          required 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <div className="relative">
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm password</label>
        <div className="relative">
          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            type={showConfirm ? "text" : "password"}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {hint && <div className="text-orange-600 text-sm">{hint}</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing up…' : 'Sign up'}
      </button>

      <div className="text-xs text-gray-600">
        Use a unique password of at least 8 characters. Avoid reusing passwords from other sites. Consider a password manager.
      </div>
    </form>
  );
}