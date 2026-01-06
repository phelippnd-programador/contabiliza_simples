import { apiFetch } from "../../../shared/services/apiClient";
import type { ImportBatch } from "../types";
import {
  deleteImportBatch as deleteImportBatchStorage,
  getImportBatch as getImportBatchStorage,
  listImportBatches as listImportBatchesStorage,
  saveImportBatch as saveImportBatchStorage,
} from "../storage/importBatches";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function listImportBatches(): Promise<ImportBatch[]> {
  if (!API_BASE) {
    return listImportBatchesStorage().sort((a, b) =>
      a.createdAt > b.createdAt ? -1 : 1
    );
  }
  const res = await apiFetch("/integracoes/importacoes");
  if (!res.ok) {
    throw new Error("LIST_IMPORT_BATCHES_FAILED");
  }
  const data = (await res.json()) as ImportBatch[];
  return (data ?? []).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export async function getImportBatch(id: string): Promise<ImportBatch | undefined> {
  if (!API_BASE) {
    return getImportBatchStorage(id);
  }
  const res = await apiFetch(`/integracoes/importacoes/${id}`);
  if (!res.ok) {
    throw new Error("GET_IMPORT_BATCH_FAILED");
  }
  return (await res.json()) as ImportBatch;
}

export async function createImportBatch(
  payload: Omit<ImportBatch, "id"> & { id?: string }
): Promise<ImportBatch> {
  if (!API_BASE) {
    return saveImportBatchStorage(payload);
  }
  const res = await apiFetch("/integracoes/importacoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_IMPORT_BATCH_FAILED");
  }
  return (await res.json()) as ImportBatch;
}

export async function updateImportBatch(
  id: string,
  payload: Partial<ImportBatch>
): Promise<ImportBatch> {
  if (!API_BASE) {
    return saveImportBatchStorage({ ...(payload as ImportBatch), id });
  }
  const res = await apiFetch(`/integracoes/importacoes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_IMPORT_BATCH_FAILED");
  }
  return (await res.json()) as ImportBatch;
}

export async function deleteImportBatch(id: string): Promise<void> {
  if (!API_BASE) {
    deleteImportBatchStorage(id);
    return;
  }
  const res = await apiFetch(`/integracoes/importacoes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_IMPORT_BATCH_FAILED");
  }
}
