import './globals.css';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';

export const metadata: Metadata = {
  metadataBase: new URL('https://greenchainz.com'),
  title: {
    default: 'GreenChainz | Verified Sustainable Materials Marketplace',
    template: '%s | GreenChainz',
  },
  description: 'B2B marketplace connecting architects with verified sustainable building material suppliers. Search EPD-certified, low-carbon materials from trusted suppliers.',
  keywords: ['sustainable materials', 'green building', 'EPD certification', 'low-carbon concrete', 'FSC lumber', 'LEED materials', 'embodied carbon', 'B2B marketplace'],
  authors: [{ name: 'Jerit Norville', url: 'https://greenchainz.com' }],
  creator: 'GreenChainz',
  publisher: 'GreenChainz',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://greenchainz.com',
    siteName: 'GreenChainz',
    title: 'GreenChainz | Verified Sustainable Materials Marketplace',
    description: 'Connect with verified suppliers of sustainable building materials. EPD-certified, FSC-approved, low-carbon options.',
    images: [
      {
        url: '/logos/logo-main.jpg',
        width: 1200,
        height: 630,
        alt: 'GreenChainz Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GreenChainz | Verified Sustainable Materials',
    description: 'B2B marketplace for sustainable building materials',
    images: ['/logos/logo-main.jpg'],
    creator: '@greenchainz',
  },
  icons: {
    icon: '/logos/favicon.ico',
    apple: '/logos/logo-icon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://greenchainz.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen flex flex-col">
        <main className="flex-grow">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
