import type { EmpresaResumo } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function listEmpresas(): Promise<EmpresaResumo[]> {
  // TODO: ajustar endpoint real do backend
  const res = await fetch(`${API_BASE}/empresas`);
  if (!res.ok) {
    throw new Error("LIST_EMPRESAS_FAILED");
  }
  return (await res.json()) as EmpresaResumo[];
}
