import { z } from "zod";
import { AnexoSimples, RegimeTributario } from "../../tributacao/types";
export const empresaSchema = z
    .object({
        cnpj: z.string().regex(/^\d+$/, "CNPJ deve conter apenas números")
            .optional()
            .refine((v) => v !== undefined, {
                message: "CNPJ é obrigatório UN",
            })
            .refine((v) => v !== undefined && v.length > 0, {
                message: "CNPJ é obrigatório",
            })
            .refine((v) => v !== undefined && v.length === 14, {
                message: "CNPJ inválido: deve conter 14 dígitos",
            })

        ,
        razaoSocial: z
            .string()
            .min(3, "Razão social deve ter no mínimo 3 caracteres"),
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
        nomeFantasia: z
            .string()
            .min(3, "Nome fantasia deve ter no mínimo 3 caracteres"),

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
        telefone: z.string()
            .regex(/^\d+$/, "Telefone deve conter apenas números")
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

export type EmpresaFormData = z.infer<typeof empresaSchema>;
