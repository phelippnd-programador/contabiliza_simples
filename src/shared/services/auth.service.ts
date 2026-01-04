import type { Role } from "../types/auth-types";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  getAuthRole,
  setAuthTokens,
  setAuthRole,
} from "../utils/authStorage";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role?: Role;
};

const demoUsers: Array<{ email: string; senha: string; role: Role }> = [
  { email: "admin@teste.com", senha: "admin123", role: "CONTADOR" },
  { email: "empresa@teste.com", senha: "empresa123", role: "EMPRESA" },
];

export async function loginWithPassword(
  email: string,
  senha: string
): Promise<LoginResponse> {
  if (!API_BASE) {
    const user = demoUsers.find(
      (item) => item.email === email && item.senha === senha
    );
    if (!user) {
      throw new Error("LOGIN_FAILED");
    }
    const accessToken = `demo-access-${Date.now()}`;
    const refreshToken = `demo-refresh-${Date.now()}`;
    setAuthTokens(accessToken, refreshToken);
    setAuthRole(user.role);
    return { accessToken, refreshToken, role: user.role };
  }

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  if (!response.ok) {
    throw new Error("LOGIN_FAILED");
  }
  const data = (await response.json()) as LoginResponse;
  setAuthTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function refreshSession(): Promise<LoginResponse | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!API_BASE) {
    const role = getAuthRole() as Role | null;
    const accessToken = `demo-access-${Date.now()}`;
    setAuthTokens(accessToken, refreshToken);
    return { accessToken, refreshToken, role: role ?? undefined };
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearAuthTokens();
    return null;
  }

  const data = (await response.json()) as LoginResponse;
  setAuthTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function getMe(): Promise<{ role: Role }> {
  if (!API_BASE) {
    const role = getAuthRole();
    if (!role) {
      throw new Error("ME_FAILED");
    }
    return { role: role as Role };
  }
  const token = getAccessToken();
  if (!token) {
    throw new Error("NO_TOKEN");
  }
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("ME_FAILED");
  }
  return (await response.json()) as { role: Role };
}
