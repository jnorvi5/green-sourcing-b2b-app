import React from 'react';
import { Link } from 'react-router-dom';
import MobileNav from './MobileNav';
import Logo from './Logo'; // Assuming Logo component exists

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center">
        <MobileNav />
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              GreenChainz
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/dashboard/buyer"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dashboard
            </Link>
            <Link
              to="/search"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Search
            </Link>
            <Link
              to="/rfq-history"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              RFQs
            </Link>
          </nav>
        </div>
        
        {/* Mobile Logo Centering */}
        <div className="flex flex-1 items-center justify-center md:hidden">
            <Logo className="h-6 w-6" />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other right-side items could go here */}
          </div>
          <nav className="flex items-center">
             {/* User Profile or Auth buttons */}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
