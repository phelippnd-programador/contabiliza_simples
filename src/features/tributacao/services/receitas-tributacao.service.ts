import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ReceitaTributacaoResumo = {
  id: string;
  competencia: string;
  valor: number;
  origem?: string;
  status?: string;
};

export type ReceitaTributacaoPayload = {
  competencia: string;
  valor: number;
  origem?: string;
  status?: string;
};

export type ListReceitasTributacaoParams = {
  page?: number;
  pageSize?: number;
  competencia?: string;
  status?: string;
};

export async function getReceitaTributacao(
  id: string
): Promise<ReceitaTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/receitas/${id}`);
  if (!res.ok) {
    throw new Error("GET_RECEITA_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ReceitaTributacaoResumo;
}

export async function listReceitasTributacao(
  params: ListReceitasTributacaoParams = {}
): Promise<ApiListResponse<ReceitaTributacaoResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.competencia) query.set("competencia", params.competencia);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/tributacao/receitas?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_RECEITAS_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ApiListResponse<ReceitaTributacaoResumo>;
}

export async function createReceitaTributacao(
  payload: ReceitaTributacaoPayload
): Promise<ReceitaTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/tributacao/receitas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_RECEITA_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ReceitaTributacaoResumo;
}

export async function updateReceitaTributacao(
  id: string,
  payload: Partial<ReceitaTributacaoPayload>
): Promise<ReceitaTributacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/receitas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_RECEITA_TRIBUTACAO_FAILED");
  }
  return (await res.json()) as ReceitaTributacaoResumo;
}

export async function deleteReceitaTributacao(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/tributacao/receitas/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_RECEITA_TRIBUTACAO_FAILED");
  }
}
