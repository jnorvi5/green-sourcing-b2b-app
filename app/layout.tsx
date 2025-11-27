import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// IMPORT THE NEW HEADER HERE
import Header from "@/components/Header"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GreenChainz | Verified Sustainable Sourcing",
  description: "The Tesla of environmental sourcing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-background text-foreground`}>
        {/* GLOBAL BACKGROUND SHAPES (From your layout.css) */}
        <div className="bg-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
        </div>

        {/* MOUNT THE HEADER */}
        <Header />

        {/* MAIN CONTENT */}
        <main className="min-h-screen pt-20">
          {children}
        </main>
        
      </body>
    </html>
  );
}
