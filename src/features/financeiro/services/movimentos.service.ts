import type { MovimentoCaixa } from "../types";
import {
  deleteMovimento as deleteMovimentoStorage,
  getMovimento as getMovimentoStorage,
  listMovimentos as listMovimentosStorage,
  saveMovimento as saveMovimentoStorage,
} from "../storage/movimentos";

export async function listMovimentos(): Promise<MovimentoCaixa[]> {
  return listMovimentosStorage();
}

export async function getMovimento(
  id: string
): Promise<MovimentoCaixa | undefined> {
  return getMovimentoStorage(id);
}

export async function saveMovimento(
  data: Omit<MovimentoCaixa, "id"> & { id?: string }
): Promise<MovimentoCaixa> {
  return saveMovimentoStorage(data);
}

export async function deleteMovimento(id: string): Promise<void> {
  deleteMovimentoStorage(id);
}
