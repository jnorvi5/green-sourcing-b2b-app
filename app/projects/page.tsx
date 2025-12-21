'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatShortDate } from "@/lib/utils/formatters";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      // Test Mode Check
      const token = localStorage.getItem("auth-token");
      if (token?.startsWith("test_")) {
        console.log("ProjectsPage: Test mode active");
        // Return mock data for test mode
        setProjects([
            {
                id: "proj-1",
                name: "Green Office Tower",
                status: "active",
                description: "LEED Platinum office complex renovation.",
                location: "Austin, TX",
                materials: [{ count: 3 }],
                rfqs: [{ count: 1 }],
                created_at: new Date().toISOString()
            }
        ]);
        setLoading(false);
        return;
      }

      console.log("ProjectsPage: Checking auth session...");
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("ProjectsPage: Auth error:", authError);
        return;
      }

      if (!user) {
        console.warn("ProjectsPage: No user found.");
        return;
      }

      console.log("ProjectsPage: User authenticated, fetching projects for:", user.id);

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          materials:project_materials(count),
          rfqs:rfqs(count)
        `)
        .eq("architect_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
         console.error("ProjectsPage: Error fetching projects:", error);
         throw error;
      }

      console.log("ProjectsPage: Projects fetched:", data);
      setProjects(data || []);
    } catch (err) {
      console.error("ProjectsPage: Unexpected error loading projects:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-gray-400">
              Manage your construction projects and material needs
            </p>
          </div>
          <Link
            href="/projects/new"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold transition flex items-center gap-2"
          >
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-xl font-medium mb-4">No projects yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first project to start tracking materials and RFQs.
            </p>
            <Link
              href="/projects/new"
              className="text-teal-400 hover:text-teal-300 underline"
            >
              Create New Project
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block p-6 bg-white/5 border border-white/10 rounded-xl hover:border-teal-500/50 transition group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold group-hover:text-teal-400 transition">
                    {project.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      project.status === 'active'
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">
                  {project.description || "No description provided."}
                </p>

                <div className="border-t border-white/10 pt-4 flex justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                     <span className="text-white font-medium">{project.materials?.[0]?.count || 0}</span> Materials
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-white font-medium">{project.rfqs?.[0]?.count || 0}</span> RFQs
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-600">
                    Location: {project.location || "N/A"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
