// frontend/src/components/Layout.tsx
import { Outlet } from 'react-router-dom';
<<<<<<< HEAD
import { ReactNode } from 'react';
import Footer from './Footer';

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
=======
import React from 'react';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      {/* This is a simplified layout. In a real app, it would include Header, Footer, etc. */}
      <main>
>>>>>>> f18a4d538f187dbffce8025b48f9131be8f907ca
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
