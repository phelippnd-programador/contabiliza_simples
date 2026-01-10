import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { CartaoLancamento } from "../types";
import { assertCompetenciaAberta } from "./fechamento.service";
import { registrarAuditoria } from "./auditoria.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function listCartaoLancamentos(
  cartaoId: string
): Promise<CartaoLancamento[]> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const query = new URLSearchParams();
  query.set("cartaoId", cartaoId);
  const res = await apiFetch(`/financeiro/cartoes-lancamentos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CARTAO_LANCAMENTOS_FAILED");
  }
  const data = (await res.json()) as ApiListResponse<CartaoLancamento>;
  return data.data ?? [];
}

export async function createCartaoLancamento(
  payload: Omit<CartaoLancamento, "id">
): Promise<CartaoLancamento> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  await assertCompetenciaAberta(payload.faturaCompetencia);
  const res = await apiFetch("/financeiro/cartoes-lancamentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CARTAO_LANCAMENTO_FAILED");
  }
  const created = (await res.json()) as CartaoLancamento;
  await registrarAuditoria({
    acao: "CRIAR",
    entidade: "CARTAO_LANCAMENTO",
    entidadeId: created.id,
    competencia: payload.faturaCompetencia,
  });
  return created;
}

export async function deleteCartaoLancamento(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const current = await getCartaoLancamento(id);
  await assertCompetenciaAberta(current?.faturaCompetencia);
  const res = await apiFetch(`/financeiro/cartoes-lancamentos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CARTAO_LANCAMENTO_FAILED");
  }
  await registrarAuditoria({
    acao: "EXCLUIR",
    entidade: "CARTAO_LANCAMENTO",
    entidadeId: id,
    competencia: current?.faturaCompetencia,
  });
}

export async function getCartaoLancamento(
  id: string
): Promise<CartaoLancamento | undefined> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/cartoes-lancamentos/${id}`);
  if (!res.ok) {
    throw new Error("GET_CARTAO_LANCAMENTO_FAILED");
  }
  return (await res.json()) as CartaoLancamento;
}
