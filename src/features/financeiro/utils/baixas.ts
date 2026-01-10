import type { BaixaTitulo, MovimentoCaixa } from "../types";
import { TipoMovimentoCaixa, TipoReferenciaMovimentoCaixa } from "../types";
import { deleteMovimento, saveMovimento } from "../services/movimentos.service";

const createBaixaId = () =>
  `baixa-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createCompetencia = (date: string) => date.slice(0, 7);

const hasBaixa = (
  baixas: BaixaTitulo[] | undefined,
  data: string,
  parcela?: number
) =>
  (baixas ?? []).some(
    (baixa) => baixa.data === data && (baixa.parcela ?? 0) === (parcela ?? 0)
  );

const buildMovimento = (
  baixa: BaixaInput,
  referenciaId: string,
  descricao: string,
  tipo: "RECEBER" | "PAGAR",
  movimentoId?: string
): Omit<MovimentoCaixa, "id"> & { id?: string } => ({
  id: movimentoId,
  data: baixa.data,
  contaId: baixa.contaId!,
  tipo: tipo === "RECEBER" ? TipoMovimentoCaixa.ENTRADA : TipoMovimentoCaixa.SAIDA,
  valor: baixa.valor,
  descricao,
  competencia: createCompetencia(baixa.data),
  categoriaId: baixa.categoriaId,
  centroCustoId: baixa.centroCustoId,
  referencia: {
    tipo:
      tipo === "RECEBER"
        ? TipoReferenciaMovimentoCaixa.RECEITA
        : TipoReferenciaMovimentoCaixa.DESPESA,
    id: referenciaId,
  },
});

const updateMovimentoForBaixa = async (params: {
  baixa: BaixaInput;
  referenciaId: string;
  descricao: string;
  tipo: "RECEBER" | "PAGAR";
  movimentoId?: string;
}) => {
  if (!params.baixa.contaId) return undefined;
  const movimento = buildMovimento(
    params.baixa,
    params.referenciaId,
    params.descricao,
    params.tipo,
    params.movimentoId
  );
  const saved = await saveMovimento(movimento);
  return saved.id;
};

const removeMovimentoForBaixa = async (movimentoId?: string) => {
  if (!movimentoId) return;
  await deleteMovimento(movimentoId);
};

export type BaixaInput = {
  data: string;
  valor: number;
  parcela?: number;
  formaPagamento?: string;
  contaId?: string;
  categoriaId?: string;
  centroCustoId?: string;
  observacoes?: string;
};

export const registrarBaixa = async (params: {
  tipo: "RECEBER" | "PAGAR";
  referenciaId: string;
  descricao: string;
  baixas?: BaixaTitulo[];
  baixa: BaixaInput;
}): Promise<BaixaTitulo[]> => {
  const { tipo, referenciaId, descricao, baixa } = params;
  const atual = params.baixas ?? [];
  const existingIndex = atual.findIndex(
    (item) => item.data === baixa.data && (item.parcela ?? 0) === (baixa.parcela ?? 0)
  );
  if (existingIndex >= 0) {
    const existing = atual[existingIndex];
    if (!baixa.contaId && existing.movimentoId) {
      await removeMovimentoForBaixa(existing.movimentoId);
    }
    const movimentoId = await updateMovimentoForBaixa({
      baixa,
      referenciaId,
      descricao,
      tipo,
      movimentoId: existing.movimentoId,
    });
    const updated: BaixaTitulo = {
      ...existing,
      data: baixa.data,
      valor: baixa.valor,
      parcela: baixa.parcela,
      formaPagamento: baixa.formaPagamento,
      contaId: baixa.contaId,
      categoriaId: baixa.categoriaId,
      observacoes: baixa.observacoes,
      movimentoId: movimentoId ?? existing.movimentoId,
    };
    const next = [...atual];
    next[existingIndex] = updated;
    return next;
  }

  let movimentoId: string | undefined;
  movimentoId = await updateMovimentoForBaixa({
    baixa,
    referenciaId,
    descricao,
    tipo,
  });

  return [
    ...atual,
    {
      id: createBaixaId(),
      data: baixa.data,
      valor: baixa.valor,
      parcela: baixa.parcela,
      formaPagamento: baixa.formaPagamento,
      contaId: baixa.contaId,
      categoriaId: baixa.categoriaId,
      observacoes: baixa.observacoes,
      movimentoId,
    },
  ];
};

export const removerMovimentosDeBaixas = async (baixas?: BaixaTitulo[]) => {
  if (!baixas?.length) return;
  for (const baixa of baixas) {
    if (baixa.movimentoId) {
      await deleteMovimento(baixa.movimentoId);
    }
  }
};
