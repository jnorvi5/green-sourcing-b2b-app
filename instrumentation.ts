import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env['NEXT_RUNTIME'] === "nodejs") {
    Sentry.init({
      dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1, // ✅ ONE instance only
    });
  }
}
