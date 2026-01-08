export type EstoquePolicy = {
  allowNegative: boolean;
  requireJustificativa: boolean;
};

export const DEFAULT_ESTOQUE_POLICY: EstoquePolicy = {
  allowNegative: false,
  requireJustificativa: true,
};

export type MovimentoInput = {
  itemId: string;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  quantidade: number;
  data: string;
  custoUnitario?: number;
  origem?: string;
  origemId?: string;
  lote?: string;
  serie?: string;
  depositoId?: string;
  observacoes?: string;
  reversoDe?: string;
};

const normalizeKeyPart = (value?: string | number) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

export const buildDedupeKey = (movimento: MovimentoInput) =>
  [
    normalizeKeyPart(movimento.itemId),
    normalizeKeyPart(movimento.tipo),
    normalizeKeyPart(movimento.data),
    normalizeKeyPart(movimento.quantidade),
    normalizeKeyPart(movimento.custoUnitario),
    normalizeKeyPart(movimento.origem),
    normalizeKeyPart(movimento.origemId),
    normalizeKeyPart(movimento.lote),
    normalizeKeyPart(movimento.serie),
    normalizeKeyPart(movimento.depositoId),
  ]
    .filter((part) => part)
    .join("|");

export const getSignedQuantidade = (
  tipo: MovimentoInput["tipo"],
  quantidade: number,
  ajusteDirecao?: "ENTRADA" | "SAIDA"
) => {
  if (tipo === "AJUSTE") {
    if (ajusteDirecao === "SAIDA") return -Math.abs(quantidade);
    if (ajusteDirecao === "ENTRADA") return Math.abs(quantidade);
    return quantidade;
  }
  return tipo === "SAIDA" ? -Math.abs(quantidade) : Math.abs(quantidade);
};

export const calcularCustoMedio = (params: {
  quantidadeAtual: number;
  custoMedioAtual?: number;
  quantidadeMovimento: number;
  custoUnitario: number;
}) => {
  const quantidadeAtual = Math.max(0, params.quantidadeAtual);
  const custoMedioAtual = Math.max(0, params.custoMedioAtual ?? 0);
  const quantidadeMovimento = Math.max(0, params.quantidadeMovimento);
  if (!quantidadeMovimento) {
    return custoMedioAtual || 0;
  }
  const totalAtual = quantidadeAtual * custoMedioAtual;
  const totalMovimento = quantidadeMovimento * params.custoUnitario;
  const novoTotal = totalAtual + totalMovimento;
  const novoSaldo = quantidadeAtual + quantidadeMovimento;
  if (!novoSaldo) return 0;
  return Math.round(novoTotal / novoSaldo);
};

export const calcularQuantidadeDisponivel = (
  quantidadeAtual: number,
  quantidadeReservada?: number
) => quantidadeAtual - Math.max(0, quantidadeReservada ?? 0);

export const validarSaldoNegativo = (params: {
  saldoAtual: number;
  movimento: number;
  policy: EstoquePolicy;
  observacoes?: string;
}) => {
  const novoSaldo = params.saldoAtual + params.movimento;
  if (novoSaldo >= 0) {
    return { ok: true, novoSaldo };
  }
  if (!params.policy.allowNegative) {
    return { ok: false, novoSaldo, reason: "NEGATIVE_NOT_ALLOWED" as const };
  }
  if (params.policy.requireJustificativa && !params.observacoes) {
    return { ok: false, novoSaldo, reason: "JUSTIFICATION_REQUIRED" as const };
  }
  return { ok: true, novoSaldo, reason: "NEGATIVE_ALLOWED" as const };
};

export const formatLocalISODate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatLocalISODateTime = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
