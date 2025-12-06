import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Company */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">GreenChainz</h3>
          <p className="text-sm text-gray-400">Verified sustainable materials marketplace for architects and suppliers.</p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-white font-semibold mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/search" className="hover:text-green-400 transition">Search Materials</Link></li>
            <li><Link href="/supplier/pricing" className="hover:text-green-400 transition">Supplier Pricing</Link></li>
            <li><Link href="/carbon-analysis" className="hover:text-green-400 transition">Carbon Analysis</Link></li>
            <li><Link href="/data-licensing" className="hover:text-green-400 transition">Data Licensing</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-green-400 transition">About</Link></li>
            <li><Link href="/contact" className="hover:text-green-400 transition">Contact</Link></li>
            <li><a href="mailto:founder@greenchainz.com" className="hover:text-green-400 transition">founder@greenchainz.com</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-green-400 transition">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-green-400 transition">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
        <p>&copy; 2025 GreenChainz. All rights reserved. | Launching Q1 2026</p>
      </div>
    </footer>
  );
}
