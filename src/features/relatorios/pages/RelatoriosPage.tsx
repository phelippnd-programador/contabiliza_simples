import React, { useEffect, useMemo, useState } from "react";

import {
  TipoMovimentoCaixa,
  type CategoriaMovimento,
  type ContaBancaria,
  type MovimentoCaixa,
  type CartaoFatura,
  type CartaoLancamento,
  type CartaoCredito,
} from "../../financeiro/types";
import { listContas } from "../../financeiro/services/contas.service";
import { listCategorias } from "../../financeiro/services/categorias.service";
import { listMovimentos } from "../../financeiro/services/movimentos.service";
import { listCentrosCusto } from "../../rh/services/rh.service";
import type { CentroCusto } from "../../rh/types/rh.types";
import { listContasReceber, type ContaReceberResumo } from "../../financeiro/services/contas-receber.service";
import { listContasPagar, type ContaPagarResumo } from "../../financeiro/services/contas-pagar.service";
import { listCartoes } from "../../financeiro/services/cartoes.service";
import { listCartaoLancamentos } from "../../financeiro/services/cartao-lancamentos.service";
import { listCartaoFaturas } from "../../financeiro/services/cartao-faturas.service";
import {
  deleteOrcamento,
  listOrcamentos,
  saveOrcamento,
} from "../../financeiro/services/orcamentos.service";
import type { OrcamentoFinanceiro } from "../../financeiro/types";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import DashboardStatCard from "../../../components/ui/card/DashboardStatCard";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import { formatBRL, formatLocalDate } from "../../../shared/utils/formater";


