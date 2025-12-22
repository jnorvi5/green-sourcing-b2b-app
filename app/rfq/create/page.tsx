"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRFQ() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    project_name: "",
    materials: "",
    budget: "",
    timeline: "",
    job_site_location: "",
    material_weight_tons: "1",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create RFQ
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: formData.project_name,
          project_location: formData.job_site_location,
          material_specs: {
            material_type: "other", // Default or derived from input
            quantity: parseFloat(formData.material_weight_tons),
          },
          budget_range: `$${formData.budget}`,
          message: `Materials: ${formData.materials}. Timeline: ${formData.timeline}`,
          // Extensions for integrated system
          job_site_location: formData.job_site_location,
          material_weight_tons: parseFloat(formData.material_weight_tons),
          materials: formData.materials.split(",").map((m) => m.trim()),
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/rfq/${data.rfq_id}/suppliers`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create RFQ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-xl rounded-2xl my-10 border border-gray-100">
      <h1 className="text-4xl font-black mb-2 text-gray-900">Create RFQ</h1>
      <p className="text-gray-500 mb-8">
        Get AI-matched with verified sustainable suppliers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">
            Project Name
          </label>
          <input
            type="text"
            placeholder="Crystal Heights Tower"
            value={formData.project_name}
            onChange={(e) =>
              setFormData({ ...formData, project_name: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
            Materials (comma-separated)
          </label>
          <input
            type="text"
            placeholder="Low-carbon Concrete, Recycled Steel"
            value={formData.materials}
            onChange={(e) =>
              setFormData({ ...formData, materials: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
              Budget ($)
            </label>
            <input
              type="number"
              placeholder="50000"
              value={formData.budget}
              onChange={(e) =>
                setFormData({ ...formData, budget: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
              Timeline
            </label>
            <input
              type="text"
              placeholder="Q3 2025"
              value={formData.timeline}
              onChange={(e) =>
                setFormData({ ...formData, timeline: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
            Job Site Location
          </label>
          <input
            type="text"
            placeholder="San Francisco, CA"
            value={formData.job_site_location}
            onChange={(e) =>
              setFormData({ ...formData, job_site_location: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
            Est. Material Weight (tons)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.material_weight_tons}
            onChange={(e) =>
              setFormData({ ...formData, material_weight_tons: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-green-600 text-white font-black text-lg rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition disabled:bg-gray-400 disabled:translate-y-0"
        >
          {loading ? "Processing..." : "Find Sustainable Suppliers →"}
        </button>
      </form>
    </div>
  );
}
