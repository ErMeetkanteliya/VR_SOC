import type { IocType, IocHashType, IocIpVersion } from "@vrsoc/types";

export interface NormalizationResult {
  isValid: boolean;
  iocType: IocType;
  normalizedValue: string;
  rawValue: string;
  hashType?: IocHashType | null;
  ipVersion?: IocIpVersion | null;
  error?: string;
}

/**
 * Universal defang remover: removes brackets and safe obfuscations
 * Examples:
 *   192[.]168[.]1[.]1 -> 192.168.1.1
 *   hxxps://evil[.]com -> https://evil.com
 *   user[@]domain[.]com -> user@domain.com
 */
export function removeDefanging(value: string): string {
  if (!value) return "";
  let v = value.trim();

  // URL protocol defangs
  v = v.replace(/^hxxps?:\/\//i, (match) => match.toLowerCase().replace(/^hxxp/, "http"));
  v = v.replace(/^h\*\*ps?:\/\//i, (match) => match.toLowerCase().replace(/^h\*\*p/, "http"));
  v = v.replace(/^fxps?:\/\//i, (match) => match.toLowerCase().replace(/^fxp/, "ftp"));

  // Bracketed separators
  v = v.replace(/\[\.\]/g, ".");
  v = v.replace(/\{\.\}/g, ".");
  v = v.replace(/\(\.\)/g, ".");
  v = v.replace(/\[dot\]/gi, ".");
  v = v.replace(/\[:\]/g, ":");
  v = v.replace(/\[@\]/g, "@");
  v = v.replace(/\[at\]/gi, "@");

  return v.trim();
}

/**
 * Validates IPv4 address string (e.g. 192.168.1.1)
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = parseInt(p, 10);
    return n >= 0 && n <= 255 && (p === "0" || !p.startsWith("0"));
  });
}

/**
 * Validates IPv6 address string (basic RFC 4291 syntax check)
 */
export function isValidIPv6(ip: string): boolean {
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv6Regex.test(ip);
}

/**
 * Normalizes an IP address (v4 or v6)
 */
export function normalizeIp(rawValue: string): NormalizationResult {
  const cleaned = removeDefanging(rawValue);
  // Strip any accidental wrapping quotes, spaces, or ports like 192.168.1.1:8080
  let ipCandidate = cleaned.replace(/^["']|["']$/g, "").trim();

  // If user pasted http://1.2.3.4:8080, extract host
  if (/^https?:\/\//i.test(ipCandidate)) {
    try {
      const u = new URL(ipCandidate);
      ipCandidate = u.hostname;
    } catch {
      // Keep as is
    }
  }

  // Strip port if IPv4 with port (e.g. 1.2.3.4:443)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ipCandidate)) {
    ipCandidate = ipCandidate.split(":")[0] || ipCandidate;
  }

  if (isValidIPv4(ipCandidate)) {
    return {
      isValid: true,
      iocType: "ip",
      normalizedValue: ipCandidate,
      rawValue,
      ipVersion: "v4",
    };
  }

  if (isValidIPv6(ipCandidate)) {
    return {
      isValid: true,
      iocType: "ip",
      normalizedValue: ipCandidate.toLowerCase(),
      rawValue,
      ipVersion: "v6",
    };
  }

  return {
    isValid: false,
    iocType: "ip",
    normalizedValue: ipCandidate,
    rawValue,
    error: `Invalid IP address format: "${rawValue}". Expected valid IPv4 or IPv6.`,
  };
}

/**
 * Normalizes a Domain Name (e.g. evil.com, sub.c2.ru)
 */
export function normalizeDomain(rawValue: string): NormalizationResult {
  let cleaned = removeDefanging(rawValue).trim().toLowerCase();

  // Strip protocol if included
  cleaned = cleaned.replace(/^[a-z]+:\/\//i, "");

  // Strip path and query parameters if pasted (e.g. evil.com/login?id=1 -> evil.com)
  const pathPart = cleaned.split("/")[0] || "";
  const queryPart = pathPart.split("?")[0] || "";
  cleaned = queryPart.split("#")[0] || cleaned;

  // Strip port if present (e.g. evil.com:8443 -> evil.com)
  cleaned = cleaned.split(":")[0] || cleaned;

  // Strip trailing dot if present (FQDN root notation)
  cleaned = cleaned.replace(/\.$/, "");

  // Domain syntax validation (standard RFC 1035 labels)
  const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  const isDomain = domainRegex.test(cleaned);

  if (!isDomain || isValidIPv4(cleaned)) {
    return {
      isValid: false,
      iocType: "domain",
      normalizedValue: cleaned,
      rawValue,
      error: `Invalid domain name format: "${rawValue}". Expected valid fully qualified domain name.`,
    };
  }

  return {
    isValid: true,
    iocType: "domain",
    normalizedValue: cleaned,
    rawValue,
  };
}

/**
 * Normalizes a URL (e.g. https://evil.com/payload.exe?ref=1)
 */
export function normalizeUrl(rawValue: string): NormalizationResult {
  let cleaned = removeDefanging(rawValue).trim();

  // If missing protocol, prepend http:// for URL parser parsing
  if (!/^[a-z]+:\/\//i.test(cleaned)) {
    cleaned = "http://" + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    // Lowercase scheme and hostname
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();

    // Standardize URL string representation
    let normalized = parsed.toString();

    // If root path without query/hash, remove trailing slash for clean canonical representation
    if (parsed.pathname === "/" && !parsed.search && !parsed.hash) {
      normalized = normalized.replace(/\/$/, "");
    }

    return {
      isValid: true,
      iocType: "url",
      normalizedValue: normalized,
      rawValue,
    };
  } catch {
    return {
      isValid: false,
      iocType: "url",
      normalizedValue: cleaned,
      rawValue,
      error: `Invalid URL format: "${rawValue}".`,
    };
  }
}

/**
 * Normalizes a cryptographic hash (MD5, SHA1, SHA256, SHA512)
 */
export function normalizeHash(rawValue: string, explicitHashType?: IocHashType | null): NormalizationResult {
  let cleaned = removeDefanging(rawValue).trim().toLowerCase();

  // Strip hex prefix if present
  cleaned = cleaned.replace(/^0x/, "");

  // Strip hash type prefix like md5: or sha256:
  cleaned = cleaned.replace(/^(md5|sha1|sha256|sha512):/i, "");

  // Validate hex characters
  const isHex = /^[a-f0-9]+$/.test(cleaned);
  const len = cleaned.length;

  let detectedType: IocHashType | null = null;
  if (len === 32) detectedType = "md5";
  else if (len === 40) detectedType = "sha1";
  else if (len === 64) detectedType = "sha256";
  else if (len === 128) detectedType = "sha512";

  const finalType = explicitHashType || detectedType;

  if (!isHex || !detectedType) {
    return {
      isValid: false,
      iocType: "hash",
      normalizedValue: cleaned,
      rawValue,
      hashType: finalType,
      error: `Invalid hash format: "${rawValue}". Expected 32 (MD5), 40 (SHA1), 64 (SHA256), or 128 (SHA512) hexadecimal characters.`,
    };
  }

  return {
    isValid: true,
    iocType: "hash",
    normalizedValue: cleaned,
    rawValue,
    hashType: finalType,
  };
}

/**
 * Normalizes an Email address (e.g. phish@bad-actor.com)
 */
export function normalizeEmail(rawValue: string): NormalizationResult {
  const cleaned = removeDefanging(rawValue).trim().toLowerCase();

  // Email regex RFC 5322 simplified
  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

  if (!emailRegex.test(cleaned)) {
    return {
      isValid: false,
      iocType: "email",
      normalizedValue: cleaned,
      rawValue,
      error: `Invalid email address format: "${rawValue}".`,
    };
  }

  return {
    isValid: true,
    iocType: "email",
    normalizedValue: cleaned,
    rawValue,
  };
}

/**
 * Normalizes a File indicator (e.g. C:\Windows\System32\malware.exe or suspicious_script.ps1)
 */
export function normalizeFile(rawValue: string): NormalizationResult {
  let cleaned = removeDefanging(rawValue).trim();
  // Standardize slashes
  cleaned = cleaned.replace(/\\/g, "/");
  // Remove wrapping quotes
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();

  if (!cleaned || cleaned.length > 512) {
    return {
      isValid: false,
      iocType: "file",
      normalizedValue: cleaned,
      rawValue,
      error: `Invalid file name/path length.`,
    };
  }

  return {
    isValid: true,
    iocType: "file",
    normalizedValue: cleaned,
    rawValue,
  };
}

/**
 * Master dispatcher for IOC normalization
 */
export function normalizeIoc(
  iocType: IocType,
  rawValue: string,
  explicitHashType?: IocHashType | null
): NormalizationResult {
  if (!rawValue || typeof rawValue !== "string" || !rawValue.trim()) {
    return {
      isValid: false,
      iocType,
      normalizedValue: "",
      rawValue: rawValue || "",
      error: "Indicator value cannot be empty.",
    };
  }

  switch (iocType) {
    case "ip":
      return normalizeIp(rawValue);
    case "domain":
      return normalizeDomain(rawValue);
    case "url":
      return normalizeUrl(rawValue);
    case "hash":
      return normalizeHash(rawValue, explicitHashType);
    case "email":
      return normalizeEmail(rawValue);
    case "file":
      return normalizeFile(rawValue);
    default:
      return {
        isValid: false,
        iocType,
        normalizedValue: rawValue.trim(),
        rawValue,
        error: `Unsupported IOC type: "${iocType}".`,
      };
  }
}

/**
 * Heuristic auto-detector for IOC type from raw string
 */
export function detectIocType(value: string): IocType {
  const cleaned = removeDefanging(value).trim().toLowerCase();

  // 1. Check IP
  if (isValidIPv4(cleaned) || isValidIPv6(cleaned)) {
    return "ip";
  }

  // 2. Check Hash
  const hexOnly = cleaned.replace(/^0x/, "").replace(/^(md5|sha1|sha256|sha512):/i, "");
  if (/^[a-f0-9]{32}$/.test(hexOnly) || /^[a-f0-9]{40}$/.test(hexOnly) || /^[a-f0-9]{64}$/.test(hexOnly) || /^[a-f0-9]{128}$/.test(hexOnly)) {
    return "hash";
  }

  // 3. Check Email
  if (cleaned.includes("@") && !cleaned.includes("/")) {
    return "email";
  }

  // 4. Check URL with protocol prefix
  if (/^[a-z]+:\/\//i.test(cleaned)) {
    return "url";
  }

  // 5. Check File Extensions & Paths
  const fileExtRegex = /\.(exe|dll|ps1|bat|cmd|vbs|sh|bin|py|elf|msi|sys|scr|jar|apk|dmg|doc|docx|xls|xlsx|pdf|zip|rar|7z|iso|tar|gz|dat)$/i;
  if (fileExtRegex.test(cleaned) || (cleaned.includes("\\") && !cleaned.includes("://"))) {
    return "file";
  }

  // 6. Check URL without protocol (e.g. evil.com/path)
  if (cleaned.includes("/") && cleaned.includes(".")) {
    return "url";
  }

  // 7. Check Domain
  if (/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(cleaned)) {
    return "domain";
  }

  // 8. Default to file
  return "file";
}
