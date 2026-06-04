import type { SASRateLimitHeaders } from "./types.js";

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

export function getHeader(headers: Headers, name: string): string | undefined {
  return headers.get(name) ?? undefined;
}

export async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getNestedValue(obj: unknown, path: string[]): unknown {
  let current = obj;

  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function getRequestId(headers: Headers, body: unknown): string | undefined {
  const headerRequestId =
    getHeader(headers, "x-request-id") ??
    getHeader(headers, "x-render-origin-request-id");

  if (headerRequestId) {
    return headerRequestId;
  }

  const direct = getNestedValue(body, ["request_id"]);
  if (typeof direct === "string") {
    return direct;
  }

  const detail = getNestedValue(body, ["detail", "request_id"]);
  if (typeof detail === "string") {
    return detail;
  }

  return undefined;
}

export function getRateLimitInfo(headers: Headers, body: unknown): SASRateLimitHeaders {
  const retryAfterHeader = getHeader(headers, "retry-after");
  const retryAfterFromBody = getNestedValue(body, ["detail", "retry_after_seconds"]);

  return {
    retryAfter:
      retryAfterHeader ??
      (typeof retryAfterFromBody === "number" || typeof retryAfterFromBody === "string"
        ? retryAfterFromBody
        : undefined),
    limit: getHeader(headers, "x-ratelimit-limit"),
    remaining: getHeader(headers, "x-ratelimit-remaining"),
    reset: getHeader(headers, "x-ratelimit-reset")
  };
}

export function retryAfterToDelayMs(retryAfter: string | number | undefined): number | undefined {
  if (retryAfter === undefined) return undefined;

  if (typeof retryAfter === "number") {
    return Math.max(0, retryAfter * 1000);
  }

  const numeric = Number(retryAfter);
  if (Number.isFinite(numeric)) {
    return Math.max(0, numeric * 1000);
  }

  const date = Date.parse(retryAfter);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return undefined;
}
