// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Configure error filtering
  beforeSend(event, hint) {
    // Filter out localhost errors
    if (typeof window !== 'undefined' &&
       (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')) {
      return null;
    }

    // Filter out known non-critical errors
    const error = hint.originalException as any;
    
    // Ignore hydration errors (common in development)
    if (error?.message?.includes('Hydration')) {
      return null;
    }
    
    // Ignore network errors from ad blockers
    if (error?.message?.includes('Failed to fetch')) {
      return null;
    }

    // Supabase error integration
    // Check for common Supabase/Postgrest error properties
    // Stricter check: must have code AND (details OR hint)
    // We avoid checking message as generic errors have it
    if (error && typeof error === 'object') {
      if (error.code && (error.details || error.hint)) {
        event.tags = {
          ...event.tags,
          'supabase.error_code': error.code,
          'db.system': 'supabase'
        };
        event.extra = {
          ...event.extra,
          'supabase.details': error.details,
          'supabase.hint': error.hint,
          'supabase.message': error.message
        };
      }
    }
    
    return event;
  },

  // Add environment and release info
  environment: process.env['NEXT_PUBLIC_VERCEL_ENV'] || 'development',
  release: process.env['NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA'],
});
