import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenChainz - Sustainable Building Materials Marketplace",
  description: "B2B marketplace for verified green building materials",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: "/apple-touch-icon.png",
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
        <link
          rel="preconnect"
          href="https://ezgnhyymoqxaplungbabj.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://ezgnhyymoqxaplungbabj.supabase.co"
        />
      </head>
      <body className="bg-slate-950 text-white">
        {children}
      </body>
    </html>
  );
}
