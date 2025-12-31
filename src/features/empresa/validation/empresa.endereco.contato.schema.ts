import { z } from "zod";

export const EnderecoContatoSchema = z.object({
    email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
    telefone: z.string().min(10, "Telefone inválido"),

    cep: z.string().min(8, "CEP inválido"),
    logradouro: z.string().min(2, "Informe o endereço"),
    numero: z.string().min(1, "Informe o número"),
    complemento: z.string().optional().or(z.literal("")),
    bairro: z.string().min(2, "Informe o bairro"),
    cidade: z.string().min(2, "Informe a cidade"),
    uf: z.string().length(2, "UF inválida"),
});

export type EnderecoContatoFormData = z.infer<typeof EnderecoContatoSchema>;
