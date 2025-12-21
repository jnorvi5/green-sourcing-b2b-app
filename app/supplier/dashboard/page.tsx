"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { DashboardErrorBoundary } from "@/components/DashboardErrorBoundary";
import { DashboardLoadingSkeleton } from "@/components/DashboardLoadingSkeleton";
import { SupplierDashboard } from "@/components/SupplierDashboard";

export default function SupplierDashboardPage() {
  return (
    <DashboardErrorBoundary onReset={() => window.location.reload()}>
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <SupplierDashboard />
      </Suspense>
    </DashboardErrorBoundary>
  );
}
