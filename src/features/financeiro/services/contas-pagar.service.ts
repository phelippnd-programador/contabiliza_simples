import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { BaixaTitulo } from "../types";
import { assertCompetenciaAberta } from "./fechamento.service";
import { registrarAuditoria } from "./auditoria.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ContaPagarResumo = {
  id: string;
  fornecedorId?: string;
  fornecedorNome?: string;
  fornecedor?: string;
  vencimento: string;
  valor: number;
  status?: string;
  origem?: "COMPRA" | "MANUAL";
  origemId?: string;
  descricao?: string;
  numeroDocumento?: string;
  competencia?: string;
  parcela?: number;
  totalParcelas?: number;
  parcelaPaga?: number;
  valorOriginal?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  valorPago?: number;
  dataPagamento?: string;
  formaPagamento?: string;
  contaId?: string;
  categoriaId?: string;
  centroCustoId?: string;
  observacoes?: string;
  recorrente?: boolean;
  baixas?: BaixaTitulo[];
};

export type ContaPagarPayload = {
  fornecedorId: string;
  fornecedorNome?: string;
  vencimento: string;
  valor: number;
  status?: string;
  origem?: "COMPRA" | "MANUAL";
  origemId?: string;
  descricao?: string;
  numeroDocumento?: string;
  competencia?: string;
  parcela?: number;
  totalParcelas?: number;
  parcelaPaga?: number;
  valorOriginal?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  valorPago?: number;
  dataPagamento?: string;
  formaPagamento?: string;
  contaId?: string;
  categoriaId?: string;
  centroCustoId?: string;
  observacoes?: string;
  recorrente?: boolean;
  baixas?: BaixaTitulo[];
};

export type ListContasPagarParams = {
  page?: number;
  pageSize?: number;
  vencimentoInicio?: string;
  vencimentoFim?: string;
  status?: string;
  q?: string;
};

export async function getContaPagar(id: string): Promise<ContaPagarResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/contas-pagar/${id}`);
  if (!res.ok) {
    throw new Error("GET_CONTA_PAGAR_FAILED");
  }
  return (await res.json()) as ContaPagarResumo;
}

export async function listContasPagar(
  params: ListContasPagarParams = {}
): Promise<ApiListResponse<ContaPagarResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.vencimentoInicio) query.set("vencimentoInicio", params.vencimentoInicio);
  if (params.vencimentoFim) query.set("vencimentoFim", params.vencimentoFim);
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  const res = await apiFetch(`/financeiro/contas-pagar?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CONTAS_PAGAR_FAILED");
  }
  return (await res.json()) as ApiListResponse<ContaPagarResumo>;
}

export async function createContaPagar(
  payload: ContaPagarPayload
): Promise<ContaPagarResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const competencia = payload.competencia ?? payload.vencimento?.slice(0, 7);
  await assertCompetenciaAberta(competencia);
  const res = await apiFetch("/financeiro/contas-pagar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CONTA_PAGAR_FAILED");
  }
  const created = (await res.json()) as ContaPagarResumo;
  await registrarAuditoria({
    acao: "CRIAR",
    entidade: "CONTA_PAGAR",
    entidadeId: created.id,
    competencia: competencia ?? created.competencia,
  });
  return created;
}

export async function updateContaPagar(
  id: string,
  payload: Partial<ContaPagarPayload>
): Promise<ContaPagarResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  let competencia = payload.competencia ?? payload.vencimento?.slice(0, 7);
  if (!competencia) {
    const current = await getContaPagar(id);
    competencia = current?.competencia ?? current?.vencimento?.slice(0, 7);
  }
  await assertCompetenciaAberta(competencia);
  const res = await apiFetch(`/financeiro/contas-pagar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CONTA_PAGAR_FAILED");
  }
  const updated = (await res.json()) as ContaPagarResumo;
  await registrarAuditoria({
    acao: "ATUALIZAR",
    entidade: "CONTA_PAGAR",
    entidadeId: updated.id,
    competencia: competencia ?? updated.competencia,
  });
  return updated;
}

export async function patchContaPagar(
  id: string,
  payload: Partial<ContaPagarPayload>
): Promise<ContaPagarResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  let competencia = payload.competencia ?? payload.vencimento?.slice(0, 7);
  if (!competencia) {
    const current = await getContaPagar(id);
    competencia = current?.competencia ?? current?.vencimento?.slice(0, 7);
  }
  await assertCompetenciaAberta(competencia);
  const res = await apiFetch(`/financeiro/contas-pagar/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("PATCH_CONTA_PAGAR_FAILED");
  }
  const patched = (await res.json()) as ContaPagarResumo;
  await registrarAuditoria({
    acao: "ATUALIZAR",
    entidade: "CONTA_PAGAR",
    entidadeId: patched.id,
    competencia: competencia ?? patched.competencia,
  });
  return patched;
}

export async function deleteContaPagar(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const current = await getContaPagar(id);
  const competencia = current?.competencia ?? current?.vencimento?.slice(0, 7);
  await assertCompetenciaAberta(competencia);
  const res = await apiFetch(`/financeiro/contas-pagar/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CONTA_PAGAR_FAILED");
  }
  await registrarAuditoria({
    acao: "EXCLUIR",
    entidade: "CONTA_PAGAR",
    entidadeId: id,
    competencia,
  });
}
