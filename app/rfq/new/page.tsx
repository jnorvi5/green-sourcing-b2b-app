'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function NewRFQPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    project_name: '',
    quantity: '',
    unit: 'kg',
    delivery_date: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to submit an RFQ');
        return;
      }

      // Create RFQ
      const { data: rfq, error: rfqError } = await supabase
        .from('rfq_requests')
        .insert([
          {
            buyer_id: user.id,
            project_name: formData.project_name,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            delivery_date: formData.delivery_date,
            notes: formData.notes
          }
        ])
        .select()
        .single();

      if (rfqError) throw rfqError;

      // Success - redirect to confirmation
      alert(`RFQ submitted! ID: ${rfq.id}`);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Request a Quote</h1>
        <p className="text-gray-600 mb-8">Submit your material requirements and suppliers will respond with quotes.</p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Office Building Renovation"
            />
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="tonnes">Tonnes</option>
                <option value="m3">Cubic Meters (m³)</option>
                <option value="m2">Square Meters (m²)</option>
                <option value="units">Units</option>
              </select>
            </div>
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            </label>
            <input
              type="date"
              required
              value={formData.delivery_date}

              onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Requirements
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={4}
              placeholder="Certifications, delivery location, special requirements, etc."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Submitting...' : 'Submit RFQ'}
          </button>
        </form>
      </div>
    </div>
  );
}

