import type { ContaBancaria } from "../types";


const STORAGE_KEY = "financeiro.contas";

const createLocalId = () =>
  `conta-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const load = (): ContaBancaria[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ContaBancaria[]) : [];
  } catch {
    return [];
  }
};

const persist = (contas: ContaBancaria[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contas));
};

export const listContas = (): ContaBancaria[] => load();

export const getConta = (id: string): ContaBancaria | undefined =>
  load().find((conta) => conta.id === id);

export const saveConta = (
  data: Omit<ContaBancaria, "id"> & { id?: string }
): ContaBancaria => {
  const contas = load();
  if (data.id) {
    const next = contas.map((conta) =>
      conta.id === data.id ? { ...conta, ...data } : conta
    );
    persist(next);
    return next.find((conta) => conta.id === data.id) ?? {
      ...(data as ContaBancaria),
    };
  }

  const created: ContaBancaria = {
    ...(data as Omit<ContaBancaria, "id">),
    id: createLocalId(),
  };
  persist([...contas, created]);
  return created;
};

export const deleteConta = (id: string) => {
  const contas = load();
  const next = contas.filter((conta) => conta.id !== id);
  persist(next);
};
