// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  beforeSend(event, hint) {
    // Filter out localhost errors (development environment)
    if (process.env.NODE_ENV === 'development') {
        return null;
    }

    const error = hint.originalException as any;

    // Supabase error integration
    // Stricter check: must have code AND (details OR hint)
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
  }
});
