import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import DashboardSection from "../../../components/ui/card/DashboardSection";
import DashboardStatCard from "../../../components/ui/card/DashboardStatCard";
import PeriodCashChart, {
  type PeriodCashPoint,
} from "../../../components/ui/chart/PeriodCashChart";
import { listContas } from "../../financeiro/services/contas.service";
import { listCategorias } from "../../financeiro/services/categorias.service";
import { listMovimentos } from "../../financeiro/services/movimentos.service";
import { formatLocalDate } from "../../../shared/utils/formater";
import {
  TipoMovimentoCaixa,
  type CategoriaMovimento,
  type ContaBancaria,
  type MovimentoCaixa,
} from "../../financeiro/types";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDateLabel = (value: string) => value.slice(5);

const toDateString = (date: Date) =>
  date.toISOString().slice(0, 10);

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const DashboardPage = () => {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [chartFilters, setChartFilters] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return {
      start: toDateString(start),
      end: toDateString(end),
    };
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [contasData, categoriasData, movimentosData] = await Promise.all([
        listContas(),
        listCategorias(),
        listMovimentos(),
      ]);
      if (!isMounted) return;
      setContas(contasData);
      setCategorias(categoriasData);
      setMovimentos(movimentosData);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const saldoTotal = useMemo(() => {
    return movimentos.reduce((acc, movimento) => {
      const sinal = movimento.tipo === TipoMovimentoCaixa.ENTRADA ? 1 : -1;
      return acc + movimento.valor * sinal;
    }, 0);
  }, [movimentos]);

  const [entradasMes, saidasMes] = useMemo(() => {
    const now = new Date();
    const since = new Date();
    since.setDate(now.getDate() - 30);
    let entradas = 0;
    let saidas = 0;
    movimentos.forEach((movimento) => {
      const data = parseDate(movimento.data);
      if (!data) return;
      if (data < since) return;
      if (movimento.tipo === TipoMovimentoCaixa.ENTRADA) {
        entradas += movimento.valor;
      } else {
        saidas += movimento.valor;
      }
    });
    return [entradas, saidas];
  }, [movimentos]);

  const movimentosRecentes = useMemo(() => {
    return [...movimentos]
      .sort((a, b) => (a.data < b.data ? 1 : -1))
      .slice(0, 6);
  }, [movimentos]);

  const despesasPorCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    movimentos
      .filter((movimento) => movimento.tipo === TipoMovimentoCaixa.SAIDA)
      .forEach((movimento) => {
        const nome =
          categorias.find((categoria) => categoria.id === movimento.categoriaId)
            ?.nome ?? "Sem categoria";
        mapa.set(nome, (mapa.get(nome) ?? 0) + movimento.valor);
      });
    return Array.from(mapa.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [categorias, movimentos]);

  const chartData = useMemo<PeriodCashPoint[]>(() => {
    if (!chartFilters.start || !chartFilters.end) return [];
    const start = parseDate(chartFilters.start);
    const end = parseDate(chartFilters.end);
    if (!start || !end) return [];

    const map = new Map<string, { entradas: number; saidas: number }>();
    movimentos.forEach((movimento) => {
      const data = parseDate(movimento.data);
      if (!data) return;
      if (data < start || data > end) return;
      const label = toDateString(data);
      const current = map.get(label) ?? { entradas: 0, saidas: 0 };
      if (movimento.tipo === TipoMovimentoCaixa.ENTRADA) {
        current.entradas += movimento.valor;
      } else {
        current.saidas += movimento.valor;
      }
      map.set(label, current);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([label, values]) => ({
        label: formatDateLabel(label),
        entradas: values.entradas,
        saidas: values.saidas,
      }));
  }, [chartFilters, movimentos]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <AppTitle text="Dashboard" />
        <AppSubTitle text="Visao geral do financeiro e indicadores-chave." />
      </div>

      <DashboardSection
        title="Resumo"
        subtitle="Dados consolidados dos ultimos 30 dias."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <DashboardStatCard
            title="Saldo total"
            value={formatCurrency(saldoTotal)}
            helper={`${contas.length} contas cadastradas`}
            tone="blue"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9Zm1 13.5h-2V14H8v-2h3V9.5h2V12h3v2h-3Z" />
              </svg>
            }
          />
          <DashboardStatCard
            title="Entradas (30d)"
            value={formatCurrency(entradasMes)}
            helper="Receitas recentes"
            tone="green"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 4 5 11h4v7h6v-7h4z" />
              </svg>
            }
          />
          <DashboardStatCard
            title="Saidas (30d)"
            value={formatCurrency(saidasMes)}
            helper="Pagamentos recentes"
            tone="amber"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="m12 20 7-7h-4V6H9v7H5z" />
              </svg>
            }
          />
          <DashboardStatCard
            title="Categorias"
            value={`${categorias.length}`}
            helper="Classificacoes ativas"
            tone="purple"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M4 6a2 2 0 0 1 2-2h5v6H4Zm0 8h7v6H6a2 2 0 0 1-2-2Zm9 6v-6h7v4a2 2 0 0 1-2 2Zm0-10V4h5a2 2 0 0 1 2 2v4Z" />
              </svg>
            }
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Entradas x saidas por periodo">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppDateInput
            title="Data inicial"
            type="date"
            value={chartFilters.start}
            onChange={(e) =>
              setChartFilters((prev) => ({ ...prev, start: e.target.value }))
            }
          />
          <AppDateInput
            title="Data final"
            type="date"
            value={chartFilters.end}
            onChange={(e) =>
              setChartFilters((prev) => ({ ...prev, end: e.target.value }))
            }
          />
        </div>

        <div className="mt-4">
          <PeriodCashChart title="Fluxo de caixa" data={chartData} />
        </div>
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardSection title="Movimentos recentes">
          <AppTable
            data={movimentosRecentes}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhum movimento recente." />}
            pagination={{ enabled: false }}
            columns={[
              {
                key: "data",
                header: "Data",
                headerClassName: "text-left whitespace-nowrap",
                className: "whitespace-nowrap",
                render: (movimento) => formatLocalDate(movimento.data),
              },
              {
                key: "conta",
                header: "Conta",
                headerClassName: "text-left",
                className: "text-left",
                render: (movimento) =>
                  contas.find((conta) => conta.id === movimento.contaId)?.nome ??
                  "Conta removida",
              },
              {
                key: "valor",
                header: "Valor",
                align: "right",
                render: (movimento) => {
                  const isEntrada = movimento.tipo === TipoMovimentoCaixa.ENTRADA;
                  return (
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={isEntrada ? "text-emerald-500" : "text-red-500"}
                        aria-hidden="true"
                      >
                        {isEntrada ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M12 4 5 11h4v9h6v-9h4z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="m12 20 7-7h-4V4H9v9H5z" />
                          </svg>
                        )}
                      </span>
                      <span>{formatCurrency(movimento.valor)}</span>
                    </div>
                  );
                },
              },
            ]}
          />
        </DashboardSection>

        <DashboardSection title="Despesas por categoria">
          <AppTable
            data={despesasPorCategoria}
            rowKey={(row) => row.categoria}
            emptyState={<AppListNotFound texto="Sem despesas registradas." />}
            pagination={{ enabled: false }}
            columns={[
              { key: "categoria", header: "Categoria", render: (row) => row.categoria },
              {
                key: "total",
                header: "Total",
                align: "right",
                render: (row) => formatCurrency(row.total),
              },
            ]}
          />
        </DashboardSection>
      </div>
    </div>
  );
};

export default DashboardPage;
