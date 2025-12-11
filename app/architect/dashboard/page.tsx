'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 1. Inner component that uses searchParams
function DashboardContent() {
  const searchParams = useSearchParams();
  // Logic using searchParams goes here
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Architect Dashboard</h1>
      {/* Your existing dashboard JSX */}
    </div>
  );
}

// 2. Default export wrapped in Suspense to satisfy Next.js build
export default function ArchitectDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 1. Inner component that uses searchParams
function DashboardContent() {
  const searchParams = useSearchParams();
  // Logic using searchParams goes here
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Architect Dashboard</h1>
      {/* Your existing dashboard JSX */}
    </div>
  );
}

// 2. Default export wrapped in Suspense to satisfy Next.js build
export default function ArchitectDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
