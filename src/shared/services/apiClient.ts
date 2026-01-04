import { getAccessToken, getRefreshToken, clearAuthTokens } from "../utils/authStorage";
import { refreshSession } from "./auth.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  title?: string;
  code?: string;
  errorCode?: string;
  details?: unknown;
  errors?: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function ensureRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((res) => Boolean(res))
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function handleUnauthorized() {
  clearAuthTokens();
  window.location.assign("/login");
}

export async function toApiError(
  response: Response,
  fallbackMessage = "Erro ao comunicar com o servidor."
): Promise<ApiError> {
  let message = fallbackMessage;
  let code: string | undefined;
  let details: unknown;

  try {
    const data = (await response.clone().json()) as ApiErrorPayload;
    if (data) {
      message = data.message || data.error || data.title || message;
      code = data.code || data.errorCode;
      details = data.details ?? data.errors;
    }
  } catch {
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {
      // ignore
    }
  }

  return new ApiError(message, response.status, code, details);
}

export function getErrorMessage(
  error: unknown,
  fallback = "Erro inesperado."
): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function apiFetch(
  path: string,
  options: ApiOptions = {}
): Promise<Response> {
  const { auth = true, ...rest } = options;
  const headers = new Headers(rest.headers);

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
  });

  if (response.status !== 401 || !auth) return response;

  if (!getRefreshToken()) {
    handleUnauthorized();
    return response;
  }

  const refreshed = await ensureRefresh();
  if (!refreshed) {
    handleUnauthorized();
    return response;
  }

  const retryHeaders = new Headers(rest.headers);
  const token = getAccessToken();
  if (token) retryHeaders.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: retryHeaders,
  });
}
