import { createMovimento, listEstoque, updateEstoqueItem } from "../services/estoque.service";
import type { ComercialItem } from "../../comercial/services/comercial.service";
import { calcularQuantidadeDisponivel } from "./estoque.utils";

export const FINAL_MOVEMENT_STATUSES = ["APROVADA", "FATURADA"] as const;
export const FINAL_STATUS_SET = new Set<string>(FINAL_MOVEMENT_STATUSES);

export const shouldGenerateMovement = (status?: string) =>
  Boolean(status && FINAL_STATUS_SET.has(status));

const toMovimento = (
  item: { produtoId?: string; quantidade: number },
  params: {
    data: string;
    tipo: "ENTRADA" | "SAIDA";
    origem: "VENDA" | "COMPRA";
    origemId: string;
  }
) => ({
  tipo: params.tipo,
  data: params.data,
  quantidade: item.quantidade,
  origem: params.origem,
  origemId: params.origemId,
  observacoes: `${params.origem} ${params.origemId}`,
});

export const gerarMovimentosParaVenda = async (params: {
  itens: ComercialItem[];
  data: string;
  vendaId: string;
  movimentoTipo: "ENTRADA" | "SAIDA";
  depositoId?: string;
}) => {
  await Promise.all(
    params.itens
      .filter((item) => item.produtoId && item.quantidade > 0)
      .map((item) =>
        createMovimento(item.produtoId as string, {
          ...toMovimento(item, {
            data: params.data,
            tipo: params.movimentoTipo,
            origem: "VENDA",
            origemId: params.vendaId,
          }),
          depositoId: params.depositoId,
        })
      )
  );
};

export const gerarMovimentosParaCompra = async (params: {
  itens: ComercialItem[];
  data: string;
  compraId: string;
}) => {
  await Promise.all(
    params.itens
      .filter((item) => item.produtoId && item.quantidade > 0)
      .map((item) =>
        createMovimento(item.produtoId as string, {
          ...toMovimento(item, {
            data: params.data,
            tipo: "ENTRADA",
            origem: "COMPRA",
            origemId: params.compraId,
          }),
        })
      )
  );
};

const resolveEstoqueItem = (
  estoqueItens: Awaited<ReturnType<typeof listEstoque>>["data"],
  produtoId: string,
  depositoId?: string,
  criteria?: "AVAILABLE" | "RESERVED"
) => {
  const matches = estoqueItens.filter(
    (item) => String(item.produtoId ?? item.id) === produtoId
  );
  if (depositoId) {
    return matches.find((item) => item.depositoId === depositoId) ?? null;
  }
  if (!matches.length) return null;
  if (criteria === "RESERVED") {
    return matches
      .slice()
      .sort(
        (a, b) =>
          (b.quantidadeReservada ?? 0) - (a.quantidadeReservada ?? 0)
      )[0];
  }
  return matches
    .slice()
    .sort((a, b) => {
      const availableA = calcularQuantidadeDisponivel(
        a.quantidade,
        a.quantidadeReservada
      );
      const availableB = calcularQuantidadeDisponivel(
        b.quantidade,
        b.quantidadeReservada
      );
      return availableB - availableA;
    })[0];
};

export const reservarEstoqueParaVenda = async (params: {
  itens: ComercialItem[];
  depositoId?: string;
}) => {
  const estoque = await listEstoque({ page: 1, pageSize: 200 });
  for (const item of params.itens) {
    if (!item.produtoId || item.quantidade <= 0) continue;
    const target = resolveEstoqueItem(
      estoque.data,
      item.produtoId,
      params.depositoId
    );
    if (!target) {
      throw new Error("ITEM_NOT_FOUND");
    }
    const disponivel = calcularQuantidadeDisponivel(
      target.quantidade,
      target.quantidadeReservada
    );
    if (item.quantidade > disponivel) {
      throw new Error("SALDO_INSUFICIENTE");
    }
    await updateEstoqueItem(target.id, {
      quantidadeReservada: (target.quantidadeReservada ?? 0) + item.quantidade,
    });
  }
};

export const liberarReservaVenda = async (params: {
  itens: ComercialItem[];
  depositoId?: string;
}) => {
  const estoque = await listEstoque({ page: 1, pageSize: 200 });
  for (const item of params.itens) {
    if (!item.produtoId || item.quantidade <= 0) continue;
    const target = resolveEstoqueItem(
      estoque.data,
      item.produtoId,
      params.depositoId,
      "RESERVED"
    );
    if (!target) continue;
    const reservadoAtual = target.quantidadeReservada ?? 0;
    const novoReservado = Math.max(0, reservadoAtual - item.quantidade);
    await updateEstoqueItem(target.id, {
      quantidadeReservada: novoReservado,
    });
  }
};
