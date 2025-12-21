'use client';

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">Security & Compliance</h1>
      <p className="text-lg mb-8">At GreenChainz, we take data security seriously.</p>
      
      <h2 className="text-2xl font-bold mb-4">Our Commitments</h2>
      <ul className="list-disc ml-6 mb-8">
        <li>GDPR Compliant</li>
        <li>Encrypted Data (HTTPS/TLS 1.3)</li>
        <li>SOC 2 Roadmap: 2026</li>
      </ul>
      
      <h2 className="text-2xl font-bold mb-4">Infrastructure Partners</h2>
      <ul className="list-disc ml-6 mb-8">
        <li>Hosting: Vercel (ISO 27001, SOC 2)</li>
        <li>Database: Supabase (SOC 2)</li>
        <li>Payments: Stripe (PCI DSS Level 1)</li>
      </ul>
      
      <p>Security questions? Email <a href="mailto:security@greenchainz.com">security@greenchainz.com</a></p>
    </div>
  );
}
