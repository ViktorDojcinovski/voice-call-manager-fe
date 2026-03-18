/**
 * Extracts and returns the domain-only display string from a URL or website value.
 * e.g. "https://www.google.com/search" -> "google.com"
 *      "www.example.com" -> "example.com"
 *      "google.com" -> "google.com"
 */
export function formatWebsiteToDomain(website: string): string {
  if (!website?.trim()) return website;
  let s = website.trim();
  if (s.startsWith("http://")) s = s.slice(7);
  else if (s.startsWith("https://")) s = s.slice(8);
  if (s.startsWith("www.")) s = s.slice(4);
  const pathStart = s.indexOf("/");
  if (pathStart >= 0) s = s.slice(0, pathStart);
  return s || website;
}

/**
 * Normalizes input to domain-only format (strips protocol, www, path).
 * Use before saving to ensure stored value is domain-only.
 */
export function normalizeToDomain(input: string): string {
  return formatWebsiteToDomain(input);
}

/** Domain format: optional subdomain(s) + domain + TLD (e.g. google.com, www.example.co.uk). */
const DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

/**
 * Validates that the value is a domain-only format (e.g. google.com).
 * Rejects full URLs (https://...) and values without a valid TLD.
 */
export function isValidDomainFormat(value: string): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  if (trimmed.includes("://") || trimmed.includes("/")) return false;
  return DOMAIN_REGEX.test(trimmed);
}
