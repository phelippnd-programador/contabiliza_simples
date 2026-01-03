import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ConciliacaoTributacaoResumo = {
  id: string;
  data: string;
  conta: string;
  valor: number;
  status?: string;
};

export type ConciliacaoTributacaoPayload = {
  data: string;
  conta: string;
  valor: number;
  status?: string;
};

export type ListConciliacaoTributacaoParams = {
  page?: number;
  pageSize?: number;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
};

export async function getConciliacaoTributacao(
  id: string
): Promise<ConciliacaoTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/conciliacao/${id}`);
  if (!res.ok) {
    throw new Error("GET_CONCILIACAO_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ConciliacaoTributacaoResumo;
}

export async function listConciliacaoTributacao(
  params: ListConciliacaoTributacaoParams = {}
): Promise<ApiListResponse<ConciliacaoTributacaoResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.dataInicio) query.set("dataInicio", params.dataInicio);
  if (params.dataFim) query.set("dataFim", params.dataFim);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/tributacao/conciliacao?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CONCILIACAO_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ApiListResponse<ConciliacaoTributacaoResumo>;
}

export async function createConciliacaoTributacao(
  payload: ConciliacaoTributacaoPayload
): Promise<ConciliacaoTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/tributacao/conciliacao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CONCILIACAO_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ConciliacaoTributacaoResumo;
}

export async function updateConciliacaoTributacao(
  id: string,
  payload: Partial<ConciliacaoTributacaoPayload>
): Promise<ConciliacaoTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/conciliacao/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CONCILIACAO_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ConciliacaoTributacaoResumo;
}

export async function deleteConciliacaoTributacao(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/conciliacao/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CONCILIACAO_TRIBUTACAO_FAILED");
  }
}
