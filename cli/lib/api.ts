/**
 * Minimal client for the hosted My Ui API.
 *
 * Every call is explicit about the base URL and token. When no API is
 * configured the caller receives an ApiError with status 0, which the CLI
 * turns into an actionable "no API configured" message. Nothing here is
 * reached by `search`, `audit`, `review`, `status`, `tokens` or
 * `map-tokens` — those run fully offline.
 */
import { resolveApiUrl, resolveToken } from "./config";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface ApiOptions {
  apiUrl?: string;
  token?: string;
  method?: string;
  body?: unknown;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function apiRequest<T = unknown>(pathname: string, options: ApiOptions = {}): Promise<T> {
  const base = resolveApiUrl(options.apiUrl);
  if (!base) {
    throw new ApiError(
      "No API URL configured. Pass --api-url, set MYUI_API_URL, or run `myui login --api-url <url>`.",
      0,
    );
  }

  const url = `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  const token = resolveToken(options.token);
  const headers: Record<string, string> = { accept: "application/json", ...options.headers };
  if (token) headers.authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (options.body !== undefined) {
    if (typeof options.body === "string") {
      body = options.body;
    } else {
      headers["content-type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body,
      // Node 20 ships AbortSignal.timeout.
      signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ApiError(`Could not reach ${base}: ${message}`, 0);
  }

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // Leave the raw text in place; the caller can still show it.
  }

  if (!response.ok) {
    const detail =
      parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : response.statusText;
    throw new ApiError(`${response.status} ${detail || "request failed"}`, response.status, parsed);
  }

  return parsed as T;
}

export interface MeResponse {
  user?: { email?: string; name?: string; username?: string };
  email?: string;
  expiresAt?: string;
}

export async function fetchMe(options: ApiOptions = {}): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/v1/me", options);
}

export interface RemoteSearchResponse {
  query?: string;
  total?: number;
  count?: number;
  results?: unknown[];
  [key: string]: unknown;
}

export async function remoteSearch(
  query: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options: ApiOptions = {},
): Promise<RemoteSearchResponse> {
  const search = new URLSearchParams();
  if (query) search.set("q", query);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const suffix = search.toString();
  return apiRequest<RemoteSearchResponse>(`/api/v1/search${suffix ? `?${suffix}` : ""}`, options);
}

export async function publishRemote(
  payload: unknown,
  options: ApiOptions = {},
): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>("/api/v1/publish", {
    ...options,
    method: "POST",
    body: payload,
  });
}
