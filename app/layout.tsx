import type { Metadata } from "next";
// FIX: Use relative path for CSS (Current folder)
import "./globals.css"; 

export const metadata: Metadata = {
  title: "GreenChainz | Verified Sustainable Sourcing",
  description: "The B2B marketplace for verified sustainable building materials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
