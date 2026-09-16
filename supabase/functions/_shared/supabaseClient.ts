import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

/**
 * Creates an authenticated Supabase client for Edge Functions using the request's Authorization header.
 */
export function createEdgeUserClient(req: Request) {
  const authHeader = req.headers.get("Authorization");
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader ?? "" },
      },
    }
  );
}

/**
 * Creates a privileged service-role Supabase client for Edge Functions.
 * Reserved strictly for trusted background orchestration.
 */
export function createEdgeAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}
