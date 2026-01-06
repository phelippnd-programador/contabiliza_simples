import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { CartaoCredito } from "../types";
import {
  deleteCartao as deleteCartaoStorage,
  getCartao as getCartaoStorage,
  listCartoes as listCartoesStorage,
  saveCartao as saveCartaoStorage,
} from "../storage/cartoes";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type CartaoResumo = CartaoCredito;

export type CartaoPayload = Omit<CartaoCredito, "id">;

export async function listCartoes(): Promise<CartaoResumo[]> {
  if (!API_BASE) {
    return listCartoesStorage();
  }
  const res = await apiFetch("/financeiro/cartoes");
  if (!res.ok) {
    throw new Error("LIST_CARTOES_FAILED");
  }
  const data = (await res.json()) as ApiListResponse<CartaoResumo>;
  return data.data ?? [];
}

export async function getCartao(id: string): Promise<CartaoResumo | undefined> {
  if (!API_BASE) {
    return getCartaoStorage(id);
  }
  const res = await apiFetch(`/financeiro/cartoes/${id}`);
  if (!res.ok) {
    throw new Error("GET_CARTAO_FAILED");
  }
  return (await res.json()) as CartaoResumo;
}

export async function saveCartao(
  data: CartaoPayload & { id?: string }
): Promise<CartaoResumo> {
  if (!API_BASE) {
    return saveCartaoStorage(data);
  }
  const method = data.id ? "PUT" : "POST";
  const path = data.id ? `/financeiro/cartoes/${data.id}` : "/financeiro/cartoes";
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("SAVE_CARTAO_FAILED");
  }
  return (await res.json()) as CartaoResumo;
}

export async function deleteCartao(id: string): Promise<void> {
  if (!API_BASE) {
    deleteCartaoStorage(id);
    return;
  }
  const res = await apiFetch(`/financeiro/cartoes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CARTAO_FAILED");
  }
}
