import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'];

// Don't throw at module load time - let the createClient function handle missing vars
// This prevents build-time crashes when env vars aren't available

export const createClient = (request: NextRequest) => {
    // Check at runtime instead of module load time to prevent build crashes
    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Missing Supabase environment variables in middleware. Skipping auth refresh.');
        // Return a passthrough response without Supabase client
        const response = NextResponse.next({
            request: { headers: request.headers },
        });
        // Create a minimal mock supabase client that won't crash
        // Note: Only getUser is mocked since that's all the middleware calls.
        // If additional methods are needed, they must be added here.
        const mockSupabase = {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
            },
        };
        return { response, supabase: mockSupabase as unknown as ReturnType<typeof createServerClient> };
    }

    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options?: unknown }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        supabaseResponse.cookies.set(name, value, options as any)
                    )
                },
            },
        },
    );

    return { response: supabaseResponse, supabase };
};
