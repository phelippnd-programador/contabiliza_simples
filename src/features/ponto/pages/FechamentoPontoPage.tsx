import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import {
  createEventoFolha,
  createLancamentoFolha,
  deleteLancamentoFolha,
  listCompetencias,
  listEventosFolha,
  listLancamentosFolha,
  listPonto,
  updateLancamentoFolha,
} from "../../rh/services/folha.service";
import { listFuncionarios } from "../../rh/services/rh.service";
import type { EventoFolha, Funcionario, PontoDia } from "../../rh/types/rh.types";
import {
  calcDayMinutes,
  calcDayNightMinutes,
  getCompetenciaRange,
  listDatesBetween,
  minutesToHours,
} from "../utils/pontoCalc";
import {
  DEFAULT_PONTO_CONFIG,
  getPontoRuleForFuncionario,
  mergePontoRule,
} from "../utils/pontoConfig";
import type { PontoFuncionarioConfig } from "../utils/pontoConfig";
import { usePontoConfig } from "../hooks/usePontoConfig";
import { usePontoCalendario } from "../hooks/usePontoCalendario";
import { getExpectedMinutes } from "../utils/pontoCalendario";
import type { FuncionarioContratoTipo } from "../../rh/types/rh.types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

type FechamentoRow = {
  funcionarioId: string;
  funcionarioNome: string;
  totalMinutes: number;
  expectedMinutes: number;
  overtimeMinutes: number;
  overtimeMinutes100: number;
  missingMinutes: number;
  nightMinutes: number;
  dsrMinutes?: number;
  inconsistencias: number;
};

const EVENT_DEFS: Array<Pick<EventoFolha, "codigo" | "descricao" | "tipo" | "incidencias">> = [
  {
    codigo: "HORA_EXTRA",
    descricao: "Hora extra",
    tipo: "PROVENTO",
    incidencias: { inss: true, fgts: true, irrf: true },
  },
  {
    codigo: "HORA_EXTRA_100",
    descricao: "Hora extra 100%",
    tipo: "PROVENTO",
    incidencias: { inss: true, fgts: true, irrf: true },
  },
  {
    codigo: "ADICIONAL_NOTURNO",
    descricao: "Adicional noturno",
    tipo: "PROVENTO",
    incidencias: { inss: true, fgts: true, irrf: true },
  },
  {
    codigo: "FALTA",
    descricao: "Falta / atraso",
    tipo: "DESCONTO",
    incidencias: { inss: false, fgts: false, irrf: false },
  },
  {
    codigo: "DSR_HORA_EXTRA",
    descricao: "DSR sobre hora extra",
    tipo: "PROVENTO",
    incidencias: { inss: true, fgts: true, irrf: true },
  },
];

