import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import IntercomProvider from '@/components/IntercomProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GreenChainz - Sustainable Building Materials Marketplace',
  description: 'B2B marketplace for verified green building materials',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <IntercomProvider>
          {children}
        </IntercomProvider>
      </body>
    </html>
  );
}
