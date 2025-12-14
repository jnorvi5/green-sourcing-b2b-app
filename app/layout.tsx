'use client';

import type { Metadata } from 'next';
import './globals.css';
import PostHogProvider from '@/components/PostHogProvider';
import IntercomProvider from '@/components/IntercomProvider';
import AgentChat from '@/components/AgentChat';

export const metadata: Metadata = {
  title: 'GreenChainz - Sustainable Building Materials Marketplace',
  description: 'B2B marketplace for verified green building materials',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <PostHogProvider>
          <IntercomProvider>
            {children}
          </IntercomProvider>
          <AgentChat />
        </PostHogProvider>
      </body>
    </html>
  );
}