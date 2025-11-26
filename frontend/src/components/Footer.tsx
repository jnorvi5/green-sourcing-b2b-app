// frontend/src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import '../glassmorphism.css';

export default function Footer() {
    return (
        <footer className="border-t border-gray-800 bg-gray-900 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-5 gap-8">
                    {/* Brand Section */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                                <Leaf className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-white text-lg">GreenChainz</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">
                            Global Trust Layer for Sustainable Commerce
                        </p>
                        <p className="text-emerald-400 text-sm font-semibold italic mb-4">
                            Where profit and sustainability are on the same side
                        </p>
                        {/* Social Media Links */}
                        <div className="flex items-center space-x-4">
                            <a
                                href="#"
                                className="text-slate-500 hover:text-emerald-400 transition-colors"
                                aria-label="Twitter"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="text-slate-500 hover:text-emerald-400 transition-colors"
                                aria-label="LinkedIn"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="text-slate-500 hover:text-emerald-400 transition-colors"
                                aria-label="GitHub"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Resources</h4>
                        <ul className="space-y-2">
                            <li><Link to="/features" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Features</Link></li>
                            <li><Link to="/search" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Browse Products</Link></li>
                            <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Sustainability</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Investors</a></li>
                        </ul>
                    </div>

                    {/* Company Section */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-2">
                            <li><Link to="/contact" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Contact</Link></li>
                            <li><a href="mailto:careers@greenchainz.com" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">💼 Careers</a></li>
                            <li><a href="mailto:partnerships@greenchainz.com" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Partnerships</a></li>
                            <li><Link to="/signup" className="text-slate-400 hover:text-amber-400 transition-colors text-sm font-semibold">👑 Join as Founder</Link></li>
                        </ul>
                    </div>

                    {/* Legal Section */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link to="/privacy-policy" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Privacy Policy</Link></li>
                            <li><Link to="/terms-of-service" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Terms of Service</Link></li>
                            <li><Link to="/supplier-agreement" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Supplier Agreement</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-12 pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-sm">
                            © {new Date().getFullYear()} GreenChainz. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-4">
                            <p className="text-emerald-400 text-sm font-medium">
                                Building a greener future, one supply chain at a time
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}