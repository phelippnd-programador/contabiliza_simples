import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { MovimentoCaixa, TipoMovimentoCaixa } from "../types";
import { assertCompetenciaAberta } from "./fechamento.service";
import { registrarAuditoria } from "./auditoria.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ListMovimentosParams = {
  page?: number;
  pageSize?: number;
  contaId?: string;
  categoriaId?: string;
  dataInicio?: string;
  dataFim?: string;
  tipo?: TipoMovimentoCaixa;
};

export async function listMovimentos(
  params: ListMovimentosParams = {}
): Promise<MovimentoCaixa[]> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.contaId) query.set("contaId", params.contaId);
  if (params.categoriaId) query.set("categoriaId", params.categoriaId);
  if (params.dataInicio) query.set("dataInicio", params.dataInicio);
  if (params.dataFim) query.set("dataFim", params.dataFim);
  if (params.tipo) query.set("tipo", params.tipo);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch(`/financeiro/movimentos${suffix}`);
  if (!res.ok) {
    throw new Error("LIST_MOVIMENTOS_FAILED");
  }
  const data = (await res.json()) as ApiListResponse<MovimentoCaixa>;
  return data.data ?? [];
}

export async function getMovimento(
  id: string
): Promise<MovimentoCaixa | undefined> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/movimentos/${id}`);
  if (!res.ok) {
    throw new Error("GET_MOVIMENTO_FAILED");
  }
  return (await res.json()) as MovimentoCaixa;
}

export async function saveMovimento(
  data: Omit<MovimentoCaixa, "id"> & { id?: string }
): Promise<MovimentoCaixa> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const competencia = data.competencia ?? data.data?.slice(0, 7);
  await assertCompetenciaAberta(competencia);
  const method = data.id ? "PUT" : "POST";
  const path = data.id
    ? `/financeiro/movimentos/${data.id}`
    : "/financeiro/movimentos";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("SAVE_MOVIMENTO_FAILED");
  }
  const saved = (await res.json()) as MovimentoCaixa;
  await registrarAuditoria({
    acao: data.id ? "ATUALIZAR" : "CRIAR",
    entidade: "MOVIMENTO",
    entidadeId: saved.id,
    competencia: competencia ?? saved.competencia,
    detalhes: { tipo: saved.tipo, valor: saved.valor },
  });
  return saved;
}

export async function deleteMovimento(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const current = await getMovimento(id);
  const competencia = current?.competencia ?? current?.data?.slice(0, 7);
  await assertCompetenciaAberta(competencia);
  const res = await apiFetch(`/financeiro/movimentos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_MOVIMENTO_FAILED");
  }
  await registrarAuditoria({
    acao: "EXCLUIR",
    entidade: "MOVIMENTO",
    entidadeId: id,
    competencia,
  });
}
