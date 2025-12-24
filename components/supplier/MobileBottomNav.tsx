'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiPackage, FiMessageSquare, FiUser } from 'react-icons/fi';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/supplier/dashboard',
      icon: FiHome,
      label: 'Dashboard',
      active: pathname === '/supplier/dashboard' || pathname === '/supplier',
    },
    {
      href: '/supplier/rfqs',
      icon: FiMessageSquare,
      label: 'RFQs',
      active: pathname?.startsWith('/supplier/rfqs'),
    },
    {
      href: '/supplier/products',
      icon: FiPackage,
      label: 'Products',
      active: pathname?.startsWith('/supplier/products'),
    },
    {
      href: '/supplier/profile',
      icon: FiUser,
      label: 'Profile',
      active: pathname?.startsWith('/supplier/profile'),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                item.active
                  ? 'text-teal-500'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.label}
              aria-current={item.active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
