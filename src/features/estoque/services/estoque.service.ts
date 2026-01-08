import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import { getLocalEstoqueData, getLocalMovimentosData } from "../utils/estoque.mock";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type EstoqueResumo = {
  id: string;
  produtoId?: string;
  descricao?: string;
  item?: string;
  quantidade: number;
  custoMedio?: number;
  estoqueMinimo?: number;
};

export type EstoquePayload = {
  produtoId: string;
  descricao?: string;
  quantidade: number;
  custoMedio?: number;
  estoqueMinimo?: number;
};

export type EstoqueMovimentoTipo = "ENTRADA" | "SAIDA" | "AJUSTE";

export type EstoqueMovimentoResumo = {
  id: string;
  itemId: string;
  tipo: EstoqueMovimentoTipo;
  quantidade: number;
  custoUnitario?: number;
  custoMedio?: number;
  saldo?: number;
  data: string;
  lote?: string;
  serie?: string;
  origem?: "MANUAL" | "VENDA" | "COMPRA";
  origemId?: string;
  observacoes?: string;
};

export type EstoqueMovimentoPayload = {
  tipo: EstoqueMovimentoTipo;
  quantidade: number;
  custoUnitario?: number;
  data: string;
  lote?: string;
  serie?: string;
  origem?: "MANUAL" | "VENDA" | "COMPRA";
  origemId?: string;
  observacoes?: string;
};

export type ListEstoqueParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export type ListMovimentosParams = {
  page?: number;
  pageSize?: number;
  dataInicio?: string;
  dataFim?: string;
  origem?: "MANUAL" | "VENDA" | "COMPRA";
  lote?: string;
  serie?: string;
};

export async function getEstoqueItem(id: string): Promise<EstoqueResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/estoque/${id}`);
  if (!res.ok) {
    throw new Error("GET_ESTOQUE_FAILED");
  }
  return (await res.json()) as EstoqueResumo;
}

export async function listEstoque(
  params: ListEstoqueParams = {}
): Promise<ApiListResponse<EstoqueResumo>> {
  const { page = 1, pageSize = 10, ...paramFiltro } = params;
  if (!API_BASE) {
    return getLocalEstoqueData(page, pageSize, paramFiltro.q);
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (paramFiltro.q) query.set("q", paramFiltro.q);
  const res = await apiFetch(`/estoque?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_ESTOQUE_FAILED");
  }
  return (await res.json()) as ApiListResponse<EstoqueResumo>;
}

export async function createEstoqueItem(
  payload: EstoquePayload
): Promise<EstoqueResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/estoque", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_ESTOQUE_FAILED");
  }
  return (await res.json()) as EstoqueResumo;
}

export async function updateEstoqueItem(
  id: string,
  payload: Partial<EstoquePayload>
): Promise<EstoqueResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/estoque/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_ESTOQUE_FAILED");
  }
  return (await res.json()) as EstoqueResumo;
}

export async function deleteEstoqueItem(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/estoque/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_ESTOQUE_FAILED");
  }
}

export async function listMovimentos(
  itemId: string,
  params: ListMovimentosParams = {}
): Promise<ApiListResponse<EstoqueMovimentoResumo>> {
  const { page = 1, pageSize = 10, ...paramFiltro } = params;
  if (!API_BASE) {
    return getLocalMovimentosData(itemId, page, pageSize, paramFiltro);
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (paramFiltro.dataInicio) query.set("data_gte", paramFiltro.dataInicio);
  if (paramFiltro.dataFim) query.set("data_lte", paramFiltro.dataFim);
  if (paramFiltro.origem) query.set("origem", paramFiltro.origem);
  if (paramFiltro.lote) query.set("lote", paramFiltro.lote);
  if (paramFiltro.serie) query.set("serie", paramFiltro.serie);
  const urlBase = itemId
    ? `/estoque/${itemId}/movimentos?${query.toString()}`
    : `/estoque/movimentos?${query.toString()}`;

  const res = await apiFetch(urlBase);
  if (!res.ok) {
    throw new Error("LIST_ESTOQUE_MOVIMENTOS_FAILED");
  }
  return (await res.json()) as ApiListResponse<EstoqueMovimentoResumo>;
}



export async function createMovimento(
  itemId: string,
  payload: EstoqueMovimentoPayload
): Promise<EstoqueMovimentoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/estoque/${itemId}/movimentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_ESTOQUE_MOVIMENTO_FAILED");
  }
  return (await res.json()) as EstoqueMovimentoResumo;
}
