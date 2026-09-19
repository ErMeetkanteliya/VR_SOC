import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPermission } from "./permissions";
import type { Permission, UserRole, AuthorizeResult } from "@vrsoc/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ServerAuthorizeOptions {
  organizationId: string;
  permission: Permission;
  supabase?: SupabaseClient;
}

export interface ServerAuthorizeSuccess extends AuthorizeResult {
  authorized: true;
  userId: string;
  organizationId: string;
  role: UserRole;
  membershipId: string;
}

export interface ServerAuthorizeFailure extends AuthorizeResult {
  authorized: false;
  error: string;
  statusCode: number;
}

export type ServerAuthorizeOutput = ServerAuthorizeSuccess | ServerAuthorizeFailure;

import {
  hasActiveDevSession,
  DEV_ADMIN_USER_ID,
  DEV_ORG_ID,
} from "@/lib/auth/dev-auth";

/**
 * Authoritative Server-Side Authorization Guard.
 * 
 * Verifies authenticated session, queries live active membership in PostgreSQL,
 * and checks if the verified role holds the requested permission within the active organization.
 */
export async function authorizePermission({
  organizationId,
  permission,
  supabase: customClient,
}: ServerAuthorizeOptions): Promise<ServerAuthorizeOutput> {
  // 0. Development-Only Session Authorization
  if (hasActiveDevSession()) {
    const role: UserRole = "Super Admin";
    const isAllowed = hasPermission(role, permission);
    if (!isAllowed) {
      return {
        authorized: false,
        statusCode: 403,
        error: `Access denied: Role '${role}' lacks permission '${permission}'.`,
      };
    }
    return {
      authorized: true,
      userId: DEV_ADMIN_USER_ID,
      organizationId: organizationId || DEV_ORG_ID,
      role,
      membershipId: "mem-dev-01",
    };
  }

  const supabase = customClient || (await createServerSupabaseClient());

  // 1. Authenticate user identity
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Authentication required to perform this action.",
    };
  }

  // 2. Query live database membership record
  const { data: membership, error: memberError } = await supabase
    .from("memberships")
    .select("id, organization_id, user_id, role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !membership) {
    return {
      authorized: false,
      statusCode: 403,
      error: "Access denied: User does not hold membership in this organization.",
    };
  }

  // 3. Verify membership is active
  if (membership.status !== "active") {
    return {
      authorized: false,
      statusCode: 403,
      error: `Access denied: Membership status is '${membership.status}'.`,
    };
  }

  const role = membership.role as UserRole;

  // 4. Verify role has the requested granular permission
  const isAllowed = hasPermission(role, permission);

  if (!isAllowed) {
    return {
      authorized: false,
      statusCode: 403,
      error: `Access denied: Role '${role}' lacks permission '${permission}'.`,
    };
  }

  return {
    authorized: true,
    userId: user.id,
    organizationId: membership.organization_id,
    role,
    membershipId: membership.id,
  };
}

/**
 * Throwing variant for Server Actions and API route guards.
 */
export async function requirePermission(
  options: ServerAuthorizeOptions
): Promise<ServerAuthorizeSuccess> {
  const result = await authorizePermission(options);

  if (!result.authorized) {
    const error = new Error(result.error);
    (error as Error & { statusCode?: number }).statusCode = result.statusCode;
    throw error;
  }

  return result;
}
