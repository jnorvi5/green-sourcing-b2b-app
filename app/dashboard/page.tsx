"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardRedirect() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function redirectUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "supplier") {
        router.push("/supplier/rfqs");
      } else if (profile?.role === "architect" || profile?.role === "buyer") {
        router.push("/architect/rfqs");
      } else if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        // Fallback or setup profile
        router.push("/onboarding"); // Assuming an onboarding flow exists
      }
      setLoading(false);
    }

    redirectUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading Dashboard...
      </div>
    );
  }

  return null;
}
