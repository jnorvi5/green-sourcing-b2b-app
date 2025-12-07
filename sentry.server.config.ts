// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
<<<<<<< HEAD
  dsn: "https://7eaf7cc60234118db714b516e9228e49@o4510491318484992.ingest.us.sentry.io/4510491318681600",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
=======
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Add environment and release info
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Configure error filtering
  beforeSend(event, hint) {
    const error = hint.originalException as Error;
    
    // Filter out expected errors
    if (error?.message?.includes('ECONNREFUSED')) {
      return null;
    }
    
    return event;
  },
>>>>>>> e9b837ba7d63025b9d5266db0e2ea10ec0565f47
});
