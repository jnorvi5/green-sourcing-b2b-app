export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-green-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: December 5, 2025</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700">We collect information you provide directly to us, including name, email address, company information, and material specifications when you register as a supplier or architect.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Facilitate connections between architects and sustainable material suppliers</li>
              <li>Verify supplier certifications and material sustainability data</li>
              <li>Send platform updates and relevant marketplace opportunities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">3. Contact</h2>
            <p className="text-gray-700">For privacy inquiries: <a href="mailto:founder@greenchainz.com" className="text-green-600 hover:text-green-700 underline">founder@greenchainz.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
