const ACCESS_TOKEN_KEY = "auth.accessToken";
const REFRESH_TOKEN_KEY = "auth.refreshToken";
const ROLE_KEY = "auth.role";

const memoryStore: Record<string, string | null> = {
  [ACCESS_TOKEN_KEY]: null,
  [REFRESH_TOKEN_KEY]: null,
  [ROLE_KEY]: null,
};

const getStorage = (): Storage | null => {
  try {
    if (typeof window === "undefined") return null;
    if (!window.sessionStorage) return null;
    const probeKey = "__auth_probe__";
    window.sessionStorage.setItem(probeKey, "1");
    window.sessionStorage.removeItem(probeKey);
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const readValue = (key: string) => {
  const storage = getStorage();
  if (storage) return storage.getItem(key);
  return memoryStore[key] ?? null;
};

const writeValue = (key: string, value: string) => {
  const storage = getStorage();
  if (storage) {
    storage.setItem(key, value);
  } else {
    memoryStore[key] = value;
  }
};

const removeValue = (key: string) => {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(key);
  }
  memoryStore[key] = null;
};

export const getAccessToken = () => readValue(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => readValue(REFRESH_TOKEN_KEY);

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  writeValue(ACCESS_TOKEN_KEY, accessToken);
  writeValue(REFRESH_TOKEN_KEY, refreshToken);
};

export const setAuthRole = (role: string) => {
  writeValue(ROLE_KEY, role);
};

export const getAuthRole = () => readValue(ROLE_KEY);

export const clearAuthTokens = () => {
  removeValue(ACCESS_TOKEN_KEY);
  removeValue(REFRESH_TOKEN_KEY);
  removeValue(ROLE_KEY);
};
