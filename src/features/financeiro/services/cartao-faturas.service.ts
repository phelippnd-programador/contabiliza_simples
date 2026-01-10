import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { CartaoFatura } from "../types";
import { assertCompetenciaAberta } from "./fechamento.service";
import { registrarAuditoria } from "./auditoria.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function listCartaoFaturas(cartaoId: string): Promise<CartaoFatura[]> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const query = new URLSearchParams();
  query.set("cartaoId", cartaoId);
  const res = await apiFetch(`/financeiro/cartoes-faturas?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CARTAO_FATURAS_FAILED");
  }
  const data = (await res.json()) as ApiListResponse<CartaoFatura>;
  return data.data ?? [];
}

export async function getCartaoFatura(id: string): Promise<CartaoFatura | undefined> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/financeiro/cartoes-faturas/${id}`);
  if (!res.ok) {
    throw new Error("GET_CARTAO_FATURA_FAILED");
  }
  return (await res.json()) as CartaoFatura;
}

export async function createCartaoFatura(
  payload: Omit<CartaoFatura, "id">
): Promise<CartaoFatura> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  await assertCompetenciaAberta(payload.competencia);
  const res = await apiFetch("/financeiro/cartoes-faturas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CARTAO_FATURA_FAILED");
  }
  const created = (await res.json()) as CartaoFatura;
  await registrarAuditoria({
    acao: "CRIAR",
    entidade: "CARTAO_FATURA",
    entidadeId: created.id,
    competencia: payload.competencia,
  });
  return created;
}

export async function updateCartaoFatura(
  id: string,
  payload: Partial<CartaoFatura>
): Promise<CartaoFatura> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  let competencia = payload.competencia;
  if (!competencia) {
    const current = await getCartaoFatura(id);
    competencia = current?.competencia;
  }
  await assertCompetenciaAberta(competencia);
  const res = await apiFetch(`/financeiro/cartoes-faturas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CARTAO_FATURA_FAILED");
  }
  const updated = (await res.json()) as CartaoFatura;
  await registrarAuditoria({
    acao: "ATUALIZAR",
    entidade: "CARTAO_FATURA",
    entidadeId: updated.id,
    competencia: competencia ?? updated.competencia,
  });
  return updated;
}
