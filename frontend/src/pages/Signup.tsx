import { useState, type FormEvent, type FocusEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// --- Validation Utilities ---
const validateEmail = (email: string) => {
    if (!email) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    return "";
};

const validatePassword = (password: string) => {
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;
    if (!passwordRegex.test(password)) return "Password must include 1 uppercase letter, 1 number, and 1 special character.";
    return "";
};

// --- Reusable Components with Error Handling ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    error?: string;
}

const Input = ({ id, label, error, ...props }: InputProps) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
            {label}
        </label>
        <input
            id={id}
            name={id}
            {...props}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${error ? 'border-destructive ring-destructive' : 'border-border focus:ring-primary'
                }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
        />
        {error && <p id={`${id}-error`} className="mt-1 text-sm text-destructive" role="alert">{error}</p>}
    </div>
);

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    id: string;
    label: string;
}

const Dropdown = ({ id, label, ...props }: DropdownProps) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground">{label}</label>
        <select id={id} name={id} {...props} className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white" />
    </div>
);

export default function Signup() {
    const navigate = useNavigate();
    // --- State Management ---
    const [formData, setFormData] = useState({
        role: 'buyer' as 'buyer' | 'supplier',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        projectType: 'Residential',
        productCategory: 'Insulation',
        agreedToTerms: false,
    });
    const [isAdmin, setIsAdmin] = useState(false);

    const [errors, setErrors] = useState({
        email: '', password: '', confirmPassword: '', companyName: '', agreedToTerms: '', form: ''
    });

    const [loading, setLoading] = useState(false);

    // --- Handlers ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let error = "";
        switch (name) {
            case 'email':
                error = validateEmail(value);
                break;
            case 'password':
                error = validatePassword(value);
                break;
            case 'confirmPassword':
                if (formData.password && value !== formData.password) {
                    error = "Passwords do not match.";
                }
                break;
            case 'companyName':
                if (!value) error = "Company name is required.";
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const validateForm = () => {
        const newErrors = {
            email: validateEmail(formData.email),
            password: validatePassword(formData.password),
            confirmPassword: formData.password !== formData.confirmPassword ? "Passwords do not match." : "",
            companyName: !formData.companyName ? "Company name is required." : "",
            agreedToTerms: !formData.agreedToTerms ? "You must agree to the Terms and Privacy Policy." : "",
            form: ''
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setErrors(prev => ({ ...prev, form: '' }));

        if (!validateForm()) return;

        setLoading(true);
        try {
            // Determine final role
            const finalRole = isAdmin ? 'admin' : formData.role;

            // Sign up with Supabase Auth - the profile will be created by trigger
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        company_name: formData.companyName,
                        role: finalRole,
                        full_name: formData.companyName, // Use company name as initial name
                        ...(formData.role === 'buyer' && { project_type: formData.projectType }),
                        ...(formData.role === 'supplier' && { product_category: formData.productCategory })
                    }
                }
            });

            if (signUpError) throw signUpError;

            // Update the profile with the role (in case trigger doesn't set it)
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        email: formData.email,
                        role: finalRole,
                        company_name: formData.companyName,
                        full_name: formData.companyName,
                        verification_status: 'pending',
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error('Error creating profile:', profileError);
                    // Continue anyway - profile trigger might have created it
                }
            }

            // Redirect based on role
            if (finalRole === 'admin') {
                navigate('/admin');
            } else if (finalRole === 'buyer') {
                navigate('/dashboard/buyer');
            } else if (finalRole === 'supplier') {
                // Suppliers go to onboarding first
                navigate('/dashboard/supplier/onboarding');
            }

        } catch (err) {
            const errorMessage = (err as Error).message.includes('already exists')
                ? "This email is already registered. Please log in."
                : "An unexpected error occurred. Please try again.";
            setErrors(prev => ({ ...prev, form: errorMessage }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <Link to="/" className="inline-block">
                        <img src="/assets/logo/greenchainz-logo-full.png" alt="GreenChainz" className="mx-auto h-20 w-auto" />
                    </Link>
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-bold">
                        <span className="text-lg">👑</span>
                        BECOME A FOUNDING MEMBER
                        <span className="text-lg">👑</span>
                    </div>
                    <h2 className="mt-4 text-3xl font-bold text-white">Join the Elite 175</h2>
                    <p className="mt-2 text-emerald-400 font-semibold italic">
                        Where profit and sustainability are on the same side
                    </p>
                    <p className="mt-2 text-blue-400 font-medium">
                        We authenticate and verify so you can focus on the build and the design
                    </p>
                    <p className="mt-2 text-slate-400">Lock in lifetime benefits. Only <span className="text-amber-400 font-bold">32 spots left</span></p>
                </div>

                <div className="flex gap-3 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                    <button
                        onClick={() => setFormData(prev => ({ ...prev, role: 'buyer' }))}
                        className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all ${formData.role === 'buyer'
                                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        🏗️ I'm a Buyer/Architect
                    </button>
                    <button
                        onClick={() => setFormData(prev => ({ ...prev, role: 'supplier' }))}
                        className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all ${formData.role === 'supplier'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        🌱 I'm a Supplier
                    </button>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    {/* Founding Member Benefits Preview */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-emerald-400 font-bold text-sm mb-2 italic">💰 Making CENTS of sustainability:</p>
                        <ul className="text-slate-300 text-xs space-y-1">
                            <li>💎 $0 Lifetime Fees (Save $5,988/year)</li>
                            <li>🎯 VIP Priority Access Forever</li>
                            <li>🏆 Equity + Revenue Sharing</li>
                        </ul>
                    </div>

                    <form className="space-y-5" onSubmit={handleSignup} noValidate>
                        {errors.form && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm" role="alert">
                                {errors.form}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="you@company.com"
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                                <input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="Your Company, Inc."
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.companyName ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                                />
                                {errors.companyName && <p className="mt-1 text-sm text-red-400">{errors.companyName}</p>}
                            </div>

                            {formData.role === 'buyer' ? (
                                <div>
                                    <label htmlFor="projectType" className="block text-sm font-medium text-slate-300 mb-2">Project Type</label>
                                    <select
                                        id="projectType"
                                        name="projectType"
                                        value={formData.projectType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    >
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Both">Both</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="productCategory" className="block text-sm font-medium text-slate-300 mb-2">Product Category</label>
                                    <select
                                        id="productCategory"
                                        name="productCategory"
                                        value={formData.productCategory}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    >
                                        <option value="Insulation">Insulation</option>
                                        <option value="Flooring">Flooring</option>
                                        <option value="Roofing">Roofing</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.password ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                                />
                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {import.meta.env.DEV && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={isAdmin}
                                    onChange={(e) => setIsAdmin(e.target.checked)}
                                    id="admin-checkbox"
                                />
                                <label htmlFor="admin-checkbox" className="text-sm text-red-600">
                                    Create as Admin (Dev Only)
                                </label>
                            </div>
                        )}

                        <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <input
                                id="agreedToTerms"
                                name="agreedToTerms"
                                type="checkbox"
                                checked={formData.agreedToTerms}
                                onChange={handleChange}
                                className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-600 rounded bg-slate-700"
                            />
                            <label htmlFor="agreedToTerms" className="text-sm text-slate-400">
                                I agree to the{' '}
                                <Link to="/legal/terms" className="font-medium text-emerald-400 hover:text-emerald-300 underline">
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link to="/legal/privacy" className="font-medium text-emerald-400 hover:text-emerald-300 underline">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>
                        {errors.agreedToTerms && <p className="text-sm text-red-400" role="alert">{errors.agreedToTerms}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-white font-black text-lg rounded-lg shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating Your Account...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="text-2xl">👑</span>
                                    CLAIM MY FOUNDING MEMBER SPOT
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                                Sign in
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
