// app/signup/page.tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const SignupForm = dynamic(() => import('@/components/SignupForm'), {
  loading: () => <div className="animate-pulse">Loading...</div>,
  ssr: false,
});

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
