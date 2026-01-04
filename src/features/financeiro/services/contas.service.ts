import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { ContaBancaria, TipoConta, TipoMovimentoCaixa } from "../types";
import {
  deleteConta as deleteContaStorage,
  getConta as getContaStorage,
  listContas as listContasStorage,
  saveConta as saveContaStorage,
} from "../storage/contas";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ListContasParams = {
  page?: number;
  pageSize?: number;
  tipo?: TipoConta;
  categoria?: TipoMovimentoCaixa;
  q?: string;
};

export async function listContas(
  params: ListContasParams = {}
): Promise<ContaBancaria[]> {
  if (!API_BASE) {
    return listContasStorage();
  }
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.tipo) query.set("tipo", params.tipo);
  if (params.categoria) query.set("categoria", params.categoria);
  if (params.q) query.set("q", params.q);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch(`/financeiro/contas${suffix}`);
  if (!res.ok) {
    throw new Error("LIST_CONTAS_FAILED");
  }
  const data = (await res.json()) as ApiListResponse<ContaBancaria>;
  return data.data ?? [];
}

export async function getConta(
  id: string
): Promise<ContaBancaria | undefined> {
  if (!API_BASE) {
    return getContaStorage(id);
  }
  const res = await apiFetch(`/financeiro/contas/${id}`);
  if (!res.ok) {
    throw new Error("GET_CONTA_FAILED");
  }
  return (await res.json()) as ContaBancaria;
}

export async function saveConta(
  data: Omit<ContaBancaria, "id"> & { id?: string }
): Promise<ContaBancaria> {
  if (!API_BASE) {
    return saveContaStorage(data);
  }
  const method = data.id ? "PUT" : "POST";
  const path = data.id ? `/financeiro/contas/${data.id}` : "/financeiro/contas";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("SAVE_CONTA_FAILED");
  }
  return (await res.json()) as ContaBancaria;
}

export async function deleteConta(id: string): Promise<void> {
  if (!API_BASE) {
    deleteContaStorage(id);
    return;
  }
  const res = await apiFetch(`/financeiro/contas/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("DELETE_CONTA_FAILED");
  }
}
