"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import type {
  RFQFormData,
  MaterialCategory,
  UnitType,
  BudgetRange,
} from "@/types/rfq";

const materialCategories: MaterialCategory[] = [
  "Lumber",
  "Insulation",
  "Concrete",
  "Steel",
  "Flooring",
  "Other",
];

const unitTypes: UnitType[] = [
  "sqft",
  "linear ft",
  "tons",
  "units",
  "kg", // Added from user request
  "m3", // Added from user request
  "m2", // Added from user request
];

const budgetRanges: BudgetRange[] = [
  "<$10k",
  "$10k-50k",
  "$50k-100k",
  "$100k+",
];

export default function NewRFQPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get product_id from URL if present
  const productId = searchParams.get("product_id");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RFQFormData>({
    defaultValues: {
      urgency: "medium",
      unit: "kg", // Default per user request, though generic default might be better
    },
  });

  const onSubmit = async (data: RFQFormData) => {
    if (!user) {
      setErrorMessage("You must be logged in to submit an RFQ");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Map form data to API schema
      const apiPayload = {
        project_name: data.project_name,
        project_location: data.location,
        material_specs: {
          material_type: data.material_category.toLowerCase(),
          quantity: data.quantity,
          unit: data.unit,
        },
        budget_range: data.budget_range,
        delivery_deadline: new Date(data.deadline).toISOString(),
        // Combine description and urgency into message
        message: `Urgency: ${data.urgency}\n\n${data.project_description}`,
        required_certifications: [],
        product_id: productId || null,
      };

      const response = await fetch("/api/rfqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.error || "Failed to create RFQ. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to RFQ details (user request) or dashboard
      // User request: router.push(`/rfq/${rfq.id}`);
      // Existing: router.push('/architect/dashboard?rfq=created');
      // I'll follow user's preference if ID is available
      if (result.rfq_id) {
        router.push(`/architect/rfq/${result.rfq_id}`); // Adjusted path to likely architect route
      } else {
        router.push("/architect/dashboard?rfq=created");
      }
    } catch (error: any) {
      console.error("Error submitting RFQ:", error);
      setErrorMessage(
        error.message || "An unexpected error occurred. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold mb-2">Request a Quote</h1>
          <p className="text-gray-400">
            Submit a request for quote to connect with sustainable material
            suppliers
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
            <label
              htmlFor="project_name"
              className="block text-sm font-medium mb-2"
            >
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              id="project_name"
              type="text"
              {...register("project_name", {
                required: "Project Name is required",
                minLength: { value: 3, message: "Minimum 3 characters" },
              })}
              className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                errors.project_name ? "border-red-500" : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
              placeholder="e.g., Office Building Renovation"
              disabled={isSubmitting}
            />
            {errors.project_name && (
              <p className="mt-1 text-sm text-red-400">
                {errors.project_name.message}
              </p>
            )}
          </div>

          {/* Quantity + Unit */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium mb-2"
              >
                Quantity <span className="text-red-400">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                step="0.01"
                {...register("quantity", {
                  required: "Quantity is required",
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Must be greater than 0" },
                })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.quantity ? "border-red-500" : "border-white/10"
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                placeholder="0"
                disabled={isSubmitting}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium mb-2">
                Unit <span className="text-red-400">*</span>
              </label>
              <select
                id="unit"
                {...register("unit", { required: "Unit is required" })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.unit ? "border-red-500" : "border-white/10"
                } text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                disabled={isSubmitting}
              >
                {unitTypes.map((u) => (
                  <option key={u} value={u} className="bg-gray-900">
                    {u}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.unit.message}
                </p>
              )}
            </div>
          </div>

          {/* Material Category (Required for API matching) */}
          <div>
            <label
              htmlFor="material_category"
              className="block text-sm font-medium mb-2"
            >
              Material Category <span className="text-red-400">*</span>
            </label>
            <select
              id="material_category"
              {...register("material_category", {
                required: "Material category is required",
              })}
              className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                errors.material_category ? "border-red-500" : "border-white/10"
              } text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
              disabled={isSubmitting}
            >
              <option value="" className="bg-gray-900">
                Select a category
              </option>
              {materialCategories.map((c) => (
                <option key={c} value={c} className="bg-gray-900">
                  {c}
                </option>
              ))}
            </select>
            {errors.material_category && (
              <p className="mt-1 text-sm text-red-400">
                {errors.material_category.message}
              </p>
            )}
          </div>

          {/* Delivery Date + Location */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium mb-2"
              >
                Delivery Date <span className="text-red-400">*</span>
              </label>
              <input
                id="deadline"
                type="date"
                {...register("deadline", {
                  required: "Delivery Date is required",
                })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.deadline ? "border-red-500" : "border-white/10"
                } text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                disabled={isSubmitting}
              />
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.deadline.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium mb-2"
              >
                Delivery Location <span className="text-red-400">*</span>
              </label>
              <input
                id="location"
                type="text"
                {...register("location", {
                  required: "Delivery Location is required",
                })}
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.location ? "border-red-500" : "border-white/10"
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
                placeholder="e.g., Seattle, WA"
                disabled={isSubmitting}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.location.message}
                </p>
              )}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label htmlFor="urgency" className="block text-sm font-medium mb-2">
              Urgency
            </label>
            <select
              id="urgency"
              {...register("urgency")}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              disabled={isSubmitting}
            >
              <option value="low" className="bg-gray-900">
                Low - Flexible timeline
              </option>
              <option value="medium" className="bg-gray-900">
                Medium - Standard timeline
              </option>
              <option value="high" className="bg-gray-900">
                High - Urgent
              </option>
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label
              htmlFor="project_description"
              className="block text-sm font-medium mb-2"
            >
              Additional Notes / Specifications
            </label>
            <textarea
              id="project_description"
              rows={4}
              {...register("project_description")} // Note: existing page made this required, user request made it optional. I'll make it optional? API createRfqSchema says message is optional. So I'll make it optional.
              className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                errors.project_description
                  ? "border-red-500"
                  : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
              placeholder="Specifications, certifications required, etc."
              disabled={isSubmitting}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Submitting..." : "Submit RFQ"}
          </button>
        </form>
      </div>
    </main>
  );
}
