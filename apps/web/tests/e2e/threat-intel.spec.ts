import { test, expect } from "@playwright/test";

test.describe("Phase 20: Threat Intelligence / IOC Center E2E", () => {
  test("1. Redirects unauthenticated user to login with redirect parameter", async ({ page }) => {
    await page.goto("/threat-intelligence");
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

      await page.goto("/threat-intelligence");
      await page.waitForLoadState("domcontentloaded");
    });

    test("2. Displays Threat Intelligence Workbench, KPIs, and Filters", async ({ page }) => {
      await expect(page).toHaveURL("/threat-intelligence");

      // Header validation
      await expect(page.locator("h1")).toContainText("Threat Intelligence");
      await expect(page.getByText("STIX/TAXII Aligned")).toBeVisible();

      // KPI Metric Cards
      await expect(page.getByText("Total Active IOCs")).toBeVisible();
      await expect(page.getByText("Critical & High Threats")).toBeVisible();
      await expect(page.getByText("Sighting Matches")).toBeVisible();
      await expect(page.getByText("Indicator Types")).toBeVisible();

      // Type Filter Buttons
      await expect(page.getByTestId("type-filter-all")).toBeVisible();
      await expect(page.getByTestId("type-filter-ip")).toBeVisible();
      await expect(page.getByTestId("type-filter-domain")).toBeVisible();
      await expect(page.getByTestId("type-filter-hash")).toBeVisible();

      // Initial table items
      await expect(page.getByText("185.220.101.5").first()).toBeVisible();
    });

    test("3. Filters indicators by type and searches by keyword", async ({ page }) => {
      // Filter by Domain
      const domainFilterBtn = page.getByTestId("type-filter-domain");
      await domainFilterBtn.click();
      await expect(page.getByText("c2-update-services.ru").first()).toBeVisible();

      // Switch back to All Types to search across all indicators
      await page.getByTestId("type-filter-all").click();

      // Search by keyword
      const searchInput = page.getByPlaceholder(/Search by indicator value/i);
      await searchInput.fill("Emotet");
      await expect(page.getByText("44d88612fea8a8f36de82e1278abb02f").first()).toBeVisible();

      // Clear search for subsequent tests
      await searchInput.fill("");
      await page.getByTestId("type-filter-all").click();
    });

    test("4. Opens New Indicator modal, validates live normalization, and creates custom IOC", async ({
      page,
    }) => {
      // Ensure clean state
      const searchInput = page.getByPlaceholder(/Search by indicator value/i);
      await searchInput.fill("");

      // Click New Indicator button
      const newBtn = page.getByTestId("create-ioc-btn");
      await expect(newBtn).toBeVisible();
      await newBtn.click();

      // Modal should appear
      const modal = page.getByTestId("create-ioc-modal");
      await expect(modal).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId("create-ioc-modal-title")).toContainText("Create Threat Indicator");

      // Select Domain type
      await page.getByTestId("modal-type-domain").click();

      // Enter defanged domain value
      const valInput = page.getByTestId("ioc-value-input");
      await valInput.fill("hxxps://malicious-test-c2[.]net/beacon");

      // Check normalization preview text
      await expect(page.getByText("malicious-test-c2.net").first()).toBeVisible();

      // Submit form
      const submitBtn = page.getByTestId("submit-ioc-btn");
      await submitBtn.click();

      // Verify modal closes and new IOC appears in table
      await expect(modal).not.toBeVisible();
      await expect(page.getByText("malicious-test-c2.net").first()).toBeVisible();
    });

    test("5. Opens IOC Forensic Detail Drawer and inspects relationships and pivots", async ({
      page,
    }) => {
      // Ensure clean state
      const searchInput = page.getByPlaceholder(/Search by indicator value/i);
      await searchInput.fill("");
      await page.getByTestId("type-filter-all").click();

      // Click on Inspect button for 185.220.101.5
      const inspectBtn = page.getByTestId("inspect-ioc-ioc-ip-001");
      await expect(inspectBtn).toBeVisible();
      await inspectBtn.click();

      // Drawer should appear
      const drawer = page.getByTestId("ioc-detail-drawer");
      await expect(drawer).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId("ioc-drawer-title")).toContainText("185.220.101.5");

      // Switch to Related Events Tab
      const eventsTab = drawer.getByRole("button", { name: /Related Events/i });
      await eventsTab.click();
      await expect(drawer.getByText("communicated_with")).toBeVisible();

      // Switch to Alerts & Incidents Tab
      const alertsTab = drawer.getByRole("button", { name: /Alerts & Incidents/i });
      await alertsTab.click();
      await expect(drawer.getByText("Suspicious Cobalt Strike C2 Traffic")).toBeVisible();

      // Verify Quick Pivots exist
      await expect(drawer.getByText("SIEM Logs")).toBeVisible();
      await expect(drawer.getByText("Alert Center")).toBeVisible();
      await expect(drawer.getByText("EDR Endpoint")).toBeVisible();
      await expect(drawer.getByText("MITRE ATT&CK")).toBeVisible();
    });
  });
});
