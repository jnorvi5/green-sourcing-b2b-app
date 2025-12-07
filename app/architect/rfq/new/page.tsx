'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { RFQFormData, MaterialCategory, UnitType, BudgetRange } from '@/types/rfq';

const materialCategories: MaterialCategory[] = [
  'Lumber',
  'Insulation',
  'Concrete',
  'Steel',
  'Flooring',
  'Other',
];

const unitTypes: UnitType[] = [
  'sqft',
  'linear ft',
  'tons',
  'units',
];

const budgetRanges: BudgetRange[] = [
  '<$10k',
  '$10k-50k',
  '$50k-100k',
  '$100k+',
];

export default function NewRFQPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RFQFormData>();

  const onSubmit = async (data: RFQFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/rfq/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error || 'Failed to create RFQ. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to dashboard with success message
      router.push('/dashboard/architect?rfq=created');
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold mb-2">Create New RFQ</h1>
          <p className="text-gray-400">
            Submit a request for quote to connect with sustainable material suppliers
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="project_name" className="block text-sm font-medium mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              id="project_name"
              type="text"
              {...register('project_name', {
                required: 'Project name is required',
                minLength: {
                  value: 3,
                  message: 'Project name must be at least 3 characters',
                },
                maxLength: {
                  value: 255,
                  message: 'Project name must be less than 255 characters',
                },
              })}
              className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                errors.project_name ? 'border-red-500' : 'border-white/10'
              } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
              placeholder="e.g., Downtown Office Building Renovation"
              disabled={isSubmitting}
            />
            {errors.project_name && (
              <p className="mt-1 text-sm text-red-400">{errors.project_name.message}</p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="project_description" className="block text-sm font-medium mb-2">
              Project Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="project_description"
              rows={5}
              {...register('project_description', {
                required: 'Project description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters',
                },
                maxLength: {
                  value: 2000,
                  message: 'Description must be less than 2000 characters',
                },
              })}
              className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                errors.project_description ? 'border-red-500' : 'border-white/10'
              } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none`}
              placeholder="Describe your material requirements, sustainability goals, and any specific certifications needed..."
              disabled={isSubmitting}
            />
            {errors.project_description && (
              <p className="mt-1 text-sm text-red-400">{errors.project_description.message}</p>
            )}
          </div>

          {/* Material Category and Quantity Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Material Category */}
            <div>
              <label htmlFor="material_category" className="block text-sm font-medium mb-2">
                Material Category <span className="text-red-400">*</span>
              </label>
              <select
                id="material_category"
                {...register('material_category', {
                  required: 'Material category is required',
                })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.material_category ? 'border-red-500' : 'border-white/10'
                } text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                disabled={isSubmitting}
              >
                <option value="" className="bg-gray-900">Select a category</option>
                {materialCategories.map((category) => (
                  <option key={category} value={category} className="bg-gray-900">
                    {category}
                  </option>
                ))}
              </select>
              {errors.material_category && (
                <p className="mt-1 text-sm text-red-400">{errors.material_category.message}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                Quantity <span className="text-red-400">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', {
                  required: 'Quantity is required',
                  min: {
                    value: 0.01,
                    message: 'Quantity must be greater than 0',
                  },
                  valueAsNumber: true,
                })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.quantity ? 'border-red-500' : 'border-white/10'
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                placeholder="0"
                disabled={isSubmitting}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-400">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          {/* Unit and Budget Range Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Unit */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium mb-2">
                Unit <span className="text-red-400">*</span>
              </label>
              <select
                id="unit"
                {...register('unit', {
                  required: 'Unit is required',
                })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.unit ? 'border-red-500' : 'border-white/10'
                } text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                disabled={isSubmitting}
              >
                <option value="" className="bg-gray-900">Select a unit</option>
                {unitTypes.map((unit) => (
                  <option key={unit} value={unit} className="bg-gray-900">
                    {unit}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-400">{errors.unit.message}</p>
              )}
            </div>

            {/* Budget Range */}
            <div>
              <label htmlFor="budget_range" className="block text-sm font-medium mb-2">
                Budget Range <span className="text-gray-500">(Optional)</span>
              </label>
              <select
                id="budget_range"
                {...register('budget_range')}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                disabled={isSubmitting}
              >
                <option value="" className="bg-gray-900">Select budget range</option>
                {budgetRanges.map((range) => (
                  <option key={range} value={range} className="bg-gray-900">
                    {range}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline and Location Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium mb-2">
                Deadline <span className="text-red-400">*</span>
              </label>
              <input
                id="deadline"
                type="date"
                {...register('deadline', {
                  required: 'Deadline is required',
                  validate: (value) => {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return selectedDate >= today || 'Deadline must be today or in the future';
                  },
                })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.deadline ? 'border-red-500' : 'border-white/10'
                } text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                disabled={isSubmitting}
              />
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-400">{errors.deadline.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Location <span className="text-red-400">*</span>
              </label>
              <input
                id="location"
                type="text"
                {...register('location', {
                  required: 'Location is required',
                  minLength: {
                    value: 3,
                    message: 'Location must be at least 3 characters',
                  },
                  maxLength: {
                    value: 255,
                    message: 'Location must be less than 255 characters',
                  },
                })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.location ? 'border-red-500' : 'border-white/10'
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                placeholder="e.g., Seattle, WA"
                disabled={isSubmitting}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-400">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating RFQ...
                </>
              ) : (
                'Create RFQ'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
