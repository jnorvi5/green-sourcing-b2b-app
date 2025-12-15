'use client';

'use client';

import { useEffect } from 'react';
import { initIntercom } from '@/lib/intercom';

export default function IntercomProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initIntercom();
  }, []);

  return <>{children}</>;
}
