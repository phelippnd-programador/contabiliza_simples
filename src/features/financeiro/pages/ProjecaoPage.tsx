import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppButton from "../../../components/ui/button/AppButton";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import DashboardStatCard from "../../../components/ui/card/DashboardStatCard";
import PeriodCashChart, {
  type PeriodCashPoint,
} from "../../../components/ui/chart/PeriodCashChart";
import PeriodBalanceChart, {
  type PeriodBalancePoint,
} from "../../../components/ui/chart/PeriodBalanceChart";
import { listMovimentos } from "../services/movimentos.service";
import { listContasPagar, type ContaPagarResumo } from "../services/contas-pagar.service";
import { listContasReceber, type ContaReceberResumo } from "../services/contas-receber.service";
import { TipoMovimentoCaixa, type MovimentoCaixa } from "../types";
import { formatLocalDate } from "../../../shared/utils/formater";

type ProjecaoItem = {
  id: string;
  tipo: "RECEBER" | "PAGAR";
  nome: string;
  vencimento: string;
  valor: number;
  recorrente?: boolean;
  parcela?: number;
  totalParcelas?: number;
  status?: string;
  origem?: string;
};

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatCurrency = (value: number) =>
  (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const formatDateInput = (date: Date) =>
  date.toISOString().slice(0, 10);

const ProjecaoPage = () => {
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagarResumo[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceberResumo[]>([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => {
    const hoje = new Date();
    return {
      inicio: toDateString(hoje),
      fim: toDateString(addDays(hoje, 30)),
    };
  });

  const load = async () => {
    try {
      setError("");
      const [movimentosData, pagarData, receberData] = await Promise.all([
        listMovimentos(),
        listContasPagar({
          page: 1,
          pageSize: 200,
          vencimentoInicio: filters.inicio || undefined,
          vencimentoFim: filters.fim || undefined,
        }),
        listContasReceber({
          page: 1,
          pageSize: 200,
          vencimentoInicio: filters.inicio || undefined,
          vencimentoFim: filters.fim || undefined,
        }),
      ]);
      setMovimentos(movimentosData);
      setContasPagar(pagarData.data);
      setContasReceber(receberData.data);
    } catch {
      setError("Nao foi possivel carregar a projecao financeira.");
      setMovimentos([]);
      setContasPagar([]);
      setContasReceber([]);
    }
  };

  useEffect(() => {
    load();
  }, [filters.inicio, filters.fim]);

  const startDate = useMemo(() => parseDate(filters.inicio), [filters.inicio]);
  const endDate = useMemo(() => parseDate(filters.fim), [filters.fim]);

  const saldoBase = useMemo(() => {
    return movimentos.reduce((acc, movimento) => {
      const dataMovimento = parseDate(movimento.data);
      if (startDate && dataMovimento && dataMovimento > startDate) {
        return acc;
      }
      const sinal = movimento.tipo === TipoMovimentoCaixa.ENTRADA ? 1 : -1;
      return acc + movimento.valor * sinal;
    }, 0);
  }, [movimentos, startDate]);

  const contasReceberAbertas = useMemo(
    () =>
      contasReceber.filter(
        (item) => item.status !== "RECEBIDA" && item.status !== "CANCELADA"
      ),
    [contasReceber]
  );

  const contasPagarAbertas = useMemo(
    () =>
      contasPagar.filter(
        (item) => item.status !== "PAGA" && item.status !== "CANCELADA"
      ),
    [contasPagar]
  );

  const projecoes = useMemo<ProjecaoItem[]>(() => {
    const expandParcelas = (
      item: ContaReceberResumo | ContaPagarResumo,
      tipo: "RECEBER" | "PAGAR",
      nome: string
    ) => {
      const baseDate = parseDate(item.vencimento);
      if (!baseDate) return [];
      const isRecorrente =
        tipo === "RECEBER"
          ? (item as ContaReceberResumo).recorrente
          : (item as ContaPagarResumo).recorrente;
      if (isRecorrente) {
        const items: ProjecaoItem[] = [];
        let cursor = new Date(baseDate);
        const day = cursor.getDate();
        while (true) {
          const vencimentoStr = formatDateInput(cursor);
          if (startDate && cursor < startDate) {
            cursor = addMonths(cursor, 1);
            continue;
          }
          if (endDate && cursor > endDate) break;
          items.push({
            id: `${item.id}-rec-${vencimentoStr}`,
            tipo,
            nome,
            vencimento: vencimentoStr,
            valor: item.valor,
            recorrente: true,
            status: item.status,
            origem: item.origem,
          });
          const next = addMonths(cursor, 1);
          const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          next.setDate(Math.min(day, maxDay));
          cursor = next;
        }
        return items;
      }
      const rawTotal = item.totalParcelas && item.totalParcelas > 0 ? item.totalParcelas : 1;
      const rawParcela = item.parcela && item.parcela > 0 ? item.parcela : 1;
      const totalParcelas = rawTotal < rawParcela ? rawParcela : rawTotal;
      const parcelaInicial = rawTotal < rawParcela ? 1 : rawParcela;
      const parcelasRestantes = totalParcelas - parcelaInicial + 1;
      const totalValor =
        item.valorOriginal && item.valorOriginal > item.valor
          ? item.valorOriginal
          : item.valor * totalParcelas;
      const valorBase =
        totalParcelas > 1 ? Math.floor(totalValor / totalParcelas) : item.valor;
      const valorResto =
        totalParcelas > 1 ? totalValor - valorBase * totalParcelas : 0;
      const parcelaValor =
        item.valorOriginal && item.valorOriginal > item.valor ? valorBase : item.valor;
      const items: ProjecaoItem[] = [];
      for (let i = 0; i < parcelasRestantes; i += 1) {
        const vencimento = addMonths(baseDate, i);
        const vencimentoStr = formatDateInput(vencimento);
        if (startDate && vencimento < startDate) continue;
        if (endDate && vencimento > endDate) continue;
        items.push({
          id: `${item.id}-${parcelaInicial + i}`,
          tipo,
          nome,
          vencimento: vencimentoStr,
          valor:
            parcelaInicial + i === totalParcelas
              ? parcelaValor + valorResto
              : parcelaValor,
          recorrente: false,
          parcela: parcelaInicial + i,
          totalParcelas,
          status: item.status,
          origem: item.origem,
        });
      }
      return items;
    };

    const receber = contasReceberAbertas.flatMap((item) =>
      expandParcelas(
        item,
        "RECEBER",
        item.clienteNome || item.cliente || "Cliente"
      )
    );
    const pagar = contasPagarAbertas.flatMap((item) =>
      expandParcelas(
        item,
        "PAGAR",
        item.fornecedorNome || item.fornecedor || "Fornecedor"
      )
    );
    return [...receber, ...pagar].sort((a, b) =>
      a.vencimento < b.vencimento ? -1 : 1
    );
  }, [contasPagarAbertas, contasReceberAbertas, endDate, startDate]);

  const totalReceber = useMemo(
    () =>
      projecoes
        .filter((item) => item.tipo === "RECEBER")
        .reduce((acc, item) => acc + item.valor, 0),
    [projecoes]
  );

  const totalPagar = useMemo(
    () =>
      projecoes
        .filter((item) => item.tipo === "PAGAR")
        .reduce((acc, item) => acc + item.valor, 0),
    [projecoes]
  );

  const totalPagarPago = useMemo(
    () =>
      contasPagar
        .filter((item) => item.status === "PAGA")
        .reduce((acc, item) => acc + item.valor, 0),
    [contasPagar]
  );

  const fixos = useMemo(
    () => projecoes.filter((item) => item.recorrente),
    [projecoes]
  );

  const saldoAposPagar = saldoBase + totalReceber - totalPagarPago;
  const saldoProjetado = saldoBase + totalReceber - totalPagar;

  const chartData = useMemo<PeriodCashPoint[]>(() => {
    if (!filters.inicio || !filters.fim) return [];
    const map = new Map<string, { entradas: number; saidas: number }>();
    const baseLabel = startDate ? filters.inicio : new Date().toISOString().slice(0, 10);

    map.set(baseLabel, { entradas: saldoBase, saidas: 0 });

    projecoes.forEach((item) => {
      if (!item.vencimento) return;
      const current = map.get(item.vencimento) ?? { entradas: 0, saidas: 0 };
      if (item.tipo === "RECEBER") {
        current.entradas += item.valor;
      } else {
        current.saidas += item.valor;
      }
      map.set(item.vencimento, current);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([label, values]) => ({
        label: formatLocalDate(label, { day: "2-digit", month: "2-digit" }),
        entradas: values.entradas / 100,
        saidas: values.saidas / 100,
      }));
  }, [filters.fim, filters.inicio, projecoes, saldoBase, startDate]);

  const balanceData = useMemo<PeriodBalancePoint[]>(() => {
    if (!filters.inicio || !filters.fim) return [];
    const deltas = new Map<string, number>();
    projecoes.forEach((item) => {
      if (!item.vencimento) return;
      const delta = item.tipo === "RECEBER" ? item.valor : -item.valor;
      deltas.set(item.vencimento, (deltas.get(item.vencimento) ?? 0) + delta);
    });
    const sortedDates = Array.from(deltas.keys()).sort();
    const baseLabel = startDate ? filters.inicio : new Date().toISOString().slice(0, 10);
    const endLabel = endDate ? filters.fim : baseLabel;
    if (!sortedDates.includes(endLabel)) {
      sortedDates.push(endLabel);
      sortedDates.sort();
    }
    let running = saldoBase;
    const points: PeriodBalancePoint[] = [
      {
        label: formatLocalDate(baseLabel, { day: "2-digit", month: "2-digit" }),
        saldo: running / 100,
      },
    ];
    sortedDates.forEach((date) => {
      running += deltas.get(date) ?? 0;
      points.push({
        label: formatLocalDate(date, { day: "2-digit", month: "2-digit" }),
        saldo: running / 100,
      });
    });
    return points;
  }, [filters.fim, filters.inicio, projecoes, saldoBase, startDate]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Projecao financeira" />
        <AppSubTitle text="Fluxo de caixa atual e previsao com contas a pagar/receber." />
      </div>

      <Card>
        <AppSubTitle text="Periodo de analise" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppDateInput
            title="Inicio"
            type="date"
            value={filters.inicio}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, inicio: e.target.value }))
            }
          />
          <AppDateInput
            title="Fim"
            type="date"
            value={filters.fim}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, fim: e.target.value }))
            }
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto" onClick={load}>
              Atualizar
            </AppButton>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <DashboardStatCard
          title="Saldo base"
          value={formatCurrency(saldoBase)}
          helper="Saldo ate o inicio do periodo"
          tone="blue"
        />
        <DashboardStatCard
          title="A receber"
          value={formatCurrency(totalReceber)}
          helper="Vencimentos em aberto"
          tone="green"
        />
        <DashboardStatCard
          title="A pagar"
          value={formatCurrency(totalPagar)}
          helper="Vencimentos em aberto"
          tone="amber"
        />
        <DashboardStatCard
          title="Saldo atual"
          value={formatCurrency(saldoAposPagar)}
          helper="Saldo base + receber - contas pagas no periodo"
          tone={saldoAposPagar < 0 ? "red" : "blue"}
        />
        <DashboardStatCard
          title="Saldo projetado"
          value={formatCurrency(saldoProjetado)}
          helper="Saldo base + receber - pagar no periodo"
          tone={saldoProjetado < 0 ? "red" : "purple"}
        />
      </div>

      <Card>
        <PeriodCashChart title="Fluxo projetado" data={chartData} />
      </Card>

      <Card>
        <PeriodBalanceChart title="Saldo projetado" data={balanceData} />
      </Card>

      <Card>
        <AppSubTitle text="Detalhamento por vencimento" />
        <div className="mt-4">
          <AppTable
            data={projecoes}
            rowKey={(row) => `${row.tipo}-${row.id}`}
            emptyState={<AppListNotFound texto="Sem contas no periodo." />}
            pagination={{ enabled: true, pageSize: 8 }}
            columns={[
              {
                key: "vencimento",
                header: "Vencimento",
                render: (row) => formatLocalDate(row.vencimento),
              },
              {
                key: "parcela",
                header: "Parcela",
                render: (row) =>
                  row.parcela && row.totalParcelas
                    ? `${row.parcela}/${row.totalParcelas}`
                    : "-",
              },
              {
                key: "tipo",
                header: "Tipo",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.tipo === "RECEBER" ? (
                      <span className="text-green-600">↑</span>
                    ) : (
                      <span className="text-red-600">↓</span>
                    )}
                    <span>
                      {row.tipo === "RECEBER" ? "Conta a receber" : "Conta a pagar"}
                    </span>
                  </div>
                ),
              },
              {
                key: "nome",
                header: "Cliente/Fornecedor",
                render: (row) => row.nome,
              },
              {
                key: "valor",
                header: "Valor",
                align: "right" as const,
                render: (row) => (
                  <div className="flex items-center justify-end gap-2">
                    {row.tipo === "RECEBER" ? (
                      <span className="text-green-600">↑</span>
                    ) : (
                      <span className="text-red-600">↓</span>
                    )}
                    <span>{formatCurrency(row.valor)}</span>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Fixos" />
        <div className="mt-4">
          <AppTable
            data={fixos}
            rowKey={(row) => `${row.tipo}-${row.id}`}
            emptyState={<AppListNotFound texto="Sem recorrentes no periodo." />}
            pagination={{ enabled: true, pageSize: 8 }}
            columns={[
              {
                key: "vencimento",
                header: "Vencimento",
                render: (row) => formatLocalDate(row.vencimento),
              },
              {
                key: "tipo",
                header: "Tipo",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.tipo === "RECEBER" ? (
                      <span className="text-green-600">↑</span>
                    ) : (
                      <span className="text-red-600">↓</span>
                    )}
                    <span>
                      {row.tipo === "RECEBER" ? "Conta a receber" : "Conta a pagar"}
                    </span>
                  </div>
                ),
              },
              {
                key: "nome",
                header: "Cliente/Fornecedor",
                render: (row) => row.nome,
              },
              {
                key: "valor",
                header: "Valor",
                align: "right" as const,
                render: (row) => (
                  <div className="flex items-center justify-end gap-2">
                    {row.tipo === "RECEBER" ? (
                      <span className="text-green-600">↑</span>
                    ) : (
                      <span className="text-red-600">↓</span>
                    )}
                    <span>{formatCurrency(row.valor)}</span>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default ProjecaoPage;
