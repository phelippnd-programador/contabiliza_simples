import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { OrcamentoFinanceiro } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const normalizeList = (
  payload: ApiListResponse<OrcamentoFinanceiro> | OrcamentoFinanceiro[]
) => (Array.isArray(payload) ? payload : payload.data ?? []);

export async function listOrcamentos(
  competencia?: string
): Promise<OrcamentoFinanceiro[]> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const query = new URLSearchParams();
  if (competencia) query.set("competencia", competencia);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch(`/financeiro/orcamentos${suffix}`);
  if (!res.ok) {
    throw new Error("LIST_ORCAMENTOS_FAILED");
  }
  const data = (await res.json()) as
    | ApiListResponse<OrcamentoFinanceiro>
    | OrcamentoFinanceiro[];
  return normalizeList(data);
}

export async function saveOrcamento(
  payload: Omit<OrcamentoFinanceiro, "id"> & { id?: string }
): Promise<OrcamentoFinanceiro> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const method = payload.id ? "PUT" : "POST";
  const path = payload.id
    ? `/financeiro/orcamentos/${payload.id}`
    : "/financeiro/orcamentos";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("SAVE_ORCAMENTO_FAILED");
  }
  return (await res.json()) as OrcamentoFinanceiro;
}

export async function deleteOrcamento(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/orcamentos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_ORCAMENTO_FAILED");
  }
}
