import type { CategoriaMovimento } from "../types";

const STORAGE_KEY = "financeiro.categorias";

const createLocalId = () =>
  `categoria-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const load = (): CategoriaMovimento[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CategoriaMovimento[]) : [];
  } catch {
    return [];
  }
};

const persist = (categorias: CategoriaMovimento[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
};

export const listCategorias = (): CategoriaMovimento[] => load();

export const getCategoria = (id: string): CategoriaMovimento | undefined =>
  load().find((categoria) => categoria.id === id);

export const saveCategoria = (
  data: Omit<CategoriaMovimento, "id"> & { id?: string }
): CategoriaMovimento => {
  const categorias = load();
  if (data.id) {
    const next = categorias.map((categoria) =>
      categoria.id === data.id ? { ...categoria, ...data } : categoria
    );
    persist(next);
    return next.find((categoria) => categoria.id === data.id) ?? {
      ...(data as CategoriaMovimento),
    };
  }

  const created: CategoriaMovimento = {
    ...(data as Omit<CategoriaMovimento, "id">),
    id: createLocalId(),
  };
  persist([...categorias, created]);
  return created;
};

export const deleteCategoria = (id: string) => {
  const categorias = load();
  const next = categorias.filter((categoria) => categoria.id !== id);
  persist(next);
};
