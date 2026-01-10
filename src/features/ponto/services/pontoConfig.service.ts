import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { PontoConfig, PontoFuncionarioConfig } from "../utils/pontoConfig";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function listPontoConfig(): Promise<PontoConfig | null> {
  if (!API_BASE) return null;
  const res = await apiFetch("/rh/ponto-config");
  if (!res.ok) throw new Error("LIST_PONTO_CONFIG_FAILED");
  const payload = (await res.json()) as ApiListResponse<PontoConfig> | PontoConfig[];
  const list = Array.isArray(payload) ? payload : payload.data ?? [];
  return list[0] ?? null;
}

export async function savePontoConfig(config: PontoConfig): Promise<PontoConfig> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const id = config.id ?? 1;
  const res = await apiFetch(`/rh/ponto-config/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...config, id }),
  });
  if (!res.ok) throw new Error("SAVE_PONTO_CONFIG_FAILED");
  return (await res.json()) as PontoConfig;
}

export async function listPontoFuncionarioConfig(): Promise<PontoFuncionarioConfig[]> {
  if (!API_BASE) return [];
  const res = await apiFetch("/rh/ponto-config-funcionarios");
  if (!res.ok) throw new Error("LIST_PONTO_CONFIG_FUNC_FAILED");
  const payload = (await res.json()) as ApiListResponse<PontoFuncionarioConfig> | PontoFuncionarioConfig[];
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

export async function savePontoFuncionarioConfig(
  payload: PontoFuncionarioConfig
): Promise<PontoFuncionarioConfig> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const hasId = Boolean(payload.id);
  const res = await apiFetch(
    hasId ? `/rh/ponto-config-funcionarios/${payload.id}` : "/rh/ponto-config-funcionarios",
    {
      method: hasId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error("SAVE_PONTO_CONFIG_FUNC_FAILED");
  return (await res.json()) as PontoFuncionarioConfig;
}

export async function deletePontoFuncionarioConfig(id: string | number): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/ponto-config-funcionarios/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_PONTO_CONFIG_FUNC_FAILED");
}
