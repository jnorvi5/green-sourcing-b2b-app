export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-green-900 mb-8">About GreenChainz</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Our Mission</h2>
            <p className="text-gray-700 text-lg">Building the trust layer for sustainable construction materials through verified certification data and transparent sourcing.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">The Problem</h2>
            <p className="text-gray-700">Architects spend 40+ hours per project manually verifying material sustainability claims across fragmented databases.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Market Opportunity</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>$471B green building materials market → $1T by 2037</li>
              <li>LEED v5, Buy Clean policies driving demand</li>
              <li>50 suppliers, 200 architects by Q1 2026</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Founder</h2>
            <p className="text-gray-700">Jerit Norville - Military vet → Construction → Tech.</p>
            <p className="text-gray-700 mt-2">Email: <a href="mailto:founder@greenchainz.com" className="text-green-600 hover:text-green-700 underline">founder@greenchainz.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
