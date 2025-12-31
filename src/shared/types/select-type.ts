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