import type { SASRateLimitHeaders } from "./types.js";

export class SASError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SASNetworkError extends SASError {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class SASTimeoutError extends SASNetworkError {
  timeoutMs: number;

  constructor(timeoutMs: number, cause?: unknown) {
    super(`SAS request timed out after ${timeoutMs}ms.`, cause);
    this.timeoutMs = timeoutMs;
  }
}

export class SASAPIError extends SASError {
  status: number;
  statusText: string;
  body: unknown;
  headers: Record<string, string>;
  requestId?: string;
  retryAfter?: string | number;
  rateLimit?: SASRateLimitHeaders;

  constructor(options: {
    message: string;
    status: number;
    statusText: string;
    body: unknown;
    headers: Record<string, string>;
    requestId?: string;
    retryAfter?: string | number;
    rateLimit?: SASRateLimitHeaders;
  }) {
    super(options.message);
    this.status = options.status;
    this.statusText = options.statusText;
    this.body = options.body;
    this.headers = options.headers;
    this.requestId = options.requestId;
    this.retryAfter = options.retryAfter;
    this.rateLimit = options.rateLimit;
  }
}

export class SASAuthenticationError extends SASAPIError {}
export class SASValidationError extends SASAPIError {}
export class SASRateLimitError extends SASAPIError {}
export class SASServerError extends SASAPIError {}
export class SASConfigurationError extends SASError {}