const FechamentoPontoPage = () => {
  const [competencias, setCompetencias] = useState<Array<{ value: string; label: string }>>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [itens, setItens] = useState<PontoDia[]>([]);
  const [filters, setFilters] = useState({ competencia: "", funcionarioId: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const { config: pontoConfig, overrides, saveConfig, saveOverride, removeOverride } =
    usePontoConfig();
  const { calendario, calendarioFuncionario } = usePontoCalendario();
  const [configDraft, setConfigDraft] = useState(pontoConfig);
  const [tipoContrato, setTipoContrato] = useState<FuncionarioContratoTipo>("CLT");
  const [overrideFuncionarioId, setOverrideFuncionarioId] = useState("");
  const [overrideDraft, setOverrideDraft] = useState<Partial<PontoFuncionarioConfig>>({});
  const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const { popupProps, openConfirm } = useConfirmPopup();

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
      setError("Nao foi possivel carregar o ponto da competencia.");
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

  const funcionarioOverrideOptions = useMemo(
    () => [
      { value: "", label: "Selecione" },
      ...funcionarios.map((func) => ({ value: func.id, label: func.nome })),
    ],
    [funcionarios]
  );

  const rowsAll = useMemo<FechamentoRow[]>(() => {
    if (!filters.competencia) return [];
    const grouped = new Map<string, FechamentoRow>();
    itens.forEach((item) => {
      const func = funcionarios.find((f) => String(f.id) === String(item.funcionarioId));
      const rule = getPontoRuleForFuncionario(
        pontoConfig,
        overrides,
        String(item.funcionarioId),
        func?.tipoContrato
      );
      const key = String(item.funcionarioId);
      const current =
        grouped.get(key) ??
        ({
          funcionarioId: key,
          funcionarioNome: func?.nome ?? key,
          totalMinutes: 0,
          expectedMinutes: 0,
          overtimeMinutes: 0,
          overtimeMinutes100: 0,
          missingMinutes: 0,
          nightMinutes: 0,
          inconsistencias: 0,
        } as FechamentoRow);
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
      if (missingPair || outsideTolerance || item.status === "INCONSISTENTE") {
        current.inconsistencias += 1;
      }
      if (expectedMinutes === 0 && totalMinutes > 0) {
        current.overtimeMinutes100 += totalMinutes;
      } else if (expectedMinutes > 0 && Math.abs(saldoMinutes) > rule.toleranceMinutes) {
        if (saldoMinutes > 0) current.overtimeMinutes += saldoMinutes;
        if (saldoMinutes < 0) current.missingMinutes += Math.abs(saldoMinutes);
      }
      current.totalMinutes += totalMinutes;
      current.expectedMinutes += expectedMinutes;
      current.nightMinutes += calcDayNightMinutes(
        item.entrada1,
        item.saida1,
        item.entrada2,
        item.saida2
      );
      grouped.set(key, current);
    });
    const range = getCompetenciaRange(filters.competencia);
    const days = listDatesBetween(range.start, range.end);
    const result = Array.from(grouped.values()).map((row) => {
      const funcionario = funcionarios.find((item) => String(item.id) === String(row.funcionarioId));
      const rule = getPontoRuleForFuncionario(
        pontoConfig,
        overrides,
        String(row.funcionarioId),
        funcionario?.tipoContrato
      );
      let diasTrabalhados = 0;
      let diasDescanso = 0;
      days.forEach((day) => {
        const expected = getExpectedMinutes(
          day,
          String(row.funcionarioId),
          calendario,
          calendarioFuncionario,
          rule
        );
        if (expected > 0) diasTrabalhados += 1;
        else diasDescanso += 1;
      });
      const baseExtra = row.overtimeMinutes + row.overtimeMinutes100;
      const dsrMinutes =
        diasTrabalhados > 0 ? Number(((baseExtra / diasTrabalhados) * diasDescanso).toFixed(2)) : 0;
      return { ...row, dsrMinutes };
    });
    return result;
  }, [filters.competencia, funcionarios, itens, pontoConfig, calendario, calendarioFuncionario, overrides]);

  const rows = useMemo(
    () =>
      filters.funcionarioId
        ? rowsAll.filter((row) => String(row.funcionarioId) === String(filters.funcionarioId))
        : rowsAll,
    [filters.funcionarioId, rowsAll]
  );

  const overall = useMemo(() => {
    if (!filters.competencia) {
      return {
        totalMinutes: 0,
        expectedMinutes: 0,
        overtimeMinutes: 0,
        missingMinutes: 0,
        nightMinutes: 0,
        inconsistencias: 0,
      };
    }
    return rows.reduce(
      (acc, row) => ({
        totalMinutes: acc.totalMinutes + row.totalMinutes,
        expectedMinutes: acc.expectedMinutes + row.expectedMinutes,
        overtimeMinutes: acc.overtimeMinutes + row.overtimeMinutes,
        overtimeMinutes100: acc.overtimeMinutes100 + row.overtimeMinutes100,
        missingMinutes: acc.missingMinutes + row.missingMinutes,
        nightMinutes: acc.nightMinutes + row.nightMinutes,
        dsrMinutes: (acc.dsrMinutes ?? 0) + (row.dsrMinutes ?? 0),
        inconsistencias: acc.inconsistencias + row.inconsistencias,
      }),
      {
        totalMinutes: 0,
        expectedMinutes: 0,
        overtimeMinutes: 0,
        overtimeMinutes100: 0,
        missingMinutes: 0,
        nightMinutes: 0,
        dsrMinutes: 0,
        inconsistencias: 0,
      }
    );
  }, [filters.competencia, rows]);

  const ensureEventos = async () => {
    const eventosRes = await listEventosFolha({ page: 1, pageSize: 200 });
    const existing = new Map(eventosRes.data.map((evt) => [evt.codigo, evt]));
    const created: EventoFolha[] = [];
    for (const def of EVENT_DEFS) {
      if (!existing.has(def.codigo)) {
        const novo = await createEventoFolha({
          codigo: def.codigo,
          descricao: def.descricao,
          tipo: def.tipo,
          incidencias: def.incidencias,
          status: "ATIVO",
        });
        existing.set(def.codigo, novo);
        created.push(novo);
      }
    }
    return { map: existing, created };
  };

  const getHourlyRate = (funcionario: Funcionario, rule: ReturnType<typeof getPontoRuleForFuncionario>) => {
    if (funcionario.salarioTipo === "HORA") return funcionario.salarioBase;
    const divisor = rule.monthlyHours || DEFAULT_PONTO_CONFIG.byContrato.CLT.monthlyHours;
    return funcionario.salarioBase / divisor;
  };

  const generateLancamentos = async () => {
    setError("");
    setInfo("");
    if (!filters.competencia) {
      setError("Selecione uma competencia.");
      return;
    }
    if (!API_BASE) {
      setError("API nao configurada.");
      return;
    }
    try {
      const { map } = await ensureEventos();
      const pageSize = 200;
      let page = 1;
      let allLancamentos: Array<{ id: string; funcionarioId: string; eventoId: string; valor: number; referencia?: string; observacao?: string }> = [];
      while (true) {
        const res = await listLancamentosFolha(filters.competencia, {
          page,
          pageSize,
        });
        allLancamentos = allLancamentos.concat(res.data);
        const total = res.meta.total ?? allLancamentos.length;
        if (allLancamentos.length >= total || res.data.length < pageSize) break;
        page += 1;
      }
      const existentesPorChave = new Map<string, Array<typeof allLancamentos[number]>>();
      allLancamentos.forEach((item) => {
        const key = `${item.funcionarioId}:${item.eventoId}`;
        const list = existentesPorChave.get(key) ?? [];
        list.push(item);
        existentesPorChave.set(key, list);
      });

      let totalCreated = 0;
      let totalUpdated = 0;
      let totalDeleted = 0;
      for (const row of rowsAll) {
        const funcionario = funcionarios.find(
          (item) => String(item.id) === String(row.funcionarioId)
        );
        if (!funcionario) continue;
        const rule = getPontoRuleForFuncionario(
          pontoConfig,
          overrides,
          String(funcionario.id),
          funcionario.tipoContrato
        );
        const hourlyRate = getHourlyRate(funcionario, rule);
        const overtimeHours = minutesToHours(row.overtimeMinutes);
        const overtime100Hours = minutesToHours(row.overtimeMinutes100);
        const missingHours = minutesToHours(row.missingMinutes);
        const nightHours = minutesToHours(row.nightMinutes);
        const dsrHours = minutesToHours((row as any).dsrMinutes ?? 0);

        const processLancamento = async (
          eventoCodigo: "HORA_EXTRA" | "HORA_EXTRA_100" | "ADICIONAL_NOTURNO" | "FALTA",
          valor: number,
          referencia: string
        ) => {
          const evento = map.get(eventoCodigo);
          if (!evento) return;
          const key = `${row.funcionarioId}:${evento.id}`;
          const existingList = existentesPorChave.get(key) ?? [];
          const existing = existingList[0];
          if (valor > 0) {
            if (!existing) {
              await createLancamentoFolha({
                competencia: filters.competencia,
                funcionarioId: row.funcionarioId,
                eventoId: evento.id,
                valor,
                referencia,
                observacao: "Gerado automaticamente pelo ponto.",
              });
              totalCreated += 1;
              return;
            }
            if (
              Math.abs(existing.valor - valor) > 0.01 ||
              existing.referencia !== referencia ||
              existing.observacao !== "Gerado automaticamente pelo ponto."
            ) {
              await updateLancamentoFolha(existing.id, {
                ...existing,
                valor,
                referencia,
                observacao: "Gerado automaticamente pelo ponto.",
              });
              totalUpdated += 1;
            }
            return;
          }
          if (existing) {
            await deleteLancamentoFolha(String(existing.id));
            totalDeleted += 1;
          }
        };

        await processLancamento(
          "HORA_EXTRA",
          Number((overtimeHours * hourlyRate * rule.overtimeRate).toFixed(2)),
          `${overtimeHours.toFixed(2)}h`
        );

        await processLancamento(
          "HORA_EXTRA_100",
          Number((overtime100Hours * hourlyRate * 2).toFixed(2)),
          `${overtime100Hours.toFixed(2)}h`
        );

        await processLancamento(
          "ADICIONAL_NOTURNO",
          Number((nightHours * hourlyRate * rule.nightRate).toFixed(2)),
          `${nightHours.toFixed(2)}h`
        );

        await processLancamento(
          "DSR_HORA_EXTRA",
          Number((dsrHours * hourlyRate).toFixed(2)),
          `${dsrHours.toFixed(2)}h`
        );

        await processLancamento(
          "FALTA",
          Number((missingHours * hourlyRate).toFixed(2)),
          `${missingHours.toFixed(2)}h`
        );
      }
      setInfo(
        totalCreated || totalUpdated || totalDeleted
          ? `Criamos ${totalCreated}, atualizamos ${totalUpdated}, removemos ${totalDeleted} lancamento(s).`
          : "Nenhuma alteracao necessaria."
      );
    } catch {
      setError("Nao foi possivel gerar lancamentos da folha.");
    }
  };

  const columns = useMemo(
    () => [
      { key: "funcionario", header: "Funcionario", render: (row: FechamentoRow) => row.funcionarioNome },
      {
        key: "total",
        header: "Horas",
        align: "right" as const,
        render: (row: FechamentoRow) => minutesToHours(row.totalMinutes).toFixed(2),
      },
      {
        key: "extra",
        header: "Extras",
        align: "right" as const,
        render: (row: FechamentoRow) => minutesToHours(row.overtimeMinutes).toFixed(2),
      },
      {
        key: "extra100",
        header: "Extras 100%",
        align: "right" as const,
        render: (row: FechamentoRow) => minutesToHours(row.overtimeMinutes100).toFixed(2),
      },
      {
        key: "faltas",
        header: "Faltas/atrasos",
        align: "right" as const,
        render: (row: FechamentoRow) => minutesToHours(row.missingMinutes).toFixed(2),
      },
      {
        key: "noturno",
        header: "Noturno",
        align: "right" as const,
        render: (row: FechamentoRow) => minutesToHours(row.nightMinutes).toFixed(2),
      },
      {
        key: "dsr",
        header: "DSR",
        align: "right" as const,
        render: (row: FechamentoRow) => minutesToHours(row.dsrMinutes ?? 0).toFixed(2),
      },
      {
        key: "banco",
        header: "Banco (saldo)",
        align: "right" as const,
        render: (row: FechamentoRow) =>
          minutesToHours(row.overtimeMinutes - row.missingMinutes).toFixed(2),
      },
      { key: "inconsistencias", header: "Inconsistencias", render: (row: FechamentoRow) => row.inconsistencias },
    ],
    []
  );

  useEffect(() => {
    setConfigDraft(pontoConfig);
  }, [pontoConfig]);

  const currentRule = configDraft.byContrato[tipoContrato];

  const updateRule = (patch: Partial<typeof currentRule>) => ({
    ...configDraft,
    byContrato: {
      ...configDraft.byContrato,
      [tipoContrato]: { ...configDraft.byContrato[tipoContrato], ...patch },
    },
  });

  const overrideFuncionario = useMemo(
    () => overrides.find((item) => String(item.funcionarioId) === String(overrideFuncionarioId)),
    [overrides, overrideFuncionarioId]
  );

  const overrideBase = useMemo(() => {
    if (!overrideFuncionarioId) return null;
    const funcionario = funcionarios.find(
      (item) => String(item.id) === String(overrideFuncionarioId)
    );
    if (!funcionario) return null;
    const rule = getPontoRuleForFuncionario(
      pontoConfig,
      [],
      String(funcionario.id),
      funcionario.tipoContrato
    );
    return rule;
  }, [funcionarios, overrideFuncionarioId, pontoConfig]);

  useEffect(() => {
    if (overrideFuncionario) {
      setOverrideDraft(overrideFuncionario);
      return;
    }
    if (overrideBase) {
      setOverrideDraft({
        funcionarioId: overrideFuncionarioId,
        dailyHours: overrideBase.dailyHours,
        toleranceMinutes: overrideBase.toleranceMinutes,
        overtimeRate: overrideBase.overtimeRate,
        nightRate: overrideBase.nightRate,
        monthlyHours: overrideBase.monthlyHours,
      });
    } else {
      setOverrideDraft({});
    }
  }, [overrideBase, overrideFuncionario, overrideFuncionarioId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Ponto - Fechamento" />
        <AppSubTitle text="Resumo mensal, banco de horas e integracao com folha." />
      </div>

      <Card>
        <AppSubTitle text="Filtros e geracao" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Escolha a competencia e gere lancamentos para a folha.
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
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={() =>
                openConfirm(
                  {
                    title: "Gerar lancamentos",
                    description:
                      "Deseja gerar lancamentos de hora extra, faltas e adicional noturno para todos os funcionarios da competencia?",
                    confirmLabel: "Gerar",
                  },
                  generateLancamentos
                )
              }
            >
              Gerar lancamentos na folha
            </AppButton>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-7">
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Horas totais</div>
            <div className="text-sm font-semibold">{minutesToHours(overall.totalMinutes).toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Extras</div>
            <div className="text-sm font-semibold">{minutesToHours(overall.overtimeMinutes).toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Extras 100%</div>
            <div className="text-sm font-semibold">{minutesToHours(overall.overtimeMinutes100).toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Faltas/atrasos</div>
            <div className="text-sm font-semibold">{minutesToHours(overall.missingMinutes).toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Noturno</div>
            <div className="text-sm font-semibold">{minutesToHours(overall.nightMinutes).toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">DSR</div>
            <div className="text-sm font-semibold">{minutesToHours(overall.dsrMinutes ?? 0).toFixed(2)}h</div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Inconsistencias</div>
            <div className="text-sm font-semibold">{overall.inconsistencias}</div>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {info ? <p className="mt-2 text-sm text-green-600">{info}</p> : null}
      </Card>

      <Card>
        <AppSubTitle text="Configuracao de jornada por tipo de contrato" />
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Tipo de contrato"
            value={tipoContrato}
            onChange={(e) => setTipoContrato(e.target.value as FuncionarioContratoTipo)}
            data={[
              { value: "CLT", label: "CLT" },
              { value: "PJ", label: "PJ" },
              { value: "ESTAGIO", label: "Estagio" },
              { value: "OUTRO", label: "Outro" },
            ]}
          />
          <AppTextInput
            title="Horas diarias"
            value={currentRule.dailyHours}
            sanitizeRegex={/[0-9.]/g}
            onValueChange={(raw) =>
              setConfigDraft(updateRule({ dailyHours: Number(raw || 0) }))
            }
          />
          <AppTextInput
            title="Tolerancia (min)"
            value={currentRule.toleranceMinutes}
            sanitizeRegex={/[0-9]/g}
            onValueChange={(raw) =>
              setConfigDraft(updateRule({ toleranceMinutes: Number(raw || 0) }))
            }
          />
          <AppTextInput
            title="Hora extra (multiplicador)"
            value={currentRule.overtimeRate}
            sanitizeRegex={/[0-9.]/g}
            onValueChange={(raw) =>
              setConfigDraft(updateRule({ overtimeRate: Number(raw || 0) }))
            }
          />
          <AppTextInput
            title="Adicional noturno (multiplicador)"
            value={currentRule.nightRate}
            sanitizeRegex={/[0-9.]/g}
            onValueChange={(raw) =>
              setConfigDraft(updateRule({ nightRate: Number(raw || 0) }))
            }
          />
          <AppTextInput
            title="Horas mensais base"
            value={currentRule.monthlyHours}
            sanitizeRegex={/[0-9.]/g}
            onValueChange={(raw) =>
              setConfigDraft(updateRule({ monthlyHours: Number(raw || 0) }))
            }
          />
          <AppSelectInput
            title="Escala"
            value={currentRule.scheduleType}
            onChange={(e) =>
              setConfigDraft(updateRule({ scheduleType: e.target.value as typeof currentRule.scheduleType }))
            }
            data={[
              { value: "SEMANAL_5X2", label: "5x2" },
              { value: "SEMANAL_6X1", label: "6x1" },
              { value: "ESCALA_12X36", label: "12x36" },
              { value: "CUSTOM", label: "Personalizada" },
            ]}
          />
          <AppDateInput
            title="Inicio escala"
            value={currentRule.scheduleStart ?? ""}
            onChange={(e) =>
              setConfigDraft(updateRule({ scheduleStart: e.target.value || undefined }))
            }
            helperText="Usado apenas para 12x36."
          />
          <AppSelectInput
            title="Banco de horas"
            value={currentRule.bankPeriod}
            onChange={(e) =>
              setConfigDraft(updateRule({ bankPeriod: e.target.value as typeof currentRule.bankPeriod }))
            }
            data={[
              { value: "MENSAL", label: "Mensal" },
              { value: "ANUAL", label: "Anual" },
            ]}
          />
          <AppTextInput
            title="Mes inicio banco"
            value={currentRule.bankStartMonth ?? 1}
            sanitizeRegex={/[0-9]/g}
            maxRawLength={2}
            onValueChange={(raw) =>
              setConfigDraft(updateRule({ bankStartMonth: Number(raw || 1) }))
            }
          />
        </div>
        {currentRule.scheduleType === "CUSTOM" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-7">
            {weekLabels.map((label, index) => (
              <AppTextInput
                key={label}
                title={label}
                value={currentRule.weekHours?.[index] ?? 0}
                sanitizeRegex={/[0-9.]/g}
                onValueChange={(raw) => {
                  const next = Array.isArray(currentRule.weekHours)
                    ? [...currentRule.weekHours]
                    : [0, 0, 0, 0, 0, 0, 0];
                  next[index] = Number(raw || 0);
                  setConfigDraft(updateRule({ weekHours: next }));
                }}
              />
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-3">
          <AppButton
            type="button"
            className="w-auto px-6"
            onClick={() => {
              saveConfig(configDraft);
              setInfo("Configuracao salva.");
            }}
          >
            Salvar configuracao
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            className="w-auto px-6"
            onClick={() => {
              setConfigDraft(DEFAULT_PONTO_CONFIG);
              saveConfig(DEFAULT_PONTO_CONFIG);
              setInfo("Configuracao restaurada para o padrao.");
            }}
          >
            Restaurar padrao
          </AppButton>
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Override por funcionario" />
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Funcionario"
            value={overrideFuncionarioId}
            onChange={(e) => setOverrideFuncionarioId(e.target.value)}
            data={funcionarioOverrideOptions}
          />
          <AppTextInput
            title="Horas diarias"
            value={overrideDraft.dailyHours ?? ""}
            sanitizeRegex={/[0-9.]/g}
            onValueChange={(raw) =>
              setOverrideDraft((prev) => ({ ...prev, dailyHours: Number(raw || 0) }))
            }
          />
          <AppTextInput
            title="Tolerancia (min)"
            value={overrideDraft.toleranceMinutes ?? ""}
            sanitizeRegex={/[0-9]/g}
            onValueChange={(raw) =>
              setOverrideDraft((prev) => ({ ...prev, toleranceMinutes: Number(raw || 0) }))
            }
          />
          <AppTextInput
            title="Hora extra (multiplicador)"
            value={overrideDraft.overtimeRate ?? ""}
            sanitizeRegex={/[0-9.]/g}
            onValueChange={(raw) =>
              setOverrideDraft((prev) => ({ ...prev, overtimeRate: Number(raw || 0) }))
            }
          />
          <AppTextInput
            title="Adicional noturno (multiplicador)"
            value={overrideDraft.nightRate ?? ""}
            sanitizeRegex={/[0-9.]/g}
            onValueChange={(raw) =>
              setOverrideDraft((prev) => ({ ...prev, nightRate: Number(raw || 0) }))
            }
          />
          <AppTextInput
            title="Horas mensais base"
            value={overrideDraft.monthlyHours ?? ""}
            sanitizeRegex={/[0-9.]/g}
            onValueChange={(raw) =>
              setOverrideDraft((prev) => ({ ...prev, monthlyHours: Number(raw || 0) }))
            }
          />
          <AppSelectInput
            title="Escala"
            value={overrideDraft.scheduleType ?? ""}
            onChange={(e) =>
              setOverrideDraft((prev) => ({ ...prev, scheduleType: e.target.value as any }))
            }
            data={[
              { value: "", label: "Herdar" },
              { value: "SEMANAL_5X2", label: "5x2" },
              { value: "SEMANAL_6X1", label: "6x1" },
              { value: "ESCALA_12X36", label: "12x36" },
              { value: "CUSTOM", label: "Personalizada" },
            ]}
          />
          <AppDateInput
            title="Inicio escala"
            value={overrideDraft.scheduleStart ?? ""}
            onChange={(e) =>
              setOverrideDraft((prev) => ({ ...prev, scheduleStart: e.target.value || undefined }))
            }
            helperText="Opcional."
          />
          <AppSelectInput
            title="Banco de horas"
            value={overrideDraft.bankPeriod ?? ""}
            onChange={(e) =>
              setOverrideDraft((prev) => ({ ...prev, bankPeriod: e.target.value as any }))
            }
            data={[
              { value: "", label: "Herdar" },
              { value: "MENSAL", label: "Mensal" },
              { value: "ANUAL", label: "Anual" },
            ]}
          />
          <AppTextInput
            title="Mes inicio banco"
            value={overrideDraft.bankStartMonth ?? ""}
            sanitizeRegex={/[0-9]/g}
            maxRawLength={2}
            onValueChange={(raw) =>
              setOverrideDraft((prev) => ({ ...prev, bankStartMonth: Number(raw || 0) }))
            }
          />
        </div>
        {overrideDraft.scheduleType === "CUSTOM" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-7">
            {weekLabels.map((label, index) => (
              <AppTextInput
                key={label}
                title={label}
                value={overrideDraft.weekHours?.[index] ?? ""}
                sanitizeRegex={/[0-9.]/g}
                onValueChange={(raw) => {
                  const next = Array.isArray(overrideDraft.weekHours)
                    ? [...overrideDraft.weekHours]
                    : [0, 0, 0, 0, 0, 0, 0];
                  next[index] = Number(raw || 0);
                  setOverrideDraft((prev) => ({ ...prev, weekHours: next }));
                }}
              />
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-3">
          <AppButton
            type="button"
            className="w-auto px-6"
            onClick={() => {
              if (!overrideFuncionarioId) {
                setError("Selecione um funcionario para salvar override.");
                return;
              }
              const base = overrideBase ?? pontoConfig.byContrato.CLT;
              const merged = mergePontoRule(base, overrideDraft);
              saveOverride({
                ...merged,
                funcionarioId: overrideFuncionarioId,
                id: overrideFuncionario?.id,
              });
              setInfo("Override salvo.");
            }}
          >
            Salvar override
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            className="w-auto px-6"
            onClick={() => {
              if (!overrideFuncionarioId) return;
              removeOverride(overrideFuncionarioId);
              setOverrideDraft({});
              setInfo("Override removido.");
            }}
          >
            Remover override
          </AppButton>
        </div>
      </Card>

      <Card>
        <AppTable
          data={rows}
          rowKey={(row) => row.funcionarioId}
          emptyState={<AppListNotFound texto="Selecione uma competencia para ver o fechamento." />}
          columns={columns}
        />
      </Card>
      <AppPopup {...popupProps} />
    </div>
  );
};

export default FechamentoPontoPage;
