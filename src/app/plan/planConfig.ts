import type { AppPlan, PlanModule } from "./types";

type PlanLabels = {
  menu: {
    folha: string;
    folhaExecucao: string;
    folhaSimulador: string;
    folhaColaboradores: string;
  };
  payroll: {
    title: string;
    subtitle: string;
    newButton: string;
    closeButton: string;
    apiHint: string;
    empty: string;
  };
  simulator: {
    title: string;
    subtitle: string;
    cardTitle: string;
    generateButton: string;
    empty: string;
    hint: string;
  };
  fields: {
    referencia: string;
    colaborador: string;
    salarioBase: string;
    horasExtras: string;
    outrosProventos: string;
    descontos: string;
    dependentes: string;
    status: string;
    rescisao: string;
    verbasRescisorias: string;
  };
  totals: {
    proventos: string;
    descontos: string;
    liquido: string;
    inss: string;
    fgts: string;
    irrf: string;
    multaFgts: string;
  };
  events: {
    title: string;
    generate: string;
    send: string;
    empty: string;
    hint: string;
  };
  integracoes: {
    importMenu: string;
    importTitle: string;
    importSubtitle: string;
  };
  financeiro: {
    contasPagar: {
      title: string;
      subtitle: string;
      newButton: string;
      closeButton: string;
      apiHint: string;
      empty: string;
      fields: {
        pessoa: string;
        descricao: string;
        documento: string;
        vencimento: string;
        competencia: string;
        parcela: string;
        totalParcelas: string;
        parcelaPaga: string;
        valorTitulo: string;
        desconto: string;
        juros: string;
        multa: string;
        valorLiquido: string;
        status: string;
        pagamento: string;
        valorPago: string;
        formaPagamento: string;
        conta: string;
        categoria: string;
        observacoes: string;
      };
      table: {
        pessoa: string;
        titulo: string;
        origem: string;
        dataOrigem: string;
        vencimento: string;
        parcela: string;
        parcelasPagas: string;
        valor: string;
        status: string;
        acoes: string;
      };
    };
    contasReceber: {
      title: string;
      subtitle: string;
      newButton: string;
      closeButton: string;
      apiHint: string;
      empty: string;
      fields: {
        pessoa: string;
        descricao: string;
        documento: string;
        vencimento: string;
        competencia: string;
        parcela: string;
        totalParcelas: string;
        parcelaPaga: string;
        valorTitulo: string;
        desconto: string;
        juros: string;
        multa: string;
        valorLiquido: string;
        status: string;
        recebimento: string;
        valorRecebido: string;
        formaPagamento: string;
        conta: string;
        categoria: string;
        observacoes: string;
      };
      table: {
        pessoa: string;
        titulo: string;
        origem: string;
        dataOrigem: string;
        vencimento: string;
        parcela: string;
        parcelasPagas: string;
        valor: string;
        status: string;
        acoes: string;
      };
    };
  };
};

type PlanConfig = {
  enabledModules: Record<PlanModule, boolean>;
  labels: PlanLabels;
  payroll: {
    showLegalFields: boolean;
    showRescisao: boolean;
    showEsocial: boolean;
  };
};

