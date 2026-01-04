import type {
  ListNotasParams,
  NotaDraftRequest,
  NotaDraftResponse,
  NotaEmissaoResponse,
  NotaResumo,
} from "../types";
import type { ApiListResponse } from "../../../shared/types/api-types";
import { apiFetch } from "../../../shared/services/apiClient";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function createDraft(
  payload: NotaDraftRequest
): Promise<NotaDraftResponse> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/notas/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_DRAFT_FAILED");
  }
  return (await res.json()) as NotaDraftResponse;
}

export async function emitir(draftId: string): Promise<NotaEmissaoResponse> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/notas/draft/${draftId}/emitir`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("EMITIR_NOTA_FAILED");
  }
  return (await res.json()) as NotaEmissaoResponse;
}

export async function listNotas(
  params: ListNotasParams & { page?: number; pageSize?: number }
): Promise<ApiListResponse<NotaResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.competencia) query.set("competencia", params.competencia);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/notas?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_NOTAS_FAILED");
  }
  return (await res.json()) as ApiListResponse<NotaResumo>;
}

export async function getNota(id: string): Promise<NotaEmissaoResponse> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/notas/${id}`);
  if (!res.ok) {
    throw new Error("GET_NOTA_FAILED");
  }
  return (await res.json()) as NotaEmissaoResponse;
}
