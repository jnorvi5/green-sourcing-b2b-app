"use client";

import Header from "@/components/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import dynamic from "next/dynamic";

// Static import for above-the-fold content (Hero is already static above)
// Dynamic imports for below-the-fold content
const StatsSection = dynamic(() => import("@/components/home/StatsSection"), {
  loading: () => <div className="py-16 bg-slate-900/50 min-h-[200px]" />,
});

const ProblemSolutionSection = dynamic(
  () => import("@/components/home/ProblemSolutionSection"),
  {
    loading: () => <div className="py-20 min-h-[400px]" />,
  }
);

const HowItWorksSection = dynamic(
  () => import("@/components/home/HowItWorksSection"),
  {
    loading: () => <div className="py-20 bg-slate-900/50 min-h-[400px]" />,
  }
);

// Changed PluginDemoSection to PlatformPreviewSection
const PlatformPreviewSection = dynamic(
  () => import("@/components/home/PlatformPreviewSection"),
  {
    loading: () => <div className="py-24 bg-slate-950 min-h-[500px]" />,
  }
);

const PricingSection = dynamic(
  () => import("@/components/home/PricingSection"),
  {
    loading: () => <div className="py-20 min-h-[400px]" />,
  }
);

const TestimonialsSection = dynamic(
  () => import("@/components/home/TestimonialsSection"),
  {
    loading: () => <div className="py-20 min-h-[400px]" />,
  }
);

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      <HeroSection />
      {/* <StatsSection /> -- Hiding Stats as we are in Foundation phase */}
      <ProblemSolutionSection />
      <PlatformPreviewSection />
      {/* <HowItWorksSection /> -- Keeping this might be confusing if the platform isn't live, but let's check content first. Actually, Problem/Solution covers the 'Why', PlatformPreview covers 'What'. */}
      {/* <TestimonialsSection /> -- Hiding Testimonials as we have no users yet */}
      {/* <PricingSection /> -- Hiding Pricing for now */}
      <Footer />
    </div>
  );
}
