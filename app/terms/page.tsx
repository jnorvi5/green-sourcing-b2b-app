export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-green-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: December 5, 2025</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">By accessing GreenChainz, you agree to be bound by these Terms of Service and our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">2. Platform Purpose</h2>
            <p className="text-gray-700">GreenChainz is a B2B marketplace connecting architects with verified sustainable building material suppliers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">3. Fees</h2>
            <p className="text-gray-700">Supplier membership fees are $299/month or $2,990/year. Payment is processed through Stripe.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">4. Contact</h2>
            <p className="text-gray-700">Questions: <a href="mailto:founder@greenchainz.com" className="text-green-600 hover:text-green-700 underline">founder@greenchainz.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
