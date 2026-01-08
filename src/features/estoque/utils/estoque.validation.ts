import type {
  EstoqueMovimentoPayload,
  EstoqueMovimentoTipo,
  ListMovimentosParams,
} from "../services/estoque.service";
import {
  DEFAULT_ESTOQUE_POLICY,
  getSignedQuantidade,
  validarSaldoNegativo,
} from "./estoque.utils";

export type MovimentacaoContext = {
  selectedItemQuantity?: number;
  ajusteDirecao?: "ENTRADA" | "SAIDA";
  allowNegative?: boolean;
  requireJustificativa?: boolean;
};

export type MovimentacaoValidationResult = {
  valid: boolean;
  errors: Partial<
    Record<
      keyof Omit<EstoqueMovimentoPayload, "observacoes"> | "itemId" | "observacoes",
      string
    >
  >;
};

export const validateMovimentacao = (
  payload: EstoqueMovimentoPayload & { itemId?: string },
  context: MovimentacaoContext = {}
): MovimentacaoValidationResult => {
  const errors: MovimentacaoValidationResult["errors"] = {};
  const { selectedItemQuantity, ajusteDirecao } = context;
  const tipoEntrada =
    payload.tipo === "ENTRADA" ||
    (payload.tipo === "AJUSTE" && ajusteDirecao === "ENTRADA");
  const tipoSaida =
    payload.tipo === "SAIDA" ||
    (payload.tipo === "AJUSTE" && ajusteDirecao === "SAIDA");

  if (!payload.itemId) {
    errors.itemId = "Selecione o item do estoque.";
  }
  if (!payload.data) {
    errors.data = "Informe a data do movimento.";
  }
  if (!payload.quantidade || payload.quantidade <= 0) {
    errors.quantidade = "Quantidade deve ser maior que zero.";
  }
  if (tipoEntrada && (!payload.custoUnitario || payload.custoUnitario <= 0)) {
    errors.custoUnitario = "Informe o custo unitário para entrada/ajuste.";
  }
  if (tipoSaida && selectedItemQuantity !== undefined) {
    const movementSigned = getSignedQuantidade(
      payload.tipo,
      payload.quantidade,
      ajusteDirecao
    );
    const policy = {
      ...DEFAULT_ESTOQUE_POLICY,
      allowNegative: Boolean(context.allowNegative),
      requireJustificativa: context.requireJustificativa ?? DEFAULT_ESTOQUE_POLICY.requireJustificativa,
    };
    const negativeCheck = validarSaldoNegativo({
      saldoAtual: selectedItemQuantity,
      movimento: movementSigned,
      policy,
      observacoes: payload.observacoes,
    });
    if (!negativeCheck.ok) {
      if (negativeCheck.reason === "JUSTIFICATION_REQUIRED") {
        errors.observacoes = "Informe a justificativa para saldo negativo.";
      } else {
        errors.quantidade = "Quantidade excede o saldo atual.";
      }
    }
  }

  if (payload.origem && payload.origem !== "MANUAL" && !payload.origemId) {
    errors.origemId = "Informe a referência da origem.";
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
};
