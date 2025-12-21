"use client";

import { Suspense } from 'react';
import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 p-12 opacity-5">
        <div className="w-96 h-96 rounded-full bg-primary blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 right-0 p-12 opacity-5">
        <div className="w-96 h-96 rounded-full bg-emerald-600 blur-3xl"></div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
