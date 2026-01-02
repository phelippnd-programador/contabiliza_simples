import type { ContaBancaria } from "../types";
import {
  deleteConta as deleteContaStorage,
  getConta as getContaStorage,
  listContas as listContasStorage,
  saveConta as saveContaStorage,
} from "../storage/contas";

export async function listContas(): Promise<ContaBancaria[]> {
  return listContasStorage();
}

export async function getConta(
  id: string
): Promise<ContaBancaria | undefined> {
  return getContaStorage(id);
}

export async function saveConta(
  data: Omit<ContaBancaria, "id"> & { id?: string }
): Promise<ContaBancaria> {
  return saveContaStorage(data);
}

export async function deleteConta(id: string): Promise<void> {
  deleteContaStorage(id);
}
