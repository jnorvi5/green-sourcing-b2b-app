'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export default function JoinForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'founding_50' }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (status === 'error') setStatus('idle');
    setEmail(e.target.value);
  };

  if (status === 'success') {
    return (
      <div role="status" className="p-4 bg-teal-500/10 backdrop-blur-sm text-teal-300 rounded-lg border border-teal-500/30">
        <p className="font-bold">✓ Secured.</p>
        <p className="text-sm text-teal-400/80">The Machine is processing your entry.</p>
        <button onClick={() => setStatus('idle')} className="text-xs underline mt-2 text-teal-400 hover:text-teal-300">Add another</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 relative">
        <label htmlFor="email-input" className="sr-only">Email address</label>
        <div className="flex-1 relative">
          <input
            id="email-input"
            type="email"
            required
            placeholder="enter@email.com"
            value={email}
            onChange={handleEmailChange}
            disabled={status === 'loading'}
            aria-invalid={status === 'error'}
            aria-describedby={status === 'error' ? "email-error" : undefined}
            className={`w-full px-4 py-3 rounded-lg bg-white/5 backdrop-blur-sm border outline-none text-white placeholder-gray-500 transition-all
              ${status === 'error'
                ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-white/10 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20'
              }`}
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25 min-w-[160px] flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing</span>
            </>
          ) : (
            'Join Founding 50'
          )}
        </button>
      </form>

      {status === 'error' && (
        <div
          id="email-error"
          role="alert"
          className="mt-3 flex items-center gap-2 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4" />
          <p>Something went wrong. Please try again.</p>
        </div>
      )}
    </div>
  );
}
