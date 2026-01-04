import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type CaixaTributacaoResumo = {
  id: string;
  competencia: string;
  conta: string;
  valor: number;
  status?: string;
};

export type CaixaTributacaoPayload = {
  competencia: string;
  conta: string;
  valor: number;
  status?: string;
};

export type ListCaixaTributacaoParams = {
  page?: number;
  pageSize?: number;
  competencia?: string;
  conta?: string;
  status?: string;
};

export async function getCaixaTributacao(
  id: string
): Promise<CaixaTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/caixa/${id}`);
  if (!res.ok) {
    throw new Error("GET_CAIXA_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as CaixaTributacaoResumo;
}

export async function listCaixaTributacao(
  params: ListCaixaTributacaoParams = {}
): Promise<ApiListResponse<CaixaTributacaoResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.competencia) query.set("competencia", params.competencia);
  if (params.conta) query.set("conta", params.conta);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/tributacao/caixa?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CAIXA_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ApiListResponse<CaixaTributacaoResumo>;
}

export async function createCaixaTributacao(
  payload: CaixaTributacaoPayload
): Promise<CaixaTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/tributacao/caixa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CAIXA_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as CaixaTributacaoResumo;
}

export async function updateCaixaTributacao(
  id: string,
  payload: Partial<CaixaTributacaoPayload>
): Promise<CaixaTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/caixa/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CAIXA_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as CaixaTributacaoResumo;
}

export async function deleteCaixaTributacao(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/caixa/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CAIXA_TRIBUTACAO_FAILED");
  }
}
