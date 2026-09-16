import { test, expect } from "@playwright/test";

test.describe("Phase 07 — Multi-Tenancy E2E Tests", () => {
  test("dashboard renders multi-tenant status and active organization context", async ({ page }) => {
    await page.goto("/design-system");

    // Verify multi-tenant badges and layout
    await expect(page.getByText("Multi-Tenant Enabled")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cyber Defense Academy" })).toBeVisible();
  });

  test("organization switcher dropdown opens, lists organizations, and opens creation modal", async ({ page }) => {
    await page.goto("/design-system");

    // Click org switcher trigger
    const orgTrigger = page.getByRole("button", { name: "Cyber Defense Academy" });
    await expect(orgTrigger).toBeVisible();
    await orgTrigger.click();

    // Verify dropdown items
    await expect(page.getByText("FinTech Global SOC")).toBeVisible();
    await expect(page.getByText("Create Organization")).toBeVisible();

    // Click Create Organization button to open modal
    await page.getByRole("button", { name: /Create Organization/i }).click();

    // Verify modal elements
    await expect(page.getByRole("heading", { name: "Create New Organization" })).toBeVisible();
    await expect(page.getByText("Organization Name")).toBeVisible();
    await expect(page.getByText("Workspace URL Slug")).toBeVisible();
  });
});


