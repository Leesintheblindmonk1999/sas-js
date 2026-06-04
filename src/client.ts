import {
  SASAPIError,
  SASAuthenticationError,
  SASConfigurationError,
  SASNetworkError,
  SASRateLimitError,
  SASServerError,
  SASTimeoutError,
  SASValidationError
} from "./errors.js";

import type {
  AuditRequest,
  AuditResponse,
  BatchRequest,
  BatchResponse,
  DemoAuditRequest,
  DemoAuditResponse,
  DiffApiRequest,
  DiffRequest,
  DiffResponse,
  HealthResponse,
  InteractionStabilityApiRequest,
  InteractionStabilityExampleResponse,
  InteractionStabilityRequest,
  InteractionStabilityResponse,
  PublicActivityOptions,
  PublicActivityResponse,
  PublicInteractionStatsOptions,
  PublicInteractionStatsResponse,
  PublicStatsResponse,
  ReadyzResponse,
  RequestMethod,
  RetryOptions,
  SASClientOptions,
  WhoamiResponse
} from "./types.js";

import {
  getRateLimitInfo,
  getRequestId,
  headersToRecord,
  normalizeBaseUrl,
  parseResponseBody,
  retryAfterToDelayMs,
  sleep
} from "./utils.js";

const DEFAULT_BASE_URL = "https://sas-api.onrender.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const SDK_USER_AGENT = "sas-node-sdk/0.1.0";

interface RequestOptions {
  method: RequestMethod;
  path: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

export class SASClient {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly retry: false | RetryOptions;

  private readonly apiKey?: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: SASClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retry = options.retry ?? false;
    this.apiKey = options.apiKey ?? getEnv("SAS_API_KEY") ?? getEnv("SAS_KEY");
    this.defaultHeaders = options.headers ?? {};
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>({ method: "GET", path: "/health", auth: false });
  }

  async readyz(): Promise<ReadyzResponse> {
    return this.request<ReadyzResponse>({ method: "GET", path: "/readyz", auth: false });
  }

  async demoAudit(input: DemoAuditRequest): Promise<DemoAuditResponse> {
    return this.request<DemoAuditResponse>({
      method: "POST",
      path: "/public/demo/audit",
      auth: false,
      body: input
    });
  }

  async whoami(): Promise<WhoamiResponse> {
    return this.request<WhoamiResponse>({ method: "GET", path: "/v1/whoami", auth: true });
  }

  async diff(input: DiffRequest): Promise<DiffResponse> {
    const body: DiffApiRequest = {
      text_a: input.textA,
      text_b: input.textB,
      experimental: input.experimental
    };

    return this.request<DiffResponse>({
      method: "POST",
      path: "/v1/diff",
      auth: true,
      body: removeUndefined(body)
    });
  }

  async audit(input: AuditRequest): Promise<AuditResponse> {
    return this.request<AuditResponse>({
      method: "POST",
      path: "/v1/audit",
      auth: true,
      body: removeUndefined({
        text: input.text,
        experimental: input.experimental
      })
    });
  }

  async batch(input: BatchRequest): Promise<BatchResponse> {
    return this.request<BatchResponse>({
      method: "POST",
      path: "/v1/batch",
      auth: true,
      body: removeUndefined({
        pairs: input.pairs,
        experimental: input.experimental
      })
    });
  }

  async publicStats(): Promise<PublicStatsResponse> {
    return this.request<PublicStatsResponse>({
      method: "GET",
      path: "/public/stats",
      auth: false
    });
  }

  async publicActivity(options: PublicActivityOptions = {}): Promise<PublicActivityResponse> {
    return this.request<PublicActivityResponse>({
      method: "GET",
      path: "/public/activity",
      auth: false,
      query: { limit: options.limit }
    });
  }

  async publicInteractionStats(
    options: PublicInteractionStatsOptions = {}
  ): Promise<PublicInteractionStatsResponse> {
    return this.request<PublicInteractionStatsResponse>({
      method: "GET",
      path: "/public/interaction/stats",
      auth: false,
      query: { days: options.days }
    });
  }

  async interactionStability(
    input: InteractionStabilityRequest
  ): Promise<InteractionStabilityResponse> {
    const body: InteractionStabilityApiRequest = {
      conversation: input.conversation,
      gamma: input.gamma,
      window: input.window,
      kappa_d: input.kappaD,
      alpha: input.alpha,
      mode: input.mode,
      normalize_demand: input.normalizeDemand
    };

    return this.request<InteractionStabilityResponse>({
      method: "POST",
      path: "/v1/interaction/stability",
      auth: true,
      body: removeUndefined(body)
    });
  }

