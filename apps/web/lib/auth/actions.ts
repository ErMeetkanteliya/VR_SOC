"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyOtpSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyOtpInput,
} from "@vrsoc/validation";
import { mapAuthError } from "./errors";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Executes an async action with an upper timeout boundary (3.5s) to guarantee snappy responses.
 */
async function withTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("network timeout")), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Log in with email and password
 */
export async function loginAction(input: LoginInput): Promise<AuthActionResult> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input data",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      })
    );

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      data: { user: data.user },
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Register a new user with email, full name, and password
 */
export async function registerAction(input: RegisterInput): Promise<AuthActionResult> {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input data",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.fullName,
          },
        },
      })
    );

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Verify 6-digit OTP code for email confirmation or recovery
 */
export async function verifyOtpAction(input: VerifyOtpInput): Promise<AuthActionResult> {
  const parsed = VerifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid OTP data",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await withTimeout(
      supabase.auth.verifyOtp({
        email: parsed.data.email,
        token: parsed.data.token,
        type: parsed.data.type as any,
      })
    );

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      data: { user: data.user, session: data.session },
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Resend email confirmation or recovery code
 */
export async function resendOtpAction(email: string, type: "signup" | "email_change" = "signup"): Promise<AuthActionResult> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email address required" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await withTimeout(
      supabase.auth.resend({
        type,
        email,
      })
    );

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Initiate password recovery dispatch
 */
export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<AuthActionResult> {
  const parsed = ForgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid email address",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await withTimeout(
      supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      })
    );

    return {
      success: true,
    };
  } catch {
    // Return success to prevent enumeration even on network edge failure
    return {
      success: true,
    };
  }
}

/**
 * Complete password reset with new password
 */
export async function resetPasswordAction(input: ResetPasswordInput): Promise<AuthActionResult> {
  const parsed = ResetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid password format",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await withTimeout(
      supabase.auth.updateUser({
        password: parsed.data.password,
      })
    );

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      data: { user: data.user },
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Log out and clear session cookies
 */
export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Silent catch on network signout
  }
  redirect("/login");
}
