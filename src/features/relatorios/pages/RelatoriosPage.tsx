import React, { useEffect, useMemo, useState } from "react";

import { TipoMovimentoCaixa, type CategoriaMovimento, type ContaBancaria, type MovimentoCaixa } from "../../financeiro/types";
import { listContas } from "../../financeiro/services/contas.service";
import { listCategorias } from "../../financeiro/services/categorias.service";
import { listMovimentos } from "../../financeiro/services/movimentos.service";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import DashboardStatCard from "../../../components/ui/card/DashboardStatCard";


const RelatoriosPage = () => {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [filters, setFilters] = useState({
    dataInicial: "",
    dataFinal: "",
    contaId: "",
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

  const contaOptions = useMemo(
    () =>
      contas.map((conta) => ({
        value: conta.id,
        label: `${conta.nome} (${conta.banco})`,
      })),
    [contas]
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

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text="Relatorios" />
      <AppSubTitle text="Resumo rapido de movimentos e categorias." />

      <Card>
        <AppSubTitle text="Filtros" />
        <small>Filtre os relatorios por periodo e conta.</small>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppTextInput
            title="Data inicial"
            type="date"
            value={filters.dataInicial}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataInicial: e.target.value }))
            }
          />

          <AppTextInput
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
      </Card>
    </div>
  );
};

export default RelatoriosPage;
