import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header"; // Import the new component
import Footer from "@/components/Footer"; // Assuming you have this, or we remove it if not ready

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GreenChainz | Verified Sustainable Sourcing",
  description: "The Tesla of environmental sourcing. Connect with verified green suppliers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-background text-foreground overflow-x-hidden`}>
        {/* BACKGROUND EFFECTS */}
        <div className="bg-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
        </div>

        {/* 1. MOUNT THE HEADER */}
        <Header />

        {/* 2. MAIN CONTENT WRAPPER */}
        <main className="min-h-screen pt-16"> 
          {/* pt-16 pushes content down so it's not hidden behind the fixed header */}
          {children}
        </main>

        {/* 3. MOUNT THE FOOTER */}
        <Footer /> 
      </body>
    </html>
  );
}
