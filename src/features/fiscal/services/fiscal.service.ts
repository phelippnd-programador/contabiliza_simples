import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ApuracaoResumo = {
  id: string;
  competencia: string;
  tributo: string;
  valor: number;
  status?: string;
};

export type ObrigacaoResumo = {
  id: string;
  obrigacao: string;
  vencimento: string;
  status?: string;
};

export type ApuracaoPayload = {
  competencia: string;
  tributo: string;
  valor: number;
  status?: string;
};

export type ObrigacaoPayload = {
  obrigacao: string;
  vencimento: string;
  status?: string;
};

export type ListApuracoesParams = {
  page?: number;
  pageSize?: number;
  competencia?: string;
  status?: string;
};

export type ListObrigacoesParams = {
  page?: number;
  pageSize?: number;
  vencimentoInicio?: string;
  vencimentoFim?: string;
  status?: string;
};

export async function getApuracao(id: string): Promise<ApuracaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/fiscal/apuracoes/${id}`);
  if (!res.ok) {
    throw new Error("GET_APURACAO_FAILED");
  }
  return (await res.json()) as ApuracaoResumo;
}

export async function listApuracoes(
  params: ListApuracoesParams = {}
): Promise<ApiListResponse<ApuracaoResumo>> {
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

  const res = await apiFetch(`/fiscal/apuracoes?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_APURACOES_FAILED");
  }
  return (await res.json()) as ApiListResponse<ApuracaoResumo>;
}

export async function createApuracao(
  payload: ApuracaoPayload
): Promise<ApuracaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/fiscal/apuracoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_APURACAO_FAILED");
  }
  return (await res.json()) as ApuracaoResumo;
}

export async function updateApuracao(
  id: string,
  payload: Partial<ApuracaoPayload>
): Promise<ApuracaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/fiscal/apuracoes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_APURACAO_FAILED");
  }
  return (await res.json()) as ApuracaoResumo;
}

export async function deleteApuracao(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/fiscal/apuracoes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_APURACAO_FAILED");
  }
}

export async function getObrigacao(id: string): Promise<ObrigacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/fiscal/obrigacoes/${id}`);
  if (!res.ok) {
    throw new Error("GET_OBRIGACAO_FAILED");
  }
  return (await res.json()) as ObrigacaoResumo;
}

export async function listObrigacoes(
  params: ListObrigacoesParams = {}
): Promise<ApiListResponse<ObrigacaoResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.vencimentoInicio) query.set("vencimentoInicio", params.vencimentoInicio);
  if (params.vencimentoFim) query.set("vencimentoFim", params.vencimentoFim);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/fiscal/obrigacoes?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_OBRIGACOES_FAILED");
  }
  return (await res.json()) as ApiListResponse<ObrigacaoResumo>;
}

export async function createObrigacao(
  payload: ObrigacaoPayload
): Promise<ObrigacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/fiscal/obrigacoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_OBRIGACAO_FAILED");
  }
  return (await res.json()) as ObrigacaoResumo;
}

export async function updateObrigacao(
  id: string,
  payload: Partial<ObrigacaoPayload>
): Promise<ObrigacaoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/fiscal/obrigacoes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_OBRIGACAO_FAILED");
  }
  return (await res.json()) as ObrigacaoResumo;
}

export async function deleteObrigacao(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/fiscal/obrigacoes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_OBRIGACAO_FAILED");
  }
}
