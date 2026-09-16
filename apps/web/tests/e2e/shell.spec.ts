import { test, expect } from "@playwright/test";

test.describe("Phase 09 — Application Shell & Base44 Navigation E2E Tests", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "vrsoc_e2e_session",
        value: "analyst@vrsoc.app",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("renders shell with Base44 navigation hierarchy, breadcrumbs, and command palette", async ({ page }) => {
    // Navigate to root dashboard (which uses authenticated AppShell)
    await page.goto("/");

    // 1. Verify Brand and Logo
    await expect(page.getByRole("heading", { name: "VRSOC" })).toBeVisible();
    await expect(page.getByText("Enterprise Defense")).toBeVisible();

    // 2. Verify Navigation Groups
    await expect(page.getByText("Core Operations")).toBeVisible();
    await expect(page.getByText("SOAR Orchestration")).toBeVisible();

    // 3. Test Command Palette Trigger and Keyboard Escape on Shell
    const quickSearchBtn = page.getByRole("button", { name: /Quick search/i });
    await expect(quickSearchBtn).toBeVisible();
    await quickSearchBtn.click();

    const commandPaletteInput = page.getByPlaceholder("Type a command, route, or search query...");
    await expect(commandPaletteInput).toBeVisible();

    // Close command palette with Escape
    await page.keyboard.press("Escape");
    await expect(commandPaletteInput).not.toBeVisible();

    // 4. Verify Key Sidebar Links
    await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Agents (EDR)" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Alerts" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Incidents" })).toBeVisible();
    await expect(page.getByRole("link", { name: "SOAR Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Automation Pipeline" })).toBeVisible();

    // 5. Test Navigation to Placeholder Route
    await page.getByRole("link", { name: "Agents (EDR)" }).click();
    await expect(page).toHaveURL(/.*\/agents/);
    await expect(page.getByRole("heading", { name: "Endpoint Agents (EDR Fleet)", exact: true })).toBeVisible();
    await expect(page.getByText("Phase 11 — Agent Fleet & Assets")).toBeVisible();

    // 6. Verify Dynamic Breadcrumbs on subpage
    const breadcrumbsNav = page.locator("nav[aria-label='Breadcrumb']");
    await expect(breadcrumbsNav).toBeVisible();
    await expect(breadcrumbsNav.getByText("Dashboard", { exact: true })).toBeVisible();
    await expect(breadcrumbsNav.getByText("Agents (EDR)")).toBeVisible();

    // 7. Test Navigation to Nested SOAR Route
    await page.getByRole("link", { name: "Automation Pipeline" }).click();
    await expect(page).toHaveURL(/.*\/soar\/automation/);
    await expect(page.getByRole("heading", { name: "Automation Pipeline", exact: true })).toBeVisible();
    await expect(page.getByText("Phase 21 — Automation Pipeline")).toBeVisible();

    // 8. Verify 3-Level Breadcrumb
    await expect(breadcrumbsNav.getByText("Dashboard", { exact: true })).toBeVisible();
    await expect(breadcrumbsNav.getByText("SOAR Dashboard")).toBeVisible();
    await expect(breadcrumbsNav.getByText("Automation Pipeline")).toBeVisible();
  });

  test("user profile menu displays active role, email, and navigation options", async ({ page }) => {
    await page.goto("/");

    // Locate user menu button in topbar
    const userMenuBtn = page.getByLabel("User profile menu");
    await expect(userMenuBtn).toBeVisible();
    await userMenuBtn.click();

    // Verify dropdown contents
    await expect(page.getByText("Signed in as")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Platform Settings/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Knowledge Center/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Sign out/i })).toBeVisible();

    // Close dropdown
    await page.keyboard.press("Escape");
  });

  test("mobile responsive menu toggles sidebar drawer", async ({ page }) => {
    // Set small mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Hamburger button should be visible on mobile
    const mobileToggle = page.getByLabel("Open navigation menu");
    await expect(mobileToggle).toBeVisible();
    await mobileToggle.click();

    // Verify mobile sidebar drawer items are visible
    const mobileSidebar = page.locator("aside[aria-label='Navigation sidebar']");
    await expect(mobileSidebar.getByText("Core Operations")).toBeVisible();
    await expect(mobileSidebar.getByRole("link", { name: "Alerts" })).toBeVisible();

    // Close mobile drawer
    await page.getByLabel("Close navigation menu").click();
    await expect(mobileSidebar).toHaveClass(/-translate-x-full/);
  });
});
