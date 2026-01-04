import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ContaPagarResumo = {
  id: string;
  fornecedor: string;
  vencimento: string;
  valor: number;
  status?: string;
  descricao?: string;
  numeroDocumento?: string;
  competencia?: string;
  parcela?: number;
  totalParcelas?: number;
  valorOriginal?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  valorPago?: number;
  dataPagamento?: string;
  formaPagamento?: string;
  contaId?: string;
  categoriaId?: string;
  observacoes?: string;
};

export type ContaPagarPayload = {
  fornecedor: string;
  vencimento: string;
  valor: number;
  status?: string;
  descricao?: string;
  numeroDocumento?: string;
  competencia?: string;
  parcela?: number;
  totalParcelas?: number;
  valorOriginal?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  valorPago?: number;
  dataPagamento?: string;
  formaPagamento?: string;
  contaId?: string;
  categoriaId?: string;
  observacoes?: string;
};

export type ListContasPagarParams = {
  page?: number;
  pageSize?: number;
  vencimentoInicio?: string;
  vencimentoFim?: string;
  status?: string;
  q?: string;
};

export async function getContaPagar(id: string): Promise<ContaPagarResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/contas-pagar/${id}`);
  if (!res.ok) {
    throw new Error("GET_CONTA_PAGAR_FAILED");
  }
  return (await res.json()) as ContaPagarResumo;
}

export async function listContasPagar(
  params: ListContasPagarParams = {}
): Promise<ApiListResponse<ContaPagarResumo>> {
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

  const res = await apiFetch(`/financeiro/contas-pagar?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CONTAS_PAGAR_FAILED");
  }
  return (await res.json()) as ApiListResponse<ContaPagarResumo>;
}

export async function createContaPagar(
  payload: ContaPagarPayload
): Promise<ContaPagarResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/financeiro/contas-pagar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CONTA_PAGAR_FAILED");
  }
  return (await res.json()) as ContaPagarResumo;
}

export async function updateContaPagar(
  id: string,
  payload: Partial<ContaPagarPayload>
): Promise<ContaPagarResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/contas-pagar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CONTA_PAGAR_FAILED");
  }
  return (await res.json()) as ContaPagarResumo;
}

export async function deleteContaPagar(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/contas-pagar/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CONTA_PAGAR_FAILED");
  }
}
