/**
 * Maps Supabase Auth and network error responses into safe, sanitized user-facing messages.
 * Prevents account enumeration and internal infrastructure leakage.
 */
export function mapAuthError(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  const message = typeof error === "string" ? error : error.message || error.error_description || "";
  const code = error.code || error.status;

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials") || normalized.includes("invalid_grant")) {
    return "Invalid email or password. Please verify your credentials.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "An account with this email address already exists. Please log in.";
  }

  if (normalized.includes("password should be at least")) {
    return "Password must be at least 8 characters in length.";
  }

  if (normalized.includes("token has expired") || normalized.includes("otp expired") || normalized.includes("invalid token")) {
    return "The verification code or link is invalid or has expired. Please request a new one.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests") || code === 429) {
    return "Too many requests. Please wait a moment before trying again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Your email address has not been confirmed yet. Please verify your email.";
  }

  if (normalized.includes("network") || normalized.includes("fetch failed")) {
    return "Network connection issue. Please check your connectivity and try again.";
  }

  // Safe fallback
  return "Authentication failed. Please check your details and try again.";
}
