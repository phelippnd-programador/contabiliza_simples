import { z } from "zod";

const itemSchema = z.object({
  descricao: z.string().min(1, "Descricao e obrigatoria"),
  quantidade: z.coerce.number().min(1, "Quantidade minima e 1").optional(),
  valorUnitario: z.coerce.number().min(0.01, "Valor unitario deve ser maior que zero"),
  codigoServico: z.string().optional(),
  ncm: z.string().optional(),
  cfop: z.string().optional(),
  cnae: z.string().optional(),
});

export const notaDraftSchema = z
  .object({
    empresaId: z.string().min(1, "Empresa e obrigatoria"),
    tipo: z.enum(["SERVICO", "PRODUTO"]),
    competencia: z.string().min(1, "Competencia e obrigatoria"),
    dataEmissao: z.string().optional(),
    tomador: z.object({
      nomeRazao: z.string().min(1, "Nome/Razao social e obrigatorio"),
      documento: z
        .string()
        .min(11, "Documento deve ter 11 ou 14 digitos")
        .max(14, "Documento deve ter 11 ou 14 digitos")
        .refine((val) => /^\d+$/.test(val), "Documento deve conter apenas numeros"),
      email: z.string().email("Email invalido").optional(),
      telefone: z.string().optional(),
      endereco: z
        .object({
          cep: z.string().optional(),
          logradouro: z.string().optional(),
          numero: z.string().optional(),
          complemento: z.string().optional(),
          bairro: z.string().optional(),
          cidade: z.string().optional(),
          uf: z.string().optional(),
          codigoMunicipioIbge: z.string().optional(),
          pais: z.string().optional(),
        })
        .optional(),
    }),
    itens: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
    observacoes: z.string().optional(),
    financeiro: z
      .object({
        gerarMovimentoCaixa: z.boolean().optional(),
        contaId: z.string().optional(),
        categoriaId: z.string().optional(),
        dataRecebimento: z.string().optional(),
        formaPagamento: z.enum(["PIX", "DINHEIRO", "CARTAO", "BOLETO", "TRANSFERENCIA"]).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    data.itens.forEach((item, index) => {
      if (data.tipo === "PRODUTO") {
        if (!item.ncm) {
          ctx.addIssue({
            path: ["itens", index, "ncm"],
            code: "custom",
            message: "NCM e obrigatorio para produto",
          });
        }
        if (!item.cfop) {
          ctx.addIssue({
            path: ["itens", index, "cfop"],
            code: "custom",
            message: "CFOP e obrigatorio para produto",
          });
        }
      }
    });
  });

export type NotaDraftFormData = z.infer<typeof notaDraftSchema>;
