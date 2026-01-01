'use client';

import { useEffect } from 'react';
import { initIntercom } from '@/lib/intercom';
import { useAuth } from '@/hooks/useAuth';

// Define minimal Intercom interface for window
interface IntercomWindow extends Window {
  Intercom?: (command: string, options?: unknown) => void;
}

export default function IntercomProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as unknown as IntercomWindow;
      // Shutdown previous session before booting new one
      if (w.Intercom) {
        w.Intercom('shutdown');
      }

      const bootIntercom = () => {
        if (user) {
          initIntercom(user.id, user.email, user.full_name);
        } else {
          initIntercom();
        }
      };

      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(() => {
          bootIntercom();
        });
      } else {
        setTimeout(() => {
          bootIntercom();
        }, 5000);
      }
    }
  }, [user]);

  return <>{children}</>;
}
