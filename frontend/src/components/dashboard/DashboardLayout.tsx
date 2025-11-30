import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden md:block">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <img 
            src="/assets/logo/greenchainz-logo.png" 
            alt="GreenChainz" 
            className="h-8 w-auto"
          />
        </div>
        
        <nav className="p-4 space-y-1">
          <Link 
            to="/supplier/dashboard" 
            className={`sidebar-link ${isActive('/supplier/dashboard') ? 'active' : ''}`}
          >
            <span className="mr-3">📊</span> Dashboard
          </Link>
          <Link 
            to="/supplier/products" 
            className={`sidebar-link ${isActive('/supplier/products') ? 'active' : ''}`}
          >
            <span className="mr-3">📦</span> Products
          </Link>
          <Link 
            to="/supplier/orders" 
            className={`sidebar-link ${isActive('/supplier/orders') ? 'active' : ''}`}
          >
            <span className="mr-3">🛒</span> Orders
          </Link>
          <Link 
            to="/supplier/certifications" 
            className={`sidebar-link ${isActive('/supplier/certifications') ? 'active' : ''}`}
          >
            <span className="mr-3">📜</span> Certifications
          </Link>
          <Link 
            to="/supplier/settings" 
            className={`sidebar-link ${isActive('/supplier/settings') ? 'active' : ''}`}
          >
            <span className="mr-3">⚙️</span> Settings
          </Link>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              S
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Supplier Inc.</p>
              <p className="text-xs text-gray-500">View Profile</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
