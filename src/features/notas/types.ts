export type NotaTipo = "SERVICO" | "PRODUTO";

export type NotaStatus =
  | "RASCUNHO"
  | "INVALIDO"
  | "EMITIDA"
  | "ERRO"
  | "CANCELADA";

export type NotaDraftRequest = {
  empresaId: string;
  tipo: NotaTipo;
  competencia: string;
  dataEmissao?: string;
  tomador: {
    nomeRazao: string;
    documento: string;
    email?: string;
    telefone?: string;
    endereco?: {
      cep?: string;
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      uf?: string;
      codigoMunicipioIbge?: string;
      pais?: string;
    };
  };
  itens: Array<{
    descricao: string;
    quantidade?: number;
    valorUnitario: number;
    codigoServico?: string;
    ncm?: string;
    cfop?: string;
    cnae?: string;
  }>;
  observacoes?: string;
  financeiro?: {
    gerarMovimentoCaixa?: boolean;
    contaId?: string;
    categoriaId?: string;
    dataRecebimento?: string;
    formaPagamento?: "PIX" | "DINHEIRO" | "CARTAO" | "BOLETO" | "TRANSFERENCIA";
  };
};

export type NotaDraftResponse = {
  draftId: string;
  status: "RASCUNHO" | "INVALIDO";
  faltando?: Array<{ campo: string; mensagem: string }>;
  preview?: {
    total: number;
    impostosEstimados?: Array<{ nome: string; valor: number }>;
  };
};

export type NotaEmissaoResponse = {
  notaId: string;
  status: "EMITIDA" | "ERRO";
  numero?: string;
  serie?: string;
  chave?: string;
  urlPdf?: string;
  urlXml?: string;
  erro?: { mensagem: string; detalhes?: string };
};

export type NotaResumo = {
  id: string;
  status: NotaStatus;
  tipo: NotaTipo;
  competencia: string;
  dataEmissao?: string;
  numero?: string;
  tomador?: { nomeRazao?: string };
  total?: number;
};

export type ListNotasParams = {
  competencia?: string;
  status?: NotaStatus;
};
