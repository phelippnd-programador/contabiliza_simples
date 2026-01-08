import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import { buildDedupeKey, formatLocalISODateTime } from "../utils/estoque.utils";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type EstoqueResumo = {
  id: string;
  produtoId?: string;
  depositoId?: string;
  descricao?: string;
  codigo?: string;
  unidade?: string;
  valorUnitario?: number;
  fornecedorId?: string;
  localizacao?: string;
  item?: string;
  quantidade: number;
  quantidadeReservada?: number;
  quantidadeDisponivel?: number;
  custoMedio?: number;
  estoqueMinimo?: number;
};

export type EstoquePayload = {
  produtoId: string;
  depositoId?: string;
  descricao?: string;
  quantidade: number;
  quantidadeReservada?: number;
  custoMedio?: number;
  estoqueMinimo?: number;
};

export type EstoqueMovimentoTipo = "ENTRADA" | "SAIDA" | "AJUSTE";

export type EstoqueMovimentoResumo = {
  id: string;
  itemId: string;
  depositoId?: string;
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
  createdAt?: string;
  createdBy?: string;
  dedupeKey?: string;
  reversoDe?: string;
};

export type EstoqueMovimentoPayload = {
  tipo: EstoqueMovimentoTipo;
  quantidade: number;
  custoUnitario?: number;
  data: string;
  depositoId?: string;
  lote?: string;
  serie?: string;
  origem?: "MANUAL" | "VENDA" | "COMPRA";
  origemId?: string;
  observacoes?: string;
  allowNegative?: boolean;
  createdAt?: string;
  createdBy?: string;
  dedupeKey?: string;
  reversoDe?: string;
};

export type ListEstoqueParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export type EstoqueDepositoResumo = {
  id: string;
  nome: string;
  ativo?: boolean;
  observacoes?: string;
};

export type ListMovimentosParams = {
  page?: number;
  pageSize?: number;
  dataInicio?: string;
  dataFim?: string;
  origem?: "MANUAL" | "VENDA" | "COMPRA";
  lote?: string;
  serie?: string;
  depositoId?: string;
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
    throw new Error("API_NOT_CONFIGURED");
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

export async function listDepositos(): Promise<EstoqueDepositoResumo[]> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/estoque/depositos");
  if (!res.ok) {
    throw new Error("LIST_ESTOQUE_DEPOSITOS_FAILED");
  }
  const payload = (await res.json()) as
    | EstoqueDepositoResumo[]
    | ApiListResponse<EstoqueDepositoResumo>;
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
}

export async function createDeposito(
  payload: Pick<EstoqueDepositoResumo, "nome" | "ativo" | "observacoes">
): Promise<EstoqueDepositoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/estoque/depositos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_DEPOSITO_FAILED");
  }
  return (await res.json()) as EstoqueDepositoResumo;
}

export async function updateDeposito(
  id: string,
  payload: Partial<Pick<EstoqueDepositoResumo, "nome" | "ativo" | "observacoes">>
): Promise<EstoqueDepositoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/estoque/depositos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_DEPOSITO_FAILED");
  }
  return (await res.json()) as EstoqueDepositoResumo;
}

export async function deleteDeposito(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/estoque/depositos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_DEPOSITO_FAILED");
  }
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
    throw new Error("API_NOT_CONFIGURED");
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (paramFiltro.dataInicio) query.set("data_gte", paramFiltro.dataInicio);
  if (paramFiltro.dataFim) query.set("data_lte", paramFiltro.dataFim);
  if (paramFiltro.origem) query.set("origem", paramFiltro.origem);
  if (paramFiltro.lote) query.set("lote", paramFiltro.lote);
  if (paramFiltro.serie) query.set("serie", paramFiltro.serie);
  if (paramFiltro.depositoId) query.set("depositoId", paramFiltro.depositoId);
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
  const dedupeKey = payload.dedupeKey ?? buildDedupeKey({
    itemId,
    tipo: payload.tipo,
    quantidade: payload.quantidade,
    data: payload.data,
    custoUnitario: payload.custoUnitario,
    origem: payload.origem,
    origemId: payload.origemId,
    lote: payload.lote,
    serie: payload.serie,
    depositoId: payload.depositoId,
  });
  const body = {
    ...payload,
    dedupeKey,
    createdAt: payload.createdAt ?? formatLocalISODateTime(),
    createdBy: payload.createdBy ?? "Sistema",
  };
  const res = await apiFetch(`/estoque/${itemId}/movimentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error("CREATE_ESTOQUE_MOVIMENTO_FAILED");
  }
  return (await res.json()) as EstoqueMovimentoResumo;
}

export async function reverterMovimento(
  itemId: string,
  movimento: EstoqueMovimentoResumo
): Promise<EstoqueMovimentoResumo> {
  const tipoReverso: EstoqueMovimentoTipo =
    movimento.tipo === "ENTRADA" ? "SAIDA" : "ENTRADA";
  return createMovimento(itemId, {
    tipo: tipoReverso,
    quantidade: movimento.quantidade,
    data: formatLocalISODate(),
    custoUnitario: movimento.custoUnitario,
    origem: "MANUAL",
    origemId: movimento.id,
    observacoes: `Estorno do movimento ${movimento.id}`,
    reversoDe: movimento.id,
    depositoId: movimento.depositoId,
  });
}
