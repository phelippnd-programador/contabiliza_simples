import mockDb from "../../../../mock/db.json";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type { ProdutoServicoResumo } from "../services/cadastros.service";

const normalizeProduto = (entry: any): ProdutoServicoResumo => ({
  id: String(entry.id),
  descricao: entry.descricao,
  tipo: entry.tipo,
  status: entry.status,
  codigo: entry.codigo,
  unidade: entry.unidade,
  valorUnitario: entry.valorUnitario,
  ncm: entry.ncm,
  cfop: entry.cfop,
  cnae: entry.cnae,
  codigoServico: entry.codigoServico,
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

export function getLocalProdutosServicos(
  page: number,
  pageSize: number,
  q?: string
): ApiListResponse<ProdutoServicoResumo> {
  const raw = Array.isArray(mockDb.produtosServicos) ? mockDb.produtosServicos : [];
  const normalized = raw.map(normalizeProduto);
  const filtered = q
    ? normalized.filter((item) =>
        String(item.descricao ?? item.codigo ?? "")
          .toLowerCase()
          .includes(q.toLowerCase())
      )
    : normalized;
  return paginate(filtered, page, pageSize);
}
