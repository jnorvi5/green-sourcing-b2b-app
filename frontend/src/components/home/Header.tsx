import { Link } from 'react-router-dom';
import Logo from '../Logo';

export default function Header() {
    return (
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <Logo height={40} showText={true} />
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/features" className="text-slate-300 hover:text-emerald-400 transition-colors font-medium">Features</Link>
                        <Link to="/survey/architect" className="text-slate-300 hover:text-emerald-400 transition-colors font-medium">Free Assessment</Link>
                        <a href="mailto:careers@greenchainz.com" className="text-slate-300 hover:text-purple-400 transition-colors font-medium">Careers</a>
                        <Link to="/login" className="text-slate-300 hover:text-white transition-colors font-medium">Sign In</Link>
                        <Link
                            to="/signup"
                            className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105"
                        >
                            👑 Join as Founder
                        </Link>
                    </nav>
                    {/* Mobile menu button */}
                    <button className="md:hidden text-slate-300 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
