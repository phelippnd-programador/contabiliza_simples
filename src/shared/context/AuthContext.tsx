import type { Role } from "../types/auth-types";

export function useAuth() {
  // depois isso vem da API
  return {
    isAuthenticated: true,
    role: "EMPRESA" as Role,
  };
}