const baseLabels = {
  menu: {
    folha: "Folha",
    folhaExecucao: "Folha de pagamento",
    folhaSimulador: "Simulador",
    folhaColaboradores: "Colaboradores",
  },
  payroll: {
    title: "Folha de pagamento",
    subtitle: "Rotinas e fechamento da folha.",
    newButton: "Nova folha",
    closeButton: "Fechar",
    apiHint: "API de folha preparada para integracao.",
    empty: "Nenhuma folha encontrada.",
  },
  simulator: {
    title: "Simulador de folha",
    subtitle: "Calculo de encargos e eventos eSocial.",
    cardTitle: "Simulador",
    generateButton: "Gerar folha simulada",
    empty: "Nenhuma folha simulada.",
    hint: "Simulador ativo: calcule folha e eventos eSocial localmente.",
  },
  fields: {
    referencia: "Referencia",
    colaborador: "Colaborador",
    salarioBase: "Salario base",
    horasExtras: "Horas extras",
    outrosProventos: "Outros proventos",
    descontos: "Descontos",
    dependentes: "Dependentes",
    status: "Status",
    rescisao: "Rescisao",
    verbasRescisorias: "Verbas rescisorias",
  },
  totals: {
    proventos: "Total proventos",
    descontos: "Total descontos",
    liquido: "Liquido",
    inss: "INSS",
    fgts: "FGTS",
    irrf: "IRRF",
    multaFgts: "Multa FGTS",
  },
  financeiro: {
    contasPagar: {
      title: "Contas a pagar",
      subtitle: "Controle titulos, vencimentos e baixas.",
      newButton: "Nova conta",
      closeButton: "Fechar",
      apiHint: "API de contas a pagar preparada para o backend.",
      empty: "Nenhuma conta a pagar.",
      fields: {
        pessoa: "Fornecedor",
        descricao: "Titulo",
        documento: "Documento",
        vencimento: "Vencimento",
        competencia: "Competencia",
        parcela: "Parcela",
        totalParcelas: "Total parcelas",
        parcelaPaga: "Parcela paga",
        valorTitulo: "Valor do titulo",
        desconto: "Desconto",
        juros: "Juros",
        multa: "Multa",
        valorLiquido: "Valor liquido",
        status: "Status",
        pagamento: "Pagamento",
        valorPago: "Valor pago",
        formaPagamento: "Forma de pagamento",
        conta: "Conta",
        categoria: "Categoria",
        observacoes: "Observacoes",
      },
      table: {
        pessoa: "Fornecedor",
        titulo: "Titulo",
        origem: "Origem",
        dataOrigem: "Competencia",
        vencimento: "Vencimento",
        parcela: "Parcela",
        parcelasPagas: "Pagas",
        valor: "Valor",
        status: "Status",
        acoes: "Acoes",
      },
    },
    contasReceber: {
      title: "Contas a receber",
      subtitle: "Controle cobrancas e recebimentos.",
      newButton: "Nova conta",
      closeButton: "Fechar",
      apiHint: "API de contas a receber preparada para o backend.",
      empty: "Nenhuma conta a receber.",
      fields: {
        pessoa: "Cliente",
        descricao: "Titulo",
        documento: "Documento",
        vencimento: "Vencimento",
        competencia: "Competencia",
        parcela: "Parcela",
        totalParcelas: "Total parcelas",
        parcelaPaga: "Parcela paga",
        valorTitulo: "Valor do titulo",
        desconto: "Desconto",
        juros: "Juros",
        multa: "Multa",
        valorLiquido: "Valor liquido",
        status: "Status",
        recebimento: "Recebimento",
        valorRecebido: "Valor recebido",
        formaPagamento: "Forma de pagamento",
        conta: "Conta",
        categoria: "Categoria",
        observacoes: "Observacoes",
      },
      table: {
        pessoa: "Cliente",
        titulo: "Titulo",
        origem: "Origem",
        dataOrigem: "Competencia",
        vencimento: "Vencimento",
        parcela: "Parcela",
        parcelasPagas: "Pagas",
        valor: "Valor",
        status: "Status",
        acoes: "Acoes",
      },
    },
  },
  events: {
    title: "Eventos eSocial",
    generate: "Gerar eventos eSocial",
    send: "Enviar eventos",
    empty: "Nenhum evento gerado.",
    hint: "Simulador ativo: calcule folha e eventos eSocial localmente.",
  },
  integracoes: {
    importMenu: "Importar extrato / conciliacao",
    importTitle: "Importar extrato / conciliacao",
    importSubtitle: "Importe CSV, OFX ou PDF com revisao.",
  },
};

