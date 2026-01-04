import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ContaReceberResumo = {
  id: string;
  cliente: string;
  vencimento: string;
  valor: number;
  status?: string;
  origem?: "VENDA" | "MANUAL";
  origemId?: string;
  descricao?: string;
  numeroDocumento?: string;
  competencia?: string;
  parcela?: number;
  totalParcelas?: number;
  valorOriginal?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  valorRecebido?: number;
  dataRecebimento?: string;
  formaPagamento?: string;
  contaId?: string;
  categoriaId?: string;
  observacoes?: string;
};

export type ContaReceberPayload = {
  cliente: string;
  vencimento: string;
  valor: number;
  status?: string;
  origem?: "VENDA" | "MANUAL";
  origemId?: string;
  descricao?: string;
  numeroDocumento?: string;
  competencia?: string;
  parcela?: number;
  totalParcelas?: number;
  valorOriginal?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  valorRecebido?: number;
  dataRecebimento?: string;
  formaPagamento?: string;
  contaId?: string;
  categoriaId?: string;
  observacoes?: string;
};

export type ListContasReceberParams = {
  page?: number;
  pageSize?: number;
  vencimentoInicio?: string;
  vencimentoFim?: string;
  status?: string;
  q?: string;
};

export async function getContaReceber(
  id: string
): Promise<ContaReceberResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/contas-receber/${id}`);
  if (!res.ok) {
    throw new Error("GET_CONTA_RECEBER_FAILED");
  }
  return (await res.json()) as ContaReceberResumo;
}

export async function listContasReceber(
  params: ListContasReceberParams = {}
): Promise<ApiListResponse<ContaReceberResumo>> {
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
  if (params.q) query.set("q", params.q);

  const res = await apiFetch(`/financeiro/contas-receber?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CONTAS_RECEBER_FAILED");
  }
  return (await res.json()) as ApiListResponse<ContaReceberResumo>;
}

export async function createContaReceber(
  payload: ContaReceberPayload
): Promise<ContaReceberResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/financeiro/contas-receber", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CONTA_RECEBER_FAILED");
  }
  return (await res.json()) as ContaReceberResumo;
}

export async function updateContaReceber(
  id: string,
  payload: Partial<ContaReceberPayload>
): Promise<ContaReceberResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/contas-receber/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CONTA_RECEBER_FAILED");
  }
  return (await res.json()) as ContaReceberResumo;
}

export async function deleteContaReceber(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/contas-receber/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CONTA_RECEBER_FAILED");
  }
}
