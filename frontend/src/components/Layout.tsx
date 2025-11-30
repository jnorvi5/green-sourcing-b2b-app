import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import Footer from './Footer';
import Navbar from './Navbar';
import CompareBar from './CompareBar';
import SEO from './SEO';
import IntercomProvider from './providers/IntercomProvider';
import '../glassmorphism.css';

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <IntercomProvider appId="">
      <div className="min-h-screen flex flex-col bg-gray-950">
        <SEO />
        <Navbar />
        <main className="flex-1 pt-16">
          {children || <Outlet />}
        </main>
        <Footer />
        <CompareBar />
      </div>
    </IntercomProvider>
  );
};

export default Layout;
