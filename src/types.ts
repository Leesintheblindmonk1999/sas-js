export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RetryOptions {
  attempts: number;
  backoffMs: number;
  respectRetryAfter?: boolean;
  retryOnStatuses?: number[];
  maxRetryDelayMs?: number;
}

export interface SASClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  retry?: false | RetryOptions;
  headers?: Record<string, string>;
}

export interface SASRateLimitHeaders {
  retryAfter?: string | number;
  limit?: string;
  remaining?: string;
  reset?: string;
}

export interface HealthResponse {
  status: string;
  kappa_d: number;
}

export interface ReadyzResponse {
  status: "ready" | "degraded" | string;
  service: string;
  version: string;
  kappa_d: number;
  databases: {
    auth_db?: boolean;
    metrics_db?: boolean;
    audit_db?: boolean;
    rate_limit_db?: boolean;
    interaction_db?: boolean;
    [key: string]: boolean | undefined;
  };
  routers: {
    health?: boolean;
    audit?: boolean;
    diff?: boolean;
    admin?: boolean;
    metrics?: boolean;
    public_activity?: boolean;
    public_interaction_stats?: boolean;
    public_demo?: boolean;
    public_request_key?: boolean;
    whoami?: boolean;
    billing_polar?: boolean;
    billing_mercadopago?: boolean;
    chat?: boolean;
    audit_conversation?: boolean;
    status?: boolean;
    external_audit?: boolean;
    batch?: boolean;
    notarization?: boolean;
    interaction_stability?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface DemoAuditRequest {
  source: string;
  response: string;
}

export interface ManipulationAlert {
  triggered: boolean;
  sources?: string[];
}

export interface AuditEvidence {
  isi_final?: number;
  kappa_d?: number;
  fired_modules?: string[];
  [key: string]: unknown;
}

export interface DemoAuditResponse {
  status: string;
  isi: number;
  kappa_d: number;
  verdict: string;
  fired_modules?: string[];
  manipulation_alert?: ManipulationAlert;
  evidence?: AuditEvidence;
  demo?: boolean;
  latency_ms?: number;
  request_id?: string;
}

export interface WhoamiResponse {
  status: string;
  plan: string;
  active?: boolean;
  email?: string;
  email_hash?: string;
  daily_limit?: number | null;
  monthly_limit?: number | null;
  daily_used?: number | null;
  monthly_used?: number | null;
  quota_allowed?: boolean;
  quota_reason?: string | null;
  [key: string]: unknown;
}

export interface DiffRequest {
  textA: string;
  textB: string;
  experimental?: boolean;
}

export interface DiffApiRequest {
  text_a: string;
  text_b: string;
  experimental?: boolean;
}

export interface DiffResponse {
  status?: string;
  isi: number;
  kappa_d: number;
  verdict: string;
  fired_modules?: string[];
  manipulation_alert?: ManipulationAlert;
  evidence?: AuditEvidence;
  request_id?: string;
  latency_ms?: number;
  [key: string]: unknown;
}

export interface AuditRequest {
  text: string;
  experimental?: boolean;
}

export interface AuditResponse {
  status?: string;
  isi: number;
  kappa_d?: number;
  verdict: string;
  fired_modules?: string[];
  manipulation_alert?: ManipulationAlert;
  evidence?: AuditEvidence;
  request_id?: string;
  latency_ms?: number;
  [key: string]: unknown;
}

export interface BatchPair {
  source: string;
  response: string;
}

export interface BatchRequest {
  pairs: BatchPair[];
  experimental?: boolean;
}

export interface BatchItemResult {
  index: number;
  status: string;
  isi?: number;
  kappa_d?: number;
  verdict?: string;
  fired_modules?: string[];
  manipulation_alert?: ManipulationAlert;
  error?: string | null;
  [key: string]: unknown;
}

export interface BatchResponse {
  status: string;
  count: number;
  results: BatchItemResult[];
  batch?: boolean;
  latency_ms?: number;
  request_id?: string;
}

export interface PublicStatsResponse {
  status: string;
  period?: string;
  total_requests?: number;
  total_errors?: number;
  total_2xx?: number;
  total_4xx?: number;
  total_5xx?: number;
  avg_latency_ms?: number;
  countries?: Record<string, number>;
  paths?: Record<string, number>;
  plans?: Record<string, number>;
  [key: string]: unknown;
}

export interface PublicActivityOptions {
  limit?: number;
}

export interface PublicActivityEvent {
  ts_utc?: string;
  time_bucket_utc?: string;
  method?: string;
  path?: string;
  status_bucket?: string;
  country?: string;
  plan?: string;
  [key: string]: unknown;
}

export interface PublicActivityResponse {
  status: string;
  activity?: PublicActivityEvent[];
  events?: PublicActivityEvent[];
  limit?: number;
  [key: string]: unknown;
}

export interface PublicInteractionStatsOptions {
  days?: number;
}

export interface PublicInteractionStatsResponse {
  status: string;
  period: string;
  total_analyses: number;
  avg_conversation_turns?: number;
  avg_assistant_turns?: number;
  avg_final_sigma?: number;
  avg_final_omega_t?: number;
  avg_demand_peak?: number;
  threshold_crossed_pct?: number;
  stability_below_kappa_pct?: number;
  high_uncertainty_pct?: number;
  avg_latency_ms?: number;
  dominant_states_distribution?: Record<string, number>;
  plan_distribution?: Record<string, number>;
  sigma_buckets?: Record<string, number>;
  demand_peak_buckets?: Record<string, number>;
  privacy: {
    raw_text_stored: boolean;
    raw_api_keys_stored: boolean;
    public_stats_are_aggregated: boolean;
  };
}

export type InteractionRole = "user" | "assistant" | "system" | string;

export interface InteractionTurn {
  role: InteractionRole;
  content: string;
}

export type InteractionMode = "analyze" | string;

export interface InteractionStabilityRequest {
  conversation: InteractionTurn[];
  gamma?: number;
  window?: number;
  kappaD?: number;
  alpha?: number;
  mode?: InteractionMode;
  normalizeDemand?: boolean;
}

export interface InteractionStabilityApiRequest {
  conversation: InteractionTurn[];
  gamma?: number;
  window?: number;
  kappa_d?: number;
  alpha?: number;
  mode?: InteractionMode;
  normalize_demand?: boolean;
}

export interface InteractionBeliefState {
  Open?: number;
  Ambivalent?: number;
  Saturated?: number;
  Avoidant?: number;
  Defensive?: number;
  [key: string]: number | undefined;
}

export interface InteractionTrajectoryPoint {
  t: number;
  raw_turn_index?: number;
  user_action?: string;
  agent_observation?: string;
  demand?: number;
  effective_window?: number;
  belief?: InteractionBeliefState;
  dominant_state?: string;
  dominant_probability?: number;
  omega_t?: number;
  belief_coherence_chi?: number;
  interaction_stability_sigma?: number;
  alerts?: {
    threshold_crossed?: boolean;
    stability_below_kappa?: boolean;
    high_uncertainty?: boolean;
    [key: string]: boolean | undefined;
  };
  [key: string]: unknown;
}

export interface InteractionSummary {
  final_omega_t?: number;
  final_chi?: number;
  final_sigma?: number;
  final_dominant_state?: string;
  final_dominant_probability?: number;
  demand_peak?: number;
  alerts?: {
    threshold_crossed?: boolean;
    stability_below_kappa?: boolean;
    high_uncertainty?: boolean;
    [key: string]: boolean | undefined;
  };
  [key: string]: unknown;
}

export interface InteractionStabilityResponse {
  status: string;
  mode: string;
  model_version?: string;
  theory_reference?: string;
  theory_doi?: string;
  kappa_d_ref?: number;
  theta_hat?: number;
  alpha?: number;
  trajectory: InteractionTrajectoryPoint[];
  summary: InteractionSummary;
  request_id?: string;
  executed_at?: string;
  input_hash?: string;
  content_fingerprint?: string;
  skipped_turns?: unknown[];
  [key: string]: unknown;
}

export interface InteractionStabilityExampleResponse {
  experimental_notice?: string;
  likelihood_note?: string;
  omega_note?: string;
  sigma_note?: string;
  threshold_note?: string;
  conjecture_note?: string;
  demand_note?: string;
  theory_doi?: string;
  conversation: InteractionTurn[];
  gamma?: number;
  window?: number;
  kappa_d?: number;
  alpha?: number;
  mode?: InteractionMode;
  normalize_demand?: boolean;
  [key: string]: unknown;
}
