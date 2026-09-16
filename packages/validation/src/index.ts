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

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
