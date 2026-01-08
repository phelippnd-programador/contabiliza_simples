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

const getSaldoInicial = () => {
  const raw = Array.isArray(mockDb.estoque) ? mockDb.estoque : [];
  return raw.reduce<Record<string, number>>((acc, entry) => {
    const key = String(entry.produtoId ?? entry.id);
    acc[key] = entry.quantidade ?? 0;
    return acc;
  }, {});
};

const normalizeMovimentoEntry = (
  entry: any,
  saldoMap: Record<string, number>
): EstoqueMovimentoResumo => {
  const itemId = entry.itemId
    ? String(entry.itemId)
    : entry.produtoId
    ? String(entry.produtoId)
    : "manual";
  const quantidade = entry.quantidade ?? 0;
  const signed =
    entry.tipo === "SAIDA"
      ? -Math.abs(quantidade)
      : Math.abs(quantidade);
  const previousSaldo = saldoMap[itemId] ?? 0;
  const newSaldo = previousSaldo + signed;
  saldoMap[itemId] = newSaldo;

  return {
    id: String(entry.id),
    itemId,
    tipo: entry.tipo,
    quantidade,
    custoUnitario: entry.custoUnitario,
    custoMedio: entry.custoMedio,
    saldo: newSaldo,
    data: entry.data,
    lote: entry.lote,
    serie: entry.serie,
    origem: entry.origem,
    origemId: entry.origemId,
    observacoes: entry.observacoes,
  };
};

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
  const saldoMap = getSaldoInicial();
  const normalized = raw
    .map((entry) => normalizeMovimentoEntry(entry, saldoMap))
    .sort((a, b) => b.data.localeCompare(a.data));
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
