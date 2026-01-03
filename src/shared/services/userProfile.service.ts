export type UserProfile = {
  nome?: string;
  email?: string;
  telefone?: string;
};

const STORAGE_KEY = "usuario.perfil";

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
  return load();
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const next = { ...load(), ...profile };
  persist(next);
  return next;
}
