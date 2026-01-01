export async function createRFQConversation(
  rfqId: string,
  architectId: string,
  supplierId: string,
  rfqDetails: any
  rfqDetails: Record<string, unknown>
) {
  const token = process.env['INTERCOM_ACCESS_TOKEN'];

  if (!token) {
    console.error('Missing Intercom Access Token');
    return { id: `mock_conv_${Date.now()}` };
  }

  try {
    const res = await fetch('https://api.intercom.io/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { type: 'user', id: architectId },
        body: `RFQ Discussion\nMaterials: ${rfqDetails.materials?.join(', ')}\nBudget: $${rfqDetails.budget}\nTimeline: ${rfqDetails.timeline}`,
        custom_attributes: {
          rfq_id: rfqId,
          architect_id: architectId,
          supplier_id: supplierId,
        },
      }),
    })

    return await res.json()
  } catch (error) {
    console.error('Intercom API error:', error);
    return { id: `error_conv_${Date.now()}` };
  }

  try {
    const res = await fetch('https://api.intercom.io/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { type: 'user', id: architectId },
        body: `RFQ Discussion\nMaterials: ${(rfqDetails['materials'] as string[])?.join(', ')}\nBudget: $${rfqDetails['budget']}\nTimeline: ${rfqDetails['timeline']}`,
        custom_attributes: {
          rfq_id: rfqId,
          architect_id: architectId,
          supplier_id: supplierId,
        },
      }),
    })

    return await res.json()
  } catch (error) {
    console.error('Intercom API error:', error);
    return { id: `error_conv_${Date.now()}` };
  }
}

interface IntercomWindow extends Window {
  Intercom: ((...args: unknown[]) => void) & {
    q?: unknown[];
    c?: (args: unknown) => void;
  };
  intercomSettings?: Record<string, unknown>;
}

export function initIntercom(userId?: string, email?: string, name?: string) {
  const APP_ID = process.env['NEXT_PUBLIC_INTERCOM_APP_ID'] || 'cqtm1euj';

  if (!APP_ID) {
    console.warn('Intercom init skipped: Missing NEXT_PUBLIC_INTERCOM_APP_ID');
    return;
  }

  // Check for existing Intercom instance
  const existingWindow = window as unknown as IntercomWindow;
  if (typeof existingWindow !== 'undefined' && existingWindow.Intercom) {
    if (userId) {
       existingWindow.Intercom('boot', {
         app_id: APP_ID,
         user_id: userId,
         email: email,
         name: name,
       });
    } else {
       existingWindow.Intercom('boot', {
         app_id: APP_ID,
       });
    }
    return;
  }

export function initIntercom(_userId: string, _email: string, _name: string) {
  // Logic for initializing Intercom client-side if needed
  // This is a placeholder for requirements in components
  if (typeof window === 'undefined') return;

  // Inject script cleanly
  const d = document;
  const s = d.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = 'https://widget.intercom.io/widget/' + APP_ID;
  const x = d.getElementsByTagName('script')[0];
  if (x && x.parentNode) {
    x.parentNode.insertBefore(s, x);
  }

  // Initialize placeholder
  const w = window;
  const i = function (...args: unknown[]) {
    i.c?.(args);
  };
  i.q = [] as unknown[];
  i.c = function (args: unknown) {
    i.q?.push(args);
  };
  w.Intercom = i;

  // Initial boot
  if (userId) {
     w.Intercom('boot', {
       app_id: APP_ID,
       user_id: userId,
       email: email,
       name: name,
     });
  } else {
     w.Intercom('boot', {
       app_id: APP_ID,
     });
  }
}
