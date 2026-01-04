import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppButton from "../../../components/ui/button/AppButton";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import DashboardStatCard from "../../../components/ui/card/DashboardStatCard";
import {
  getVendasAnalytics,
  type VendasAnalyticsResponse,
} from "../services/comercial.service";

const VendasAnalyticsPage = () => {
  const [filters, setFilters] = useState({ dataInicio: "", dataFim: "" });
  const [error, setError] = useState("");
  const [data, setData] = useState<VendasAnalyticsResponse>({
    maisVendidos: [],
    menosVendidos: [],
    ultimosSaidos: [],
  });

  const load = async () => {
    try {
      setError("");
      const res = await getVendasAnalytics({
        dataInicio: filters.dataInicio || undefined,
        dataFim: filters.dataFim || undefined,
      });
      setData(res);
    } catch {
      setData({ maisVendidos: [], menosVendidos: [], ultimosSaidos: [] });
      setError("Nao foi possivel carregar os dados de vendas.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = data.totais ?? { quantidade: 0, total: 0 };

  const produtoColumns = useMemo(
    () => [
      {
        key: "descricao",
        header: "Produto",
        render: (row: { descricao: string }) => row.descricao,
      },
      {
        key: "quantidade",
        header: "Quantidade",
        align: "right" as const,
        render: (row: { quantidade: number }) => row.quantidade,
      },
      {
        key: "total",
        header: "Total",
        align: "right" as const,
        render: (row: { total: number }) =>
          (row.total / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
    ],
    []
  );

  const saidaColumns = useMemo(
    () => [
      { key: "data", header: "Data", render: (row: { data: string }) => row.data },
      {
        key: "produto",
        header: "Produto",
        render: (row: { produto: string }) => row.produto,
      },
      {
        key: "quantidade",
        header: "Quantidade",
        align: "right" as const,
        render: (row: { quantidade: number }) => row.quantidade,
      },
      {
        key: "total",
        header: "Total",
        align: "right" as const,
        render: (row: { total: number }) =>
          (row.total / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Analise de vendas" />
        <AppSubTitle text="Mais vendidos, menos vendidos e ultimas saidas." />
      </div>

      <Card>
        <AppSubTitle text="Filtros" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppDateInput
            title="Data inicial"
            type="date"
            value={filters.dataInicio}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataInicio: e.target.value }))
            }
          />
          <AppDateInput
            title="Data final"
            type="date"
            value={filters.dataFim}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataFim: e.target.value }))
            }
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto" onClick={load}>
              Filtrar
            </AppButton>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardStatCard
          title="Quantidade"
          value={String(totals.quantidade)}
          tone="green"
        />
        <DashboardStatCard
          title="Total"
          value={
            (totals.total / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          }
          tone="blue"
        />
        <DashboardStatCard
          title="Itens catalogados"
          value={String(data.maisVendidos.length + data.menosVendidos.length)}
          tone="amber"
        />
      </div>

      <Card>
        <AppSubTitle text="Mais vendidos" />
        <div className="mt-4">
          <AppTable
            data={data.maisVendidos}
            rowKey={(row) => row.produtoId ?? row.descricao}
            emptyState={<AppListNotFound texto="Sem dados de vendas." />}
            pagination={{ enabled: true, pageSize: 8 }}
            columns={produtoColumns}
          />
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Menos vendidos" />
        <div className="mt-4">
          <AppTable
            data={data.menosVendidos}
            rowKey={(row) => row.produtoId ?? row.descricao}
            emptyState={<AppListNotFound texto="Sem dados de vendas." />}
            pagination={{ enabled: true, pageSize: 8 }}
            columns={produtoColumns}
          />
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Ultimos saidos" />
        <div className="mt-4">
          <AppTable
            data={data.ultimosSaidos}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Sem saidas recentes." />}
            pagination={{ enabled: true, pageSize: 8 }}
            columns={saidaColumns}
          />
        </div>
      </Card>
    </div>
  );
};

export default VendasAnalyticsPage;
