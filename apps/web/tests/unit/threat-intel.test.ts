import { describe, it, expect } from "vitest";
import {
  normalizeIp,
  normalizeDomain,
  normalizeUrl,
  normalizeHash,
  normalizeEmail,
  normalizeFile,
  detectIocType,
} from "@/lib/threat-intel/normalization";
import {
  CreateIocInputSchema,
  IocFilterSchema,
} from "@vrsoc/validation";
import {
  getThreatIndicators,
  getThreatIndicatorById,
  getThreatIndicatorByValue,
  createThreatIndicator,
  enrichEntityIocs,
} from "@/lib/threat-intel/threat-intel-service";
import {
  CANONICAL_THREAT_INDICATORS,
  CANONICAL_IOC_RELATIONSHIPS,
  calculateIocOverviewStats,
} from "@/lib/threat-intel/catalog";

describe("Phase 20 — Threat Intelligence / IOC Model Unit Tests", () => {
  describe("1. Defang Resolution & Normalization Engine", () => {
    it("resolves defanged IP addresses correctly", () => {
      const res1 = normalizeIp("185[.]220[.]101[.]5");
      expect(res1.isValid).toBe(true);
      expect(res1.normalizedValue).toBe("185.220.101.5");
      expect(res1.ipVersion).toBe("v4");

      const res2 = normalizeIp("192.168.1.1:8080");
      expect(res2.isValid).toBe(true);
      expect(res2.normalizedValue).toBe("192.168.1.1");

      const res3 = normalizeIp("999.999.999.999");
      expect(res3.isValid).toBe(false);
      expect(res3.error).toBeDefined();
    });

    it("resolves and normalizes domain names", () => {
      const res1 = normalizeDomain("hxxps://c2-update-services[.]ru/beacon");
      expect(res1.isValid).toBe(true);
      expect(res1.normalizedValue).toBe("c2-update-services.ru");

      const res2 = normalizeDomain("SUBDOMAIN.EVIL.COM:443");
      expect(res2.isValid).toBe(true);
      expect(res2.normalizedValue).toBe("subdomain.evil.com");

      const res3 = normalizeDomain("not-a-domain");
      expect(res3.isValid).toBe(false);
    });

    it("resolves and normalizes URLs", () => {
      const res1 = normalizeUrl("hxxp://evil[.]com/payloads/beacon.bin?key=123");
      expect(res1.isValid).toBe(true);
      expect(res1.normalizedValue).toBe("http://evil.com/payloads/beacon.bin?key=123");

      const res2 = normalizeUrl("https://PHISH-TARGET.COM/");
      expect(res2.isValid).toBe(true);
      expect(res2.normalizedValue).toBe("https://phish-target.com");
    });

    it("validates and normalizes cryptographic hashes", () => {
      // MD5
      const md5 = normalizeHash("0x44D88612FEA8A8F36DE82E1278ABB02F");
      expect(md5.isValid).toBe(true);
      expect(md5.normalizedValue).toBe("44d88612fea8a8f36de82e1278abb02f");
      expect(md5.hashType).toBe("md5");

      // SHA256
      const sha256 = normalizeHash("A2B8E39D41EF4873919864299B801A2489C72E411B0E36B85D957102E3B8A1C9");
      expect(sha256.isValid).toBe(true);
      expect(sha256.normalizedValue).toBe("a2b8e39d41ef4873919864299b801a2489c72e411b0e36b85d957102e3b8a1c9");
      expect(sha256.hashType).toBe("sha256");

      // Invalid hex
      const invalid = normalizeHash("not-a-hex-hash");
      expect(invalid.isValid).toBe(false);
    });

    it("normalizes email addresses and files", () => {
      const email = normalizeEmail("Security-Alert[@]Microsoft-Support-Verify[.]com");
      expect(email.isValid).toBe(true);
      expect(email.normalizedValue).toBe("security-alert@microsoft-support-verify.com");

      const file = normalizeFile("C:\\Windows\\Temp\\Invoke-Mimikatz.ps1");
      expect(file.isValid).toBe(true);
      expect(file.normalizedValue).toBe("C:/Windows/Temp/Invoke-Mimikatz.ps1");
    });

    it("correctly auto-detects IOC types from strings", () => {
      expect(detectIocType("192.168.1.1")).toBe("ip");
      expect(detectIocType("44d88612fea8a8f36de82e1278abb02f")).toBe("hash");
      expect(detectIocType("phish@target.com")).toBe("email");
      expect(detectIocType("https://evil.com/dropper.exe")).toBe("url");
      expect(detectIocType("evil-c2.ru")).toBe("domain");
      expect(detectIocType("malware.exe")).toBe("file");
    });
  });

  describe("2. Schema & Validation Contracts", () => {
    it("validates CreateIocInputSchema with default values", () => {
      const parsed = CreateIocInputSchema.parse({
        ioc_type: "ip",
        value: "185.220.101.5",
        threat_types: ["c2"],
      });

      expect(parsed.ioc_type).toBe("ip");
      expect(parsed.confidence).toBe(80);
      expect(parsed.severity).toBe("medium");
      expect(parsed.status).toBe("active");
    });

    it("rejects malformed CreateIocInputSchema payloads", () => {
      expect(() =>
        CreateIocInputSchema.parse({
          ioc_type: "invalid_type",
          value: "185.220.101.5",
        })
      ).toThrow();
    });

    it("validates IocFilterSchema with pagination defaults", () => {
      const filter = IocFilterSchema.parse({});
      expect(filter.page).toBe(1);
      expect(filter.pageSize).toBe(25);
      expect(filter.ioc_type).toBe("all");
      expect(filter.severity).toBe("all");
    });
  });

  describe("3. Threat Intelligence Service & Catalog", () => {
    it("retrieves canonical threat indicators with filtering", async () => {
      const res = await getThreatIndicators({ ioc_type: "ip" });
      expect(res.indicators.length).toBeGreaterThan(0);
      expect(res.indicators.every((i) => i.ioc_type === "ip")).toBe(true);
    });

    it("searches threat indicators by substring query", async () => {
      const res = await getThreatIndicators({ search: "CobaltStrike" });
      expect(res.indicators.length).toBeGreaterThan(0);
      expect(res.indicators.some((i) => i.normalized_value === "185.220.101.5")).toBe(true);
    });

    it("retrieves detailed indicator with relationship counts", async () => {
      const detail = await getThreatIndicatorById("ioc-ip-001");
      expect(detail).toBeDefined();
      expect(detail?.normalized_value).toBe("185.220.101.5");
      expect(detail?.relationships_count.alerts).toBeGreaterThanOrEqual(1);
    });

    it("creates a new custom indicator with automatic normalization", async () => {
      const created = await createThreatIndicator(
        {
          ioc_type: "domain",
          value: "HXXPS://EVIL-RANSOMWARE-STAGING[.]COM/PATH",
          severity: "critical",
          threat_types: ["ransomware"],
          tags: ["TestTag"],
          description: "Simulated ransomware staging domain",
        },
        "00000000-0000-0000-0000-000000000001"
      );

      expect(created).toBeDefined();
      expect(created.normalized_value).toBe("evil-ransomware-staging.com");
      expect(created.severity).toBe("critical");

      // Verify lookup by value resolves
      const lookup = await getThreatIndicatorByValue("evil-ransomware-staging.com");
      expect(lookup).toBeDefined();
      expect(lookup?.id).toBe(created.id);
    });

    it("calculates deterministic overview stats", () => {
      const stats = calculateIocOverviewStats(
        CANONICAL_THREAT_INDICATORS,
        CANONICAL_IOC_RELATIONSHIPS
      );

      expect(stats.total_iocs).toBe(CANONICAL_THREAT_INDICATORS.length);
      expect(stats.active_iocs).toBe(CANONICAL_THREAT_INDICATORS.length);
      expect(stats.by_type.ip).toBeGreaterThan(0);
      expect(stats.total_sightings).toBe(CANONICAL_IOC_RELATIONSHIPS.length);
    });

    it("enriches entity observables against the intelligence repository", async () => {
      const observables = ["185.220.101.5", "10.0.0.1", "c2-update-services.ru", "clean-host.com"];
      const matched = await enrichEntityIocs("alert", "alert-test-99", observables);

      expect(matched.length).toBe(2);
      expect(matched.map((m) => m.normalized_value)).toContain("185.220.101.5");
      expect(matched.map((m) => m.normalized_value)).toContain("c2-update-services.ru");
    });
  });
});
