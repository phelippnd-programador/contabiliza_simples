import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { FinanceiroAuditoria } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

type AuditoriaInput = Omit<FinanceiroAuditoria, "id" | "data"> & {
  data?: string;
};

export async function registrarAuditoria(
  payload: AuditoriaInput
): Promise<void> {
  if (!API_BASE) return;
  const body = {
    ...payload,
    data: payload.data ?? new Date().toISOString(),
  };
  try {
    await apiFetch("/financeiro/auditoria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // nao bloquear fluxo principal
  }
}

export async function listAuditoria(): Promise<FinanceiroAuditoria[]> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/financeiro/auditoria");
  if (!res.ok) {
    throw new Error("LIST_AUDITORIA_FAILED");
  }
  const data = (await res.json()) as
    | ApiListResponse<FinanceiroAuditoria>
    | FinanceiroAuditoria[];
  return Array.isArray(data) ? data : data.data ?? [];
}
