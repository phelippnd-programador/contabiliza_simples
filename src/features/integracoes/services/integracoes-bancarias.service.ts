import { apiFetch, toApiError } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type IntegracaoBancariaResumo = {
  id: string;
  banco: string;
  status?: string;
  ultimaAtualizacao?: string;
};

export type IntegracaoBancariaPayload = {
  banco: string;
  status?: string;
};

export type ListIntegracoesBancariasParams = {
  page?: number;
  pageSize?: number;
  status?: string;
};

export async function getIntegracaoBancaria(
  id: string
): Promise<IntegracaoBancariaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  console.info("[integracoes] getIntegracaoBancaria", { id });
  const res = await apiFetch(`/integracoes/bancos/${id}`);
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel carregar a integracao.");
    console.error("[integracoes] getIntegracaoBancaria failed", apiError);
    throw apiError;
  }
  return (await res.json()) as IntegracaoBancariaResumo;
}

export async function listIntegracoesBancarias(
  params: ListIntegracoesBancariasParams = {}
): Promise<ApiListResponse<IntegracaoBancariaResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  console.info("[integracoes] listIntegracoesBancarias", {
    page,
    pageSize,
    status: params.status,
  });
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/integracoes/bancos?${query.toString()}`);
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel carregar as integracoes.");
    console.error("[integracoes] listIntegracoesBancarias failed", apiError);
    throw apiError;
  }
  return (await res.json()) as ApiListResponse<IntegracaoBancariaResumo>;
}

export async function createIntegracaoBancaria(
  payload: IntegracaoBancariaPayload
): Promise<IntegracaoBancariaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  console.info("[integracoes] createIntegracaoBancaria", { banco: payload.banco });
  const res = await apiFetch("/integracoes/bancos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel criar a integracao.");
    console.error("[integracoes] createIntegracaoBancaria failed", apiError);
    throw apiError;
  }
  return (await res.json()) as IntegracaoBancariaResumo;
}

export async function updateIntegracaoBancaria(
  id: string,
  payload: Partial<IntegracaoBancariaPayload>
): Promise<IntegracaoBancariaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  console.info("[integracoes] updateIntegracaoBancaria", { id });
  const res = await apiFetch(`/integracoes/bancos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel atualizar a integracao.");
    console.error("[integracoes] updateIntegracaoBancaria failed", apiError);
    throw apiError;
  }
  return (await res.json()) as IntegracaoBancariaResumo;
}

export async function deleteIntegracaoBancaria(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  console.info("[integracoes] deleteIntegracaoBancaria", { id });
  const res = await apiFetch(`/integracoes/bancos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel excluir a integracao.");
    console.error("[integracoes] deleteIntegracaoBancaria failed", apiError);
    throw apiError;
  }
}
