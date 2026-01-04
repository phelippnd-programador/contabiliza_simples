import type {
  ListNotasParams,
  NotaDraftRequest,
  NotaDraftResponse,
  NotaEmissaoResponse,
  NotaResumo,
} from "../types";
import type { ApiListResponse } from "../../../shared/types/api-types";
import { apiFetch, toApiError } from "../../../shared/services/apiClient";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function createDraft(
  payload: NotaDraftRequest
): Promise<NotaDraftResponse> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  console.info("[notas] createDraft", {
    empresaId: payload.empresaId,
    tipo: payload.tipo,
    itens: payload.itens.length,
  });
  const res = await apiFetch(`/notas/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel criar o rascunho.");
    console.error("[notas] createDraft failed", apiError);
    throw apiError;
  }
  const data = (await res.json()) as NotaDraftResponse;
  console.info("[notas] createDraft ok", { draftId: data.draftId });
  return data;
}

export async function emitir(draftId: string): Promise<NotaEmissaoResponse> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  console.info("[notas] emitir", { draftId });
  const res = await apiFetch(`/notas/draft/${draftId}/emitir`, {
    method: "POST",
  });
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel emitir a nota.");
    console.error("[notas] emitir failed", apiError);
    throw apiError;
  }
  const data = (await res.json()) as NotaEmissaoResponse;
  console.info("[notas] emitir ok", { status: data.status, chave: data.chave });
  return data;
}

export async function listNotas(
  params: ListNotasParams & { page?: number; pageSize?: number }
): Promise<ApiListResponse<NotaResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  console.info("[notas] listNotas", {
    page,
    pageSize,
    competencia: params.competencia,
    status: params.status,
  });
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.competencia) query.set("competencia", params.competencia);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/notas?${query.toString()}`);
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel carregar as notas.");
    console.error("[notas] listNotas failed", apiError);
    throw apiError;
  }
  return (await res.json()) as ApiListResponse<NotaResumo>;
}

export async function getNota(id: string): Promise<NotaEmissaoResponse> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  console.info("[notas] getNota", { id });
  const res = await apiFetch(`/notas/${id}`);
  if (!res.ok) {
    const apiError = await toApiError(res, "Nao foi possivel carregar a nota.");
    console.error("[notas] getNota failed", apiError);
    throw apiError;
  }
  return (await res.json()) as NotaEmissaoResponse;
}
