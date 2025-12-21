'use client';

import { useState } from 'react';

export default function EmailPreviewPage() {
  const [template, setTemplate] = useState('RFQ_RECEIVED');
  const [emailTo, setEmailTo] = useState('test@example.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const getExampleData = (type: string) => {
    switch (type) {
      case 'RFQ_RECEIVED':
        return {
          supplierName: 'Green Suppliers Inc.',
          rfqNumber: 'RFQ-2023-001',
          productName: 'Recycled Steel Beams',
          quantity: 50,
          unit: 'tons',
          buyerCompany: 'BuildRight Construction',
          projectName: 'Skyline Tower',
          deliveryLocation: 'New York, NY',
          deliveryDate: '2023-12-01',
          expiresAt: '2023-11-15',
          viewUrl: 'http://localhost:3000/rfq/123',
          rfqId: '123'
        };
      case 'QUOTE_SUBMITTED':
        return {
          architectName: 'Alice Architect',
          rfqName: 'Skyline Tower - Steel',
          supplierName: 'Green Suppliers Inc.',
          quoteUrl: 'http://localhost:3000/quote/456',
          quotePreview: 'Total: $50,000 | Lead Time: 4 weeks'
        };
      case 'QUOTE_ACCEPTED':
        return {
          supplierName: 'Green Suppliers Inc.',
          rfqName: 'Skyline Tower - Steel',
          architectContact: {
            name: 'Alice Architect',
            email: 'alice@example.com',
            company: 'BuildRight'
          }
        };
      case 'WELCOME_EMAIL':
        return {
          name: 'John Doe',
          role: 'buyer',
          createRfqUrl: 'http://localhost:3000/rfq/new'
        };
      case 'AUDIT_COMPLETE':
        return {
          userName: 'Project Manager',
          projectName: 'Eco Friendly Villa',
          reportUrl: 'http://localhost:3000/reports/789.pdf',
          totalCarbon: 15000,
          score: 'A+'
        };
      default:
        return {};
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailTo,
          template,
          data: getExampleData(template),
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to send' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Email Notification Tester</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template Type</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="RFQ_RECEIVED">RFQ Received (Supplier)</option>
            <option value="QUOTE_SUBMITTED">Quote Submitted (Architect)</option>
            <option value="QUOTE_ACCEPTED">Quote Accepted (Supplier)</option>
            <option value="WELCOME_EMAIL">Welcome Email</option>
            <option value="AUDIT_COMPLETE">Audit Complete</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recipient Email</label>
          <input
            type="email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: If API keys are missing, the server will log the email instead of sending.
          </p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold text-sm mb-2">Payload Preview:</h3>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(getExampleData(template), null, 2)}
          </pre>
        </div>

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>

        {result && (
          <div className={`p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h3 className="font-bold">{result.success ? 'Success!' : 'Error'}</h3>
            <pre className="text-xs mt-2 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
