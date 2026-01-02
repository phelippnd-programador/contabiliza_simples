import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { listNotas } from "../services/notas.service";
import type { NotaResumo, NotaStatus } from "../types";

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "INVALIDO", label: "Invalido" },
  { value: "EMITIDA", label: "Emitida" },
  { value: "ERRO", label: "Erro" },
  { value: "CANCELADA", label: "Cancelada" },
];

const formatCurrency = (value?: number) =>
  typeof value === "number"
    ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "-";

const NotasListPage = () => {
  const navigate = useNavigate();
  const [notas, setNotas] = useState<NotaResumo[]>([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    competencia: "",
    status: "" as NotaStatus | "",
  });

  const load = async () => {
    try {
      setError("");
      const data = await listNotas({
        competencia: filters.competencia || undefined,
        status: filters.status || undefined,
      });
      setNotas(data);
    } catch {
      setError("Nao foi possivel carregar as notas.");
      setNotas([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "status", header: "Status", render: (row: NotaResumo) => row.status },
      { key: "tipo", header: "Tipo", render: (row: NotaResumo) => row.tipo },
      { key: "competencia", header: "Competencia", render: (row: NotaResumo) => row.competencia },
      { key: "tomador", header: "Tomador", render: (row: NotaResumo) => row.tomador?.nomeRazao ?? "-" },
      {
        key: "total",
        header: "Total",
        align: "right" as const,
        render: (row: NotaResumo) => formatCurrency(row.total),
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: NotaResumo) => (
          <AppButton
            type="button"
            className="w-auto px-4"
            onClick={() => navigate(`/fiscal/notas/${row.id}`)}
          >
            Ver
          </AppButton>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Notas fiscais" />
          <AppSubTitle text="Acompanhe as notas emitidas e seus status." />
        </div>
        <AppButton
          type="button"
          className="w-auto px-6"
          onClick={() => navigate("/fiscal/notas/nova")}
        >
          Nova nota
        </AppButton>
      </div>

      <Card>
        <AppSubTitle text="Filtros" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppDateInput
            title="Competencia"
            type="month"
            value={filters.competencia}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, competencia: e.target.value }))
            }
          />

          <AppSelectInput
            title="Status"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as NotaStatus | "",
              }))
            }
            data={statusOptions}
          />

          <div className="flex items-end">
            <AppButton type="button" className="w-auto" onClick={load}>
              Filtrar
            </AppButton>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6">
          <AppTable
            data={notas}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhuma nota encontrada." />}
            pagination={{ enabled: true, pageSize: 10 }}
            columns={columns}
          />
        </div>
      </Card>
    </div>
  );
};

export default NotasListPage;
