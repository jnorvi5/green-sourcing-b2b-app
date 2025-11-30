/**
 * Intercom Integration
 *
 * Provides customer support chat, product tours, and user engagement
 * https://www.intercom.com/
 */

// Get Intercom App ID from environment
const INTERCOM_APP_ID = import.meta.env.VITE_INTERCOM_APP_ID || '';

/**
 * User data to pass to Intercom
 */
export interface IntercomUserData {
    user_id?: string;
    email?: string;
    name?: string;
    phone?: string;
    company?: {
        company_id: string;
        name: string;
        plan?: string;
        monthly_spend?: number;
        user_count?: number;
    };
    // Custom attributes
    user_type?: 'buyer' | 'supplier' | 'admin';
    signup_date?: number;
    products_listed?: number;
    rfqs_sent?: number;
    rfqs_received?: number;
    sustainability_score?: number;
}

/**
 * Load Intercom script and initialize
 */
export function loadIntercom(): void {
    if (!INTERCOM_APP_ID) {
        console.warn('[Intercom] No App ID configured. Set VITE_INTERCOM_APP_ID in environment.');
        return;
    }

    // Don't load twice
    if (window.Intercom) {
        return;
    }

    // Intercom script loader (from Intercom docs)
    (function () {
        const w = window as Window & { Intercom?: unknown; intercomSettings?: unknown };
        const ic = w.Intercom;
        if (typeof ic === 'function') {
            ic('reattach_activator');
            ic('update', w.intercomSettings);
        } else {
            const d = document;
            const i = function (...args: unknown[]) {
                i.c(args);
            } as { c: (args: unknown[]) => void; q: unknown[][] };
            i.q = [];
            i.c = function (args) {
                i.q.push(args);
            };
            w.Intercom = i;
            const l = function () {
                const s = d.createElement('script');
                s.type = 'text/javascript';
                s.async = true;
                s.src = `https://widget.intercom.io/widget/${INTERCOM_APP_ID}`;
                const x = d.getElementsByTagName('script')[0];
                x.parentNode?.insertBefore(s, x);
            };
            if (document.readyState === 'complete') {
                l();
            } else if (w.attachEvent) {
                (w as Window & { attachEvent: (event: string, fn: () => void) => void }).attachEvent('onload', l);
            } else {
                w.addEventListener('load', l, false);
            }
        }
    })();
}

/**
 * Boot Intercom with user data
 */
export function bootIntercom(userData?: IntercomUserData): void {
    if (!INTERCOM_APP_ID || !window.Intercom) {
        return;
    }

    window.Intercom('boot', {
        app_id: INTERCOM_APP_ID,
        ...userData,
        // Custom launcher settings
        custom_launcher_selector: '#intercom-launcher',
        hide_default_launcher: false,
        // Alignment
        alignment: 'right',
        horizontal_padding: 20,
        vertical_padding: 20,
    });
}

/**
 * Update Intercom with new user data (call after login or user changes)
 */
export function updateIntercom(userData: Partial<IntercomUserData>): void {
    if (!window.Intercom) {
        return;
    }

    window.Intercom('update', userData);
}

/**
 * Shutdown Intercom (call on logout)
 */
export function shutdownIntercom(): void {
    if (!window.Intercom) {
        return;
    }

    window.Intercom('shutdown');
}

/**
 * Show the Intercom messenger
 */
export function showIntercom(): void {
    if (!window.Intercom) {
        return;
    }

    window.Intercom('show');
}

/**
 * Hide the Intercom messenger
 */
export function hideIntercom(): void {
    if (!window.Intercom) {
        return;
    }

    window.Intercom('hide');
}

/**
 * Show Intercom with a specific message pre-filled
 */
export function showIntercomWithMessage(message: string): void {
    if (!window.Intercom) {
        return;
    }

    window.Intercom('showNewMessage', message);
}

/**
 * Track custom events in Intercom
 */
export function trackIntercomEvent(eventName: string, metadata?: Record<string, unknown>): void {
    if (!window.Intercom) {
        return;
    }

    window.Intercom('trackEvent', eventName, metadata);
}

/**
 * Start a product tour
 */
export function startIntercomTour(tourId: number): void {
    if (!window.Intercom) {
        return;
    }

    window.Intercom('startTour', tourId);
}

/**
 * Show specific Intercom article
 */
export function showIntercomArticle(articleId: number): void {
    if (!window.Intercom) {
        return;
    }

    window.Intercom('showArticle', articleId);
}

// TypeScript declaration for Intercom on window
declare global {
    interface Window {
        Intercom?: (command: string, ...args: unknown[]) => void;
        intercomSettings?: Record<string, unknown>;
        attachEvent?: (event: string, fn: () => void) => void;
    }
}
