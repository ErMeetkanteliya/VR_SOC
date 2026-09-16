import { describe, it, expect } from "vitest";
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyOtpSchema,
} from "@vrsoc/validation";
import { mapAuthError } from "@/lib/auth/errors";

describe("Phase 06 — Authentication Validation & Security Tests", () => {
  describe("LoginSchema Validation", () => {
    it("validates correct login credentials", () => {
      const result = LoginSchema.safeParse({
        email: "analyst@vrsoc.app",
        password: "securePassword123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email formats", () => {
      const result = LoginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.errors[0]?.message).toContain("Invalid email address");
      }
    });

    it("rejects short passwords under 8 characters", () => {
      const result = LoginSchema.safeParse({
        email: "analyst@vrsoc.app",
        password: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.errors[0]?.message).toContain("at least 8 characters");
      }
    });
  });

  describe("RegisterSchema Validation", () => {
    it("validates matching passwords and valid full name", () => {
      const result = RegisterSchema.safeParse({
        fullName: "Alex Mercer",
        email: "alex@vrsoc.app",
        password: "SuperSecretPassword123",
        confirmPassword: "SuperSecretPassword123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched confirm passwords", () => {
      const result = RegisterSchema.safeParse({
        fullName: "Alex Mercer",
        email: "alex@vrsoc.app",
        password: "Password123",
        confirmPassword: "DifferentPassword456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.errors[0]?.message).toBe("Passwords do not match");
      }
    });
  });

  describe("ForgotPasswordSchema & ResetPasswordSchema", () => {
    it("validates forgot password email", () => {
      expect(ForgotPasswordSchema.safeParse({ email: "user@corp.internal" }).success).toBe(true);
      expect(ForgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false);
    });

    it("validates reset password confirmation match", () => {
      expect(
        ResetPasswordSchema.safeParse({
          password: "newPassword2026!",
          confirmPassword: "newPassword2026!",
        }).success
      ).toBe(true);

      expect(
        ResetPasswordSchema.safeParse({
          password: "newPassword2026!",
          confirmPassword: "mismatchPassword!",
        }).success
      ).toBe(false);
    });
  });

  describe("VerifyOtpSchema", () => {
    it("accepts exact 6-digit tokens", () => {
      const result = VerifyOtpSchema.safeParse({
        email: "analyst@vrsoc.app",
        token: "123456",
        type: "signup",
      });
      expect(result.success).toBe(true);
    });

    it("rejects tokens that are not 6 digits", () => {
      const result = VerifyOtpSchema.safeParse({
        email: "analyst@vrsoc.app",
        token: "123",
        type: "signup",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Safe Auth Error Mapping & Enumeration Prevention", () => {
    it("sanitizes invalid login credentials without leaking account existence", () => {
      const msg = mapAuthError({ message: "Invalid login credentials" });
      expect(msg).toBe("Invalid email or password. Please verify your credentials.");
    });

    it("handles rate limits safely", () => {
      const msg = mapAuthError({ message: "over_email_send_rate_limit", status: 429 });
      expect(msg).toBe("Too many requests. Please wait a moment before trying again.");
    });

    it("sanitizes expired OTP tokens", () => {
      const msg = mapAuthError({ message: "Token has expired or is invalid" });
      expect(msg).toBe("The verification code or link is invalid or has expired. Please request a new one.");
    });

    it("falls back to generic message on unknown internal errors", () => {
      const msg = mapAuthError({ message: "Postgres connection pool exhausted at 10.0.1.4:5432" });
      expect(msg).toBe("Authentication failed. Please check your details and try again.");
      expect(msg).not.toContain("Postgres");
      expect(msg).not.toContain("10.0.1.4");
    });
  });
});
