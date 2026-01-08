import { describe, expect, test } from "vitest";
import { validateMovimentacao } from "./estoque.validation";

describe("validateMovimentacao", () => {
  const basePayload = {
    itemId: "1",
    tipo: "ENTRADA" as const,
    quantidade: 5,
    data: "2026-01-06",
  };

  test("accepts valid entrada", () => {
    const result = validateMovimentacao(
      { ...basePayload, custoUnitario: 100 },
      { selectedItemQuantity: 10 }
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test("rejects entrada without cost", () => {
    const result = validateMovimentacao(basePayload, {});
    expect(result.valid).toBe(false);
    expect(result.errors.custoUnitario).toBeDefined();
  });

  test("rejects falta de quantidade", () => {
    const result = validateMovimentacao({ ...basePayload, quantidade: 0 }, {});
    expect(result.valid).toBe(false);
    expect(result.errors.quantidade).toBeDefined();
  });

  test("rejects saida maior que saldo", () => {
    const result = validateMovimentacao(
      { ...basePayload, tipo: "SAIDA", quantidade: 8 },
      { selectedItemQuantity: 5 }
    );
    expect(result.errors.quantidade).toMatch(/saldo/);
  });

  test("requires justificativa to allow negative saldo", () => {
    const result = validateMovimentacao(
      { ...basePayload, tipo: "SAIDA", quantidade: 8 },
      { selectedItemQuantity: 5, allowNegative: true }
    );
    expect(result.errors.observacoes).toBeDefined();
  });

  test("accepts negative saldo with justificativa", () => {
    const result = validateMovimentacao(
      {
        ...basePayload,
        tipo: "SAIDA",
        quantidade: 8,
        observacoes: "Saldo negativo aprovado",
      },
      { selectedItemQuantity: 5, allowNegative: true }
    );
    expect(result.valid).toBe(true);
  });

  test("requires origemId when origem != manual", () => {
    const result = validateMovimentacao(
      { ...basePayload, origem: "VENDA", origemId: "" },
      {}
    );
    expect(result.errors.origemId).toBeDefined();
  });
});
