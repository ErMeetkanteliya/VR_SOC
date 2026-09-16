import { test, expect } from "@playwright/test";

test.describe("Phase 08 — Role-Based Access Control (RBAC) E2E Tests", () => {
  test("renders RBAC management trigger and modal with member roles", async ({ page }) => {
    await page.goto("/design-system");

    // Locate and click 'Manage Roles' button
    const manageRolesBtn = page.getByRole("button", { name: /Manage Roles/i });
    await expect(manageRolesBtn).toBeVisible();
    await manageRolesBtn.click();

    // Verify modal opens with correct title and description
    await expect(page.getByRole("heading", { name: "Team Members & Access Control" })).toBeVisible();
    await expect(page.getByText("Manage organization roles and access permissions for Cyber Defense Academy.")).toBeVisible();

    // Verify self-user badge and Super Admin badge
    await expect(page.getByText("You")).toBeVisible();
    await expect(page.locator("span").filter({ hasText: "Super Admin" }).first()).toBeVisible();

    // Verify target member role selector exists
    const roleSelect = page.getByLabel("Change member role");
    await expect(roleSelect).toBeVisible();

    // Verify security notice
    await expect(page.getByText("Role changes take effect immediately across all database queries")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Team Members & Access Control" })).not.toBeVisible();
  });
});
