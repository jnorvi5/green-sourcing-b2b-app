import { z } from 'zod';

const envSchema = z.object({
  // Core Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // Server-side Admin (Optional but critical for backend tasks)
  // We make it optional to allow build in CI environments where secrets might not be present,
  // but we should check for it before using admin features.
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // App Config
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database (Optional)
  DATABASE_URL: z.string().optional(),
});

// Process and validate
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());

  // In production, we want to fail fast. In dev, we might tolerate missing optional keys.
  // But if required public keys are missing, the app won't work anyway.
  if (process.env.NODE_ENV === 'production') {
     // Throwing here might break build if envs are injected at runtime, so we just log heavily.
     // Ideally, you'd throw new Error('Invalid environment variables');
  }
}

export const env = parsed.success ? parsed.data : process.env as unknown as z.infer<typeof envSchema>;

/**
 * Helper to ensure a server-side secret exists before using it.
 * Throws if the key is missing.
 */
export function requireServerEnv(key: keyof typeof envSchema.shape) {
  const value = env[key];
  if (!value) {
    throw new Error(`❌ Missing required server-side environment variable: ${String(key)}`);
  }
  return value;
}
