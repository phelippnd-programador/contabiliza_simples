import { z } from "zod";

export const empresaFinanceiroSchema = z
  .object({
    temProlabore: z.boolean().default(false),

    // aceita "123" e vira 123
    valorProlabore: z.coerce.number().min(0, "Pró-labore não pode ser negativo").optional(),

    diaPagamentoProlabore: z.coerce
      .number()
      .int("Dia de pagamento deve ser inteiro")
      .min(1, "Dia mínimo é 1")
      .max(28, "Dia máximo é 28")
      .optional(),

    contaPagamentoProlaboreId: z.string().min(1, "Conta de pagamento é obrigatória").optional(),
    categoriaProlaboreId: z.string().min(1, "Categoria do pró-labore é obrigatória").optional(),

    percentualInssProlabore: z.coerce.number().min(0, "Percentual mínimo é 0").max(100, "Percentual máximo é 100").default(11).optional(),

    gerarLancamentoInss: z.boolean().default(true).optional(),
    categoriaInssId: z.string().min(1, "Categoria do INSS é obrigatória").optional(),

    frequenciaProlabore: z.enum(["MENSAL"]).default("MENSAL").optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.temProlabore) return;

    if (data.valorProlabore === undefined || Number.isNaN(data.valorProlabore)) {
      ctx.addIssue({ path: ["valorProlabore"], code: "custom", message: "Informe o valor do pró-labore" });
    } else if (data.valorProlabore <= 0) {
      ctx.addIssue({ path: ["valorProlabore"], code: "custom", message: "O pró-labore deve ser maior que zero" });
    }

    if (data.diaPagamentoProlabore === undefined || Number.isNaN(data.diaPagamentoProlabore)) {
      ctx.addIssue({ path: ["diaPagamentoProlabore"], code: "custom", message: "Informe o dia de pagamento (1 a 28)" });
    }

    if (!data.contaPagamentoProlaboreId) {
      ctx.addIssue({ path: ["contaPagamentoProlaboreId"], code: "custom", message: "Selecione a conta de pagamento" });
    }

    if (!data.categoriaProlaboreId) {
      ctx.addIssue({ path: ["categoriaProlaboreId"], code: "custom", message: "Selecione a categoria do pró-labore" });
    }

    const gerarInss = data.gerarLancamentoInss ?? true;
    if (gerarInss && !data.categoriaInssId) {
      ctx.addIssue({ path: ["categoriaInssId"], code: "custom", message: "Selecione a categoria do INSS" });
    }
  });

export type EmpresaFinanceiroFormData = z.infer<typeof empresaFinanceiroSchema>;
