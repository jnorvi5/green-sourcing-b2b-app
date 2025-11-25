
import WhySection from '../components/LandingPage/WhySection';
import Footer from '../components/Footer';
import Hero from '../components/home/Hero';
import TrustBar from '../components/home/TrustBar';
import SEO from '../components/SEO';

import Header from '../components/home/Header';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <SEO 
                title="GreenChainz - Verified Sustainable Sourcing" 
                description="The global trust layer for sustainable commerce. Connect verified suppliers with forward-thinking architects. Zero greenwashing. Total transparency."
            />
            {/* Premium Header */}
            <Header />

            {/* Hero Banner */}
            <Hero />
            <TrustBar />

            <WhySection />
            <Footer />
        </div>
    );
}
