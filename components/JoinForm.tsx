'use client';
import { useState, ChangeEvent, FormEvent } from 'react';

export default function JoinForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    try {
      // Feeds the email to your API (and Database)
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
    setEmail(e.target.value);
  };

  if (status === 'success') {
    return (
      <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
        <p className="font-bold">✓ Secured.</p>
        <p className="text-sm">The Machine is processing your entry.</p>
        <button onClick={() => setStatus('idle')} className="text-xs underline mt-2">Add another</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
      <input
        type="email"
        required
        placeholder="enter@email.com"
        value={email}
        onChange={handleEmailChange}
        disabled={status === 'loading'}
        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-gray-900"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
      >
        {status === 'loading' ? 'Processing...' : 'Join Founding 50'}
      </button>
    </form>
  );
}
