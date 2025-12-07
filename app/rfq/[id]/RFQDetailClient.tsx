'use client';

/**
 * RFQ Detail Client Component
 * 
 * Handles the interactive UI for viewing RFQ details and submitting quotes.
 * - Displays RFQ project details
 * - Shows existing quote with edit option
 * - Provides quote submission form
 * - Handles PDF upload to Supabase Storage
 */

import { useState, FormEvent } from 'react';
import { RFQWithArchitect, RFQResponse } from '@/types/rfq';
import { createClient } from '@/lib/supabase/client';

interface Props {
  rfq: RFQWithArchitect;
  existingQuote: RFQResponse | null;
  supplierName: string;
}

export default function RFQDetailClient({ rfq, existingQuote, supplierName }: Props) {
  const [isEditing, setIsEditing] = useState(!existingQuote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [price, setPrice] = useState(existingQuote?.quote_amount?.toString() || '');
  const [leadTime, setLeadTime] = useState(
    existingQuote ? `${existingQuote.lead_time_days} days` : ''
  );
  const [notes, setNotes] = useState(existingQuote?.message || '');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let pdfUrl: string | undefined;

      // Upload PDF to Supabase Storage if provided
      if (pdfFile) {
        const supabase = createClient();
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${rfq.id}_${Date.now()}.${fileExt}`;
        const filePath = `quotes/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('quotes')
          .upload(filePath, pdfFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload PDF: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('quotes')
          .getPublicUrl(filePath);

        pdfUrl = urlData.publicUrl;
      }

      // Submit quote to API
      const response = await fetch('/api/rfq/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rfq_id: rfq.id,
          price: parseFloat(price),
          lead_time: leadTime,
          notes: notes || undefined,
          pdf_url: pdfUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quote');
      }

      setSuccess(data.message || 'Quote submitted successfully!');
      setIsEditing(false);
      
      // Reload page after 2 seconds to show updated quote
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/supplier/dashboard"
            className="text-green-500 hover:text-green-400 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-white mt-2">RFQ Details</h1>
          <p className="text-gray-400 mt-1">Review and respond to this request for quote</p>
        </div>

        {/* RFQ Details Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Project Name</h3>
              <p className="text-white text-lg font-semibold">{rfq.project_name}</p>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Status</h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  rfq.status === 'pending'
                    ? 'bg-yellow-900 text-yellow-200'
                    : rfq.status === 'responded'
                    ? 'bg-blue-900 text-blue-200'
                    : rfq.status === 'closed'
                    ? 'bg-green-900 text-green-200'
                    : 'bg-red-900 text-red-200'
                }`}
              >
                {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
              </span>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Location</h3>
              <p className="text-white">{rfq.project_location}</p>
            </div>

            {/* Deadline */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Delivery Deadline</h3>
              <p className="text-white">{formatDate(rfq.delivery_deadline)}</p>
            </div>

            {/* Budget Range */}
            {rfq.budget_range && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Budget Range</h3>
                <p className="text-white">{rfq.budget_range}</p>
              </div>
            )}

            {/* Created Date */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">RFQ Created</h3>
              <p className="text-white">{formatDate(rfq.created_at)}</p>
            </div>
          </div>

          {/* Material Specs */}
          {rfq.material_specs && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Material Requirements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Material Category</p>
                  <p className="text-white">
                    {rfq.material_specs.material_category || rfq.material_specs.material_type || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-white">
                    {rfq.material_specs.quantity} {rfq.material_specs.unit}
                  </p>
                </div>
                {rfq.material_specs.project_description && (
                  <div className="sm:col-span-3">
                    <p className="text-xs text-gray-500">Project Description</p>
                    <p className="text-white">{rfq.material_specs.project_description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          {rfq.message && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Additional Details</h3>
              <p className="text-white whitespace-pre-wrap">{rfq.message}</p>
            </div>
          )}

          {/* Required Certifications */}
          {rfq.required_certifications && rfq.required_certifications.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Required Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {rfq.required_certifications.map((cert, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Architect Info */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Requested By</h3>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {rfq.architect.full_name?.[0] || rfq.architect.email[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">
                  {rfq.architect.full_name || 'Architect'}
                </p>
                {rfq.architect.company_name && (
                  <p className="text-gray-400 text-sm">{rfq.architect.company_name}</p>
                )}
                <p className="text-gray-500 text-sm">{rfq.architect.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Section */}
        {existingQuote && !isEditing ? (
          // Display existing quote
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">Your Quote</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Edit Quote
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Quoted Price</h3>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(existingQuote.quote_amount)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Lead Time</h3>
                <p className="text-white text-lg">{existingQuote.lead_time_days} days</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Status</h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    existingQuote.status === 'submitted'
                      ? 'bg-blue-900 text-blue-200'
                      : existingQuote.status === 'accepted'
                      ? 'bg-green-900 text-green-200'
                      : 'bg-red-900 text-red-200'
                  }`}
                >
                  {existingQuote.status.charAt(0).toUpperCase() + existingQuote.status.slice(1)}
                </span>
              </div>
            </div>

            {existingQuote.message && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Notes</h3>
                <p className="text-white whitespace-pre-wrap">{existingQuote.message}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                Submitted on {formatDate(existingQuote.responded_at)}
              </p>
            </div>
          </div>
        ) : (
          // Quote submission form
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              {existingQuote ? 'Edit Your Quote' : 'Submit Your Quote'}
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-green-200">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                  Quoted Price (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Lead Time */}
              <div>
                <label htmlFor="leadTime" className="block text-sm font-medium text-gray-300 mb-2">
                  Lead Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="leadTime"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 2-3 weeks, 5 days, 1 month"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Examples: &quot;2-3 weeks&quot;, &quot;5 days&quot;, &quot;1 month&quot;
                </p>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Include any additional information about your quote, shipping details, or special terms..."
                />
                <p className="mt-1 text-sm text-gray-400">
                  {notes.length}/2000 characters
                </p>
              </div>

              {/* PDF Upload */}
              <div>
                <label htmlFor="pdf" className="block text-sm font-medium text-gray-300 mb-2">
                  Attach PDF Quote (Optional)
                </label>
                <input
                  type="file"
                  id="pdf"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
                />
                {pdfFile && (
                  <p className="mt-2 text-sm text-green-400">
                    Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Submitting...' : existingQuote ? 'Update Quote' : 'Submit Quote'}
                </button>
                
                {existingQuote && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
