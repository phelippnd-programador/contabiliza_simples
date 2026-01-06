import type { CartaoCredito } from "../types";

const STORAGE_KEY = "financeiro.cartoes";

const createLocalId = () =>
  `cartao-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const load = (): CartaoCredito[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartaoCredito[]) : [];
  } catch {
    return [];
  }
};

const persist = (cartoes: CartaoCredito[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartoes));
};

export const listCartoes = (): CartaoCredito[] => load();

export const getCartao = (id: string): CartaoCredito | undefined =>
  load().find((cartao) => cartao.id === id);

export const saveCartao = (
  data: Omit<CartaoCredito, "id"> & { id?: string }
): CartaoCredito => {
  const cartoes = load();
  if (data.id) {
    const next = cartoes.map((cartao) =>
      cartao.id === data.id ? { ...cartao, ...data } : cartao
    );
    persist(next);
    return next.find((cartao) => cartao.id === data.id) ?? {
      ...(data as CartaoCredito),
    };
  }

  const created: CartaoCredito = {
    ...(data as Omit<CartaoCredito, "id">),
    id: createLocalId(),
  };
  persist([...cartoes, created]);
  return created;
};

export const deleteCartao = (id: string) => {
  const cartoes = load();
  const next = cartoes.filter((cartao) => cartao.id !== id);
  persist(next);
};
