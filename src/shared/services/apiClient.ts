import { getAccessToken, getRefreshToken, clearAuthTokens } from "../utils/authStorage";
import { refreshSession } from "./auth.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

type ApiOptions = RequestInit & {
  auth?: boolean;
};

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
