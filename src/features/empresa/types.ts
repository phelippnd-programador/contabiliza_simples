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
