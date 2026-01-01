import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Dynamically import providers with error boundaries
// const PostHogProvider = dynamic(
//   () => import("@/components/PostHogProvider").catch(() => ({ default: ({ children }: any) => children })),
//   { ssr: false }
// );

// const IntercomProvider = dynamic(
//   () => import("@/components/IntercomProvider").catch(() => ({ default: ({ children }: any) => children })),
//   { ssr: false }
// );

// const GoogleAnalytics = dynamic(
//   () => import("@/components/GoogleAnalytics").catch(() => ({ default: () => null })),
//   { ssr: false }
// );

// const AgentChat = dynamic(
//   () => import("@/components/AgentChat").catch(() => ({ default: () => null })),
//   { ssr: false }
// );

export const metadata: Metadata = {
  metadataBase: new URL("https://app.greenchainz.com"),
  title: "GreenChainz - The Future of Verified Green Sourcing",
  description:
    "Audit carbon in Revit and source verified green materials instantly. The all-in-one B2B marketplace and AI plugin for sustainable construction.",
  openGraph: {
    title: "GreenChainz - Design Greener, Faster",
    description:
      "Design greener, faster. Audit carbon in Revit and find verified suppliers in minutes.",
    images: ["/images/plugin/demo-thumbnail.svg"],
  },
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
    <html lang="en" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-NV6SKWWJ');`,
          }}
        />
        {/* End Google Tag Manager */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link
              rel="preconnect"
              href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            />
            <link
              rel="dns-prefetch"
              href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            />
          </>
        )}
      </head>
      <body className="font-sans bg-slate-950 text-white antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NV6SKWWJ"
            height="0"
            width="0"
            className="hidden"
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* ✅ START COOKIEYES BANNER */}
        <Script
          id="cookieyes"
          type="text/javascript"
          src="https://cdn-cookieyes.com/client_data/80d633ac80d2b968de32ce14/script.js"
          strategy="afterInteractive"
        />
        {/* ✅ END COOKIEYES BANNER */}
        {/* <GoogleAnalytics /> */}
        {/* <PostHogProvider> */}
        <AuthProvider>
          {/* <IntercomProvider> */}
          {children}
          {/* </IntercomProvider> */}
        </AuthProvider>
        {/* </PostHogProvider> */}
        {/* <AgentChat /> */}
      </body>
    </html>
  );
}
