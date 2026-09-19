import { cookies } from "next/headers";
import type { Organization, Membership, UserRole } from "@vrsoc/types";

export const DEV_SESSION_COOKIE = "vrsoc_dev_session";
export const DEV_ACTIVE_ORG_COOKIE = "vrsoc_active_org";
export const DEV_ADMIN_DEFAULT_EMAIL = "dev-admin@vrsoc.local";
export const DEV_ADMIN_USER_ID = "usr-dev-superadmin-01";
export const DEV_ORG_ID = "org-cyber-defense-academy";
export const DEV_ORG_NAME = "Cyber Defense Academy";
export const DEV_ORG_SLUG = "cyber-defense-academy";

export const DEV_ADMIN_DEFAULT_PASSWORD = "VRSOC_DevAdmin_2026_Secure!";

/**
 * Evaluates whether development-only authentication is permitted.
 * 
 * SECURITY INVARIANT:
 * This path is STRICTLY prohibited when NODE_ENV === "production".
 */
export function isDevAuthAllowed(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const email = process.env.DEV_ADMIN_EMAIL;
  const password = process.env.DEV_ADMIN_PASSWORD;
  if (!email || !password) {
    return false;
  }
  return true;
}

/**
 * Validates development credentials on the server.
 * 
 * Returns true if and only if:
 * 1. NODE_ENV !== "production"
 * 2. The provided email matches DEV_ADMIN_EMAIL (case-insensitive)
 * 3. The provided password matches DEV_ADMIN_PASSWORD exactly
 */
export function validateDevCredentials(email: string, password: string): boolean {
  if (!isDevAuthAllowed()) {
    return false;
  }

  const configuredEmail = (process.env.DEV_ADMIN_EMAIL || "").trim().toLowerCase();
  const configuredPassword = process.env.DEV_ADMIN_PASSWORD || "";

  const inputEmail = email.trim().toLowerCase();
  if (inputEmail !== configuredEmail) {
    return false;
  }

  // Exact password comparison
  return password === configuredPassword;
}

/**
 * Returns the deterministic Super Admin user identity for the development account.
 */
export function getDevAdminUser() {
  const email = process.env.DEV_ADMIN_EMAIL || DEV_ADMIN_DEFAULT_EMAIL;
  return {
    id: DEV_ADMIN_USER_ID,
    email,
    user_metadata: {
      full_name: "VRSOC Dev SuperAdmin",
      role: "Super Admin" as UserRole,
    },
    app_metadata: {
      role: "Super Admin" as UserRole,
      provider: "dev_auth",
    },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: new Date().toISOString(),
  };
}

/**
 * Returns the deterministic development organization context.
 */
export function getDevAdminOrganization(): Organization {
  return {
    id: DEV_ORG_ID,
    name: DEV_ORG_NAME,
    slug: DEV_ORG_SLUG,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: new Date().toISOString(),
  };
}

/**
 * Returns deterministic development memberships including Super Admin role.
 */
export function getDevAdminMemberships(): Membership[] {
  const org = getDevAdminOrganization();
  return [
    {
      id: "mem-dev-01",
      organization_id: org.id,
      user_id: DEV_ADMIN_USER_ID,
      role: "Super Admin" as UserRole,
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: new Date().toISOString(),
      organization: org,
      profile: {
        id: DEV_ADMIN_USER_ID,
        email: process.env.DEV_ADMIN_EMAIL || DEV_ADMIN_DEFAULT_EMAIL,
        full_name: "VRSOC Dev SuperAdmin",
        avatar_url: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    } as unknown as Membership,
    {
      id: "mem-dev-02",
      organization_id: "org-fintech-global",
      user_id: DEV_ADMIN_USER_ID,
      role: "SOC Analyst" as UserRole,
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: new Date().toISOString(),
      organization: {
        id: "org-fintech-global",
        name: "FinTech Global SOC",
        slug: "fintech-global-soc",
        status: "active",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: new Date().toISOString(),
      },
      profile: {
        id: DEV_ADMIN_USER_ID,
        email: process.env.DEV_ADMIN_EMAIL || DEV_ADMIN_DEFAULT_EMAIL,
        full_name: "VRSOC Dev SuperAdmin",
        avatar_url: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    } as unknown as Membership,
  ];
}

/**
 * Checks if the request contains an active development session cookie.
 * In production (NODE_ENV === "production"), this always returns false.
 */
export function hasActiveDevSession(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  try {
    const cookieStore = cookies();
    const val = cookieStore.get(DEV_SESSION_COOKIE)?.value;
    return Boolean(val && val.length > 0);
  } catch {
    return false;
  }
}