const RelatoriosPage = () => {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceberResumo[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagarResumo[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoFinanceiro[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [cartaoLancamentos, setCartaoLancamentos] = useState<CartaoLancamento[]>([]);
  const [cartaoFaturas, setCartaoFaturas] = useState<CartaoFatura[]>([]);
  const [faturaSelecionada, setFaturaSelecionada] = useState<{
    cartaoId: string;
    competencia: string;
    cartaoNome: string;
  } | null>(null);
  const [orcamentoError, setOrcamentoError] = useState("");
  const [orcamentoForm, setOrcamentoForm] = useState({
    competencia: new Date().toISOString().slice(0, 7),
    categoriaId: "",
    valor: "",
  });
  const [filters, setFilters] = useState({
    dataInicial: "",
    dataFinal: "",
    contaId: "",
  });
  const [cartaoFiltroId, setCartaoFiltroId] = useState("");
  const [orcamentoCompetencia, setOrcamentoCompetencia] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [contasData, categoriasData, movimentosData, centrosData] = await Promise.all([
          listContas(),
          listCategorias(),
          listMovimentos(),
          listCentrosCusto({ page: 1, pageSize: 200 }),
        ]);
        if (!isMounted) return;
        setContas(contasData);
        setCategorias(categoriasData);
        setMovimentos(movimentosData);
        setCentrosCusto(centrosData.data);
      } catch {
        if (!isMounted) return;
        setContas([]);
        setCategorias([]);
        setMovimentos([]);
        setCentrosCusto([]);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async <T,>(
      fetcher: (params: { page: number; pageSize: number }) => Promise<{
        data: T[];
        meta: { page: number; pageSize: number; total: number };
      }>
    ) => {
      const pageSize = 50;
      let page = 1;
      let all: T[] = [];
      while (true) {
        const response = await fetcher({ page, pageSize });
        all = all.concat(response.data ?? []);
        if (response.data.length < pageSize) break;
        if (response.meta?.total && all.length >= response.meta.total) break;
        page += 1;
        if (page > 50) break;
      }
      return all;
    };
    const loadTitulos = async () => {
      try {
        const [receberData, pagarData] = await Promise.all([
          fetchAll(listContasReceber),
          fetchAll(listContasPagar),
        ]);
        if (!isMounted) return;
        setContasReceber(receberData);
        setContasPagar(pagarData);
      } catch {
        if (!isMounted) return;
        setContasReceber([]);
        setContasPagar([]);
      }
    };
    loadTitulos();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadOrcamentos = async () => {
      try {
        const data = await listOrcamentos();
        if (!isMounted) return;
        setOrcamentos(data);
      } catch {
        if (!isMounted) return;
        setOrcamentos([]);
      }
    };
    loadOrcamentos();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadCartoesData = async () => {
      try {
        const cartoesData = await listCartoes();
        if (!isMounted) return;
        setCartoes(cartoesData);
        const lancamentosList: CartaoLancamento[] = [];
        const faturasList: CartaoFatura[] = [];
        for (const cartao of cartoesData) {
          const [lancamentos, faturas] = await Promise.all([
            listCartaoLancamentos(String(cartao.id)),
            listCartaoFaturas(String(cartao.id)),
          ]);
          lancamentosList.push(...lancamentos);
          faturasList.push(...faturas);
        }
        if (!isMounted) return;
        setCartaoLancamentos(lancamentosList);
        setCartaoFaturas(faturasList);
      } catch {
        if (!isMounted) return;
        setCartoes([]);
        setCartaoLancamentos([]);
        setCartaoFaturas([]);
      }
    };
    loadCartoesData();
    return () => {
      isMounted = false;
    };
  }, []);

  const contaOptions = useMemo(
    () =>
      contas.map((conta) => ({
        value: conta.id,
        label: `${conta.nome} (${conta.banco})`,
      })),
    [contas]
  );

  const cartaoOptions = useMemo(
    () =>
      cartoes.map((cartao) => ({
        value: String(cartao.id),
        label: cartao.nome,
      })),
    [cartoes]
  );

  const filteredMovimentos = useMemo(() => {
    return movimentos.filter((movimento) => {
      if (filters.contaId && movimento.contaId !== filters.contaId) {
        return false;
      }
      if (filters.dataInicial && movimento.data < filters.dataInicial) {
        return false;
      }
      if (filters.dataFinal && movimento.data > filters.dataFinal) {
        return false;
      }
      return true;
    });
  }, [filters, movimentos]);

  const competenciaByMovimento = (movimento: MovimentoCaixa) =>
    movimento.competencia ?? movimento.data.slice(0, 7);

  const resumoCaixa = useMemo(() => {
    const entradas = filteredMovimentos
      .filter((movimento) => movimento.tipo === TipoMovimentoCaixa.ENTRADA)
      .reduce((acc, movimento) => acc + movimento.valor, 0);
    const saidas = filteredMovimentos
      .filter((movimento) => movimento.tipo === TipoMovimentoCaixa.SAIDA)
      .reduce((acc, movimento) => acc + movimento.valor, 0);
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [filteredMovimentos]);

  const despesasPorCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    filteredMovimentos
      .filter((movimento) => movimento.tipo === TipoMovimentoCaixa.SAIDA)
      .forEach((movimento) => {
        const nome =
          categorias.find((categoria) => categoria.id === movimento.categoriaId)
            ?.nome ?? "Sem categoria";
        mapa.set(nome, (mapa.get(nome) ?? 0) + movimento.valor);
      });
    return Array.from(mapa.entries()).map(([categoria, total]) => ({
      categoria,
      total,
    }));
  }, [categorias, filteredMovimentos]);

  const receitaPorCnae = useMemo(() => {
    const mapa = new Map<string, number>();
    filteredMovimentos
      .filter((movimento) => movimento.tipo === TipoMovimentoCaixa.ENTRADA)
      .forEach((movimento) => {
        const cnae = movimento.cnae?.trim() || "Sem CNAE";
        mapa.set(cnae, (mapa.get(cnae) ?? 0) + movimento.valor);
      });
    return Array.from(mapa.entries()).map(([cnae, total]) => ({
      cnae,
      total,
    }));
  }, [filteredMovimentos]);

  const centroCustoMap = useMemo(() => {
    const map = new Map<string, string>();
    centrosCusto.forEach((centro) => map.set(centro.id, centro.nome));
    return map;
  }, [centrosCusto]);

  const resumoPorCentroCusto = useMemo(() => {
    const mapa = new Map<string, number>();
    filteredMovimentos.forEach((movimento) => {
      const centroId = movimento.centroCustoId ?? "sem-centro";
      const nome = centroCustoMap.get(centroId) ?? "Sem centro de custo";
      const sinal = movimento.tipo === TipoMovimentoCaixa.ENTRADA ? 1 : -1;
      mapa.set(nome, (mapa.get(nome) ?? 0) + movimento.valor * sinal);
    });
    return Array.from(mapa.entries()).map(([centro, total]) => ({
      centro,
      total,
    }));
  }, [centroCustoMap, filteredMovimentos]);

  const withinRange = (competencia: string) => {
    if (filters.dataInicial && competencia < filters.dataInicial.slice(0, 7)) return false;
    if (filters.dataFinal && competencia > filters.dataFinal.slice(0, 7)) return false;
    return true;
  };

  const buildDateFromCompetencia = (competencia: string, dia: number, offset = 0) => {
    if (!competencia || !dia) return "";
    const [yearRaw, monthRaw] = competencia.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    if (!year || !month) return "";
    const date = new Date(year, month - 1 + offset, dia);
    return date.toISOString().slice(0, 10);
  };

  const faturasCartaoResumo = useMemo(() => {
    const totals = new Map<string, { total: number; itens: number }>();
    cartaoLancamentos.forEach((item) => {
      const key = `${item.cartaoId}::${item.faturaCompetencia}`;
      const current = totals.get(key) ?? { total: 0, itens: 0 };
      totals.set(key, {
        total: current.total + item.valor,
        itens: current.itens + 1,
      });
    });
    const stored = new Map<string, CartaoFatura>();
    cartaoFaturas.forEach((item) => stored.set(`${item.cartaoId}::${item.competencia}`, item));

    const keys = new Set<string>([...totals.keys(), ...stored.keys()]);
    return Array.from(keys)
      .map((key) => {
        const [cartaoId, competencia] = key.split("::");
        const cartao = cartoes.find((item) => String(item.id) === cartaoId);
        const totalsEntry = totals.get(key);
        const storedItem = stored.get(key);
        const total = totalsEntry?.total ?? storedItem?.total ?? 0;
        return {
          id: storedItem?.id,
          cartaoId,
          cartaoNome: cartao?.nome ?? cartaoId,
          competencia,
          total,
          itens: totalsEntry?.itens ?? 0,
          status: storedItem?.status ?? "ABERTA",
          fechamento: storedItem?.fechamento ?? (cartao
            ? buildDateFromCompetencia(
                competencia,
                cartao.corteDia || cartao.fechamentoDia,
                -1
              )
            : ""),
          vencimento: storedItem?.vencimento ?? (cartao
            ? buildDateFromCompetencia(competencia, cartao.vencimentoDia, 0)
            : ""),
        };
      })
      .filter((item) => (cartaoFiltroId ? item.cartaoId === cartaoFiltroId : true))
      .sort((a, b) => (a.competencia < b.competencia ? 1 : -1));
  }, [cartaoFaturas, cartaoLancamentos, cartaoFiltroId, cartoes]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const classifyAging = (vencimento?: string) => {
    if (!vencimento) return "Sem vencimento";
    const date = new Date(`${vencimento}T00:00:00`);
    const diffDays = Math.floor((date.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      if (overdueDays <= 30) return "Vencido 0-30";
      if (overdueDays <= 60) return "Vencido 31-60";
      if (overdueDays <= 90) return "Vencido 61-90";
      return "Vencido 90+";
    }
    if (diffDays <= 30) return "A vencer 0-30";
    if (diffDays <= 60) return "A vencer 31-60";
    return "A vencer 60+";
  };

  const agingReceber = useMemo(() => {
    const map = new Map<string, number>();
    contasReceber
      .filter((item) => item.status === "ABERTA")
      .forEach((item) => {
        const key = classifyAging(item.vencimento);
        map.set(key, (map.get(key) ?? 0) + item.valor);
      });
    return Array.from(map.entries()).map(([bucket, total]) => ({
      bucket,
      total,
    }));
  }, [contasReceber]);

  const agingPagar = useMemo(() => {
    const map = new Map<string, number>();
    contasPagar
      .filter((item) => item.status === "ABERTA")
      .forEach((item) => {
        const key = classifyAging(item.vencimento);
        map.set(key, (map.get(key) ?? 0) + item.valor);
      });
    faturasCartaoResumo
      .filter((item) => item.status === "ABERTA")
      .filter((item) => (cartaoFiltroId ? item.cartaoId === cartaoFiltroId : true))
      .forEach((item) => {
        const key = classifyAging(item.vencimento);
        map.set(key, (map.get(key) ?? 0) + item.total);
      });
    return Array.from(map.entries()).map(([bucket, total]) => ({
      bucket,
      total,
    }));
  }, [cartaoFiltroId, contasPagar, faturasCartaoResumo]);

  const projecaoMeses = useMemo(() => {
    const start = new Date(today);
    start.setDate(1);
    const months = Array.from({ length: 6 }, (_, idx) => {
      const date = new Date(start);
      date.setMonth(date.getMonth() + idx);
      const competencia = date.toISOString().slice(0, 7);
      return { competencia, date };
    });
    return months.map((item) => {
      const receber = contasReceber
        .filter((conta) => conta.status === "ABERTA")
        .filter((conta) => conta.vencimento?.startsWith(item.competencia))
        .reduce((acc, conta) => acc + conta.valor, 0);
      const pagar = contasPagar
        .filter((conta) => conta.status === "ABERTA")
        .filter((conta) => conta.vencimento?.startsWith(item.competencia))
        .reduce((acc, conta) => acc + conta.valor, 0);
      const cartaoPagar = faturasCartaoResumo
        .filter((fatura) => fatura.status === "ABERTA")
        .filter((fatura) =>
          cartaoFiltroId ? fatura.cartaoId === cartaoFiltroId : true
        )
        .filter((fatura) => fatura.competencia === item.competencia)
        .reduce((acc, fatura) => acc + fatura.total, 0);
      return {
        competencia: item.competencia,
        receber,
        pagar: pagar + cartaoPagar,
        saldo: receber - pagar - cartaoPagar,
      };
    });
  }, [cartaoFiltroId, contasReceber, contasPagar, faturasCartaoResumo, today]);

  const orcamentosCompetencia = useMemo(
    () => orcamentos.filter((item) => item.competencia === orcamentoCompetencia),
    [orcamentoCompetencia, orcamentos]
  );

  const orcamentoResumo = useMemo(() => {
    const actualMap = new Map<string, number>();
    movimentos
      .filter((movimento) => competenciaByMovimento(movimento) === orcamentoCompetencia)
      .forEach((movimento) => {
        if (!movimento.categoriaId) return;
        const atual = actualMap.get(movimento.categoriaId) ?? 0;
        actualMap.set(movimento.categoriaId, atual + movimento.valor);
      });

    return orcamentosCompetencia.map((orcamento) => {
      const categoria = categorias.find((item) => item.id === orcamento.categoriaId);
      const realizado = actualMap.get(orcamento.categoriaId) ?? 0;
      const diferenca = realizado - orcamento.valor;
      return {
        ...orcamento,
        categoriaNome: categoria?.nome ?? "Sem categoria",
        tipo: categoria?.tipo,
        realizado,
        diferenca,
      };
    });
  }, [categorias, movimentos, orcamentoCompetencia, orcamentosCompetencia]);

  const handleSaveOrcamento = async () => {
    setOrcamentoError("");
    if (!orcamentoForm.competencia || !orcamentoForm.categoriaId) {
      setOrcamentoError("Informe competencia e categoria.");
      return;
    }
    const valor = Number(orcamentoForm.valor.replace(/[^0-9]/g, "")) / 100;
    if (!valor || valor <= 0) {
      setOrcamentoError("Informe um valor valido.");
      return;
    }
    try {
      await saveOrcamento({
        competencia: orcamentoForm.competencia,
        categoriaId: orcamentoForm.categoriaId,
        valor,
      });
      const updated = await listOrcamentos();
      setOrcamentos(updated);
      setOrcamentoForm((prev) => ({
        ...prev,
        categoriaId: "",
        valor: "",
      }));
    } catch {
      setOrcamentoError("Nao foi possivel salvar o orcamento.");
    }
  };

  const handleRemoveOrcamento = async (id: string) => {
    try {
      await deleteOrcamento(id);
      const updated = await listOrcamentos();
      setOrcamentos(updated);
    } catch {
      setOrcamentoError("Nao foi possivel remover o orcamento.");
    }
  };

  const faturasAbertasParaDre = useMemo(() => {
    return faturasCartaoResumo
      .filter((fatura) => fatura.status === "ABERTA")
      .filter((fatura) => withinRange(fatura.competencia))
      .reduce((acc, fatura) => acc + fatura.total, 0);
  }, [faturasCartaoResumo, filters.dataFinal, filters.dataInicial]);

  const dreResumo = useMemo(() => {
    const receitaPorCategoria = new Map<string, number>();
    const despesaPorCategoria = new Map<string, number>();
    filteredMovimentos.forEach((movimento) => {
      const categoria =
        categorias.find((item) => item.id === movimento.categoriaId)?.nome ??
        "Sem categoria";
      if (movimento.tipo === TipoMovimentoCaixa.ENTRADA) {
        receitaPorCategoria.set(
          categoria,
          (receitaPorCategoria.get(categoria) ?? 0) + movimento.valor
        );
      } else {
        despesaPorCategoria.set(
          categoria,
          (despesaPorCategoria.get(categoria) ?? 0) + movimento.valor
        );
      }
    });
    const receitas = Array.from(receitaPorCategoria.entries()).map(
      ([categoria, total]) => ({
        categoria,
        total,
      })
    );
    const despesas = Array.from(despesaPorCategoria.entries()).map(
      ([categoria, total]) => ({
        categoria,
        total,
      })
    );
    if (faturasAbertasParaDre > 0) {
      despesas.push({
        categoria: "Cartao (faturas abertas)",
        total: faturasAbertasParaDre,
      });
    }
    const totalReceitas = receitas.reduce((acc, item) => acc + item.total, 0);
    const totalDespesas = despesas.reduce((acc, item) => acc + item.total, 0);
    return {
      receitas,
      despesas,
      totalReceitas,
      totalDespesas,
      resultado: totalReceitas - totalDespesas,
    };
  }, [categorias, filteredMovimentos, faturasAbertasParaDre]);

  const detalheFatura = useMemo(() => {
    if (!faturaSelecionada) return [];
    return cartaoLancamentos
      .filter(
        (item) =>
          item.cartaoId === faturaSelecionada.cartaoId &&
          item.faturaCompetencia === faturaSelecionada.competencia
      )
      .sort((a, b) => (a.data < b.data ? 1 : -1));
  }, [cartaoLancamentos, faturaSelecionada]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <AppTitle text="Relatorios" />
        <AppSubTitle text="Resumo rapido de movimentos e categorias." />
      </div>

      <Card>
        <AppSubTitle text="Filtros" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Filtre os relatorios por periodo e conta.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <AppDateInput
            title="Data inicial"
            type="date"
            value={filters.dataInicial}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataInicial: e.target.value }))
            }
          />

          <AppDateInput
            title="Data final"
            type="date"
            value={filters.dataFinal}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataFinal: e.target.value }))
            }
          />

          <AppSelectInput
            title="Conta"
            value={filters.contaId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, contaId: e.target.value }))
            }
            data={contaOptions}
            placeholder="Todas"
          />
          <AppSelectInput
            title="Cartao"
            value={cartaoFiltroId}
            onChange={(e) => setCartaoFiltroId(e.target.value)}
            data={cartaoOptions}
            placeholder="Todos"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashboardStatCard
            title="Entradas"
            value={resumoCaixa.entradas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            tone="green"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 4 5 11h4v7h6v-7h4z" />
              </svg>
            }
          />
          <DashboardStatCard
            title="Saidas"
            value={resumoCaixa.saidas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            tone="amber"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="m12 20 7-7h-4V6H9v7H5z" />
              </svg>
            }
          />
          <DashboardStatCard
            title="Saldo"
            value={resumoCaixa.saldo.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            tone="blue"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9Zm1 13.5h-2V14H8v-2h3V9.5h2V12h3v2h-3Z" />
              </svg>
            }
          />
        </div>

        <div className="mt-8">
          <AppSubTitle text="DRE simplificada" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Receitas</p>
              <AppTable
                data={dreResumo.receitas}
                rowKey={(row) => row.categoria}
                emptyState={<AppListNotFound texto="Sem receitas no periodo." />}
                pagination={{ enabled: true, pageSize: 8 }}
                columns={[
                  { key: "categoria", header: "Categoria", render: (row) => row.categoria },
                  {
                    key: "total",
                    header: "Total",
                    align: "right",
                    render: (row) =>
                      row.total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                  },
                ]}
              />
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Total receitas:{" "}
                {dreResumo.totalReceitas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Despesas</p>
              <AppTable
                data={dreResumo.despesas}
                rowKey={(row) => row.categoria}
                emptyState={<AppListNotFound texto="Sem despesas no periodo." />}
                pagination={{ enabled: true, pageSize: 8 }}
                columns={[
                  { key: "categoria", header: "Categoria", render: (row) => row.categoria },
                  {
                    key: "total",
                    header: "Total",
                    align: "right",
                    render: (row) =>
                      row.total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                  },
                ]}
              />
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Total despesas:{" "}
                {dreResumo.totalDespesas.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Resultado:{" "}
            {dreResumo.resultado.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>

        <div className="mt-6">
          <AppSubTitle text="Despesas por categoria" />
          <AppTable
            data={despesasPorCategoria}
            rowKey={(row) => row.categoria}
            emptyState={<AppListNotFound texto="Sem despesas no periodo." />}
            pagination={{ enabled: true, pageSize: 10 }}
            columns={[
              {
                key: "categoria",
                header: "Categoria",
                render: (row) => row.categoria,
              },
              {
                key: "total",
                header: "Total",
                align: "right",
                render: (row) =>
                  row.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <AppSubTitle text="Receita por CNAE" />
          <AppTable
            data={receitaPorCnae}
            rowKey={(row) => row.cnae}
            emptyState={<AppListNotFound texto="Sem receitas no periodo." />}
            pagination={{ enabled: true, pageSize: 10 }}
            columns={[
              { key: "cnae", header: "CNAE", render: (row) => row.cnae },
              {
                key: "total",
                header: "Total",
                align: "right",
                render: (row) =>
                  row.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <AppSubTitle text="Resultado por centro de custo" />
          <AppTable
            data={resumoPorCentroCusto}
            rowKey={(row) => row.centro}
            emptyState={<AppListNotFound texto="Sem centros de custo no periodo." />}
            pagination={{ enabled: true, pageSize: 10 }}
            columns={[
              { key: "centro", header: "Centro de custo", render: (row) => row.centro },
              {
                key: "total",
                header: "Total",
                align: "right",
                render: (row) =>
                  row.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
            ]}
          />
        </div>

        <div className="mt-8">
          <AppSubTitle text="Aging de titulos" />
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">A receber (abertas)</p>
              <AppTable
                data={agingReceber}
                rowKey={(row) => row.bucket}
                emptyState={<AppListNotFound texto="Sem contas a receber." />}
                pagination={{ enabled: true }}
                columns={[
                  { key: "bucket", header: "Faixa", render: (row) => row.bucket },
                  {
                    key: "total",
                    header: "Total",
                    align: "right",
                    render: (row) =>
                      (row.total / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                  },
                ]}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">A pagar (abertas)</p>
              <AppTable
                data={agingPagar}
                rowKey={(row) => row.bucket}
                emptyState={<AppListNotFound texto="Sem contas a pagar." />}
                pagination={{ enabled: true }}
                columns={[
                  { key: "bucket", header: "Faixa", render: (row) => row.bucket },
                  {
                    key: "total",
                    header: "Total",
                    align: "right",
                    render: (row) =>
                      (row.total / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <AppSubTitle text="Fluxo de caixa projetado (6 meses)" />
          <AppTable
            data={projecaoMeses}
            rowKey={(row) => row.competencia}
            emptyState={<AppListNotFound texto="Sem titulos abertos." />}
            pagination={{ enabled: true }}
            columns={[
              {
                key: "competencia",
                header: "Competencia",
                render: (row) => formatLocalDate(row.competencia),
              },
              {
                key: "receber",
                header: "A receber",
                align: "right",
                render: (row) =>
                  (row.receber / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
              {
                key: "pagar",
                header: "A pagar",
                align: "right",
                render: (row) =>
                  (row.pagar / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
              {
                key: "saldo",
                header: "Saldo projetado",
                align: "right",
                render: (row) =>
                  (row.saldo / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
            ]}
          />
        </div>

        <div className="mt-8">
          <AppSubTitle text="Faturas de cartao (agrupadas)" />
          <AppTable
            data={faturasCartaoResumo}
            rowKey={(row) => `${row.cartaoId}-${row.competencia}`}
            emptyState={<AppListNotFound texto="Nenhuma fatura de cartao encontrada." />}
            pagination={{ enabled: true, pageSize: 8 }}
            columns={[
              { key: "cartao", header: "Cartao", render: (row) => row.cartaoNome },
              {
                key: "competencia",
                header: "Competencia",
                render: (row) => formatLocalDate(row.competencia),
              },
              {
                key: "fechamento",
                header: "Fechamento",
                render: (row) => (row.fechamento ? formatLocalDate(row.fechamento) : "-"),
              },
              {
                key: "vencimento",
                header: "Vencimento",
                render: (row) => (row.vencimento ? formatLocalDate(row.vencimento) : "-"),
              },
              {
                key: "total",
                header: "Total",
                align: "right",
                render: (row) =>
                  (row.total / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
              },
              {
                key: "itens",
                header: "Itens",
                align: "right",
                render: (row) => row.itens,
              },
              {
                key: "status",
                header: "Status",
                render: (row) => row.status,
              },
              {
                key: "acoes",
                header: "Acoes",
                align: "right",
                render: (row) => (
                  <AppButton
                    type="button"
                    className="w-auto"
                    onClick={() =>
                      setFaturaSelecionada({
                        cartaoId: row.cartaoId,
                        competencia: row.competencia,
                        cartaoNome: row.cartaoNome,
                      })
                    }
                  >
                    Detalhar
                  </AppButton>
                ),
              },
            ]}
          />
        </div>

        <div className="mt-8">
          <AppSubTitle text="Orcamentos" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <AppDateInput
              title="Competencia"
              type="month"
              value={orcamentoForm.competencia}
              onChange={(e) =>
                setOrcamentoForm((prev) => ({ ...prev, competencia: e.target.value }))
              }
            />
            <AppSelectInput
              title="Categoria"
              value={orcamentoForm.categoriaId}
              onChange={(e) =>
                setOrcamentoForm((prev) => ({ ...prev, categoriaId: e.target.value }))
              }
              data={categorias.map((categoria) => ({
                value: categoria.id,
                label: categoria.nome,
              }))}
              placeholder="Selecione"
            />
            <AppTextInput
              title="Valor"
              value={orcamentoForm.valor}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setOrcamentoForm((prev) => ({ ...prev, valor: raw }))
              }
            />
          </div>
          <div className="mt-4 flex gap-3">
            <AppButton type="button" className="w-auto" onClick={handleSaveOrcamento}>
              Salvar orcamento
            </AppButton>
          </div>
          {orcamentoError ? <p className="mt-2 text-sm text-red-600">{orcamentoError}</p> : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AppDateInput
              title="Competencia para analise"
              type="month"
              value={orcamentoCompetencia}
              onChange={(e) => setOrcamentoCompetencia(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <AppTable
              data={orcamentoResumo}
              rowKey={(row) => row.id}
              emptyState={<AppListNotFound texto="Nenhum orcamento registrado." />}
              pagination={{ enabled: true, pageSize: 8 }}
              columns={[
                {
                  key: "categoria",
                  header: "Categoria",
                  render: (row) => row.categoriaNome,
                },
                {
                  key: "tipo",
                  header: "Tipo",
                  render: (row) => row.tipo ?? "-",
                },
                {
                  key: "orcamento",
                  header: "Orcamento",
                  align: "right",
                  render: (row) =>
                    row.valor.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }),
                },
                {
                  key: "realizado",
                  header: "Realizado",
                  align: "right",
                  render: (row) =>
                    row.realizado.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }),
                },
                {
                  key: "diferenca",
                  header: "Diferenca",
                  align: "right",
                  render: (row) =>
                    row.diferenca.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }),
                },
                {
                  key: "acoes",
                  header: "Acoes",
                  align: "right",
                  render: (row) => (
                    <AppButton
                      type="button"
                      className="w-auto"
                      onClick={() => handleRemoveOrcamento(row.id)}
                    >
                      Remover
                    </AppButton>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </Card>
      {faturaSelecionada ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setFaturaSelecionada(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Fatura {faturaSelecionada.cartaoNome} -{" "}
                  {formatLocalDate(faturaSelecionada.competencia)}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Transacoes vinculadas a esta competencia.
                </p>
              </div>
              <AppButton
                type="button"
                className="w-auto px-4"
                onClick={() => setFaturaSelecionada(null)}
              >
                Fechar
              </AppButton>
            </div>

            <div className="mt-4">
              <AppTable
                data={detalheFatura}
                rowKey={(row) => row.id}
                emptyState={<AppListNotFound texto="Nenhuma transacao nesta fatura." />}
                pagination={{ enabled: true, pageSize: 8 }}
                columns={[
                  {
                    key: "data",
                    header: "Data",
                    render: (row) => formatLocalDate(row.data),
                  },
                  {
                    key: "descricao",
                    header: "Descricao",
                    render: (row) => row.descricao,
                  },
                  {
                    key: "parcela",
                    header: "Parcela",
                    render: (row) =>
                      row.totalParcelas ? `${row.parcela}/${row.totalParcelas}` : "-",
                  },
                  {
                    key: "valor",
                    header: "Valor",
                    align: "right",
                    render: (row) =>
                      (row.valor / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RelatoriosPage;
