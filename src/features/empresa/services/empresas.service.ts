import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { EmpresaCadastro, EmpresaResumo } from "../types";
import {
  deleteEmpresa as deleteEmpresaStorage,
  getEmpresa as getEmpresaStorage,
  listEmpresas as listEmpresasStorage,
  saveEmpresa as saveEmpresaStorage,
} from "../storage/empresas";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ListEmpresasParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

const toResumo = (empresa: EmpresaCadastro): EmpresaResumo => ({
  id: empresa.id,
  razaoSocial: empresa.razaoSocial,
  nomeFantasia: empresa.nomeFantasia,
  cnpj: empresa.cnpj,
});

export async function listEmpresas(
  params: ListEmpresasParams = {}
): Promise<ApiListResponse<EmpresaResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    const all = listEmpresasStorage().map(toResumo);
    const start = (page - 1) * pageSize;
    const data = all.slice(start, start + pageSize);
    return { data, meta: { page, pageSize, total: all.length } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.q) query.set("q", params.q);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch(`/empresas${suffix}`);
  if (!res.ok) {
    throw new Error("LIST_EMPRESAS_FAILED");
  }
  return (await res.json()) as ApiListResponse<EmpresaResumo>;
}

export async function getEmpresa(
  id: string
): Promise<EmpresaCadastro | undefined> {
  if (!API_BASE) {
    return getEmpresaStorage(id);
  }
  const res = await apiFetch(`/empresas/${id}`);
  if (!res.ok) {
    throw new Error("GET_EMPRESA_FAILED");
  }
  return (await res.json()) as EmpresaCadastro;
}

export async function saveEmpresa(
  data: Omit<EmpresaCadastro, "id"> & { id?: string }
): Promise<EmpresaCadastro> {
  if (!API_BASE) {
    return saveEmpresaStorage(data);
  }
  const method = data.id ? "PUT" : "POST";
  const path = data.id ? `/empresas/${data.id}` : "/empresas";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("SAVE_EMPRESA_FAILED");
  }
  return (await res.json()) as EmpresaCadastro;
}

export async function deleteEmpresa(id: string): Promise<void> {
  if (!API_BASE) {
    deleteEmpresaStorage(id);
    return;
  }
  const res = await apiFetch(`/empresas/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("DELETE_EMPRESA_FAILED");
  }
}
