import type { ImportBatch } from "../types";

const STORAGE_KEY = "import.batches";

const createLocalId = () =>
  `batch-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const load = (): ImportBatch[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ImportBatch[]) : [];
  } catch {
    return [];
  }
};

const persist = (batches: ImportBatch[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
};

export const listImportBatches = (): ImportBatch[] => load();

export const getImportBatch = (id: string): ImportBatch | undefined =>
  load().find((batch) => batch.id === id);

export const saveImportBatch = (
  data: Omit<ImportBatch, "id"> & { id?: string }
): ImportBatch => {
  const batches = load();
  if (data.id) {
    const next = batches.map((batch) =>
      batch.id === data.id ? { ...batch, ...data } : batch
    );
    persist(next);
    return next.find((batch) => batch.id === data.id) ?? {
      ...(data as ImportBatch),
    };
  }

  const created: ImportBatch = {
    ...(data as Omit<ImportBatch, "id">),
    id: createLocalId(),
  };
  persist([...batches, created]);
  return created;
};

export const deleteImportBatch = (id: string) => {
  const batches = load();
  persist(batches.filter((batch) => batch.id !== id));
};
