export type ReceitaMes = {
    competencia: '2025-12',
    porAtividade: CnaeReceita[],
}

export type CnaeReceita = {
    cnae: string;
    valor: number;
}

export type ContaCaixa = {
    id: string;
    nome: string; // Banco, Pix, Dinheiro, Cartão etc.
    tipo: TipoConta
};
export type MovimentoCaixa = {
    id: string;
    data: string; // '2025-12-23'
    contaId: string;

    tipo: TipoMovimentoCaixa;
    valor: number;

    descricao?: string;

    // vínculo fiscal/competência (opcional, mas recomendado)
    competencia?: string; // '2025-12'
    cnae?: string;        // se entrada for de receita ligada a uma atividade
    categoriaId?: string; // ex: "Vendas", "Aluguel", "Impostos", "Folha"...

    // para conciliação
    referencia?: {
        tipo: TipoReferenciaMovimentoCaixa;
        id: string;
    };
};

export const TipoReferenciaMovimentoCaixa = {
    RECEITA: 'RECEITA',
    DESPESA: 'DESPESA',
    IMPOSTO: 'IMPOSTO',
} as const;
export type TipoReferenciaMovimentoCaixa = typeof TipoReferenciaMovimentoCaixa[keyof typeof TipoReferenciaMovimentoCaixa];

export const TipoConta = {
    BANCO: 'BANCO',
    DINHEIRO: 'DINHEIRO',
    CARTAO: 'CARTAO',
    OUTROS: 'OUTROS'
} as const;
export type TipoConta = typeof TipoConta[keyof typeof TipoConta];

export const TipoMovimentoCaixa = {
    ENTRADA: 'ENTRADA',
    SAIDA: 'SAIDA',
} as const;
export type TipoMovimentoCaixa = typeof TipoMovimentoCaixa[keyof typeof TipoMovimentoCaixa];

export type CategoriaMovimento = {
    id: string;
    nome: string;
    tipo: TipoMovimentoCaixa;
};

export type ContaBancaria = {
    id: string;
    nome: string;
    banco: string;
    agencia: string;
    conta: string;
    digito?: string;
    tipo: TipoConta;
    categoria: TipoMovimentoCaixa;
};


