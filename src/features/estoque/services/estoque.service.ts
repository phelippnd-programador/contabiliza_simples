import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type EstoqueResumo = {
  id: string;
  item: string;
  quantidade: number;
  custoMedio?: number;
};

export type EstoquePayload = {
  item: string;
  quantidade: number;
  custoMedio?: number;
};

export type ListEstoqueParams = {
  page?: number;
  pageSize?: number;
  q?: string;
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
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.q) query.set("q", params.q);

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
