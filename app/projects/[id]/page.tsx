"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatShortDate } from "@/lib/utils/formatters";
import { useParams } from "next/navigation";

interface Project {
  id: string;
  name: string;
  status: string;
  description: string;
  location: string;
  created_at: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number | string;
  unit: string;
  status: string;
}

interface RFQ {
  id: string;
  material_specs: { material_type: string };
  created_at: string;
  status: string;
  quotes: { count: number }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.['id'] as string;
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    quantity: "",
    unit: "",
    category: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    try {
      // Test Mode Check
      const token = localStorage.getItem("auth-token");
      if (token?.startsWith("test_")) {
        console.log("ProjectDetail: Test mode active");
        setProject({
          id: id,
          name: "Green Office Tower",
          status: "active",
          description: "LEED Platinum office complex renovation.",
          location: "Austin, TX",
          created_at: new Date().toISOString(),
        });
        setMaterials([
          {
            id: "mat-1",
            name: "Mass Timber Panels",
            category: "Wood",
            quantity: 500,
            unit: "panels",
            status: "planned",
          },
          {
            id: "mat-2",
            name: "Recycled Steel",
            category: "Steel",
            quantity: 20,
            unit: "tons",
            status: "rfq_sent",
          },
        ]);
        setRfqs([
          {
            id: "rfq-1",
            material_specs: { material_type: "Recycled Steel" },
            created_at: new Date().toISOString(),
            status: "open",
            quotes: [{ count: 2 }],
          },
        ]);
        setLoading(false);
        return;
      }

      // Fetch Project
      const { data: projectData, error: projError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (projError) throw projError;
      setProject(projectData);

      // Fetch Materials
      const { data: matData, error: matError } = await supabase
        .from("project_materials")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (matError) throw matError;
      setMaterials(matData || []);

      // Fetch RFQs
      const { data: rfqData, error: rfqError } = await supabase
        .from("rfqs")
        .select("*, quotes:rfq_responses(count)")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (rfqError) {
        console.warn("Error fetching RFQs:", rfqError);
      } else {
        setRfqs(rfqData || []);
      }
    } catch (err) {
      console.error("Error loading project data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("auth-token");

    if (token?.startsWith("test_")) {
      setMaterials([
        {
          id: `new-${Date.now()}`,
          name: newMaterial.name,
          category: newMaterial.category,
          quantity: newMaterial.quantity,
          unit: newMaterial.unit,
          status: "planned",
        },
        ...materials,
      ]);
      setAddingMaterial(false);
      setNewMaterial({ name: "", quantity: "", unit: "", category: "" });
      return;
    }

    try {
      const { error } = await supabase.from("project_materials").insert({
        project_id: id,
        name: newMaterial.name,
        quantity: Number(newMaterial.quantity),
        unit: newMaterial.unit,
        category: newMaterial.category,
        status: "planned",
      });

      if (error) throw error;

      setAddingMaterial(false);
      setNewMaterial({ name: "", quantity: "", unit: "", category: "" });
      loadData();
    } catch (err) {
      console.error("Failed to add material:", err);
      alert("Failed to add material");
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!project) return <div className="p-8 text-white">Project not found</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/projects"
          className="text-gray-400 hover:text-white mb-6 inline-block"
        >
          ← Back to Projects
        </Link>

        <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
            <div className="flex gap-4 text-gray-400">
              <span className="flex items-center gap-2">
                📍 {project.location}
              </span>
              <span>•</span>
              <span className="uppercase bg-teal-500/10 text-teal-400 px-2 rounded text-sm font-bold">
                {project.status}
              </span>
            </div>
            <p className="mt-4 text-gray-300 max-w-2xl">
              {project.description}
            </p>
          </div>
          <div className="flex gap-3">
            {/* Edit Project button could go here */}
          </div>
        </div>

        {/* Materials Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Project Materials</h2>
            <button
              onClick={() => setAddingMaterial(!addingMaterial)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition"
            >
              {addingMaterial ? "Cancel" : "+ Add Material"}
            </button>
          </div>

          {addingMaterial && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-6">
              <form
                onSubmit={handleAddMaterial}
                className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
              >
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                    placeholder="e.g. Steel Beams"
                    value={newMaterial.name}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    aria-label="Material Category"
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                    value={newMaterial.category}
                    onChange={(e) =>
                      setNewMaterial({
                        ...newMaterial,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="">Select...</option>
                    <option value="Lumber">Lumber</option>
                    <option value="Concrete">Concrete</option>
                    <option value="Steel">Steel</option>
                    <option value="Insulation">Insulation</option>
                    <option value="Flooring">Flooring</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Quantity
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                      placeholder="0"
                      value={newMaterial.quantity}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          quantity: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      required
                      className="w-20 bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                      placeholder="Unit"
                      value={newMaterial.unit}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, unit: e.target.value })
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded h-[42px]"
                >
                  Add
                </button>
              </form>
            </div>
          )}

          {materials.length === 0 ? (
            <div className="text-gray-500 italic">No materials listed yet.</div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {materials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium">{mat.name}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {mat.category || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {mat.quantity} {mat.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase
                          ${
                            mat.status === "planned"
                              ? "bg-gray-700 text-gray-300"
                              : ""
                          }
                          ${
                            mat.status === "rfq_sent"
                              ? "bg-blue-500/20 text-blue-400"
                              : ""
                          }
                        `}
                        >
                          {mat.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {mat.status === "planned" && (
                          <Link
                            href={`/architect/rfq/new?project_id=${
                              project.id
                            }&material_id=${mat.id}&name=${encodeURIComponent(
                              mat.name
                            )}&qty=${mat.quantity}&unit=${mat.unit}&cat=${
                              mat.category
                            }`}
                            className="text-teal-400 hover:text-teal-300 text-sm font-medium"
                          >
                            Create RFQ →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RFQs Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Project RFQs</h2>
            <Link
              href={`/architect/rfq/new?project_id=${project.id}`}
              className="text-teal-400 hover:text-teal-300 text-sm font-medium"
            >
              + Direct RFQ
            </Link>
          </div>

          {rfqs.length === 0 ? (
            <div className="text-gray-500 italic">
              No RFQs sent for this project yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {rfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`/architect/rfqs/${rfq.id}`}
                  className="block p-4 bg-white/5 border border-white/10 rounded-xl hover:border-teal-500/50 transition flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-lg">
                      {rfq.material_specs?.material_type || "Material"} Request
                    </h3>
                    <div className="text-sm text-gray-400">
                      Sent: {formatShortDate(rfq.created_at)} •{" "}
                      {rfq.quotes?.[0]?.count || 0} Quotes Received
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                        ${
                          rfq.status === "open" || rfq.status === "pending"
                            ? "bg-green-500/20 text-green-400"
                            : ""
                        }
                        ${
                          rfq.status === "closed"
                            ? "bg-gray-700 text-gray-300"
                            : ""
                        }
                      `}
                    >
                      {rfq.status}
                    </span>
                    <span className="text-gray-500">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
