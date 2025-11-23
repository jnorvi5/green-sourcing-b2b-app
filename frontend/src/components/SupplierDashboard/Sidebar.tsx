<<<<<<< HEAD
import React, { useState } from 'react';
=======
>>>>>>> 7f27a4c2cf56bf868d22b93b5a77bee9fd20ba55
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { Menu } from 'lucide-react';
import Logo from '../Logo';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard/supplier', icon: HomeIcon },
    { name: 'My Products', path: '/dashboard/supplier/products', icon: CubeIcon },
    { name: 'RFQ History', path: '/dashboard/supplier/rfqs', icon: DocumentTextIcon },
    { name: 'Settings', path: '/dashboard/supplier/settings', icon: Cog6ToothIcon }
  ];

  const NavLinks = () => (
    <nav className="space-y-2">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors ${
              isActive
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Hamburger Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-white border border-border shadow-md hover:bg-muted transition-colors">
            <Menu className="h-6 w-6 text-foreground" />
            <span className="sr-only">Toggle menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Logo height={32} showText={false} />
              <span className="text-lg font-bold">Supplier Dashboard</span>
            </SheetTitle>
          </SheetHeader>
          <NavLinks />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-muted border-r border-border flex-shrink-0">
        <div className="p-6">
          <div className='mb-6'>
            <Logo height={40} showText={true}/>
          </div>
          <NavLinks />
        </div>
      </aside>
    </>
  );
}

