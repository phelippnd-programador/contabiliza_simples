import { apiFetch } from "../../../shared/services/apiClient";
import type { ImportTransaction } from "../types";
import {
  deleteImportTransactionsByBatch as deleteImportTransactionsByBatchStorage,
  listImportTransactionsByBatch as listImportTransactionsByBatchStorage,
  saveImportTransactions as saveImportTransactionsStorage,
  updateImportTransaction as updateImportTransactionStorage,
} from "../storage/importTransactions";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function listImportTransactionsByBatch(
  importBatchId: string
): Promise<ImportTransaction[]> {
  if (!API_BASE) {
    return listImportTransactionsByBatchStorage(importBatchId);
  }
  const res = await apiFetch(
    `/integracoes/importacoes-transacoes?importBatchId=${importBatchId}`
  );
  if (!res.ok) {
    throw new Error("LIST_IMPORT_TRANSACTIONS_FAILED");
  }
  return (await res.json()) as ImportTransaction[];
}

export async function saveImportTransactions(
  importBatchId: string,
  items: ImportTransaction[]
): Promise<ImportTransaction[]> {
  if (!API_BASE) {
    return saveImportTransactionsStorage(importBatchId, items);
  }
  const payloads = items.map((item) => ({
    ...item,
    importBatchId,
  }));
  const responses = await Promise.all(
    payloads.map((payload) =>
      apiFetch("/integracoes/importacoes-transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    )
  );
  responses.forEach((res) => {
    if (!res.ok) throw new Error("SAVE_IMPORT_TRANSACTIONS_FAILED");
  });
  return Promise.all(responses.map((res) => res.json())) as Promise<
    ImportTransaction[]
  >;
}

export async function updateImportTransaction(
  id: string,
  patch: Partial<ImportTransaction>
): Promise<ImportTransaction | undefined> {
  if (!API_BASE) {
    return updateImportTransactionStorage(id, patch);
  }
  const res = await apiFetch(`/integracoes/importacoes-transacoes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error("UPDATE_IMPORT_TRANSACTION_FAILED");
  }
  return (await res.json()) as ImportTransaction;
}

export async function deleteImportTransactionsByBatch(
  importBatchId: string
): Promise<void> {
  if (!API_BASE) {
    deleteImportTransactionsByBatchStorage(importBatchId);
    return;
  }
  const items = await listImportTransactionsByBatch(importBatchId);
  await Promise.all(
    items.map((item) =>
      apiFetch(`/integracoes/importacoes-transacoes/${item.id}`, {
        method: "DELETE",
      })
    )
  );
}
