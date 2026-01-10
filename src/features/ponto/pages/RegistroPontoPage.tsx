import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppHoraInput from "../../../components/ui/input/AppHoraInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import { TrashIcon } from "../../../components/ui/icon/AppIcons";
import { listFuncionarios } from "../../rh/services/rh.service";
import {
  createPonto,
  deletePonto,
  listCompetencias,
  listPonto,
  updatePonto,
} from "../../rh/services/folha.service";
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

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

type PontoRow = PontoDia & {
  totalMinutes: number;
  nightMinutes: number;
  expectedMinutes: number;
  saldoMinutes: number;
  toleranceMinutes: number;
  statusCalc: "OK" | "INCONSISTENTE";
};

const RegistroPontoPage = () => {
  const [itens, setItens] = useState<PontoDia[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [competencias, setCompetencias] = useState<Array<{ value: string; label: string }>>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const { popupProps, openConfirm } = useConfirmPopup();
  const [filters, setFilters] = useState({
    funcionarioId: "",
    competencia: "",
  });
  const [formData, setFormData] = useState({
    funcionarioId: "",
    data: "",
    entrada1: "",
    saida1: "",
    entrada2: "",
    saida2: "",
    justificativa: "",
  });
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { config: pontoConfig, overrides: pontoOverrides } = usePontoConfig();
  const { calendario, calendarioFuncionario } = usePontoCalendario();
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);

  const loadLookups = async () => {
    try {
      const [funcRes, compRes] = await Promise.all([
        listFuncionarios({ page: 1, pageSize: 200 }),
        listCompetencias({ page: 1, pageSize: 50 }),
      ]);
      setFuncionarios(funcRes.data);
      setCompetencias(
        compRes.data.map((item) => ({
          value: item.competencia,
          label: `${item.competencia} (${item.status})`,
        }))
      );
    } catch {
      setFuncionarios([]);
      setCompetencias([]);
    }
  };

  const load = async () => {
    try {
      setError("");
      const range = filters.competencia ? getCompetenciaRange(filters.competencia) : null;
      const pageSize = 200;
      let page = 1;
      let all: PontoDia[] = [];
      while (true) {
        const response = await listPonto({
          page,
          pageSize,
          dataInicio: range?.start,
          dataFim: range?.end,
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

  useEffect(() => {
    setPage(1);
  }, [filters.funcionarioId, filters.competencia]);

  const funcionarioOptions = useMemo(
    () =>
      funcionarios.map((func) => ({
        value: func.id,
        label: func.nome,
      })),
    [funcionarios]
  );

  const rows = useMemo<PontoRow[]>(() => {
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
      const nightMinutes = calcDayNightMinutes(
        item.entrada1,
        item.saida1,
        item.entrada2,
        item.saida2
      );
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
        totalMinutes,
        nightMinutes,
        expectedMinutes,
        saldoMinutes,
        toleranceMinutes: rule.toleranceMinutes,
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

  const pagedRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [page, pageSize, rows]
  );

  const summary = useMemo(() => {
    const totalMinutes = rows.reduce((acc, item) => acc + item.totalMinutes, 0);
    const nightMinutes = rows.reduce((acc, item) => acc + item.nightMinutes, 0);
    const inconsistencias = rows.filter((item) => item.statusCalc === "INCONSISTENTE").length;
    const saldoMinutes = rows.reduce((acc, item) => {
      if (Math.abs(item.saldoMinutes) <= item.toleranceMinutes) return acc;
      return acc + item.saldoMinutes;
    }, 0);
    return {
      totalHoras: minutesToHours(totalMinutes),
      noturnoHoras: minutesToHours(nightMinutes),
      saldoHoras: minutesToHours(saldoMinutes),
      inconsistencias,
    };
  }, [rows]);

  const columns = useMemo(
    () => [
      {
        key: "funcionario",
        header: "Funcionario",
        render: (row: PontoRow) =>
          funcionarios.find((func) => func.id === row.funcionarioId)?.nome ?? row.funcionarioId,
      },
      { key: "data", header: "Data", render: (row: PontoRow) => row.data },
      { key: "entrada1", header: "Entrada 1", render: (row: PontoRow) => row.entrada1 ?? "-" },
      { key: "saida1", header: "Saida 1", render: (row: PontoRow) => row.saida1 ?? "-" },
      { key: "entrada2", header: "Entrada 2", render: (row: PontoRow) => row.entrada2 ?? "-" },
      { key: "saida2", header: "Saida 2", render: (row: PontoRow) => row.saida2 ?? "-" },
      {
        key: "totalHoras",
        header: "Horas",
        align: "right" as const,
        render: (row: PontoRow) => minutesToHours(row.totalMinutes).toFixed(2),
      },
      {
        key: "saldo",
        header: "Saldo",
        align: "right" as const,
        render: (row: PontoRow) => minutesToHours(row.saldoMinutes).toFixed(2),
      },
      {
        key: "noturno",
        header: "Noturno",
        align: "right" as const,
        render: (row: PontoRow) => minutesToHours(row.nightMinutes).toFixed(2),
      },
      { key: "status", header: "Status", render: (row: PontoRow) => row.statusCalc },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: PontoRow) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path d="M4 13.5V16h2.5l7.36-7.36-2.5-2.5L4 13.5Zm11.71-6.79a1 1 0 0 0 0-1.42l-1-1a1 1 0 0 0-1.42 0l-1.04 1.04 2.5 2.5 1-1.12Z" />
                </svg>
              }
              label="Editar"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  funcionarioId: String(row.funcionarioId),
                  data: row.data,
                  entrada1: row.entrada1 ?? "",
                  saida1: row.saida1 ?? "",
                  entrada2: row.entrada2 ?? "",
                  saida2: row.saida2 ?? "",
                  justificativa: row.justificativa ?? "",
                });
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label="Excluir"
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir registro",
                    description: "Deseja excluir este registro de ponto?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    try {
                      await deletePonto(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir o registro.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [funcionarios, openConfirm]
  );

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.funcionarioId || !formData.data) {
      setFormError("Funcionario e data sao obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    const funcionario = funcionarios.find(
      (item) => String(item.id) === String(formData.funcionarioId)
    );
    const rule = getPontoRuleForFuncionario(
      pontoConfig,
      pontoOverrides,
      formData.funcionarioId,
      funcionario?.tipoContrato
    );
    const totalMinutes = calcDayMinutes(
      formData.entrada1,
      formData.saida1,
      formData.entrada2,
      formData.saida2
    );
    const expectedMinutes = getExpectedMinutes(
      formData.data,
      formData.funcionarioId,
      calendario,
      calendarioFuncionario,
      rule
    );
    const saldoMinutes = totalMinutes - expectedMinutes;
    const missingPair =
      (!!formData.entrada1 && !formData.saida1) || (!!formData.entrada2 && !formData.saida2);
    const outsideTolerance =
      Math.abs(saldoMinutes) > rule.toleranceMinutes && expectedMinutes > 0;
    const status = missingPair || outsideTolerance ? "INCONSISTENTE" : "OK";
    try {
      const payload = {
        funcionarioId: formData.funcionarioId,
        data: formData.data,
        entrada1: formData.entrada1 || undefined,
        saida1: formData.saida1 || undefined,
        entrada2: formData.entrada2 || undefined,
        saida2: formData.saida2 || undefined,
        justificativa: formData.justificativa || undefined,
        status,
        totalHoras: minutesToHours(totalMinutes),
      };
      if (editingId) {
        await updatePonto(editingId, payload);
      } else {
        await createPonto(payload);
      }
      setFormData({
        funcionarioId: "",
        data: "",
        entrada1: "",
        saida1: "",
        entrada2: "",
        saida2: "",
        justificativa: "",
      });
      setEditingId(null);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o ponto.");
    }
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map((item) => item.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = line.split(sep).map((item) => item.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? "";
      });
      return row;
    });
  };

  const handleImportCsv = async (file?: File | null) => {
    setImportError("");
    if (!file) return;
    if (!API_BASE) {
      setImportError("API nao configurada.");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        setImportError("Arquivo CSV vazio.");
        return;
      }
      const mapByMatricula = new Map(funcionarios.map((f) => [String(f.matricula), f.id]));
      for (const row of rows) {
        const funcionarioId =
          row.funcionarioid ||
          row.funcionario ||
          row.idfuncionario ||
          (row.matricula ? String(mapByMatricula.get(row.matricula)) : "");
        const data = row.data || row.dia;
        if (!funcionarioId || !data) continue;
        const entrada1 = row.entrada1 || row.entrada_1 || "";
        const saida1 = row.saida1 || row.saida_1 || "";
        const entrada2 = row.entrada2 || row.entrada_2 || "";
        const saida2 = row.saida2 || row.saida_2 || "";
        const justificativa = row.justificativa || row.obs || "";
        const funcionario = funcionarios.find((f) => String(f.id) === String(funcionarioId));
        const rule = getPontoRuleForFuncionario(
          pontoConfig,
          pontoOverrides,
          String(funcionarioId),
          funcionario?.tipoContrato
        );
        const totalMinutes = calcDayMinutes(entrada1, saida1, entrada2, saida2);
        const expectedMinutes = getExpectedMinutes(
          data,
          String(funcionarioId),
          calendario,
          calendarioFuncionario,
          rule
        );
        const saldoMinutes = totalMinutes - expectedMinutes;
        const missingPair =
          (!!entrada1 && !saida1) || (!!entrada2 && !saida2);
        const outsideTolerance =
          Math.abs(saldoMinutes) > rule.toleranceMinutes && expectedMinutes > 0;
        const status = missingPair || outsideTolerance ? "INCONSISTENTE" : "OK";

        await createPonto({
          funcionarioId,
          data,
          entrada1: entrada1 || undefined,
          saida1: saida1 || undefined,
          entrada2: entrada2 || undefined,
          saida2: saida2 || undefined,
          justificativa: justificativa || undefined,
          status,
          totalHoras: minutesToHours(totalMinutes),
        });
      }
      load();
    } catch {
      setImportError("Nao foi possivel importar o CSV.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Ponto" />
        <AppSubTitle text="Registro diario e consistencia de horas." />
      </div>

      <Card>
        <AppSubTitle text="Filtros e indicadores" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Filtre por competencia ou funcionario e acompanhe o resumo do periodo.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Competencia"
            value={filters.competencia}
            onChange={(e) => setFilters((prev) => ({ ...prev, competencia: e.target.value }))}
            data={[{ value: "", label: "Todas" }, ...competencias]}
            placeholder="Selecione"
          />
          <AppSelectInput
            title="Funcionario"
            value={filters.funcionarioId}
            onChange={(e) => setFilters((prev) => ({ ...prev, funcionarioId: e.target.value }))}
            data={[{ value: "", label: "Todos" }, ...funcionarioOptions]}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Horas totais</div>
            <div className="text-sm font-semibold">{summary.totalHoras.toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Horas noturnas</div>
            <div className="text-sm font-semibold">{summary.noturnoHoras.toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Saldo</div>
            <div className="text-sm font-semibold">{summary.saldoHoras.toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Inconsistencias</div>
            <div className="text-sm font-semibold">{summary.inconsistencias}</div>
          </div>
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Importar ponto (CSV)" />
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <input
            type="file"
            accept=".csv,text/csv"
            className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-white hover:file:bg-slate-800 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:file:bg-slate-100 dark:file:text-slate-900"
            onChange={(e) => handleImportCsv(e.target.files?.[0] ?? null)}
            disabled={importing}
          />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Cabecalhos aceitos: funcionarioId ou matricula, data, entrada1, saida1, entrada2, saida2, justificativa.
          </div>
        </div>
        {importError ? <p className="text-sm text-red-600">{importError}</p> : null}
      </Card>

      <Card>
        <AppSubTitle text="Registro manual" />
        <div className="grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Funcionario"
            value={formData.funcionarioId}
            onChange={(e) => setFormData((prev) => ({ ...prev, funcionarioId: e.target.value }))}
            data={funcionarioOptions}
            placeholder="Selecione"
          />
          <AppDateInput
            title="Data"
            value={formData.data}
            onChange={(e) => setFormData((prev) => ({ ...prev, data: e.target.value }))}
          />
          <AppHoraInput
            title="Entrada 1"
            value={formData.entrada1}
            onChange={(e) => setFormData((prev) => ({ ...prev, entrada1: e.target.value }))}
            placeholder="08:00"
          />
          <AppHoraInput
            title="Saida 1"
            value={formData.saida1}
            onChange={(e) => setFormData((prev) => ({ ...prev, saida1: e.target.value }))}
            placeholder="12:00"
          />
          <AppHoraInput
            title="Entrada 2"
            value={formData.entrada2}
            onChange={(e) => setFormData((prev) => ({ ...prev, entrada2: e.target.value }))}
            placeholder="13:00"
          />
          <AppHoraInput
            title="Saida 2"
            value={formData.saida2}
            onChange={(e) => setFormData((prev) => ({ ...prev, saida2: e.target.value }))}
            placeholder="17:00"
          />
          <div className="md:col-span-3">
            <AppTextInput
              title="Justificativa"
              value={formData.justificativa}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, justificativa: e.target.value }))
              }
            />
          </div>
        </div>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <div className="mt-3 flex flex-wrap gap-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSubmit}>
            {editingId ? "Salvar edicao" : "Registrar ponto"}
          </AppButton>
          {editingId ? (
            <AppButton
              type="button"
              variant="outline"
              className="w-auto px-6"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  funcionarioId: "",
                  data: "",
                  entrada1: "",
                  saida1: "",
                  entrada2: "",
                  saida2: "",
                  justificativa: "",
                });
              }}
            >
              Cancelar
            </AppButton>
          ) : null}
        </div>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={pagedRows}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum registro de ponto." />}
          pagination={{
            enabled: true,
            pageSize,
            page,
            total: rows.length,
            onPageChange: setPage,
          }}
          columns={columns}
        />
      </Card>
      <AppPopup {...popupProps} />
    </div>
  );
};

export default RegistroPontoPage;
