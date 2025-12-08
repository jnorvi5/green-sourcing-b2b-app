import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to GreenChainz
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            B2B marketplace for verified sustainable building materials. 
            Connect with green suppliers and make data-driven sourcing decisions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold mb-2">For Buyers</h3>
              <p className="text-gray-600 mb-4">
                Discover verified green materials with transparent sustainability data
              </p>
              <Link 
                href="/marketplace" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Browse Marketplace →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">🏭</div>
              <h3 className="text-xl font-semibold mb-2">For Suppliers</h3>
              <p className="text-gray-600 mb-4">
                Showcase your sustainable products to qualified buyers
              </p>
              <Link 
                href="/supplier/register" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Join as Supplier →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold mb-2">Admin</h3>
              <p className="text-gray-600 mb-4">
                Manage platform, run automations, and view analytics
              </p>
              <Link 
                href="/admin/dashboard" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Admin Dashboard →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Platform Status</h2>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-sm text-gray-500">API Status</div>
                <div className="text-lg font-semibold text-green-600">✓ Operational</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Database</div>
                <div className="text-lg font-semibold text-green-600">✓ Connected</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Automation</div>
                <div className="text-lg font-semibold text-green-600">✓ Ready</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Support</div>
                <div className="text-lg font-semibold text-green-600">✓ Active</div>
              </div>
            </div>
            <Link 
              href="/api/health" 
              className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700"
            >
              View detailed health check →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
