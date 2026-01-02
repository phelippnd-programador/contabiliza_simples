const ACCESS_TOKEN_KEY = "auth.accessToken";
const REFRESH_TOKEN_KEY = "auth.refreshToken";
const ROLE_KEY = "auth.role";

export const getAccessToken = () => window.localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () =>
  window.localStorage.getItem(REFRESH_TOKEN_KEY);

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const setAuthRole = (role: string) => {
  window.localStorage.setItem(ROLE_KEY, role);
};

export const getAuthRole = () => window.localStorage.getItem(ROLE_KEY);

export const clearAuthTokens = () => {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
};
