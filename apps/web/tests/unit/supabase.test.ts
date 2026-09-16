import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getClientEnv, getServerEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ClientEnvSchema, ServerEnvSchema } from "@vrsoc/validation";

describe("Supabase Foundation & Environment Isolation Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("validates client environment defaults and safe variables", () => {
    const clientEnv = getClientEnv();
    expect(clientEnv.NEXT_PUBLIC_APP_URL).toBeDefined();
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it("instantiates browser Supabase client without error", () => {
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("validates server environment and enforces service role key on admin client", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test_service_role_key_that_is_at_least_twenty_chars_long";
    const serverEnv = getServerEnv();
    expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBe("test_service_role_key_that_is_at_least_twenty_chars_long");

    const adminClient = createAdminSupabaseClient();
    expect(adminClient).toBeDefined();
    expect(adminClient.auth).toBeDefined();
  });

  it("throws error when admin client is created without service role key", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => createAdminSupabaseClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY is required/);
  });

  it("rejects invalid Supabase URLs in Zod validation schema", () => {
    const invalidResult = ClientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "short",
    });
    expect(invalidResult.success).toBe(false);

    const validServerResult = ServerEnvSchema.safeParse({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_NAME: "VRSOC",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "valid_anon_key_for_testing_purposes",
      SUPABASE_SERVICE_ROLE_KEY: "valid_service_role_key_for_testing_purposes",
    });
    expect(validServerResult.success).toBe(true);
  });
});
