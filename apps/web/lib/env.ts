import { ClientEnvSchema, ServerEnvSchema, type ClientEnv, type ServerEnv } from "@vrsoc/validation";

/**
 * Validates and returns client-safe environment variables (browser-accessible).
 */
export function getClientEnv(): ClientEnv {
  const parsed = ClientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "VRSOC — Cyber Defense Training",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_development",
  });

  if (!parsed.success) {
    console.error("Invalid client environment configuration:", parsed.error.format());
    throw new Error("Invalid client environment configuration");
  }

  return parsed.data;
}

/**
 * Validates and returns server-only environment variables.
 * MUST NEVER be called from browser/client components.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
    throw new Error("getServerEnv() must NEVER be called in the browser!");
  }

  const clientEnv = getClientEnv();
  const parsed = ServerEnvSchema.safeParse({
    ...clientEnv,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    VIRUSTOTAL_API_KEY: process.env.VIRUSTOTAL_API_KEY,
    ABUSEIPDB_API_KEY: process.env.ABUSEIPDB_API_KEY,
    SHODAN_API_KEY: process.env.SHODAN_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  });

  if (!parsed.success) {
    console.error("Invalid server environment configuration:", parsed.error.format());
    throw new Error("Invalid server environment configuration");
  }

  return parsed.data;
}
