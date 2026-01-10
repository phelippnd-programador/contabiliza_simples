import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type {
  Afastamento,
  CompetenciaFolha,
  EventoFolha,
  Ferias,
  LancamentoFolha,
  ListParams,
  PontoDia,
} from "../types/rh.types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const buildQuery = (params: ListParams, dateField = "data") => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.dataInicio) {
    query.set("dataInicio", params.dataInicio);
    query.set(`${dateField}_gte`, params.dataInicio);
  }
  if (params.dataFim) {
    query.set("dataFim", params.dataFim);
    query.set(`${dateField}_lte`, params.dataFim);
  }
  return { page, pageSize, query };
};

export async function listCompetencias(
  params: ListParams = {}
): Promise<ApiListResponse<CompetenciaFolha>> {
  const { page, pageSize, query } = buildQuery(params, "competencia");
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/folha/competencias?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_COMPETENCIAS_FAILED");
  }
  return (await res.json()) as ApiListResponse<CompetenciaFolha>;
}

export async function createCompetencia(
  payload: Partial<CompetenciaFolha>
): Promise<CompetenciaFolha> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch("/rh/folha/competencias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("CREATE_COMPETENCIA_FAILED");
  return (await res.json()) as CompetenciaFolha;
}

export async function updateCompetencia(
  id: string,
  payload: Partial<CompetenciaFolha>
): Promise<CompetenciaFolha> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/folha/competencias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("UPDATE_COMPETENCIA_FAILED");
  return (await res.json()) as CompetenciaFolha;
}

export async function listEventosFolha(
  params: ListParams = {}
): Promise<ApiListResponse<EventoFolha>> {
  const { page, pageSize, query } = buildQuery(params, "createdAt");
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/folha/eventos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_EVENTOS_FAILED");
  }
  return (await res.json()) as ApiListResponse<EventoFolha>;
}

export async function createEventoFolha(
  payload: Partial<EventoFolha>
): Promise<EventoFolha> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch("/rh/folha/eventos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("CREATE_EVENTO_FAILED");
  return (await res.json()) as EventoFolha;
}

export async function updateEventoFolha(
  id: string,
  payload: Partial<EventoFolha>
): Promise<EventoFolha> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/folha/eventos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("UPDATE_EVENTO_FAILED");
  return (await res.json()) as EventoFolha;
}

export async function deleteEventoFolha(id: string): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/folha/eventos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_EVENTO_FAILED");
}

export async function listLancamentosFolha(
  competencia: string,
  params: ListParams = {}
): Promise<ApiListResponse<LancamentoFolha>> {
  const { page, pageSize, query } = buildQuery(params, "data");
  query.set("competencia", competencia);
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/folha/lancamentos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_LANCAMENTOS_FAILED");
  }
  return (await res.json()) as ApiListResponse<LancamentoFolha>;
}

export async function createLancamentoFolha(
  payload: Partial<LancamentoFolha>
): Promise<LancamentoFolha> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch("/rh/folha/lancamentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("CREATE_LANCAMENTO_FAILED");
  return (await res.json()) as LancamentoFolha;
}

export async function updateLancamentoFolha(
  id: string | number,
  payload: Partial<LancamentoFolha>
): Promise<LancamentoFolha> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/folha/lancamentos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("UPDATE_LANCAMENTO_FAILED");
  return (await res.json()) as LancamentoFolha;
}

export async function deleteLancamentoFolha(id: string): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/folha/lancamentos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_LANCAMENTO_FAILED");
}

export async function listPonto(
  params: ListParams = {}
): Promise<ApiListResponse<PontoDia>> {
  const { page, pageSize, query } = buildQuery(params, "data");
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/ponto?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_PONTO_FAILED");
  }
  return (await res.json()) as ApiListResponse<PontoDia>;
}

export async function createPonto(payload: Partial<PontoDia>): Promise<PontoDia> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch("/rh/ponto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("CREATE_PONTO_FAILED");
  return (await res.json()) as PontoDia;
}

export async function updatePonto(
  id: string | number,
  payload: Partial<PontoDia>
): Promise<PontoDia> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/ponto/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("UPDATE_PONTO_FAILED");
  return (await res.json()) as PontoDia;
}

export async function deletePonto(id: string): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/ponto/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_PONTO_FAILED");
}

export async function listFerias(
  params: ListParams = {}
): Promise<ApiListResponse<Ferias>> {
  const { page, pageSize, query } = buildQuery(params, "inicio");
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/ferias?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_FERIAS_FAILED");
  }
  return (await res.json()) as ApiListResponse<Ferias>;
}

export async function createFerias(payload: Partial<Ferias>): Promise<Ferias> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch("/rh/ferias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("CREATE_FERIAS_FAILED");
  return (await res.json()) as Ferias;
}

export async function updateFerias(
  id: string,
  payload: Partial<Ferias>
): Promise<Ferias> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/ferias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("UPDATE_FERIAS_FAILED");
  return (await res.json()) as Ferias;
}

export async function deleteFerias(id: string): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/ferias/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_FERIAS_FAILED");
}

export async function listAfastamentos(
  params: ListParams = {}
): Promise<ApiListResponse<Afastamento>> {
  const { page, pageSize, query } = buildQuery(params, "inicio");
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/afastamentos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_AFASTAMENTOS_FAILED");
  }
  return (await res.json()) as ApiListResponse<Afastamento>;
}

export async function createAfastamento(
  payload: Partial<Afastamento>
): Promise<Afastamento> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch("/rh/afastamentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("CREATE_AFASTAMENTO_FAILED");
  return (await res.json()) as Afastamento;
}

export async function updateAfastamento(
  id: string,
  payload: Partial<Afastamento>
): Promise<Afastamento> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/afastamentos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("UPDATE_AFASTAMENTO_FAILED");
  return (await res.json()) as Afastamento;
}

export async function deleteAfastamento(id: string): Promise<void> {
  if (!API_BASE) throw new Error("API_NOT_CONFIGURED");
  const res = await apiFetch(`/rh/afastamentos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE_AFASTAMENTO_FAILED");
}
