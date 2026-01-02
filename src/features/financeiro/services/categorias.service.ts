import type { CategoriaMovimento } from "../types";
import {
  deleteCategoria as deleteCategoriaStorage,
  getCategoria as getCategoriaStorage,
  listCategorias as listCategoriasStorage,
  saveCategoria as saveCategoriaStorage,
} from "../storage/categorias";

export async function listCategorias(): Promise<CategoriaMovimento[]> {
  return listCategoriasStorage();
}

export async function getCategoria(
  id: string
): Promise<CategoriaMovimento | undefined> {
  return getCategoriaStorage(id);
}

export async function saveCategoria(
  data: Omit<CategoriaMovimento, "id"> & { id?: string }
): Promise<CategoriaMovimento> {
  return saveCategoriaStorage(data);
}

export async function deleteCategoria(id: string): Promise<void> {
  deleteCategoriaStorage(id);
}
