import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import dynamic from 'next/dynamic';

// Static import for above-the-fold content (Hero is already static above)
// Dynamic imports for below-the-fold content
const StatsSection = dynamic(() => import('@/components/home/StatsSection'), {
  loading: () => <div className="py-16 bg-slate-900/50 min-h-[200px]" />
});

const ProblemSolutionSection = dynamic(() => import('@/components/home/ProblemSolutionSection'), {
  loading: () => <div className="py-20 min-h-[400px]" />
});

const HowItWorksSection = dynamic(() => import('@/components/home/HowItWorksSection'), {
  loading: () => <div className="py-20 bg-slate-900/50 min-h-[400px]" />
});

const PricingSection = dynamic(() => import('@/components/home/PricingSection'), {
  loading: () => <div className="py-20 min-h-[400px]" />
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950">
      <Header />
      <HeroSection />
      <StatsSection />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
