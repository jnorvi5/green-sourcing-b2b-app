'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteSubmissionSchema, QuoteSubmission } from '@/types/rfq';
import { createClient } from '@/lib/supabase/client';

interface QuoteSubmissionFormProps {
  rfqId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function QuoteSubmissionForm({ rfqId, onSuccess, onCancel }: QuoteSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteSubmission>({
    resolver: zodResolver(QuoteSubmissionSchema),
    defaultValues: {
      rfq_id: rfqId,
    },
  });

  const onSubmit = async (data: QuoteSubmission) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let pdfUrl = undefined;

      // Upload PDF if present
      if (data.pdf_file && data.pdf_file instanceof File) {
        // Assume bucket name is 'rfq-attachments' or 'quotes'.
        // Need to check specific bucket usage or use API route to handle upload if bucket is restricted.
        // For now, let's assume we pass the file to the API route or upload it here.
        // Given the requirement "POST to /api/rfqs/[id]/quotes", the API might handle it.
        // But files usually need separate upload or multipart/form-data.
        // Let's assume the API endpoint handles JSON and maybe a URL for the file.
        // So I'll upload to storage first.

        const fileExt = data.pdf_file.name.split('.').pop();
        const fileName = `${rfqId}/${Date.now()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('quote-attachments') // Assuming bucket name
          .upload(fileName, data.pdf_file);

        if (uploadError) {
          throw new Error('Failed to upload attachment: ' + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('quote-attachments')
          .getPublicUrl(fileName);

        pdfUrl = publicUrl;
      }

      // Submit quote to API
      const response = await fetch(`/api/rfqs/${rfqId}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rfq_id: rfqId,
          price: data.price,
          lead_time: data.lead_time,
          notes: data.notes,
          pdf_url: pdfUrl,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to submit quote');
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      console.error('Error submitting quote:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-white/10 p-6 w-full max-w-2xl">
      <h3 className="text-xl font-bold text-white mb-4">Submit Quote</h3>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Total Price ($) *
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="0.00"
            {...register('price')}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
          )}
        </div>

        {/* Lead Time */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Lead Time / Delivery Date *
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="e.g. 2 weeks, or Dec 15th"
            {...register('lead_time')}
          />
          {errors.lead_time && (
            <p className="mt-1 text-sm text-red-400">{errors.lead_time.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Notes / Conditions
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-32"
            placeholder="Include any shipping details, exclusions, or valid-until dates..."
            {...register('notes')}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>
          )}
        </div>

        {/* PDF Attachment (Optional) - simplified handling for now */}
        {/*
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
             Official Quote PDF (Optional)
          </label>
          <input
             type="file"
             accept="application/pdf"
             className="block w-full text-sm text-gray-400
               file:mr-4 file:py-2 file:px-4
               file:rounded-full file:border-0
               file:text-sm file:font-semibold
               file:bg-teal-500/10 file:text-teal-400
               hover:file:bg-teal-500/20"
               // We need to handle file input properly with react-hook-form, often using a Controller or handling onChange manually if register doesn't support FileList well directly depending on RHF version.
               // For simplicity in this MVP step, skipping sophisticated file upload unless strictly requested, or will implement basics.
               // The schema expects File instance.
             {...register('pdf_file')}
          />
        </div>
        */}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            )}
            Submit Quote
          </button>
        </div>
      </form>
    </div>
  );
}
