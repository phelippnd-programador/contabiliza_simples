import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import type { FinanceiroAuditoria, FinanceiroFechamento } from "../types";
import {
  getFechamentoByCompetencia,
  listFechamentos,
  saveFechamento,
} from "../services/fechamento.service";
import { listAuditoria, registrarAuditoria } from "../services/auditoria.service";
import { formatLocalDate } from "../../../shared/utils/formater";

const FechamentoFinanceiroPage = () => {
  const [fechamentos, setFechamentos] = useState<FinanceiroFechamento[]>([]);
  const [competencia, setCompetencia] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditoria, setAuditoria] = useState<FinanceiroAuditoria[]>([]);

  const load = async () => {
    const [fechamentosData, auditoriaData] = await Promise.all([
      listFechamentos(),
      listAuditoria(),
    ]);
    setFechamentos(fechamentosData);
    setAuditoria(auditoriaData);
  };

  useEffect(() => {
    load().catch(() => setError("Nao foi possivel carregar fechamentos."));
  }, []);

  const rows = useMemo(
    () =>
      [...fechamentos].sort((a, b) => (a.competencia < b.competencia ? 1 : -1)),
    [fechamentos]
  );

  const auditoriaRows = useMemo(
    () =>
      [...auditoria].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 50),
    [auditoria]
  );

  const handleFechar = async () => {
    if (!competencia) {
      setError("Informe a competencia.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const existing = await getFechamentoByCompetencia(competencia);
      if (existing?.status === "FECHADO") {
        setError("Competencia ja fechada.");
        return;
      }
      const payload = {
        competencia,
        status: "FECHADO" as const,
        fechadoEm: new Date().toISOString(),
        fechadoPor: "Sistema",
        observacoes: observacoes || undefined,
      };
      const saved = await saveFechamento({ ...payload, id: existing?.id });
      await registrarAuditoria({
        acao: "FECHAR",
        entidade: "FECHAMENTO_FINANCEIRO",
        entidadeId: saved.id,
        competencia,
        detalhes: { status: "FECHADO" },
      });
      setCompetencia("");
      setObservacoes("");
      await load();
    } catch {
      setError("Nao foi possivel fechar a competencia.");
    } finally {
      setLoading(false);
    }
  };

  const handleReabrir = async (row: FinanceiroFechamento) => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        id: row.id,
        competencia: row.competencia,
        status: "ABERTO" as const,
        fechadoEm: undefined,
        fechadoPor: undefined,
        observacoes: row.observacoes,
      };
      const saved = await saveFechamento(payload);
      await registrarAuditoria({
        acao: "REABRIR",
        entidade: "FECHAMENTO_FINANCEIRO",
        entidadeId: saved.id,
        competencia: row.competencia,
        detalhes: { status: "ABERTO" },
      });
      await load();
    } catch {
      setError("Nao foi possivel reabrir a competencia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Fechamento financeiro" />
        <AppSubTitle text="Feche competencias e bloqueie alteracoes." />
      </div>

      <Card>
        <AppSubTitle text="Fechar competencia" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Bloqueie alteracoes e registre auditoria automaticamente.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <AppDateInput
            title="Competencia"
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          />
          <AppTextInput
            title="Observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
          <div className="flex items-end">
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={handleFechar}
              disabled={loading}
            >
              Fechar competencia
            </AppButton>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card>
        <AppSubTitle text="Competencias fechadas" />
        <AppTable
          data={rows}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum fechamento registrado." />}
          columns={[
            {
              key: "competencia",
              header: "Competencia",
              render: (row) => formatLocalDate(row.competencia),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => row.status,
            },
            {
              key: "fechadoEm",
              header: "Fechado em",
              render: (row) => (row.fechadoEm ? formatLocalDate(row.fechadoEm) : "-"),
            },
            {
              key: "fechadoPor",
              header: "Fechado por",
              render: (row) => row.fechadoPor ?? "-",
            },
            {
              key: "acoes",
              header: "Acoes",
              align: "right" as const,
              render: (row) => (
                <AppButton
                  type="button"
                  className="w-auto px-4"
                  disabled={loading || row.status !== "FECHADO"}
                  onClick={() => handleReabrir(row)}
                >
                  Reabrir
                </AppButton>
              ),
            },
          ]}
        />
      </Card>

      <Card>
        <AppSubTitle text="Auditoria financeira" />
        <AppTable
          data={auditoriaRows}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum evento registrado." />}
          columns={[
            {
              key: "data",
              header: "Data",
              render: (row) => formatLocalDate(row.data),
            },
            { key: "acao", header: "Acao", render: (row) => row.acao },
            { key: "entidade", header: "Entidade", render: (row) => row.entidade },
            {
              key: "competencia",
              header: "Competencia",
              render: (row) => (row.competencia ? formatLocalDate(row.competencia) : "-"),
            },
            {
              key: "entidadeId",
              header: "Referencia",
              render: (row) => row.entidadeId ?? "-",
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default FechamentoFinanceiroPage;
