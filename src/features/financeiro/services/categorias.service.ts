import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { CategoriaMovimento, TipoMovimentoCaixa } from "../types";
import {
  deleteCategoria as deleteCategoriaStorage,
  getCategoria as getCategoriaStorage,
  listCategorias as listCategoriasStorage,
  saveCategoria as saveCategoriaStorage,
} from "../storage/categorias";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ListCategoriasParams = {
  page?: number;
  pageSize?: number;
  tipo?: TipoMovimentoCaixa;
  q?: string;
};

export async function listCategorias(
  params: ListCategoriasParams = {}
): Promise<CategoriaMovimento[]> {
  if (!API_BASE) {
    return listCategoriasStorage();
  }
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.tipo) query.set("tipo", params.tipo);
  if (params.q) query.set("q", params.q);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch(`/financeiro/categorias${suffix}`);
  if (!res.ok) {
    throw new Error("LIST_CATEGORIAS_FAILED");
  }
  const data = (await res.json()) as ApiListResponse<CategoriaMovimento>;
  return data.data ?? [];
}

export async function getCategoria(
  id: string
): Promise<CategoriaMovimento | undefined> {
  if (!API_BASE) {
    return getCategoriaStorage(id);
  }
  const res = await apiFetch(`/financeiro/categorias/${id}`);
  if (!res.ok) {
    throw new Error("GET_CATEGORIA_FAILED");
  }
  return (await res.json()) as CategoriaMovimento;
}

export async function saveCategoria(
  data: Omit<CategoriaMovimento, "id"> & { id?: string }
): Promise<CategoriaMovimento> {
  if (!API_BASE) {
    return saveCategoriaStorage(data);
  }
  const method = data.id ? "PUT" : "POST";
  const path = data.id
    ? `/financeiro/categorias/${data.id}`
    : "/financeiro/categorias";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("SAVE_CATEGORIA_FAILED");
  }
  return (await res.json()) as CategoriaMovimento;
}

export async function deleteCategoria(id: string): Promise<void> {
  if (!API_BASE) {
    deleteCategoriaStorage(id);
    return;
  }
  const res = await apiFetch(`/financeiro/categorias/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CATEGORIA_FAILED");
  }
}
