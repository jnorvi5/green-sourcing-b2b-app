import Header from '../components/home/Header';
import Hero from '../components/home/Hero';
import TrustBar from '../components/home/TrustBar';
import WhySection from '../components/LandingPage/WhySection';
import LandingPageValueProps from '../components/LandingPageValueProps';
import NewsletterSignup from '../components/NewsletterSignup';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <Hero />
      <TrustBar />
      <WhySection />
      <LandingPageValueProps />
      
      {/* Newsletter Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated on Sustainable Sourcing
          </h2>
          <p className="text-gray-400 mb-8">
            Get the latest news on green building materials, certifications, and industry insights.
          </p>
          <NewsletterSignup variant="modal" />
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
