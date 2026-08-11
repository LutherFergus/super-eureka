const SD_ENDPOINT_KEY = "mosaic-sd-endpoint-v1";

/** Normalize to origin without trailing slash, e.g. http://192.168.1.20:7860 */
export function normalizeSdEndpoint(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`);
  } catch {
    throw new Error("Enter a valid URL like http://192.168.1.20:7860");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Endpoint must start with http:// or https://");
  }
  return url.origin;
}

export function loadSdEndpoint(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(SD_ENDPOINT_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function saveSdEndpoint(value: string): string {
  const normalized = normalizeSdEndpoint(value);
  if (typeof window !== "undefined") {
    localStorage.setItem(SD_ENDPOINT_KEY, normalized);
  }
  return normalized;
}

export function clearSdEndpoint(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SD_ENDPOINT_KEY);
  } catch {
    // ignore
  }
}
