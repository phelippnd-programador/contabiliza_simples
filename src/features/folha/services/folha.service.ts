import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type FolhaResumo = {
  id: string;
  referencia: string;
  colaboradores: number;
  status?: string;
};

export type FolhaPayload = {
  referencia: string;
  colaboradores: number;
  status?: string;
};

export type ListFolhaParams = {
  page?: number;
  pageSize?: number;
  referencia?: string;
  status?: string;
};

export async function getFolha(id: string): Promise<FolhaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/folha/${id}`);
  if (!res.ok) {
    throw new Error("GET_FOLHA_FAILED");
  }
  return (await res.json()) as FolhaResumo;
}

export async function listFolha(
  params: ListFolhaParams = {}
): Promise<ApiListResponse<FolhaResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.referencia) query.set("referencia", params.referencia);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/folha?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_FOLHA_FAILED");
  }
  return (await res.json()) as ApiListResponse<FolhaResumo>;
}

export async function createFolha(payload: FolhaPayload): Promise<FolhaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/folha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_FOLHA_FAILED");
  }
  return (await res.json()) as FolhaResumo;
}

export async function updateFolha(
  id: string,
  payload: Partial<FolhaPayload>
): Promise<FolhaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/folha/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_FOLHA_FAILED");
  }
  return (await res.json()) as FolhaResumo;
}

export async function deleteFolha(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/folha/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_FOLHA_FAILED");
  }
}
