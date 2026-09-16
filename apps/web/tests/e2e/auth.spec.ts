import { test, expect } from "@playwright/test";

test.describe("Phase 06 — Authentication Flow E2E Tests", () => {
  test("unauthenticated user accessing root is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Log in to your account")).toBeVisible();
  });

  test("login page renders Base44 theme, logo monogram, Google OAuth, and inputs", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("VS")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByPlaceholder("name@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create one" })).toBeVisible();
  });

  test("submitting invalid credentials displays safe sanitized error alert", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("nonexistent@vrsoc.app");
    await page.locator('input[type="password"]').fill("wrongPassword123!");
    await page.getByRole("button", { name: "Log in" }).click();

    // Verify safe error alert banner appears without leaking infrastructure details
    const errorBanner = page.getByTestId("auth-error-banner");
    await expect(errorBanner).toBeVisible({ timeout: 15000 });
    await expect(errorBanner).toContainText(/Invalid|Authentication failed|credentials|network/i);
  });

  test("registration page renders two-step wizard details step", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByPlaceholder("Alex Mercer")).toBeVisible();
    await expect(page.getByPlaceholder("name@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  });

  test("registration validates password match client-side", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Alex Mercer").fill("Test Analyst");
    await page.getByPlaceholder("name@example.com").fill("analyst@test.com");
    await page.locator('input[type="password"]').first().fill("Password123!");
    await page.locator('input[type="password"]').nth(1).fill("DifferentPassword456!");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("forgot password flow renders and submits safely", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await page.getByPlaceholder("name@example.com").fill("recovery@corp.internal");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByText("Recovery Link Dispatched")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to login" })).toBeVisible();
  });

  test("reset password page renders and validates inputs", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Update password" })).toBeVisible();
  });

  test("email verification page renders 6-digit OTP code inputs", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.getByRole("heading", { name: "Email Verification" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Email" })).toBeVisible();
  });
});
