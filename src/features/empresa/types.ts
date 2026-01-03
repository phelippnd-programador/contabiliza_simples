export type EnderecoContatoData = {
    email: string;
    telefone: string;

    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
};

export type EmpresaResumo = {
    id: string;
    razaoSocial: string;
    nomeFantasia?: string;
    cnpj?: string;
};

export type EmpresaCadastro = {
    id: string;
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    cnaePrincipal: string;
    regimeTributario?: string;
    anexoSimples?: string;
    rbt12?: number;
    percentualFatorR?: number;
    telefone?: string;
    email?: string;
    inscricaoEstadual?: string;
};
