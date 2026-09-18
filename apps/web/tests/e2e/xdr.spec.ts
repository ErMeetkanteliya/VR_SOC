import { test, expect } from "@playwright/test";

test.describe("Phase 18 — XDR Multi-Source Correlation E2E Tests", () => {
  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/xdr");
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe("Authenticated Analyst Workflows", () => {
    test.beforeEach(async ({ page, context }) => {
      await context.addCookies([
        {
          name: "vrsoc_e2e_session",
          value: "active_analyst_session",
          domain: "localhost",
          path: "/",
        },
      ]);

      await page.goto("/xdr");
    });

    test("renders XDR Workbench header, KPI cards, and Source Matrix", async ({ page }) => {
      // Header & Subtitle
      await expect(page.locator("h1")).toContainText("XDR Multi-Source Investigation");
      await expect(page.getByText("Deterministic correlation across Endpoint, Identity, Email, DNS")).toBeVisible();

      // KPI Metric Cards
      await expect(page.getByText("Cross-Source Threat Chains")).toBeVisible();
      await expect(page.getByText("Active Telemetry Surfaces")).toBeVisible();
      await expect(page.getByText("High Confidence Matches")).toBeVisible();
      await expect(page.getByText("Mean Correlation Window")).toBeVisible();

      // Telemetry Source Matrix
      await expect(page.getByText("Multi-Source Telemetry Matrix")).toBeVisible();
      await expect(page.getByText("Email Gateway")).toBeVisible();
      await expect(page.getByText("Perimeter Firewall")).toBeVisible();
      await expect(page.getByText("DNS Resolution")).toBeVisible();
    });

    test("renders correlation clusters list and allows searching", async ({ page }) => {
      await expect(page.getByText("Correlation Clusters")).toBeVisible();

      const searchInput = page.getByPlaceholder("Search code, title, host, user...");
      await expect(searchInput).toBeVisible();
      await searchInput.fill("Phishing");
      await expect(searchInput).toHaveValue("Phishing");
    });

    test("switches between investigation tabs", async ({ page }) => {
      // Killchain & Identifiers
      await expect(page.getByText("Deterministic Killchain Explanation")).toBeVisible();

      // Switch to Cross-Source Timeline tab
      await page.getByRole("button", { name: /Cross-Source Timeline/i }).click();
      await expect(page.getByText("Filter Source:")).toBeVisible();

      // Switch to Source Telemetry Tables tab
      await page.getByRole("button", { name: /Source Telemetry Tables/i }).click();
      await expect(page.getByText("DNS Queries & Resolutions")).toBeVisible();
      await expect(page.getByText("Email Messages")).toBeVisible();
      await expect(page.getByText("Perimeter Firewall Traffic")).toBeVisible();

      // Switch to Entity Dossiers tab
      await page.getByRole("button", { name: /Entity Dossiers/i }).click();
      await expect(page.getByText("Target Endpoint Host")).toBeVisible();
      await expect(page.getByText("Attributed User Identity")).toBeVisible();

      // Switch to Related Alerts tab
      await page.getByRole("button", { name: /Related Alerts/i }).click();
      await expect(page.getByText("View Alert").first()).toBeVisible();
    });

    test("opens and closes Simulate Multi-Source Attack modal", async ({ page }) => {
      const simulateBtn = page.getByRole("button", { name: "Simulate Multi-Source Attack" });
      await expect(simulateBtn).toBeVisible();
      await simulateBtn.click();

      // Modal dialog
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Simulate Safe Multi-Source XDR Attack")).toBeVisible();
      await expect(page.getByText("Spear Phishing to Endpoint C2 Callback")).toBeVisible();

      // Close modal
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });
});
