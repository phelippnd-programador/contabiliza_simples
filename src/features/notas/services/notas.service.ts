import type {
  ListNotasParams,
  NotaDraftRequest,
  NotaDraftResponse,
  NotaEmissaoResponse,
  NotaResumo,
} from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function createDraft(
  payload: NotaDraftRequest
): Promise<NotaDraftResponse> {
  // TODO: ajustar endpoint real do backend
  const res = await fetch(`${API_BASE}/notas/draft`, {
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
  // TODO: ajustar endpoint real do backend
  const res = await fetch(`${API_BASE}/notas/draft/${draftId}/emitir`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("EMITIR_NOTA_FAILED");
  }
  return (await res.json()) as NotaEmissaoResponse;
}

export async function listNotas(
  params: ListNotasParams
): Promise<NotaResumo[]> {
  const query = new URLSearchParams();
  if (params.competencia) query.set("competencia", params.competencia);
  if (params.status) query.set("status", params.status);

  // TODO: ajustar endpoint real do backend
  const res = await fetch(`${API_BASE}/notas?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_NOTAS_FAILED");
  }
  return (await res.json()) as NotaResumo[];
}

export async function getNota(id: string): Promise<NotaEmissaoResponse> {
  // TODO: ajustar endpoint real do backend
  const res = await fetch(`${API_BASE}/notas/${id}`);
  if (!res.ok) {
    throw new Error("GET_NOTA_FAILED");
  }
  return (await res.json()) as NotaEmissaoResponse;
}
