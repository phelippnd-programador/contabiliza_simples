import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type {
  MovimentoCaixa,
  TipoMovimentoCaixa,
} from "../types";
import {
  deleteMovimento as deleteMovimentoStorage,
  getMovimento as getMovimentoStorage,
  listMovimentos as listMovimentosStorage,
  saveMovimento as saveMovimentoStorage,
} from "../storage/movimentos";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ListMovimentosParams = {
  page?: number;
  pageSize?: number;
  contaId?: string;
  categoriaId?: string;
  dataInicio?: string;
  dataFim?: string;
  tipo?: TipoMovimentoCaixa;
};

export async function listMovimentos(
  params: ListMovimentosParams = {}
): Promise<MovimentoCaixa[]> {
  if (!API_BASE) {
    return listMovimentosStorage();
  }
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.contaId) query.set("contaId", params.contaId);
  if (params.categoriaId) query.set("categoriaId", params.categoriaId);
  if (params.dataInicio) query.set("dataInicio", params.dataInicio);
  if (params.dataFim) query.set("dataFim", params.dataFim);
  if (params.tipo) query.set("tipo", params.tipo);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch(`/financeiro/movimentos${suffix}`);
  if (!res.ok) {
    throw new Error("LIST_MOVIMENTOS_FAILED");
  }
  const data = (await res.json()) as ApiListResponse<MovimentoCaixa>;
  return data.data ?? [];
}

export async function getMovimento(
  id: string
): Promise<MovimentoCaixa | undefined> {
  if (!API_BASE) {
    return getMovimentoStorage(id);
  }
  const res = await apiFetch(`/financeiro/movimentos/${id}`);
  if (!res.ok) {
    throw new Error("GET_MOVIMENTO_FAILED");
  }
  return (await res.json()) as MovimentoCaixa;
}

export async function saveMovimento(
  data: Omit<MovimentoCaixa, "id"> & { id?: string }
): Promise<MovimentoCaixa> {
  if (!API_BASE) {
    return saveMovimentoStorage(data);
  }
  const method = data.id ? "PUT" : "POST";
  const path = data.id
    ? `/financeiro/movimentos/${data.id}`
    : "/financeiro/movimentos";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("SAVE_MOVIMENTO_FAILED");
  }
  return (await res.json()) as MovimentoCaixa;
}

export async function deleteMovimento(id: string): Promise<void> {
  if (!API_BASE) {
    deleteMovimentoStorage(id);
    return;
  }
  const res = await apiFetch(`/financeiro/movimentos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_MOVIMENTO_FAILED");
  }
}
