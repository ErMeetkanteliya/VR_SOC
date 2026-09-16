import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Creates a privileged Supabase admin client using the service-role secret.
 * 
 * CRITICAL SECURITY INVARIANTS:
 * 1. This client MUST NEVER be imported or invoked in client-side code.
 * 2. It bypasses PostgreSQL Row Level Security (RLS).
 * 3. It is strictly reserved for server-side administrative tasks (e.g. Edge Functions,
 *    system seeding, or trusted background tasks).
 */
export function createAdminSupabaseClient() {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
    throw new Error("createAdminSupabaseClient() must NEVER be called in the browser!");
  }

  const env = getServerEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin Supabase client.");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
