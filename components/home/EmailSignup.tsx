'use client';

'use client'
import { useState } from 'react'

export default function EmailSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' })
      })
      
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <section className="py-20 bg-slate-900/50">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Join the Founding 50
        </h2>
        <p className="text-slate-300 mb-8">
          Get early access, exclusive perks, and shape the future of green sourcing.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-4 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold disabled:opacity-50"
          >
            {status === 'loading' ? 'Joining...' : 'Join Now'}
          </button>
        </form>
        {status === 'success' && (
          <p className="mt-4 text-green-400">✓ Success! Check your email.</p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-red-400">Error. Please try again.</p>
        )}
      </div>
    </section>
  )
}
