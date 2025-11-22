import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import Footer from './Footer';
import Header from './Header'; // Assuming Header exists or will be created
import CompareBar from './CompareBar';
import SEO from './SEO';

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO />
      <Header />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
      <CompareBar />
    </div>
  );
};

export default Layout;
