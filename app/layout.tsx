import type { Metadata } from "next";
import Script from "next/script";
import dynamic from "next/dynamic";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

// Dynamically import providers with error boundaries
const PostHogProvider = dynamic(
  () => import("@/components/PostHogProvider").catch(() => ({ default: ({ children }: any) => children })),
  { ssr: false }
);

const IntercomProvider = dynamic(
  () => import("@/components/IntercomProvider").catch(() => ({ default: ({ children }: any) => children })),
  { ssr: false }
);

const GoogleAnalytics = dynamic(
  () => import("@/components/GoogleAnalytics").catch(() => ({ default: () => null })),
  { ssr: false }
);

const AgentChat = dynamic(
  () => import("@/components/AgentChat").catch(() => ({ default: () => null })),
  { ssr: false }
);

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
        {/* ✅ START COOKIEYES BANNER */}
        <Script
          id="cookieyes"
          type="text/javascript"
          src="https://cdn-cookieyes.com/client_data/80d633ac80d2b968de32ce14/script.js"
          strategy="beforeInteractive"
        />
        {/* ✅ END COOKIEYES BANNER */}
        <GoogleAnalytics />
        <PostHogProvider>
          <AuthProvider>
            <IntercomProvider>
              {children}
            </IntercomProvider>
          </AuthProvider>
        </PostHogProvider>
        <AgentChat />
      </body>
    </html>
  );
}
