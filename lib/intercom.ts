// Intercom integration for customer support and engagement

export function initIntercom() {
  if (typeof window === 'undefined') return;
  
  const appId = process.env['NEXT_PUBLIC_INTERCOM_APP_ID'];
  if (!appId) {
    console.warn('Intercom app ID not configured');
    return;
  }

  (window as any).intercomSettings = {
    app_id: appId,
    api_base: 'https://api-iam.intercom.io'
  };

  const w = window as any;
  const ic = w.Intercom;
  if (typeof ic === 'function') {
    ic('reattach_activator');
    ic('update', w.intercomSettings);
  } else {
    const d = document;
    const i: any = function () {
      i.c(arguments);
    };
    i.q = [];
    i.c = function (args: any) {
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
  if (typeof window === 'undefined' || !(window as any).Intercom) return;

  (window as any).Intercom('update', {
    email: user.email,
    name: user.name,
    user_id: user.userId,
    user_type: user.userType,
    company: { name: user.company }
  });
}

export function shutdownIntercom() {
  if (typeof window === 'undefined' || !(window as any).Intercom) return;
  (window as any).Intercom('shutdown');
}

export function showIntercom() {
  if (typeof window === 'undefined' || !(window as any).Intercom) return;
  (window as any).Intercom('show');
}
