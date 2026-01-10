import type{ MovimentoCaixa } from "../types";

const STORAGE_KEY = "financeiro.movimentos";

const createLocalId = () =>
  `movimento-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const load = (): MovimentoCaixa[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MovimentoCaixa[]) : [];
  } catch {
    return [];
  }
};

const persist = (movimentos: MovimentoCaixa[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(movimentos));
};

export const listMovimentos = (): MovimentoCaixa[] => load();

export const getMovimento = (id: string): MovimentoCaixa | undefined =>
  load().find((movimento) => movimento.id === id);

export const saveMovimento = (
  data: Omit<MovimentoCaixa, "id"> & { id?: string }
): MovimentoCaixa => {
  const movimentos = load();
  if (data.id) {
    const next = movimentos.map((movimento) =>
      movimento.id === data.id ? { ...movimento, ...data } : movimento
    );
    persist(next);
    return next.find((movimento) => movimento.id === data.id) ?? {
      ...(data as MovimentoCaixa),
    };
  }

  const created: MovimentoCaixa = {
    ...(data as Omit<MovimentoCaixa, "id">),
    id: createLocalId(),
  };
  persist([...movimentos, created]);
  return created;
};

export const deleteMovimento = (id: string) => {
  if (id === "*") {
    persist([]);
    return;
  }
  const movimentos = load();
  const next = movimentos.filter((movimento) => movimento.id !== id);
  persist(next);
};
