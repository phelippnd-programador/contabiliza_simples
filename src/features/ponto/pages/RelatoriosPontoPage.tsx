import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { listCompetencias, listPonto } from "../../rh/services/folha.service";
import { listFuncionarios } from "../../rh/services/rh.service";
import type { Funcionario, PontoDia } from "../../rh/types/rh.types";
import {
  calcDayMinutes,
  calcDayNightMinutes,
  getCompetenciaRange,
  minutesToHours,
} from "../utils/pontoCalc";
import { getPontoRuleForFuncionario } from "../utils/pontoConfig";
import { usePontoConfig } from "../hooks/usePontoConfig";
import { usePontoCalendario } from "../hooks/usePontoCalendario";
import { getExpectedMinutes } from "../utils/pontoCalendario";

type PontoReportRow = PontoDia & {
  funcionarioNome: string;
  totalMinutes: number;
  nightMinutes: number;
  saldoMinutes: number;
  statusCalc: "OK" | "INCONSISTENTE";
};

const RelatoriosPontoPage = () => {
  const [competencias, setCompetencias] = useState<Array<{ value: string; label: string }>>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [itens, setItens] = useState<PontoDia[]>([]);
  const [filters, setFilters] = useState({ competencia: "", funcionarioId: "" });
  const [error, setError] = useState("");
  const { config: pontoConfig, overrides: pontoOverrides } = usePontoConfig();
  const { calendario, calendarioFuncionario } = usePontoCalendario();

  const loadLookups = async () => {
    try {
      const [compRes, funcRes] = await Promise.all([
        listCompetencias({ page: 1, pageSize: 50 }),
        listFuncionarios({ page: 1, pageSize: 200 }),
      ]);
      setCompetencias(
        compRes.data.map((item) => ({
          value: item.competencia,
          label: `${item.competencia} (${item.status})`,
        }))
      );
      setFuncionarios(funcRes.data);
    } catch {
      setCompetencias([]);
      setFuncionarios([]);
    }
  };

  const load = async () => {
    if (!filters.competencia) {
      setItens([]);
      return;
    }
    try {
      setError("");
      const range = getCompetenciaRange(filters.competencia);
      const pageSize = 200;
      let page = 1;
      let all: PontoDia[] = [];
      while (true) {
        const response = await listPonto({
          page,
          pageSize,
          dataInicio: range.start,
          dataFim: range.end,
        });
        all = all.concat(response.data);
        const total = response.meta.total ?? all.length;
        if (all.length >= total || response.data.length < pageSize) break;
        page += 1;
      }
      setItens(all);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar o ponto.");
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    load();
  }, [filters.competencia]);

  const funcionarioOptions = useMemo(
    () => [
      { value: "", label: "Todos" },
      ...funcionarios.map((func) => ({ value: func.id, label: func.nome })),
    ],
    [funcionarios]
  );

  const rows = useMemo<PontoReportRow[]>(() => {
    const filtered = filters.funcionarioId
      ? itens.filter((item) => String(item.funcionarioId) === String(filters.funcionarioId))
      : itens;
    return filtered.map((item) => {
      const funcionario = funcionarios.find(
        (func) => String(func.id) === String(item.funcionarioId)
      );
      const rule = getPontoRuleForFuncionario(
        pontoConfig,
        pontoOverrides,
        String(item.funcionarioId),
        funcionario?.tipoContrato
      );
      const totalMinutes =
        calcDayMinutes(item.entrada1, item.saida1, item.entrada2, item.saida2) ||
        Math.round((item.totalHoras ?? 0) * 60);
      const expectedMinutes = getExpectedMinutes(
        item.data,
        String(item.funcionarioId),
        calendario,
        calendarioFuncionario,
        rule
      );
      const saldoMinutes = totalMinutes - expectedMinutes;
      const missingPair =
        (!!item.entrada1 && !item.saida1) || (!!item.entrada2 && !item.saida2);
      const outsideTolerance =
        Math.abs(saldoMinutes) > rule.toleranceMinutes && expectedMinutes > 0;
      const statusCalc = missingPair || outsideTolerance ? "INCONSISTENTE" : "OK";
      return {
        ...item,
        funcionarioNome:
          funcionarios.find((func) => String(func.id) === String(item.funcionarioId))?.nome ??
          String(item.funcionarioId),
        totalMinutes,
        nightMinutes: calcDayNightMinutes(
          item.entrada1,
          item.saida1,
          item.entrada2,
          item.saida2
        ),
        saldoMinutes,
        statusCalc,
      };
    });
  }, [
    filters.funcionarioId,
    funcionarios,
    itens,
    pontoConfig,
    pontoOverrides,
    calendario,
    calendarioFuncionario,
  ]);

  const inconsistencias = useMemo(
    () => rows.filter((row) => row.statusCalc === "INCONSISTENTE"),
    [rows]
  );

  const resumoPorDepartamento = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const funcionario = funcionarios.find((f) => String(f.id) === String(row.funcionarioId));
      const dept = funcionario?.departamentoId ? `Depto ${funcionario.departamentoId}` : "Sem departamento";
      map.set(dept, (map.get(dept) ?? 0) + row.totalMinutes);
    });
    return Array.from(map.entries()).map(([departamento, totalMinutes]) => ({
      departamento,
      totalMinutes,
    }));
  }, [funcionarios, rows]);

  const resumoPorCentroCusto = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const funcionario = funcionarios.find((f) => String(f.id) === String(row.funcionarioId));
      const cc = funcionario?.centroCustoId ? `Centro ${funcionario.centroCustoId}` : "Sem centro";
      map.set(cc, (map.get(cc) ?? 0) + row.totalMinutes);
    });
    return Array.from(map.entries()).map(([centro, totalMinutes]) => ({
      centro,
      totalMinutes,
    }));
  }, [funcionarios, rows]);

  const exportCsv = () => {
    const lines = [
      "Funcionario,Data,Entrada1,Saida1,Entrada2,Saida2,Horas,Saldo,Noturno,Status",
    ];
    rows.forEach((row) => {
      lines.push(
        [
          row.funcionarioNome,
          row.data,
          row.entrada1 ?? "",
          row.saida1 ?? "",
          row.entrada2 ?? "",
          row.saida2 ?? "",
          minutesToHours(row.totalMinutes).toFixed(2),
          minutesToHours(row.saldoMinutes).toFixed(2),
          minutesToHours(row.nightMinutes).toFixed(2),
          row.statusCalc,
        ].join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ponto-${filters.competencia || "competencia"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printMonthlyReport = () => {
    if (!filters.competencia) {
      setError("Selecione uma competencia para gerar o espelho.");
      return;
    }
    const grouped = new Map<string, PontoReportRow[]>();
    rows.forEach((row) => {
      const list = grouped.get(row.funcionarioNome) ?? [];
      list.push(row);
      grouped.set(row.funcionarioNome, list);
    });
    const sections = Array.from(grouped.entries())
      .map(([name, list]) => {
        const totalHoras = list.reduce((acc, item) => acc + item.totalMinutes, 0);
        const totalSaldo = list.reduce((acc, item) => acc + item.saldoMinutes, 0);
        const totalNoturno = list.reduce((acc, item) => acc + item.nightMinutes, 0);
        const rowsHtml = list
          .map(
            (item) => `
              <tr>
                <td>${item.data}</td>
                <td>${item.entrada1 ?? "-"}</td>
                <td>${item.saida1 ?? "-"}</td>
                <td>${item.entrada2 ?? "-"}</td>
                <td>${item.saida2 ?? "-"}</td>
                <td style="text-align:right;">${minutesToHours(item.totalMinutes).toFixed(2)}</td>
                <td style="text-align:right;">${minutesToHours(item.saldoMinutes).toFixed(2)}</td>
                <td style="text-align:right;">${minutesToHours(item.nightMinutes).toFixed(2)}</td>
                <td>${item.statusCalc}</td>
              </tr>
            `
          )
          .join("");
        return `
          <section class="block">
            <h2>${name}</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Entrada 1</th>
                  <th>Saida 1</th>
                  <th>Entrada 2</th>
                  <th>Saida 2</th>
                  <th>Horas</th>
                  <th>Saldo</th>
                  <th>Noturno</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
            <div class="totals">
              <span>Horas: ${minutesToHours(totalHoras).toFixed(2)}</span>
              <span>Saldo: ${minutesToHours(totalSaldo).toFixed(2)}</span>
              <span>Noturno: ${minutesToHours(totalNoturno).toFixed(2)}</span>
            </div>
          </section>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>Espelho de ponto - ${filters.competencia}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin: 0 0 6px; }
            h2 { font-size: 14px; margin: 20px 0 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border-bottom: 1px solid #ddd; padding: 6px; font-size: 11px; }
            th { text-align: left; color: #444; }
            .totals { margin-top: 6px; font-size: 11px; color: #444; display: flex; gap: 12px; }
          </style>
        </head>
        <body>
          <h1>Espelho de ponto</h1>
          <div>Competencia ${filters.competencia}</div>
          ${sections}
        </body>
      </html>
    `;
    const win = window.open("", "_blank", "width=980,height=700");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const columns = useMemo(
    () => [
      { key: "funcionario", header: "Funcionario", render: (row: PontoReportRow) => row.funcionarioNome },
      { key: "data", header: "Data", render: (row: PontoReportRow) => row.data },
      { key: "entrada1", header: "Entrada 1", render: (row: PontoReportRow) => row.entrada1 ?? "-" },
      { key: "saida1", header: "Saida 1", render: (row: PontoReportRow) => row.saida1 ?? "-" },
      { key: "entrada2", header: "Entrada 2", render: (row: PontoReportRow) => row.entrada2 ?? "-" },
      { key: "saida2", header: "Saida 2", render: (row: PontoReportRow) => row.saida2 ?? "-" },
      {
        key: "horas",
        header: "Horas",
        align: "right" as const,
        render: (row: PontoReportRow) => minutesToHours(row.totalMinutes).toFixed(2),
      },
      {
        key: "saldo",
        header: "Saldo",
        align: "right" as const,
        render: (row: PontoReportRow) => minutesToHours(row.saldoMinutes).toFixed(2),
      },
      {
        key: "noturno",
        header: "Noturno",
        align: "right" as const,
        render: (row: PontoReportRow) => minutesToHours(row.nightMinutes).toFixed(2),
      },
      { key: "status", header: "Status", render: (row: PontoReportRow) => row.statusCalc },
    ],
    []
  );

  const inconsistenciasColumns = useMemo(
    () => [
      { key: "funcionario", header: "Funcionario", render: (row: PontoReportRow) => row.funcionarioNome },
      { key: "data", header: "Data", render: (row: PontoReportRow) => row.data },
      { key: "entrada1", header: "Entrada 1", render: (row: PontoReportRow) => row.entrada1 ?? "-" },
      { key: "saida1", header: "Saida 1", render: (row: PontoReportRow) => row.saida1 ?? "-" },
      { key: "entrada2", header: "Entrada 2", render: (row: PontoReportRow) => row.entrada2 ?? "-" },
      { key: "saida2", header: "Saida 2", render: (row: PontoReportRow) => row.saida2 ?? "-" },
      { key: "status", header: "Status", render: (row: PontoReportRow) => row.statusCalc },
    ],
    []
  );

  const resumoDepartamentoColumns = useMemo(
    () => [
      { key: "departamento", header: "Departamento", render: (row: any) => row.departamento },
      {
        key: "horas",
        header: "Horas",
        align: "right" as const,
        render: (row: any) => minutesToHours(row.totalMinutes).toFixed(2),
      },
    ],
    []
  );

  const resumoCentroColumns = useMemo(
    () => [
      { key: "centro", header: "Centro de custo", render: (row: any) => row.centro },
      {
        key: "horas",
        header: "Horas",
        align: "right" as const,
        render: (row: any) => minutesToHours(row.totalMinutes).toFixed(2),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Ponto - Relatorios" />
        <AppSubTitle text="Espelho de ponto e inconsistencias." />
      </div>

      <Card>
        <AppSubTitle text="Filtros e exportacao" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gere CSV ou espelho mensal com os filtros selecionados.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Competencia"
            value={filters.competencia}
            onChange={(e) => setFilters((prev) => ({ ...prev, competencia: e.target.value }))}
            data={[{ value: "", label: "Selecione" }, ...competencias]}
            placeholder="Selecione"
          />
          <AppSelectInput
            title="Funcionario"
            value={filters.funcionarioId}
            onChange={(e) => setFilters((prev) => ({ ...prev, funcionarioId: e.target.value }))}
            data={funcionarioOptions}
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto px-6" onClick={exportCsv}>
              Exportar CSV
            </AppButton>
            <AppButton
              type="button"
              variant="outline"
              className="w-auto px-6"
              onClick={printMonthlyReport}
            >
              Gerar espelho mensal
            </AppButton>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card>
        <AppSubTitle text="Espelho de ponto" />
        <AppTable
          data={rows}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Selecione uma competencia para listar o espelho." />}
          columns={columns}
        />
      </Card>

      <Card>
        <AppSubTitle text="Inconsistencias" />
        <AppTable
          data={inconsistencias}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma inconsistencia encontrada." />}
          columns={inconsistenciasColumns}
        />
      </Card>

      <Card>
        <AppSubTitle text="Resumo por departamento" />
        <AppTable
          data={resumoPorDepartamento}
          rowKey={(row) => row.departamento}
          emptyState={<AppListNotFound texto="Sem dados." />}
          columns={resumoDepartamentoColumns}
        />
      </Card>

      <Card>
        <AppSubTitle text="Resumo por centro de custo" />
        <AppTable
          data={resumoPorCentroCusto}
          rowKey={(row) => row.centro}
          emptyState={<AppListNotFound texto="Sem dados." />}
          columns={resumoCentroColumns}
        />
      </Card>
    </div>
  );
};

export default RelatoriosPontoPage;

