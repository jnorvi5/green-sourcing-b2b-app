import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include verified EPD data and sustainability certifications.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Explorer</h3>
              <p className="text-gray-600 mb-4">For individual professionals exploring sustainable materials</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <Link 
                href="/auth/signup" 
                className="block w-full py-3 px-6 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Get Started Free
              </Link>
            </div>
            
            <div className="border-t pt-6">
              <p className="font-semibold mb-4">Features:</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Search 10,000+ sustainable products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>View basic sustainability data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Compare up to 3 products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Access certification library</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">Full EPD reports</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">✗</span>
                  <span className="text-gray-400">RFQ submissions</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="bg-white rounded-lg shadow-2xl p-8 border-4 border-green-600 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              MOST POPULAR
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-gray-600 mb-4">For architects and contractors sourcing sustainable materials</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$199</span>
                <span className="text-gray-600">/month</span>
              </div>
              <Link 
                href="/auth/signup?plan=professional" 
                className="block w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Start Free Trial
              </Link>
              <p className="text-sm text-gray-600 mt-2">14-day free trial, cancel anytime</p>
            </div>
            
            <div className="border-t pt-6">
              <p className="font-semibold mb-4">Everything in Explorer, plus:</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Full EPD data access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Unlimited RFQ submissions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Carbon footprint calculations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Autodesk Revit integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Project collaboration (up to 5 users)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Supplier Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Supplier</h3>
              <p className="text-gray-600 mb-4">For manufacturers and distributors showcasing sustainable products</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$299</span>
                <span className="text-gray-600">/month</span>
              </div>
              <Link 
                href="/auth/signup?plan=supplier" 
                className="block w-full py-3 px-6 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
              >
                Start Free Trial
              </Link>
              <p className="text-sm text-gray-600 mt-2">14-day free trial, cancel anytime</p>
            </div>
            
            <div className="border-t pt-6">
              <p className="font-semibold mb-4">Features:</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Showcase unlimited products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>EPD verification badge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Receive qualified RFQs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Lead analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Featured placement opportunities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Dedicated account manager</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Section */}
      <div className="bg-white border-t">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Enterprise Solutions</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Need custom integrations, white-label solutions, or serving 50+ team members?
          </p>
          <a 
            href="mailto:founder@greenchainz.com?subject=Enterprise%20Inquiry"
            className="inline-block py-3 px-8 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Contact Sales
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Can I switch plans later?</h3>
            <p className="text-gray-700">
              Yes, you can upgrade or downgrade at any time. Changes take effect immediately, 
              and we'll prorate any differences.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-700">
              We accept all major credit cards (Visa, MasterCard, Amex) and ACH transfers 
              for annual plans.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Is there a discount for annual payments?</h3>
            <p className="text-gray-700">
              Yes! Save 20% by paying annually. Professional: $1,910/year (vs $2,388), 
              Supplier: $2,870/year (vs $3,588).
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">What if I need help getting started?</h3>
            <p className="text-gray-700">
              All paid plans include onboarding support. Professional and Supplier plans 
              get priority email support, and Enterprise includes a dedicated account manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Pricing | GreenChainz - Sustainable Building Materials Marketplace',
  description: 'Transparent pricing for verified sustainable building materials. Free plan available. Professional plans start at $199/month.',
};
