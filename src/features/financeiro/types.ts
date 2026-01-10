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
    centroCustoId?: string;

    // para conciliação
    referencia?: {
        tipo: TipoReferenciaMovimentoCaixa;
        id: string;
    };
};

export type ExtratoBancarioItem = {
    id: string;
    data: string;
    contaId: string;
    descricao: string;
    valor: number;
    tipo: TipoMovimentoCaixa;
    movimentoId?: string;
};

export const TipoReferenciaMovimentoCaixa = {
    RECEITA: 'RECEITA',
    DESPESA: 'DESPESA',
    IMPOSTO: 'IMPOSTO',
    CARTAO_FATURA: 'CARTAO_FATURA',
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

export type BaixaTitulo = {
    id: string;
    data: string;
    valor: number;
    parcela?: number;
    formaPagamento?: string;
    contaId?: string;
    categoriaId?: string;
    centroCustoId?: string;
    observacoes?: string;
    movimentoId?: string;
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

export type CartaoCredito = {
    id: string;
    nome: string;
    banco: string;
    vencimentoDia: number;
    fechamentoDia: number;
    corteDia?: number;
    limiteInicial: number;
};

export type CartaoLancamento = {
    id: string;
    cartaoId: string;
    data: string;
    descricao: string;
    valor: number;
    parcela?: number;
    totalParcelas?: number;
    categoriaId?: string;
    centroCustoId?: string;
    faturaCompetencia: string;
};

export type CartaoFaturaStatus = "ABERTA" | "FECHADA" | "PAGA";

export type CartaoFatura = {
    id: string;
    cartaoId: string;
    competencia: string;
    fechamento: string;
    vencimento: string;
    total: number;
    status: CartaoFaturaStatus;
    movimentoId?: string;
};

export type FinanceiroFechamentoStatus = "ABERTO" | "FECHADO";

export type FinanceiroFechamento = {
    id: string;
    competencia: string;
    status: FinanceiroFechamentoStatus;
    fechadoEm?: string;
    fechadoPor?: string;
    observacoes?: string;
};

export type FinanceiroAuditoria = {
    id: string;
    data: string;
    acao: string;
    entidade: string;
    entidadeId?: string;
    competencia?: string;
    detalhes?: Record<string, unknown>;
};

export type OrcamentoFinanceiro = {
    id: string;
    competencia: string;
    categoriaId: string;
    valor: number;
};


