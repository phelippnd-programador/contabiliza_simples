import { apiFetch } from "./apiClient";

export type UserProfile = {
  nome?: string;
  email?: string;
  telefone?: string;
  fotoUrl?: string;
};

const STORAGE_KEY = "usuario.perfil";
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const load = (): UserProfile => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as UserProfile) : {};
  } catch {
    return {};
  }
};

const persist = (profile: UserProfile) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export async function getUserProfile(): Promise<UserProfile> {
  if (!API_BASE) {
    return load();
  }
  const response = await apiFetch("/usuarios/perfil");
  if (!response.ok) {
    throw new Error("GET_PROFILE_FAILED");
  }
  return (await response.json()) as UserProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  if (!API_BASE) {
    const next = { ...load(), ...profile };
    persist(next);
    return next;
  }
  const response = await apiFetch("/usuarios/perfil", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    throw new Error("SAVE_PROFILE_FAILED");
  }
  return (await response.json()) as UserProfile;
}
