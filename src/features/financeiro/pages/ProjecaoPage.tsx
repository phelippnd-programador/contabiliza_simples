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
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

  const saldoAtual = useMemo(() => {
    return movimentos.reduce((acc, movimento) => {
      const sinal = movimento.tipo === TipoMovimentoCaixa.ENTRADA ? 1 : -1;
      return acc + movimento.valor * sinal;
    }, 0);
  }, [movimentos]);

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

  const totalReceber = useMemo(
    () => contasReceberAbertas.reduce((acc, item) => acc + item.valor, 0),
    [contasReceberAbertas]
  );

  const totalPagar = useMemo(
    () => contasPagarAbertas.reduce((acc, item) => acc + item.valor, 0),
    [contasPagarAbertas]
  );

  const saldoProjetado = saldoAtual + totalReceber - totalPagar;

  const projeções = useMemo<ProjecaoItem[]>(() => {
    const receber = contasReceberAbertas.map((item) => ({
      id: item.id,
      tipo: "RECEBER" as const,
      nome: item.clienteNome || item.cliente || "Cliente",
      vencimento: item.vencimento,
      valor: item.valor,
      status: item.status,
      origem: item.origem,
    }));
    const pagar = contasPagarAbertas.map((item) => ({
      id: item.id,
      tipo: "PAGAR" as const,
      nome: item.fornecedorNome || item.fornecedor || "Fornecedor",
      vencimento: item.vencimento,
      valor: item.valor,
      status: item.status,
      origem: item.origem,
    }));
    return [...receber, ...pagar].sort((a, b) =>
      a.vencimento < b.vencimento ? -1 : 1
    );
  }, [contasPagarAbertas, contasReceberAbertas]);

  const chartData = useMemo<PeriodCashPoint[]>(() => {
    if (!filters.inicio || !filters.fim) return [];
    const map = new Map<string, { entradas: number; saidas: number }>();
    projeções.forEach((item) => {
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
        entradas: values.entradas,
        saidas: values.saidas,
      }));
  }, [filters.inicio, filters.fim, projeções]);

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DashboardStatCard
          title="Saldo atual"
          value={formatCurrency(saldoAtual)}
          helper="Somatorio dos movimentos"
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
          title="Saldo projetado"
          value={formatCurrency(saldoProjetado)}
          helper="Saldo atual + receber - pagar"
          tone={saldoProjetado < 0 ? "red" : "purple"}
        />
      </div>

      <Card>
        <PeriodCashChart title="Fluxo projetado" data={chartData} />
      </Card>

      <Card>
        <AppSubTitle text="Detalhamento por vencimento" />
        <div className="mt-4">
          <AppTable
            data={projeções}
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
                key: "tipo",
                header: "Tipo",
                render: (row) =>
                  row.tipo === "RECEBER" ? "Conta a receber" : "Conta a pagar",
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
                render: (row) => formatCurrency(row.valor),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default ProjecaoPage;
