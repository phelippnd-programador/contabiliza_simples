export type PagedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type ListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  departamentoId?: string;
  cargoId?: string;
  dataInicio?: string;
  dataFim?: string;
};

export type StatusAtivo = "ATIVO" | "INATIVO";

export type FuncionarioContratoTipo = "CLT" | "PJ" | "ESTAGIO" | "OUTRO";
export type FuncionarioJornada = "MENSAL" | "SEMANAL";
export type FuncionarioSalarioTipo = "MENSAL" | "HORA";
export type TipoContaBancaria = "CORRENTE" | "POUPANCA";

export type Funcionario = {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  dataNascimento?: string;
  sexo?: "M" | "F" | "OUTRO";
  estadoCivil?: "SOLTEIRO" | "CASADO" | "DIVORCIADO" | "VIUVO" | "OUTRO";
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
  };
  matricula: string;
  dataAdmissao: string;
  tipoContrato: FuncionarioContratoTipo;
  jornada: FuncionarioJornada;
  departamentoId?: string;
  cargoId?: string;
  centroCustoId?: string;
  status: StatusAtivo;
  salarioBase: number;
  salarioTipo: FuncionarioSalarioTipo;
  adicionalPericulosidade?: boolean;
  adicionalInsalubridade?: boolean;
  inssPercentual?: number;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: TipoContaBancaria;
  pix?: string;
  anexos?: Array<{ name: string; size: number }>;
  createdAt?: string;
  updatedAt?: string;
};

export type Departamento = {
  id: string;
  nome: string;
  descricao?: string;
  status?: StatusAtivo;
};

export type Cargo = {
  id: string;
  nome: string;
  nivel?: string;
  descricao?: string;
  status?: StatusAtivo;
};

export type CentroCusto = {
  id: string;
  nome: string;
  descricao?: string;
  status?: StatusAtivo;
};

export type CompetenciaStatus = "ABERTA" | "EM_PROCESSAMENTO" | "FECHADA";

export type CompetenciaFolha = {
  id: string;
  competencia: string;
  status: CompetenciaStatus;
  observacoes?: string;
};

export type EventoTipo = "PROVENTO" | "DESCONTO";

export type EventoFolha = {
  id: string;
  codigo: string;
  descricao: string;
  tipo: EventoTipo;
  incidencias: {
    inss: boolean;
    fgts: boolean;
    irrf: boolean;
  };
  formula?: string;
  valorFixo?: number;
  status?: StatusAtivo;
};

export type LancamentoFolha = {
  id: string;
  competencia: string;
  funcionarioId: string;
  eventoId: string;
  valor: number;
  referencia?: string;
  observacao?: string;
};

export type PontoStatus = "OK" | "INCONSISTENTE";

export type PontoDia = {
  id: string;
  funcionarioId: string;
  data: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  justificativa?: string;
  status: PontoStatus;
  totalHoras?: number;
};

export type FeriasStatus =
  | "SOLICITADA"
  | "APROVADA"
  | "REPROVADA"
  | "GOZO"
  | "ENCERRADA";

export type Ferias = {
  id: string;
  funcionarioId: string;
  inicio: string;
  fim: string;
  status: FeriasStatus;
  observacoes?: string;
};

export type AfastamentoTipo = "DOENCA" | "ACIDENTE" | "LICENCA" | "OUTRO";

export type Afastamento = {
  id: string;
  funcionarioId: string;
  tipo: AfastamentoTipo;
  inicio: string;
  fim?: string;
  observacoes?: string;
};
