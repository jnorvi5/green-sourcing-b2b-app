import { useState } from 'react';
import '../glassmorphism.css';

interface NewsletterSignupProps {
    variant?: 'inline' | 'modal' | 'footer';
    onSuccess?: (email: string) => void;
}

export default function NewsletterSignup({ variant = 'inline', onSuccess }: NewsletterSignupProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setStatus('error');
            setMessage('Email is required');
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch('/api/v1/mailerlite/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Thanks for subscribing! Check your inbox.');
                setEmail('');
                setName('');
                onSuccess?.(email);
            } else {
                throw new Error(data.error || 'Subscription failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    if (variant === 'footer') {
        return (
            <div className="glass-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-white mb-2">
                    Stay Updated on Green Building
                </h4>
                <p className="text-sm text-gray-300 mb-4">
                    Get the latest on sustainable materials, EPDs, and certifications.
                </p>

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="glass-input flex-1 px-4 py-2 rounded-lg text-white placeholder-gray-400"
                        disabled={status === 'loading'}
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="glass-button px-6 py-2 rounded-lg font-medium"
                    >
                        {status === 'loading' ? '...' : 'Subscribe'}
                    </button>
                </form>

                {message && (
                    <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </div>
        );
    }

    if (variant === 'modal') {
        return (
            <div className="glass-card p-8 rounded-2xl max-w-md mx-auto">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        Join the Green Revolution
                    </h3>
                    <p className="text-gray-300">
                        Get exclusive updates on sustainable materials and certification opportunities.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-green-400 font-medium">{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Name (optional)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-400"
                                disabled={status === 'loading'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-400"
                                disabled={status === 'loading'}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="glass-button w-full py-3 rounded-xl font-semibold text-lg"
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Subscribing...
                                </span>
                            ) : (
                                'Subscribe Now'
                            )}
                        </button>

                        {status === 'error' && (
                            <p className="text-red-400 text-sm text-center">{message}</p>
                        )}

                        <p className="text-xs text-gray-400 text-center">
                            We respect your privacy. Unsubscribe anytime.
                        </p>
                    </form>
                )}
            </div>
        );
    }

    // Default inline variant
    return (
        <div className="glass-card p-4 rounded-xl">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for updates"
                    className="glass-input flex-1 px-4 py-2 rounded-lg text-white placeholder-gray-400"
                    disabled={status === 'loading'}
                />
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="glass-button px-6 py-2 rounded-lg font-medium whitespace-nowrap"
                >
                    {status === 'loading' ? 'Subscribing...' : 'Get Updates'}
                </button>
            </form>

            {message && (
                <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
