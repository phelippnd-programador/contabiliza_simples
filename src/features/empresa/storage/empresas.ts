import type { EmpresaCadastro } from "../types";

const STORAGE_KEY = "empresa.cadastros";

const createLocalId = () =>
  `empresa-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const load = (): EmpresaCadastro[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmpresaCadastro[]) : [];
  } catch {
    return [];
  }
};

const persist = (empresas: EmpresaCadastro[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(empresas));
};

export const listEmpresas = (): EmpresaCadastro[] => load();

export const getEmpresa = (id: string): EmpresaCadastro | undefined =>
  load().find((empresa) => empresa.id === id);

export const saveEmpresa = (
  data: Omit<EmpresaCadastro, "id"> & { id?: string }
): EmpresaCadastro => {
  const empresas = load();

  if (data.id) {
    const next = empresas.map((empresa) =>
      empresa.id === data.id ? { ...empresa, ...data } : empresa
    );
    persist(next);
    return next.find((empresa) => empresa.id === data.id) ?? {
      ...(data as EmpresaCadastro),
    };
  }

  const created: EmpresaCadastro = {
    ...(data as Omit<EmpresaCadastro, "id">),
    id: createLocalId(),
  };
  persist([...empresas, created]);
  return created;
};

export const deleteEmpresa = (id: string) => {
  const empresas = load();
  const next = empresas.filter((empresa) => empresa.id !== id);
  persist(next);
};
