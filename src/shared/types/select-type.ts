import type { ItemSelect } from "../../components/ui/input/AppSelectInput";
import { TipoConta, TipoMovimentoCaixa } from "../../features/financeiro/types";
import { AnexoSimples, AnexoSimplesLabel, RegimeTributario, RegimeTributarioLabel } from "../../features/tributacao/types";

export const regimeTributarioOptions: ItemSelect[] =
    (Object.values(RegimeTributario) as RegimeTributario[]).map(value => ({
        value,
        label: RegimeTributarioLabel[value],
    }));
export const anexoSimplesOptions: ItemSelect[] = (
    Object.values(AnexoSimples) as AnexoSimples[]).map(value => ({
        value,
        label: AnexoSimplesLabel[value],
    })
    );

export const tipoCategoriaOptions: ItemSelect[] = (
    Object.values(TipoMovimentoCaixa) as TipoMovimentoCaixa[]).map(value => ({
        value,
        label: TipoMovimentoCaixa[value],
    })
    );

export const categoriaInssOptions: ItemSelect[] = [
    { value: "EMPREGADO", label: "Empregado (CLT)" },
    { value: "CONTRIBUINTE_INDIVIDUAL_20", label: "Contribuinte Individual 20%" },
    { value: "CONTRIBUINTE_INDIVIDUAL_11", label: "Contribuinte Individual 11%" },
    { value: "MEI", label: "MEI" },
    { value: "EMPREGADO_DOMESTICO", label: "Empregado Domestico" },
    { value: "FACULTATIVO", label: "Facultativo" },
];

export const diasPagamentoOptions: ItemSelect[] = (
    Array.from({ length: 28 }, (_, i) => ({
        label: String(i + 1),
        value: i + 1,
    }))
);
export const tipoContaOptions: ItemSelect[] = (
    Object.values(TipoConta) as TipoConta[]).map(value => ({
        value,
        label: TipoConta[value],
    })
    );

export const bancoOptions: ItemSelect[] = [
    { value: "BANCO_DO_BRASIL", label: "Banco do Brasil" },
    { value: "BRADESCO", label: "Bradesco" },
    { value: "ITAU", label: "Itau" },
    { value: "SANTANDER", label: "Santander" },
    { value: "CAIXA", label: "Caixa" },
    { value: "INTER", label: "Banco Inter" },
    { value: "NU", label: "Nubank" },
    { value: "SICOOB", label: "Sicoob" },
    { value: "SICREDI", label: "Sicredi" },
    { value: "PIX", label: "PIX" },
];

// const diasPagamentoOptions = Array.from({ length: 28 }, (_, i) => ({
//   label: String(i + 1),
//   value: i + 1,
// }));

// const tipoContaOptions = [
//   { value: TipoConta.BANCO, label: "Banco" },
//   { value: TipoConta.DINHEIRO, label: "Dinheiro" },
//   { value: TipoConta.CARTAO, label: "Cartao" },
//   { value: TipoConta.OUTROS, label: "Outros" },
// ];

// export const tipoCategoriaOptions = [
//     { value: TipoMovimentoCaixa.ENTRADA, label: "Entrada" },
//     { value: TipoMovimentoCaixa.SAIDA, label: "Saida" },
// ];
