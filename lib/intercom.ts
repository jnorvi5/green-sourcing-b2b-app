// Intercom integration for customer support and engagement

interface IntercomSettings {
  app_id: string;
  api_base: string;
}

interface IntercomQueue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c: (args: any) => void;
}

interface WindowWithIntercom extends Window {
  Intercom?: ((command: string, ...args: unknown[]) => void) & IntercomQueue;
  intercomSettings?: IntercomSettings;
  attachEvent?: (event: string, callback: () => void) => void;
}

export function initIntercom() {
  if (typeof window === 'undefined') return;
  
  const appId = process.env['NEXT_PUBLIC_INTERCOM_APP_ID'];
  if (!appId) {
    console.warn('Intercom app ID not configured');
    return;
  }

  const w = window as WindowWithIntercom;
  w.intercomSettings = {
    app_id: appId,
    api_base: 'https://api-iam.intercom.io'
  };

  const ic = w.Intercom;
  if (typeof ic === 'function') {
    ic('reattach_activator');
    ic('update', w.intercomSettings);
  } else {
    const d = document;
    const i = function (...args: unknown[]) {
      i.c(args);
    } as ((command: string, ...args: unknown[]) => void) & IntercomQueue;
    i.q = [];
    i.c = function (args: unknown) {
      i.q.push(args);
    };
    w.Intercom = i;
    const l = function () {
      const s = d.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.src = `https://widget.intercom.io/widget/${appId}`;
      const x = d.getElementsByTagName('script')[0];
      x.parentNode?.insertBefore(s, x);
    };
    if (document.readyState === 'complete') {
      l();
    } else if (w.attachEvent) {
      w.attachEvent('onload', l);
    } else {
      w.addEventListener('load', l, false);
    }
  }
}

export function updateIntercomUser(user: {
  email?: string;
  name?: string;
  userId?: string;
  userType?: 'buyer' | 'supplier' | 'admin';
  company?: string;
}) {
  if (typeof window === 'undefined') return;
  const w = window as WindowWithIntercom;
  if (!w.Intercom) return;

  w.Intercom('update', {
    email: user.email,
    name: user.name,
    user_id: user.userId,
    user_type: user.userType,
    company: { name: user.company }
  });
}

export function shutdownIntercom() {
  if (typeof window === 'undefined') return;
  const w = window as WindowWithIntercom;
  if (!w.Intercom) return;
  w.Intercom('shutdown');
}

export function showIntercom() {
  if (typeof window === 'undefined') return;
  const w = window as WindowWithIntercom;
  if (!w.Intercom) return;
  w.Intercom('show');
}
