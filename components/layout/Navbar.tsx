'use client';

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 glass-effect">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse hover-lift">
          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-green-600">
             {/* Using the transparent logo asset */}
            <Image 
              src="/assets/logo-transparent.png" 
              alt="GreenChainz Logo" 
              width={40} 
              height={40} 
              className="object-contain"
            />
          </div>
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-gray-900 dark:text-white">
            Green<span className="text-green-600">Chainz</span>
          </span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <button type="button" className="btn-primary text-sm px-4 py-2 text-center mr-2">
            Supplier Login
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button" 
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${isMenuOpen ? 'block' : 'hidden'}`}>
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0">
            <li>
              <Link href="/" className="block py-2 px-3 text-white bg-green-700 rounded md:bg-transparent md:text-green-700 md:p-0" aria-current="page">
                Marketplace
              </Link>
            </li>
            <li>
              <Link href="/sourcing" className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-green-700 md:p-0">
                Verify Data
              </Link>
            </li>
            <li>
              <Link href="/suppliers" className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-green-700 md:p-0">
                For Suppliers
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
