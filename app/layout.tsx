import type { Metadata } from 'next';
import './globals.css';
import IntercomProvider from '@/components/IntercomProvider';

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
      <body className="font-sans">
        <IntercomProvider>
          {children}
        </IntercomProvider>
      </body>
    </html>
  );
}
