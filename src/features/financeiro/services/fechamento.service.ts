import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { FinanceiroFechamento } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const normalizeList = (
  payload: ApiListResponse<FinanceiroFechamento> | FinanceiroFechamento[]
) => (Array.isArray(payload) ? payload : payload.data ?? []);

export async function listFechamentos(): Promise<FinanceiroFechamento[]> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/financeiro/fechamentos");
  if (!res.ok) {
    throw new Error("LIST_FECHAMENTOS_FAILED");
  }
  const data = (await res.json()) as
    | ApiListResponse<FinanceiroFechamento>
    | FinanceiroFechamento[];
  return normalizeList(data);
}

export async function listFechamentosByCompetencia(
  competencia: string
): Promise<FinanceiroFechamento[]> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  if (!competencia) return [];
  const query = new URLSearchParams();
  query.set("competencia", competencia);
  const res = await apiFetch(`/financeiro/fechamentos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("GET_FECHAMENTO_FAILED");
  }
  const data = (await res.json()) as
    | ApiListResponse<FinanceiroFechamento>
    | FinanceiroFechamento[];
  return normalizeList(data);
}

export async function getFechamentoByCompetencia(
  competencia: string
): Promise<FinanceiroFechamento | undefined> {
  const list = await listFechamentosByCompetencia(competencia);
  if (!list.length) return undefined;
  const aberto = list.find((item) => item.status === "ABERTO");
  if (aberto) return aberto;
  return [...list].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))[0];
}

export async function saveFechamento(
  payload: Omit<FinanceiroFechamento, "id"> & { id?: string }
): Promise<FinanceiroFechamento> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const method = payload.id ? "PUT" : "POST";
  const path = payload.id
    ? `/financeiro/fechamentos/${payload.id}`
    : "/financeiro/fechamentos";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("SAVE_FECHAMENTO_FAILED");
  }
  return (await res.json()) as FinanceiroFechamento;
}

export async function assertCompetenciaAberta(
  competencia?: string
): Promise<void> {
  if (!competencia) return;
  const list = await listFechamentosByCompetencia(competencia);
  if (!list.length) return;
  const hasAberto = list.some((item) => item.status === "ABERTO");
  const hasFechado = list.some((item) => item.status === "FECHADO");
  if (!hasAberto && hasFechado) {
    const error = new Error("COMPETENCIA_FECHADA");
    throw error;
  }
}
