import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ColaboradorResumo = {
  id: string;
  nome: string;
  documento: string;
  tipoColaborador: "CLT" | "PJ" | "CONTRIBUINTE_INDIVIDUAL" | "MEI" | "ESTAGIARIO" | "PRO_LABORE";
  email?: string;
  telefone?: string;
  dataAdmissao?: string;
  dataDemissao?: string;
  cargo?: string;
  pis?: string;
  categoriaInss?: string;
  salarioBase?: number;
  percentualInss?: number;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    codigoMunicipioIbge?: string;
    pais?: string;
  };
  status?: string;
};

export type ColaboradorPayload = {
  nome: string;
  documento: string;
  tipoColaborador: "CLT" | "PJ" | "CONTRIBUINTE_INDIVIDUAL" | "MEI" | "ESTAGIARIO" | "PRO_LABORE";
  email?: string;
  telefone?: string;
  dataAdmissao?: string;
  dataDemissao?: string;
  cargo?: string;
  pis?: string;
  categoriaInss?: string;
  salarioBase?: number;
  percentualInss?: number;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    codigoMunicipioIbge?: string;
    pais?: string;
  };
  status?: string;
};

export type ListColaboradoresParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
};

export async function listColaboradores(
  params: ListColaboradoresParams = {}
): Promise<ApiListResponse<ColaboradorResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/folha/colaboradores?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_COLABORADORES_FAILED");
  }
  return (await res.json()) as ApiListResponse<ColaboradorResumo>;
}

export async function getColaborador(id: string): Promise<ColaboradorResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/folha/colaboradores/${id}`);
  if (!res.ok) {
    throw new Error("GET_COLABORADOR_FAILED");
  }
  return (await res.json()) as ColaboradorResumo;
}

export async function createColaborador(
  payload: ColaboradorPayload
): Promise<ColaboradorResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/folha/colaboradores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_COLABORADOR_FAILED");
  }
  return (await res.json()) as ColaboradorResumo;
}

export async function updateColaborador(
  id: string,
  payload: Partial<ColaboradorPayload>
): Promise<ColaboradorResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/folha/colaboradores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_COLABORADOR_FAILED");
  }
  return (await res.json()) as ColaboradorResumo;
}

export async function deleteColaborador(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/folha/colaboradores/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_COLABORADOR_FAILED");
  }
}
