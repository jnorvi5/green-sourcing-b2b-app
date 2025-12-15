import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import IntercomProvider from "@/components/IntercomProvider";

const AgentChat = dynamic(() => import("@/components/AgentChat"), {
  ssr: false,
});

const SentryProvider = dynamic(
  () => import("@sentry/nextjs").then((mod) => mod.ErrorBoundary),
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
          href="https://jfexzdhacbguleutgdwq.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://jfexzdhacbguleutgdwq.supabase.co"
        />
      </head>
      <body className="bg-slate-950 text-white">
        <SentryProvider>
          <PostHogProvider>
            <IntercomProvider>{children}</IntercomProvider>
            <AgentChat />
          </PostHogProvider>
        </SentryProvider>
        <Script src="https://analytics.example.com" strategy="lazyOnload" />
      </body>
    </html>
  );
}
