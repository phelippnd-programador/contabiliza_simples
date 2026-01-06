import type { ImportTransaction } from "../types";

const STORAGE_KEY = "import.transactions";

const createLocalId = () =>
  `import-tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const load = (): ImportTransaction[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ImportTransaction[]) : [];
  } catch {
    return [];
  }
};

const persist = (transactions: ImportTransaction[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
};

export const listImportTransactions = (): ImportTransaction[] => load();

export const listImportTransactionsByBatch = (
  importBatchId: string
): ImportTransaction[] =>
  load().filter((item) => item.importBatchId === importBatchId);

export const saveImportTransactions = (
  importBatchId: string,
  items: ImportTransaction[]
) => {
  const existing = load().filter((item) => item.importBatchId !== importBatchId);
  const next = items.map((item) => ({
    ...item,
    id: item.id || createLocalId(),
    importBatchId,
  }));
  persist([...existing, ...next]);
  return next;
};

export const updateImportTransaction = (
  id: string,
  patch: Partial<ImportTransaction>
) => {
  const all = load();
  const next = all.map((item) => (item.id === id ? { ...item, ...patch } : item));
  persist(next);
  return next.find((item) => item.id === id);
};

export const deleteImportTransactionsByBatch = (importBatchId: string) => {
  const next = load().filter((item) => item.importBatchId !== importBatchId);
  persist(next);
};
