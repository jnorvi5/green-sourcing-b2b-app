// frontend/src/components/Layout.tsx
import { Outlet } from 'react-router-dom';
<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> 00dda8b26144a677b079dae0c3f4782bf01f9d89
import { ReactNode } from 'react';
import Footer from './Footer';

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
<<<<<<< HEAD
=======
=======

>>>>>>> 00dda8b26144a677b079dae0c3f4782bf01f9d89
import React from 'react';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      {/* This is a simplified layout. In a real app, it would include Header, Footer, etc. */}
      <main>
<<<<<<< HEAD
>>>>>>> f18a4d538f187dbffce8025b48f9131be8f907ca
=======

>>>>>>> 00dda8b26144a677b079dae0c3f4782bf01f9d89
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
