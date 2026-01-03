import type { EmpresaCadastro, EmpresaResumo } from "../types";
import {
  deleteEmpresa as deleteEmpresaStorage,
  getEmpresa as getEmpresaStorage,
  listEmpresas as listEmpresasStorage,
  saveEmpresa as saveEmpresaStorage,
} from "../storage/empresas";

export async function listEmpresas(): Promise<EmpresaResumo[]> {
  return listEmpresasStorage().map((empresa) => ({
    id: empresa.id,
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia,
    cnpj: empresa.cnpj,
  }));
}

export async function getEmpresa(
  id: string
): Promise<EmpresaCadastro | undefined> {
  return getEmpresaStorage(id);
}

export async function saveEmpresa(
  data: Omit<EmpresaCadastro, "id"> & { id?: string }
): Promise<EmpresaCadastro> {
  return saveEmpresaStorage(data);
}

export async function deleteEmpresa(id: string): Promise<void> {
  deleteEmpresaStorage(id);
}
