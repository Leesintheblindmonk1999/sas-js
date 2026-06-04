import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SASClient,
  SASAuthenticationError,
  SASConfigurationError,
  SASRateLimitError,
  SASServerError,
  SASTimeoutError,
  SASValidationError
} from "../src/index.js";

const originalEnv = { ...process.env };

function mockFetchOnce(response: Response): void {
  vi.stubGlobal("fetch", vi.fn(async () => response));
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {})
    }
  });
}

describe("SASClient", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("normalizes trailing slash from baseUrl", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "ok", kappa_d: 0.56 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({ baseUrl: "https://example.com/" });
    await client.health();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://example.com/health");
  });

  it("does not require API key for public methods", async () => {
    delete process.env.SAS_API_KEY;
    mockFetchOnce(jsonResponse({ status: "ok", kappa_d: 0.56 }));

    const client = new SASClient();
    await expect(client.health()).resolves.toEqual({ status: "ok", kappa_d: 0.56 });
  });

  it("throws configuration error for authenticated methods without API key", async () => {
    delete process.env.SAS_API_KEY;
    delete process.env.SAS_KEY;

    const client = new SASClient();

    await expect(
      client.diff({ textA: "A", textB: "B" })
    ).rejects.toBeInstanceOf(SASConfigurationError);
  });

  it("uses API key from constructor for authenticated methods", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "ok", isi: 0.25, kappa_d: 0.56, verdict: "MANIFOLD_RUPTURE" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({ apiKey: "sas_test_key" });
    await client.diff({ textA: "A", textB: "B" });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("sas_test_key");
  });

  it("does not send API key to public endpoints", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "ok", kappa_d: 0.56 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({
      apiKey: "sas_secret",
      headers: { "X-API-Key": "bad-custom-key" }
    });

    await client.health();

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(Object.keys(headers).some((k) => k.toLowerCase() === "x-api-key")).toBe(false);
  });


  it("uses SAS_KEY fallback when SAS_API_KEY is absent", async () => {
    delete process.env.SAS_API_KEY;
    process.env.SAS_KEY = "sas_alias_key";

    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "ok",
        isi: 1,
        kappa_d: 0.56,
        verdict: "COHERENT"
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient();

    await client.diff({ textA: "A", textB: "A" });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("sas_alias_key");
  });

  it("constructor API key overrides custom X-API-Key header for authenticated methods", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "ok",
        isi: 1,
        kappa_d: 0.56,
        verdict: "COHERENT"
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({
      apiKey: "sas_constructor_key",
      headers: {
        "X-API-Key": "bad-custom-key"
      }
    });

    await client.diff({ textA: "A", textB: "A" });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(Object.keys(headers).filter((k) => k.toLowerCase() === "x-api-key")).toHaveLength(1);
    expect(headers["x-api-key"]).toBe("sas_constructor_key");
  });

  it("maps diff textA/textB to text_a/text_b and does not send domain", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "ok", isi: 0.25, kappa_d: 0.56, verdict: "MANIFOLD_RUPTURE" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({ apiKey: "sas_test_key" });

    await client.diff({
      textA: "Paris is in France.",
      textB: "Paris is in Germany.",
      experimental: true
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body));

    expect(body).toEqual({
      text_a: "Paris is in France.",
      text_b: "Paris is in Germany.",
      experimental: true
    });
    expect("domain" in body).toBe(false);
  });

  it("maps interaction camelCase fields to backend snake_case", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "ok", mode: "analyze", trajectory: [], summary: {} })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({ apiKey: "sas_test_key" });

    await client.interactionStability({
      conversation: [{ role: "user", content: "hi" }],
      kappaD: 0.56,
      normalizeDemand: true
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body));

    expect(body.kappa_d).toBe(0.56);
    expect(body.normalize_demand).toBe(true);
    expect("kappaD" in body).toBe(false);
    expect("normalizeDemand" in body).toBe(false);
  });


  it("adds publicActivity limit as query parameter", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "ok", activity: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({ baseUrl: "https://example.com" });

    await client.publicActivity({ limit: 7 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://example.com/public/activity?limit=7");
  });

  it("adds publicInteractionStats days as query parameter", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "ok",
        period: "last_7_days",
        total_analyses: 0,
        privacy: {
          raw_text_stored: false,
          raw_api_keys_stored: false,
          public_stats_are_aggregated: true
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({ baseUrl: "https://example.com" });

    await client.publicInteractionStats({ days: 14 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://example.com/public/interaction/stats?days=14"
    );
  });

  it("maps 422 to SASValidationError", async () => {
    mockFetchOnce(jsonResponse({ detail: "validation failed" }, { status: 422 }));

    const client = new SASClient({ apiKey: "sas_test_key" });

    await expect(client.diff({ textA: "", textB: "" })).rejects.toBeInstanceOf(
      SASValidationError
    );
  });


  it("maps 401 to SASAuthenticationError", async () => {
    mockFetchOnce(jsonResponse({ detail: "unauthorized" }, { status: 401 }));

    const client = new SASClient({ apiKey: "sas_test_key" });

    await expect(client.whoami()).rejects.toBeInstanceOf(SASAuthenticationError);
  });

  it("maps 5xx to SASServerError", async () => {
    mockFetchOnce(jsonResponse({ detail: "server error" }, { status: 503 }));

    const client = new SASClient({ apiKey: "sas_test_key" });

    await expect(client.diff({ textA: "A", textB: "B" })).rejects.toBeInstanceOf(
      SASServerError
    );
  });

  it("maps 429 to SASRateLimitError and exposes retry-after", async () => {
    mockFetchOnce(
      jsonResponse(
        { detail: { error: "rate limited", retry_after_seconds: 60 } },
        { status: 429, headers: { "retry-after": "60", "x-ratelimit-remaining": "0" } }
      )
    );

    const client = new SASClient({ apiKey: "sas_test_key" });

    try {
      await client.diff({ textA: "A", textB: "B" });
      throw new Error("expected error");
    } catch (err) {
      expect(err).toBeInstanceOf(SASRateLimitError);
      expect((err as SASRateLimitError).retryAfter).toBe("60");
      expect((err as SASRateLimitError).rateLimit?.remaining).toBe("0");
    }
  });


  it("adds User-Agent header", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "ok", kappa_d: 0.56 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient();

    await client.health();

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(headers["user-agent"]).toBe("sas-node-sdk/0.1.0");
  });

  it("maps timeout to SASTimeoutError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (_url: string | URL | Request, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = init?.signal as AbortSignal | undefined;
            signal?.addEventListener("abort", () => {
              const err = new Error("aborted");
              err.name = "AbortError";
              reject(err);
            });
          })
      )
    );

    const client = new SASClient({ timeoutMs: 1 });

    await expect(client.health()).rejects.toBeInstanceOf(SASTimeoutError);
  });

  it("retries 5xx by default when retry is explicitly enabled", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "temporary" }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ status: "ok", kappa_d: 0.56 }));

    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({
      retry: {
        attempts: 1,
        backoffMs: 1
      }
    });

    const result = await client.health();

    expect(result.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caps retry-after delay with maxRetryDelayMs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { detail: { error: "rate limited", retry_after_seconds: 9999 } },
          { status: 429, headers: { "retry-after": "9999" } }
        )
      )
      .mockResolvedValueOnce(jsonResponse({ status: "ok", kappa_d: 0.56 }));

    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({
      retry: {
        attempts: 1,
        backoffMs: 1,
        respectRetryAfter: true,
        retryOnStatuses: [429],
        maxRetryDelayMs: 1
      }
    });

    const result = await client.health();

    expect(result.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry by default", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ detail: "boom" }, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({ apiKey: "sas_test_key" });

    await expect(client.diff({ textA: "A", textB: "B" })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries when explicitly configured", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "boom" }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ status: "ok", isi: 1, kappa_d: 0.56, verdict: "COHERENT" }));

    vi.stubGlobal("fetch", fetchMock);

    const client = new SASClient({
      apiKey: "sas_test_key",
      retry: { attempts: 1, backoffMs: 1, retryOnStatuses: [503] }
    });

    const result = await client.diff({ textA: "A", textB: "A" });

    expect(result.verdict).toBe("COHERENT");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
