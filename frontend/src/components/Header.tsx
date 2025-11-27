import React, { useState } from 'react';
import Link from 'next/link';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="fixed w-full top-0 z-50 glass-effect border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-gradient">
              GREENCHAINZ
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/compare" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Compare Suppliers
            </Link>
            <Link href="/docs" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Documentation
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Action Button */}
          <div className="hidden md:flex items-center">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)]">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              type="button"
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-effect border-b border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/compare" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">
              Compare
            </Link>
            <Link href="/docs" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">
              Docs
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
