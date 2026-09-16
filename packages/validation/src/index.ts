import { z } from "zod";

export const UserRoleSchema = z.enum([
  "Super Admin",
  "Instructor",
  "Student",
  "SOC Analyst",
  "Incident Responder",
  "Threat Hunter",
  "Auditor",
  "Viewer",
]);

export const SeverityLevelSchema = z.enum([
  "Critical",
  "High",
  "Medium",
  "Low",
  "Informational",
]);

export const AlertStatusSchema = z.enum([
  "Open",
  "Acknowledged",
  "In Progress",
  "Escalated",
  "Closed",
  "False Positive",
]);

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().length(6, "OTP code must be 6 digits"),
  type: z.enum(["signup", "recovery", "email", "magiclink"]).default("signup"),
});

export const HostIsolationSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID format"),
  reason: z.string().min(5, "Isolation reason must be at least 5 characters"),
});

export const DeclareIncidentSchema = z.object({
  title: z.string().min(3, "Incident title must be at least 3 characters"),
  severity: SeverityLevelSchema,
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  leadResponderId: z.string().uuid().optional(),
  affectedAssetIds: z.array(z.string().uuid()).min(1, "Select at least one affected asset"),
});

// Environment variable validation schemas
export const ClientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("VRSOC — Cyber Defense Training"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Valid Supabase URL required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "Valid Supabase anon key required"),
});

export const ServerEnvSchema = ClientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "Valid Supabase service role key required").optional(),
  VIRUSTOTAL_API_KEY: z.string().optional(),
  ABUSEIPDB_API_KEY: z.string().optional(),
  SHODAN_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type ClientEnv = z.infer<typeof ClientEnvSchema>;
export type ServerEnv = z.infer<typeof ServerEnvSchema>;
