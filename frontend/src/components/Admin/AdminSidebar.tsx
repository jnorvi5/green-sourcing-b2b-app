import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';

export default function AdminSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: HomeIcon },
    { name: 'Content Moderation', path: '/admin/content', icon: DocumentCheckIcon },
    { name: 'User Management', path: '/admin/users', icon: UserGroupIcon },
    { name: 'Analytics', path: '/admin/analytics', icon: ChartBarIcon }
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
            <span className="sr-only">Toggle admin menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-lg font-bold">Admin Panel</SheetTitle>
            <p className="text-sm text-muted-foreground">Content Moderation</p>
          </SheetHeader>
          <NavLinks />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-muted border-r border-border flex-shrink-0">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mb-6">Content Moderation</p>
          <NavLinks />
        </div>
      </aside>
    </>
  );
}
