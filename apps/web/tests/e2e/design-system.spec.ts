import { test, expect } from "@playwright/test";

test.describe("Phase 05 — Design System Showcase", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/design-system");
  });

  test("renders design system header and layout shell", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "VRSOC Component Library Showcase" })).toBeVisible();
    await expect(page.getByText("Base44 Visual Parity Specification")).toBeVisible();
    await expect(page.getByText("Cyber Defense Academy").first()).toBeVisible();
  });

  test("renders metric cards and severity badges", async ({ page }) => {
    await expect(page.getByText("Active Alerts")).toBeVisible();
    await expect(page.getByText("Open Incidents")).toBeVisible();
    await expect(page.getByText("Active Agents")).toBeVisible();
    await expect(page.getByText("CRITICAL").first()).toBeVisible();
    await expect(page.getByText("HIGH").first()).toBeVisible();
  });

  test("renders tabs and switches content correctly", async ({ page }) => {
    const tablesTab = page.getByRole("tab", { name: "Data Tables & Telemetry" });
    await expect(tablesTab).toBeVisible();
    await tablesTab.click();
    await expect(page.getByText("Security Alerts Data Table")).toBeVisible();

    const statesTab = page.getByRole("tab", { name: "UI States & Feedback" });
    await statesTab.click();
    await expect(page.getByText("Empty State Container")).toBeVisible();
  });

  test("opens and closes Modal correctly", async ({ page }) => {
    const openModalBtn = page.getByRole("button", { name: "Launch Modal" });
    await openModalBtn.click();
    await expect(page.getByText("Declare Security Incident")).toBeVisible();

    const closeModalBtn = page.getByRole("button", { name: "Cancel" });
    await closeModalBtn.click();
    await expect(page.getByText("Declare Security Incident")).not.toBeVisible();
  });

  test("opens and closes Drawer correctly", async ({ page }) => {
    const openDrawerBtn = page.getByRole("button", { name: "Open Drawer" });
    await openDrawerBtn.click();
    await expect(page.getByText("Alert Investigation Dossier")).toBeVisible();

    const closeDrawerBtn = page.getByRole("button", { name: "Close drawer" });
    await closeDrawerBtn.click();
    await expect(page.getByText("Alert Investigation Dossier")).not.toBeVisible();
  });

  test("opens Command Palette with quick search trigger", async ({ page }) => {
    const searchTrigger = page.getByRole("button", { name: /Quick search/i });
    await searchTrigger.click();
    await expect(page.getByPlaceholder("Type a command, route, or search query...")).toBeVisible();
    await expect(page.getByText("Launch Brute Force Simulation")).toBeVisible();

    // Close on escape
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Type a command, route, or search query...")).not.toBeVisible();
  });
});