  async interactionStabilityExample(): Promise<InteractionStabilityExampleResponse> {
    return this.request<InteractionStabilityExampleResponse>({
      method: "GET",
      path: "/v1/interaction/stability/example",
      auth: false
    });
  }

  private async request<T>(options: RequestOptions): Promise<T> {
    const retryOptions = this.retry;
    const maxRetries = retryOptions === false ? 0 : Math.max(0, retryOptions.attempts);
    let attempt = 0;
    let lastError: unknown = new SASNetworkError("Request failed unexpectedly.");

    while (attempt <= maxRetries) {
      try {
        return await this.requestOnce<T>(options);
      } catch (err) {
        lastError = err;

        if (!shouldRetry(err, retryOptions) || attempt >= maxRetries) {
          throw err;
        }

        if (retryOptions === false) {
          throw err;
        }

        const delay = getRetryDelayMs(err, retryOptions, attempt);
        await sleep(delay);
        attempt += 1;
      }
    }

    throw lastError;
  }

  private async requestOnce<T>(options: RequestOptions): Promise<T> {
    const auth = options.auth ?? false;

    if (auth && !this.apiKey) {
      throw new SASConfigurationError(
        "Missing SAS API key. Pass apiKey to SASClient or set SAS_API_KEY."
      );
    }

    const url = this.buildUrl(options.path, options.query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = this.buildHeaders(auth, options.body !== undefined);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal
      });

      const body = await parseResponseBody(response);

      if (!response.ok) {
        throw this.toApiError(response, body);
      }

      return body as T;
    } catch (err) {
      if (err instanceof SASAPIError) throw err;
      if (isAbortError(err)) throw new SASTimeoutError(this.timeoutMs, err);
      throw new SASNetworkError("SAS network request failed.", err);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  private buildHeaders(auth: boolean, hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      accept: "application/json",
      "user-agent": SDK_USER_AGENT,
      ...this.defaultHeaders
    };

    if (hasBody) {
      headers["content-type"] = "application/json";
    }

    // Never allow custom X-API-Key to be the source of truth.
    // Constructor/env API key is canonical for authenticated endpoints.
    // Public endpoints must not receive X-API-Key at all.
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === "x-api-key") {
        delete headers[key];
      }
    }

    if (auth && this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }

    return headers;
  }

  private toApiError(response: Response, body: unknown): SASAPIError {
    const headers = headersToRecord(response.headers);
    const requestId = getRequestId(response.headers, body);
    const rateLimit = getRateLimitInfo(response.headers, body);
    const retryAfter = rateLimit.retryAfter;

    const base = {
      message: `SAS API request failed with status ${response.status}.`,
      status: response.status,
      statusText: response.statusText,
      body,
      headers,
      requestId,
      retryAfter,
      rateLimit
    };

    if (response.status === 401 || response.status === 403) return new SASAuthenticationError(base);
    if (response.status === 422) return new SASValidationError(base);
    if (response.status === 429) return new SASRateLimitError(base);
    if (response.status >= 500) return new SASServerError(base);
    return new SASAPIError(base);
  }
}

function getEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}

function removeUndefined<T extends object>(obj: T): Record<string, unknown> {
  const copy: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      copy[key] = value;
    }
  }

  return copy;
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: string }).name === "AbortError"
  );
}

function shouldRetry(err: unknown, retry: false | RetryOptions): boolean {
  if (retry === false) return false;
  if (err instanceof SASConfigurationError) return false;
  if (err instanceof SASAuthenticationError || err instanceof SASValidationError) return false;

  if (err instanceof SASAPIError) {
    const statuses = retry.retryOnStatuses ?? [500, 502, 503, 504];
    return statuses.includes(err.status);
  }

  if (err instanceof SASNetworkError) return true;
  return false;
}

function getRetryDelayMs(err: unknown, retry: RetryOptions, attemptIndex: number): number {
  const maxRetryDelayMs = retry.maxRetryDelayMs ?? 30_000;

  if (retry.respectRetryAfter && err instanceof SASAPIError) {
    const delay = retryAfterToDelayMs(err.retryAfter);
    if (delay !== undefined) {
      return Math.min(delay, maxRetryDelayMs);
    }
  }

  return Math.min(retry.backoffMs * Math.pow(2, attemptIndex), maxRetryDelayMs);
}
