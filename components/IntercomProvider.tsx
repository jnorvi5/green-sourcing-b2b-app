'use client';

import { useEffect } from 'react';
import { initIntercom } from '@/lib/intercom';

export default function IntercomProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(() => {
          initIntercom();
        });
      } else {
        setTimeout(() => {
          initIntercom();
        }, 5000);
      }
    }
  }, []);

  return <>{children}</>;
}
