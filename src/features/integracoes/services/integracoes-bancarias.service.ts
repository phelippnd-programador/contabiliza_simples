import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type IntegracaoBancariaResumo = {
  id: string;
  banco: string;
  status?: string;
  ultimaAtualizacao?: string;
};

export type IntegracaoBancariaPayload = {
  banco: string;
  status?: string;
};

export type ListIntegracoesBancariasParams = {
  page?: number;
  pageSize?: number;
  status?: string;
};

export async function getIntegracaoBancaria(
  id: string
): Promise<IntegracaoBancariaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/integracoes/bancos/${id}`);
  if (!res.ok) {
    throw new Error("GET_INTEGRACAO_BANCARIA_FAILED");
  }
  return (await res.json()) as IntegracaoBancariaResumo;
}

export async function listIntegracoesBancarias(
  params: ListIntegracoesBancariasParams = {}
): Promise<ApiListResponse<IntegracaoBancariaResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/integracoes/bancos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_INTEGRACOES_BANCARIAS_FAILED");
  }
  return (await res.json()) as ApiListResponse<IntegracaoBancariaResumo>;
}

export async function createIntegracaoBancaria(
  payload: IntegracaoBancariaPayload
): Promise<IntegracaoBancariaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/integracoes/bancos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_INTEGRACAO_BANCARIA_FAILED");
  }
  return (await res.json()) as IntegracaoBancariaResumo;
}

export async function updateIntegracaoBancaria(
  id: string,
  payload: Partial<IntegracaoBancariaPayload>
): Promise<IntegracaoBancariaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/integracoes/bancos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_INTEGRACAO_BANCARIA_FAILED");
  }
  return (await res.json()) as IntegracaoBancariaResumo;
}

export async function deleteIntegracaoBancaria(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/integracoes/bancos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_INTEGRACAO_BANCARIA_FAILED");
  }
}