const planConfig: Record<AppPlan, PlanConfig> = {
  COMMERCIAL: {
    enabledModules: {
      dashboard: true,
      empresas: true,
      financeiro: true,
      cadastros: true,
      comercial: true,
      fiscal: true,
      estoque: true,
      tributacao: true,
      integracoes: true,
      folha: true,
      relatorios: true,
      prolabore: true,
      projecao: true,
    },
    labels: baseLabels,
    payroll: {
      showLegalFields: true,
      showRescisao: true,
      showEsocial: true,
    },
  },
  RESIDENTIAL: {
    enabledModules: {
      dashboard: true,
      empresas: true,
      financeiro: true,
      cadastros: false,
      comercial: false,
      fiscal: false,
      estoque: false,
      tributacao: false,
      integracoes: false,
      folha: true,
      relatorios: false,
      prolabore: false,
      projecao: true,
    },
    labels: {
      ...baseLabels,
      menu: {
        folha: "Pagamentos",
        folhaExecucao: "Pagamentos",
        folhaSimulador: "Simulador",
        folhaColaboradores: "Pessoas",
      },
      payroll: {
        title: "Pagamentos",
        subtitle: "Pagamentos do mes e recibos.",
        newButton: "Novo pagamento",
        closeButton: "Fechar",
        apiHint: "API de pagamentos preparada para integracao.",
        empty: "Nenhum pagamento encontrado.",
      },
      simulator: {
        title: "Simulador de pagamentos",
        subtitle: "Estimativa de pagamentos e recibos.",
        cardTitle: "Simulador",
        generateButton: "Gerar pagamento simulado",
        empty: "Nenhum pagamento simulado.",
        hint: "Simulador ativo: calcule pagamentos localmente.",
      },
      fields: {
        referencia: "Mes",
        colaborador: "Pessoa",
        salarioBase: "Valor base",
        horasExtras: "Horas extras",
        outrosProventos: "Outros valores",
        descontos: "Descontos",
        dependentes: "Dependentes",
        status: "Status",
        rescisao: "Rescisao",
        verbasRescisorias: "Verbas rescisorias",
      },
      totals: {
        ...baseLabels.totals,
      },
      events: {
        title: "Eventos eSocial",
        generate: "Gerar eventos eSocial",
        send: "Enviar eventos",
        empty: "Nenhum evento gerado.",
        hint: "Simulador ativo: calcule pagamentos localmente.",
      },
      integracoes: {
        importMenu: "Importar extrato",
        importTitle: "Importar extrato",
        importSubtitle: "Importe CSV, OFX ou PDF com revisao.",
      },
      financeiro: {
        contasPagar: {
          title: "Pagamentos",
          subtitle: "Controle de pagamentos e saídas.",
          newButton: "Novo pagamento",
          closeButton: "Fechar",
          apiHint: "API de pagamentos preparada para integracao.",
          empty: "Nenhum pagamento encontrado.",
          fields: {
            pessoa: "Pessoa/Servico",
            descricao: "Descricao",
            documento: "Comprovante",
            vencimento: "Vencimento",
            competencia: "Competencia",
            parcela: "Parcela",
            totalParcelas: "Total parcelas",
            parcelaPaga: "Parcela paga",
            valorTitulo: "Valor base",
            desconto: "Desconto",
            juros: "Juros",
            multa: "Multa",
            valorLiquido: "Valor total",
            status: "Status",
            pagamento: "Pagamento",
            valorPago: "Valor pago",
            formaPagamento: "Forma de pagamento",
            conta: "Conta",
            categoria: "Categoria",
            observacoes: "Observacoes",
          },
          table: {
            pessoa: "Pessoa/Servico",
            titulo: "Descricao",
            origem: "Origem",
            dataOrigem: "Competencia",
            vencimento: "Vencimento",
            parcela: "Parcela",
            parcelasPagas: "Pagas",
            valor: "Valor",
            status: "Status",
            acoes: "Acoes",
          },
        },
        contasReceber: {
          title: "Recebimentos",
          subtitle: "Controle de entradas e recebimentos.",
          newButton: "Novo recebimento",
          closeButton: "Fechar",
          apiHint: "API de recebimentos preparada para integracao.",
          empty: "Nenhum recebimento encontrado.",
          fields: {
            pessoa: "Pessoa",
            descricao: "Descricao",
            documento: "Comprovante",
            vencimento: "Vencimento",
            competencia: "Competencia",
            parcela: "Parcela",
            totalParcelas: "Total parcelas",
            parcelaPaga: "Parcela paga",
            valorTitulo: "Valor base",
            desconto: "Desconto",
            juros: "Juros",
            multa: "Multa",
            valorLiquido: "Valor total",
            status: "Status",
            recebimento: "Recebimento",
            valorRecebido: "Valor recebido",
            formaPagamento: "Forma de pagamento",
            conta: "Conta",
            categoria: "Categoria",
            observacoes: "Observacoes",
          },
          table: {
            pessoa: "Pessoa",
            titulo: "Descricao",
            origem: "Origem",
            dataOrigem: "Competencia",
            vencimento: "Vencimento",
            parcela: "Parcela",
            parcelasPagas: "Pagas",
            valor: "Valor",
            status: "Status",
            acoes: "Acoes",
          },
        },
      },
    },
    payroll: {
      showLegalFields: false,
      showRescisao: false,
      showEsocial: false,
    },
  },
};

export const getPlanConfig = (plan: AppPlan) => planConfig[plan];

export const isModuleEnabled = (plan: AppPlan, module: PlanModule) =>
  planConfig[plan].enabledModules[module];

export const planOptions = [
  { value: "RESIDENTIAL" as const, label: "Residencial" },
  { value: "COMMERCIAL" as const, label: "Comercial" },
];
