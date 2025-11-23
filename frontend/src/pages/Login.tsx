import { useState, FormEvent, FocusEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNotify } from '../hooks/useNotify';

// --- Validation Utilities ---
const validateEmail = (email: string) => {
    if (!email) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    return "";
};

// --- Reusable Input Component with Error Handling ---
const Input = ({ id, label, error, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
            {label}
        </label>
        <input
            id={id}
            name={id}
            {...props}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                error ? 'border-destructive ring-destructive' : 'border-border focus:ring-primary'
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
        />
        {error && <p id={`${id}-error`} className="mt-1 text-sm text-destructive" role="alert">{error}</p>}
    </div>
);

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ email: '', password: '', form: '' });
    const [loading, setLoading] = useState(false);

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let error = "";
        if (name === 'email') {
            error = validateEmail(value);
        } else if (name === 'password' && !value) {
            error = "Password is required.";
        }
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const validateForm = () => {
        const emailError = validateEmail(email);
        const passwordError = !password ? "Password is required." : "";
        setErrors({ email: emailError, password: passwordError, form: '' });
        return !emailError && !passwordError;
    };

    const { notifyError, notifySuccess } = useNotify();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setErrors(prev => ({ ...prev, form: '' }));

        if (!validateForm()) return;

        setLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;
            notifySuccess('Successfully logged in!');
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = 'Invalid email or password.';
            setErrors(prev => ({...prev, form: errorMessage}));
            notifyError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Link to="/" className="inline-block">
                        <img src="/assets/logo/greenchainz-full-400.png" alt="GreenChainz" className="mx-auto h-20 w-auto" />
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-white">Welcome Back to GreenChainz</h2>
                    <p className="mt-2 text-emerald-400 font-semibold italic text-lg">
                        Where profit and sustainability are on the same side
                    </p>
                    <p className="mt-2 text-blue-400 font-medium">
                        We authenticate and verify so you can focus on the build and the design
                    </p>
                    <p className="mt-2 text-slate-400">Sign in to access your sustainable sourcing dashboard</p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    <form className="space-y-6" onSubmit={handleLogin} noValidate>
                        {errors.form && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm" role="alert">
                                {errors.form}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <input 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    onBlur={handleBlur} 
                                    placeholder="you@company.com" 
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-400" role="alert">{errors.email}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
                                    <Link to="/auth/reset-password" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    onBlur={handleBlur} 
                                    placeholder="••••••••" 
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.password ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-400" role="alert">{errors.password}</p>}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing In...
                                </span>
                            ) : (
                                'Sign In to Your Dashboard'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                                Join as a Founding Member 👑
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <Link to="/" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
