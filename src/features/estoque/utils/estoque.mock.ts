import type {
  ApiListResponse,
} from "../../../shared/types/api-types";
import type {
  EstoqueResumo,
  EstoqueMovimentoResumo,
  ListMovimentosParams,
} from "../services/estoque.service";
import mockDb from "../../../mock/db.json";

const normalizeEstoqueEntry = (entry: any): EstoqueResumo => ({
  id: String(entry.id),
  produtoId: entry.produtoId ? String(entry.produtoId) : undefined,
  descricao: entry.descricao,
  item: entry.item,
  quantidade: entry.quantidade,
  custoMedio: entry.custoMedio,
  estoqueMinimo: entry.estoqueMinimo,
});

const normalizeMovimentoEntry = (entry: any): EstoqueMovimentoResumo => ({
  id: String(entry.id),
  itemId: entry.itemId ? String(entry.itemId) : entry.produtoId ? String(entry.produtoId) : "manual",
  tipo: entry.tipo,
  quantidade: entry.quantidade,
  custoUnitario: entry.custoUnitario,
  custoMedio: entry.custoMedio,
  saldo: entry.saldo,
  data: entry.data,
  lote: entry.lote,
  serie: entry.serie,
  origem: entry.origem,
  origemId: entry.origemId,
  observacoes: entry.observacoes,
});

const paginate = <T>(items: T[], page: number, pageSize: number): ApiListResponse<T> => {
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return {
    data: paged,
    meta: {
      page,
      pageSize,
      total: items.length,
    },
  };
};

export function getLocalEstoqueData(
  page: number,
  pageSize: number,
  q?: string
): ApiListResponse<EstoqueResumo> {
  const raw = Array.isArray(mockDb.estoque) ? mockDb.estoque : [];
  const normalized = raw.map(normalizeEstoqueEntry);
  const filtered = q
    ? normalized.filter((item) =>
        String(item.descricao ?? item.item ?? "")
          .toLowerCase()
          .includes(q.toLowerCase())
      )
    : normalized;
  return paginate(filtered, page, pageSize);
}

export function getLocalMovimentosData(
  itemId: string,
  page: number,
  pageSize: number,
  params: ListMovimentosParams
): ApiListResponse<EstoqueMovimentoResumo> {
  const raw = Array.isArray(mockDb.estoqueMovimentos) ? mockDb.estoqueMovimentos : [];
  const normalized = raw.map(normalizeMovimentoEntry);
  const filtered = normalized.filter((mov) => {
    if (itemId && mov.itemId && mov.itemId !== itemId) return false;
    if (params.lote && mov.lote !== params.lote) return false;
    if (params.serie && mov.serie !== params.serie) return false;
    if (params.origem && mov.origem !== params.origem) return false;
    if (params.dataInicio && mov.data < params.dataInicio) return false;
    if (params.dataFim && mov.data > params.dataFim) return false;
    return true;
  });
  return paginate(filtered, page, pageSize);
}
