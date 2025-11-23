import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const routes = [
    { href: '/dashboard/buyer', label: 'Dashboard' },
    { href: '/search', label: 'Search Products' },
    { href: '/rfq-history', label: 'RFQ History' },
    // Add more routes as needed
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4 mt-8">
          {routes.map((route) => (
            <Link
              key={route.href}
              to={route.href}
              onClick={() => setOpen(false)}
              className={`text-lg font-medium transition-colors hover:text-primary ${
                location.pathname === route.href
                  ? 'text-black font-bold'
                  : 'text-gray-600'
              }`}
            >
              {route.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
