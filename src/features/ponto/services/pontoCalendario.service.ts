import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type {
  PontoCalendarioFuncionarioItem,
  PontoCalendarioItem,
} from "../utils/pontoCalendario";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function listCalendario(): Promise<PontoCalendarioItem[]> {
  if (!API_BASE) return [];
  const res = await apiFetch("/rh/ponto-calendario");
  if (!res.ok) throw new Error("LIST_PONTO_CALENDARIO_FAILED");
  const payload = (await res.json()) as ApiListResponse<PontoCalendarioItem> | PontoCalendarioItem[];
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

export async function saveCalendarioItem(
  payload: PontoCalendarioItem
): Promise<PontoCalendarioItem> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const hasId = Boolean(payload.id);
  const res = await apiFetch(
    hasId ? `/rh/ponto-calendario/${payload.id}` : "/rh/ponto-calendario",
    {
      method: hasId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error("SAVE_PONTO_CALENDARIO_FAILED");
  return (await res.json()) as PontoCalendarioItem;
}

export async function deleteCalendarioItem(id: number | string): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/ponto-calendario/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_PONTO_CALENDARIO_FAILED");
}

export async function listCalendarioFuncionario(): Promise<PontoCalendarioFuncionarioItem[]> {
  if (!API_BASE) return [];
  const res = await apiFetch("/rh/ponto-calendario-funcionarios");
  if (!res.ok) throw new Error("LIST_PONTO_CALENDARIO_FUNC_FAILED");
  const payload = (await res.json()) as
    | ApiListResponse<PontoCalendarioFuncionarioItem>
    | PontoCalendarioFuncionarioItem[];
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

export async function saveCalendarioFuncionarioItem(
  payload: PontoCalendarioFuncionarioItem
): Promise<PontoCalendarioFuncionarioItem> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const hasId = Boolean(payload.id);
  const res = await apiFetch(
    hasId
      ? `/rh/ponto-calendario-funcionarios/${payload.id}`
      : "/rh/ponto-calendario-funcionarios",
    {
      method: hasId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error("SAVE_PONTO_CALENDARIO_FUNC_FAILED");
  return (await res.json()) as PontoCalendarioFuncionarioItem;
}

export async function deleteCalendarioFuncionarioItem(
  id: number | string
): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/ponto-calendario-funcionarios/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_PONTO_CALENDARIO_FUNC_FAILED");
}
