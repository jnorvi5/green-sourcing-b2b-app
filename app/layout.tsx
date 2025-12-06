import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GreenChainz - Verified Sustainable Sourcing',
  description: 'B2B Marketplace for Verified Sustainable Materials',
  icons: {
    icon: '/logos/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
