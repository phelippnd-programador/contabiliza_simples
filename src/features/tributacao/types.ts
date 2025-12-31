export type Tributacao = {
    regimeTributario: RegimeTributario,
    cnaePrincipal: string,
    anexoSimples: AnexoSimples,
    possuiFatorR: boolean,
    percentualFatorR: number,
    receitaBruta12Meses: number,
    dataAbertura: Date,
    geraISS: boolean,
}

export const RegimeTributario = {
    SIMPLES_NACIONAL: 'SIMPLES_NACIONAL',
    LUCRO_PRESUMIDO: 'LUCRO_PRESUMIDO',
    LUCRO_REAL: 'LUCRO_REAL'
} as const;
export const AnexoSimples = {
    I: 'I',
    II: 'II',
    III: 'III',
    IV: 'IV',
    V: 'V',
} as const;

export const AnexoSimplesLabel: Record<AnexoSimples, string> = {
    I: 'Anexo I – Comércio',
    II: 'Anexo II – Indústria',
    III: 'Anexo III – Serviços',
    IV: 'Anexo IV – Serviços (INSS fora)',
    V: 'Anexo V – Serviços (maior carga)',
};
export const RegimeTributarioLabel: Record<RegimeTributario, string> = {
    SIMPLES_NACIONAL: 'Simples Nacional',
    LUCRO_PRESUMIDO: 'Lucro Presumido',
    LUCRO_REAL: 'Lucro Real',
};

export type AnexoSimples =
    typeof AnexoSimples[keyof typeof AnexoSimples];

export type RegimeTributario = typeof RegimeTributario[keyof typeof RegimeTributario];
