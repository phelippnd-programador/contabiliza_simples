import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { ExtratoBancarioItem } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function listExtratoBancario(): Promise<ExtratoBancarioItem[]> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch("/financeiro/extratos");
  if (!res.ok) throw new Error("LIST_EXTRATO_FAILED");
  const payload = (await res.json()) as ApiListResponse<ExtratoBancarioItem> | ExtratoBancarioItem[];
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

export async function saveExtratoBancario(
  payload: Omit<ExtratoBancarioItem, "id"> & { id?: string }
): Promise<ExtratoBancarioItem> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const method = payload.id ? "PUT" : "POST";
  const path = payload.id ? `/financeiro/extratos/${payload.id}` : "/financeiro/extratos";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("SAVE_EXTRATO_FAILED");
  return (await res.json()) as ExtratoBancarioItem;
}

export async function deleteExtratoBancario(id: string): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/financeiro/extratos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_EXTRATO_FAILED");
}
