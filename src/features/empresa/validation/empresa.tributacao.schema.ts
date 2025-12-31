import { z } from "zod";
import { AnexoSimples, RegimeTributario } from "../../tributacao/types";
export const empresaTributacaoSchema = z
    .object({
        cnaePrincipal: z.string().regex(/^\d+$/, "Cnae Principal deve conter apenas números")
            .optional()
            .refine((v) => v !== undefined, {
                message: "Cnae Principal é obrigatório UN",
            })
            .refine((v) => v !== undefined && v.length > 0, {
                message: "Cnae Principal é obrigatório",
            })
            .refine((v) => v !== undefined && v.length === 7, {
                message: "Cnae Principal inválido: deve conter 7 dígitos",
            }),

        regimeTributario: z
            .enum(RegimeTributario)
            .optional()
            .refine(
                (v) => v !== undefined,
                "Regime tributário é obrigatório"
            ),

        anexoSimples: z.enum(AnexoSimples).optional(),

        rbt12: z
            .number()
            .min(0, "RBT12 não pode ser negativo")
            .optional(),

        percentualFatorR: z
            .number()
            .min(0, "Percentual mínimo é 0")
            .max(100, "Percentual máximo é 100")
            .optional(),
        cnaesSecundarios: z.array(z.string().regex(/^\d+$/, "Cnae Secundário deve conter apenas números"))
            .optional(),
    })
    .superRefine((data, ctx) => {
        // regras condicionais
        if (data.regimeTributario === RegimeTributario.SIMPLES_NACIONAL) {
            if (!data.anexoSimples) {
                ctx.addIssue({
                    path: ["anexoSimples"],
                    message: "Anexo do Simples é obrigatório",
                    code: "custom",
                });
            }

            if (data.rbt12 === undefined) {
                ctx.addIssue({
                    path: ["rbt12"],
                    message: "RBT12 é obrigatório no Simples",
                    code: "custom",
                });
            }

            if (data.anexoSimples === AnexoSimples.III || data.anexoSimples === AnexoSimples.V) {
                if (data.percentualFatorR === undefined) {
                    ctx.addIssue({
                        path: ["percentualFatorR"],
                        message: "Percentual do Fator R é obrigatório",
                        code: "custom",
                    });
                }
            }
        }
    });

export type EmpresaTributacaoFormData = z.infer<typeof empresaTributacaoSchema>;
