import type { BaixaTitulo, MovimentoCaixa } from "../types";
import { TipoMovimentoCaixa, TipoReferenciaMovimentoCaixa } from "../types";
import { saveMovimento } from "../services/movimentos.service";

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

export type BaixaInput = {
  data: string;
  valor: number;
  parcela?: number;
  formaPagamento?: string;
  contaId?: string;
  categoriaId?: string;
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
  if (hasBaixa(atual, baixa.data, baixa.parcela)) {
    return atual;
  }

  let movimentoId: string | undefined;
  if (baixa.contaId) {
    const movimento: Omit<MovimentoCaixa, "id"> = {
      data: baixa.data,
      contaId: baixa.contaId,
      tipo: tipo === "RECEBER" ? TipoMovimentoCaixa.ENTRADA : TipoMovimentoCaixa.SAIDA,
      valor: baixa.valor,
      descricao,
      competencia: createCompetencia(baixa.data),
      categoriaId: baixa.categoriaId,
      referencia: {
        tipo:
          tipo === "RECEBER"
            ? TipoReferenciaMovimentoCaixa.RECEITA
            : TipoReferenciaMovimentoCaixa.DESPESA,
        id: referenciaId,
      },
    };
    const saved = await saveMovimento(movimento);
    movimentoId = saved.id;
  }

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
