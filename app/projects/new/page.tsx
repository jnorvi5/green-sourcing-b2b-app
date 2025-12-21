'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ProjectFormData {
  name: string;
  description: string;
  location: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>();

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("You must be logged in.");
        return;
      }

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          architect_id: user.id,
          name: data.name,
          description: data.description,
          location: data.location,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      setErrorMessage(error.message || "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/projects"
          className="text-gray-400 hover:text-white mb-6 inline-block"
        >
          ← Back to Projects
        </Link>

        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-gray-400 mb-8">
          Set up a new workspace for your construction project
        </p>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register("name", {
                required: "Project Name is required",
                minLength: { value: 3, message: "Minimum 3 characters" },
              })}
              className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                errors.name ? "border-red-500" : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
              placeholder="e.g., Downtown Office Complex"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-2">
              Location <span className="text-red-400">*</span>
            </label>
            <input
              id="location"
              type="text"
              {...register("location", { required: "Location is required" })}
              className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                errors.location ? "border-red-500" : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition`}
              placeholder="e.g., Seattle, WA"
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-400">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register("description")}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="Brief overview of the project scope and requirements..."
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
            >
              {isSubmitting ? "Creating Project..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
