import React, { useEffect, useMemo, useRef, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import { apiFetch } from "../../../shared/services/apiClient";
import {
  createLancamentoFolha,
  deleteLancamentoFolha,
  listCompetencias,
  listEventosFolha,
  listLancamentosFolha,
  createEventoFolha,
} from "../services/folha.service";
import { listFuncionarios } from "../services/rh.service";
import type { EventoFolha, Funcionario, LancamentoFolha } from "../types/rh.types";
import { TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
const INSS_EVENT_CODE = "INSS";

const calcInss = (base: number) => {
  const brackets = [
    { limit: 1412.0, rate: 0.075 },
    { limit: 2666.68, rate: 0.09 },
    { limit: 4000.03, rate: 0.12 },
    { limit: 7786.02, rate: 0.14 },
  ];
  let remaining = base;
  let total = 0;
  let prevLimit = 0;
  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const slice = Math.min(bracket.limit - prevLimit, remaining);
    total += slice * bracket.rate;
    remaining -= slice;
    prevLimit = bracket.limit;
  }
  return Number(total.toFixed(2));
};

const LancamentosFolhaPage = () => {
  const [competencias, setCompetencias] = useState<Array<{ value: string; label: string }>>([]);
  const [eventos, setEventos] = useState<EventoFolha[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [itens, setItens] = useState<LancamentoFolha[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const { popupProps, openConfirm } = useConfirmPopup();
  const [competencia, setCompetencia] = useState("");
  const [filters, setFilters] = useState({
    funcionarioId: "",
  });
  const [formData, setFormData] = useState({
    funcionarioId: "",
    eventoId: "",
    valor: "",
    referencia: "",
    observacao: "",
  });
  const [cloneCompetencia, setCloneCompetencia] = useState("");
  const [cloneError, setCloneError] = useState("");
  const [cloneMessage, setCloneMessage] = useState("");
  const inssKeyRef = useRef<string>("");
  const inssInFlightRef = useRef(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const loadLookups = async () => {
    try {
      const [competenciasRes, eventosRes, funcionariosRes] = await Promise.all([
        listCompetencias({ page: 1, pageSize: 50 }),
        listEventosFolha({ page: 1, pageSize: 200 }),
        listFuncionarios({ page: 1, pageSize: 200 }),
      ]);
      const inssExists = eventosRes.data.some((evt) => evt.codigo === INSS_EVENT_CODE);
      if (!inssExists && API_BASE) {
        try {
          const created = await createEventoFolha({
            codigo: INSS_EVENT_CODE,
            descricao: "INSS",
            tipo: "DESCONTO",
            incidencias: { inss: false, fgts: false, irrf: false },
            status: "ATIVO",
          });
          eventosRes.data.push(created);
        } catch {
          // ignore creation errors; allow manual creation later
        }
      }
      setCompetencias(
        competenciasRes.data.map((item) => ({
          value: item.competencia,
          label: `${item.competencia} (${item.status})`,
        }))
      );
      setEventos(eventosRes.data);
      setFuncionarios(funcionariosRes.data);
    } catch {
      setCompetencias([]);
      setEventos([]);
      setFuncionarios([]);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  const load = async () => {
    if (!competencia) return;
    try {
      setError("");
      const response = await listLancamentosFolha(competencia, {
        page,
        pageSize,
        q: filters.funcionarioId,
      });
      setItens(
        filters.funcionarioId
          ? response.data.filter(
              (item) => String(item.funcionarioId) === String(filters.funcionarioId)
            )
          : response.data
      );
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar os lancamentos.");
    }
  };

  useEffect(() => {
    load();
  }, [competencia, page, filters]);

  const funcionarioOptions = useMemo(
    () =>
      funcionarios.map((func) => ({
        value: func.id,
        label: func.nome,
      })),
    [funcionarios]
  );

  const eventoOptions = useMemo(
    () =>
      eventos.map((evento) => ({
        value: evento.id,
        label: `${evento.codigo} - ${evento.descricao}`,
      })),
    [eventos]
  );

  const eventoLookup = useMemo(() => {
    const map = new Map<string, EventoFolha>();
    eventos.forEach((evt) => map.set(String(evt.id), evt));
    return map;
  }, [eventos]);

  const funcionarioLookup = useMemo(() => {
    const map = new Map<string, Funcionario>();
    funcionarios.forEach((func) => map.set(String(func.id), func));
    return map;
  }, [funcionarios]);

  const cloneCompetenciaOptions = useMemo(
    () => competencias.filter((item) => item.value !== competencia),
    [competencias, competencia]
  );

  useEffect(() => {
    if (!competencia || !filters.funcionarioId) return;
    if (!API_BASE) return;
    const currentKey = `${competencia}:${filters.funcionarioId}`;
    if (inssKeyRef.current === currentKey || inssInFlightRef.current) return;
    const funcionario = funcionarioLookup.get(String(filters.funcionarioId));
    if (!funcionario) return;
    const inssEvento = eventos.find((evt) => evt.codigo === INSS_EVENT_CODE);
    if (!inssEvento) return;
    const funcionarioLancamentos = itens.filter(
      (item) => String(item.funcionarioId) === String(filters.funcionarioId)
    );
    const existingInssLocal = funcionarioLancamentos.some(
      (item) => String(item.eventoId) === String(inssEvento.id)
    );
    if (existingInssLocal) {
      inssKeyRef.current = currentKey;
      return;
    }
    const checkExisting = async () => {
      const params = new URLSearchParams();
      params.set("competencia", competencia);
      params.set("funcionarioId", String(filters.funcionarioId));
      params.set("eventoId", String(inssEvento.id));
      params.set("_page", "1");
      params.set("_limit", "1");
      const res = await apiFetch(`/rh/folha/lancamentos?${params.toString()}`);
      if (res.ok) {
        const payload = (await res.json()) as
          | Array<LancamentoFolha>
          | { data?: Array<LancamentoFolha> };
        const list = Array.isArray(payload) ? payload : payload.data ?? [];
        if (list.length > 0) {
          inssKeyRef.current = currentKey;
          return true;
        }
      }
      return false;
    };
    const base = funcionario.salarioBase + funcionarioLancamentos.reduce((acc, item) => {
      const evento = eventoLookup.get(String(item.eventoId));
      if (evento?.tipo === "PROVENTO" && evento.incidencias?.inss) {
        return acc + item.valor;
      }
      return acc;
    }, 0);
    const percentual = funcionario.inssPercentual ?? 0;
    const valorInss =
      percentual > 0 ? Number((base * (percentual / 100)).toFixed(2)) : calcInss(base);
    if (valorInss <= 0) return;
    inssInFlightRef.current = true;
    checkExisting()
      .then((exists) => {
        if (exists) return;
        inssKeyRef.current = currentKey;
        return createLancamentoFolha({
          competencia,
          funcionarioId: funcionario.id,
          eventoId: inssEvento.id,
          valor: valorInss,
          referencia: "Automatico",
          observacao: "Calculado automaticamente (INSS).",
        }).then(() => load());
      })
      .catch(() => {
        setError("Nao foi possivel gerar o INSS automatico.");
      })
      .finally(() => {
        inssInFlightRef.current = false;
      });
  }, [competencia, filters.funcionarioId, itens, eventos, funcionarioLookup, eventoLookup]);

  const columns = useMemo(
    () => [
      {
        key: "funcionario",
        header: "Funcionario",
        render: (row: LancamentoFolha) =>
          funcionarioLookup.get(String(row.funcionarioId))?.nome ??
          row.funcionarioId,
      },
      {
        key: "evento",
        header: "Evento",
        render: (row: LancamentoFolha) =>
          eventoLookup.get(String(row.eventoId))?.descricao ?? row.eventoId,
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: LancamentoFolha) => `R$ ${row.valor.toFixed(2)}`,
      },
      {
        key: "referencia",
        header: "Referencia",
        render: (row: LancamentoFolha) => row.referencia ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: LancamentoFolha) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label="Excluir lancamento"
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir lancamento",
                    description: "Deseja excluir este lancamento?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    try {
                      await deleteLancamentoFolha(row.id);
                      setItens((prev) => prev.filter((item) => item.id !== row.id));
                      setTotal((prev) => (prev > 0 ? prev - 1 : 0));
                      load();
                    } catch {
                      setError("Nao foi possivel excluir o lancamento.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [eventoLookup, funcionarioLookup, openConfirm]
  );

  const handleSubmit = async () => {
    setFormError("");
    if (!competencia || !formData.funcionarioId || !formData.eventoId || !formData.valor) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      await createLancamentoFolha({
        competencia,
        funcionarioId: formData.funcionarioId,
        eventoId: formData.eventoId,
        valor: Number(formData.valor),
        referencia: formData.referencia || undefined,
        observacao: formData.observacao || undefined,
      });
      setFormData({
        funcionarioId: "",
        eventoId: "",
        valor: "",
        referencia: "",
        observacao: "",
      });
      load();
    } catch {
      setFormError("Nao foi possivel salvar o lancamento.");
    }
  };

  const buildLancamentoKey = (item: LancamentoFolha) =>
    `${item.eventoId}::${item.valor}::${item.referencia ?? ""}::${item.observacao ?? ""}`;

  const handleCloneEventos = async () => {
    setCloneError("");
    setCloneMessage("");
    if (!competencia || !filters.funcionarioId) {
      setCloneError("Selecione competencia e funcionario para duplicar.");
      return;
    }
    if (!cloneCompetencia) {
      setCloneError("Selecione a competencia de destino.");
      return;
    }
    if (cloneCompetencia === competencia) {
      setCloneError("A competencia de destino deve ser diferente da atual.");
      return;
    }
    if (!API_BASE) {
      setCloneError("API nao configurada.");
      return;
    }
    try {
      const [origemRes, destinoRes] = await Promise.all([
        listLancamentosFolha(competencia, { page: 1, pageSize: 500 }),
        listLancamentosFolha(cloneCompetencia, { page: 1, pageSize: 500 }),
      ]);
      const origem = origemRes.data.filter(
        (item) => String(item.funcionarioId) === String(filters.funcionarioId)
      );
      if (origem.length === 0) {
        setCloneMessage("Nao ha eventos para duplicar nesta competencia.");
        return;
      }
      const destino = destinoRes.data.filter(
        (item) => String(item.funcionarioId) === String(filters.funcionarioId)
      );
      const existentes = new Set(destino.map(buildLancamentoKey));
      const toCreate = origem.filter((item) => !existentes.has(buildLancamentoKey(item)));
      if (toCreate.length === 0) {
        setCloneMessage("Nenhum novo evento para duplicar.");
        return;
      }
      for (const item of toCreate) {
        await createLancamentoFolha({
          competencia: cloneCompetencia,
          funcionarioId: item.funcionarioId,
          eventoId: item.eventoId,
          valor: item.valor,
          referencia: item.referencia,
          observacao: item.observacao,
        });
      }
      setCloneMessage(`Duplicamos ${toCreate.length} evento(s) para ${cloneCompetencia}.`);
    } catch {
      setCloneError("Nao foi possivel duplicar os eventos.");
    }
  };

  const resumoFuncionario = useMemo(() => {
    if (!filters.funcionarioId) return null;
    const funcionario = funcionarioLookup.get(filters.funcionarioId);
    if (!funcionario) return null;
    const lancamentos = itens.filter(
      (item) => String(item.funcionarioId) === String(filters.funcionarioId)
    );
    const detalhes = lancamentos.map((item) => {
      const evento = eventoLookup.get(String(item.eventoId));
      return {
        id: item.id,
        descricao: evento?.descricao ?? item.eventoId,
        tipo: evento?.tipo ?? "PROVENTO",
        valor: item.valor,
        referencia: item.referencia ?? "-",
      };
    });
    const proventosList = detalhes.filter((item) => item.tipo === "PROVENTO");
    const descontosList = detalhes.filter((item) => item.tipo === "DESCONTO");
    const totals = detalhes.reduce(
      (acc, item) => {
        if (item.tipo === "DESCONTO") acc.descontos += item.valor;
        else acc.proventos += item.valor;
        return acc;
      },
      { proventos: 0, descontos: 0 }
    );
    const totalLiquido = funcionario.salarioBase + totals.proventos - totals.descontos;
    return {
      funcionario,
      proventosList,
      descontosList,
      totalProventos: totals.proventos,
      totalDescontos: totals.descontos,
      totalLiquido,
    };
  }, [eventoLookup, funcionarioLookup, filters.funcionarioId, itens]);

  const printHolerite = () => {
    if (!resumoFuncionario || !competencia) return;
    const funcionario = resumoFuncionario.funcionario;
    const base = funcionario.salarioBase + itens
      .filter((item) => String(item.funcionarioId) === String(funcionario.id))
      .reduce((acc, item) => {
        const evento = eventoLookup.get(String(item.eventoId));
        if (evento?.tipo === "PROVENTO" && evento.incidencias?.inss) {
          return acc + item.valor;
        }
        return acc;
      }, 0);
    const percentual = funcionario.inssPercentual ?? 0;

    const proventosRows = resumoFuncionario.proventosList
      .map(
        (item) => `
          <tr>
            <td>${item.descricao}</td>
            <td>${item.referencia || "-"}</td>
            <td style="text-align:right;">R$ ${item.valor.toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    const descontosRows = resumoFuncionario.descontosList
      .map(
        (item) => `
          <tr>
            <td>${item.descricao}</td>
            <td>${item.referencia || "-"}</td>
            <td style="text-align:right;">R$ ${item.valor.toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Holerite - ${funcionario.nome}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin: 0 0 8px; }
            h2 { font-size: 14px; margin: 0 0 16px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { text-align: left; color: #444; }
            .section-title { margin-top: 20px; font-size: 13px; color: #333; font-weight: 600; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
            .card { border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
            .label { font-size: 11px; color: #666; }
            .value { font-size: 13px; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>Holerite</h1>
          <h2>${funcionario.nome} - Competencia ${competencia}</h2>
          <div class="grid">
            <div class="card">
              <div class="label">Salario base</div>
              <div class="value">R$ ${funcionario.salarioBase.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="label">Proventos</div>
              <div class="value">R$ ${resumoFuncionario.totalProventos.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="label">Descontos</div>
              <div class="value">R$ ${resumoFuncionario.totalDescontos.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="label">Total liquido</div>
              <div class="value">R$ ${resumoFuncionario.totalLiquido.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="label">INSS aplicado</div>
              <div class="value">${
                percentual > 0 ? `${percentual.toFixed(2)}%` : "Tabela padrao"
              }</div>
            </div>
            <div class="card">
              <div class="label">Base INSS</div>
              <div class="value">R$ ${base.toFixed(2)}</div>
            </div>
          </div>
          <div class="section-title">Proventos</div>
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Referencia</th>
                <th style="text-align:right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${proventosRows || "<tr><td colspan='3'>Sem proventos adicionais.</td></tr>"}
            </tbody>
          </table>
          <div class="section-title">Descontos</div>
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Referencia</th>
                <th style="text-align:right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${descontosRows || "<tr><td colspan='3'>Sem descontos.</td></tr>"}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const exportCsv = () => {
    const lines = ["Departamento,Total"];
    const map = new Map<string, number>();
    itens.forEach((item) => {
    const funcionario = funcionarioLookup.get(String(item.funcionarioId));
      const departamento = funcionario?.departamentoId ?? "Sem departamento";
      const evento = eventoLookup.get(String(item.eventoId));
      const signed = evento?.tipo === "DESCONTO" ? -item.valor : item.valor;
      map.set(departamento, (map.get(departamento) ?? 0) + signed);
    });
    map.forEach((totalDepartamento, departamento) => {
      lines.push(`${departamento},${totalDepartamento.toFixed(2)}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `folha-${competencia || "competencia"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Lancamentos da folha" />
        <AppSubTitle text="Eventos por competencia e funcionario." />
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Competencia"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            data={competencias}
            placeholder="Selecione"
          />
          <AppSelectInput
            title="Funcionario"
            value={filters.funcionarioId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, funcionarioId: e.target.value }))
            }
            data={[{ value: "", label: "Todos" }, ...funcionarioOptions]}
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto px-6" onClick={exportCsv}>
              Exportar CSV
            </AppButton>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <AppSelectInput
            title="Funcionario"
            value={formData.funcionarioId}
            onChange={(e) => setFormData((prev) => ({ ...prev, funcionarioId: e.target.value }))}
            data={funcionarioOptions}
            placeholder="Selecione"
          />
          <AppSelectInput
            title="Evento"
            value={formData.eventoId}
            onChange={(e) => setFormData((prev) => ({ ...prev, eventoId: e.target.value }))}
            data={eventoOptions}
            placeholder="Selecione"
          />
          <AppTextInput
            title="Valor (R$)"
            value={formData.valor}
            sanitizeRegex={/[0-9]/g}
            onValueChange={(raw) => setFormData((prev) => ({ ...prev, valor: raw }))}
          />
          <AppTextInput
            title="Referencia"
            value={formData.referencia}
            onChange={(e) => setFormData((prev) => ({ ...prev, referencia: e.target.value }))}
          />
          <div className="md:col-span-4">
            <AppTextInput
              title="Observacao"
              value={formData.observacao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, observacao: e.target.value }))
              }
            />
          </div>
        </div>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSubmit}>
            Lancar evento
          </AppButton>
          <AppButton
            type="button"
            className="ml-2 w-auto px-6"
            onClick={() => {
              if (!competencia || !filters.funcionarioId) {
                setError("Selecione competencia e funcionario para limpar duplicados.");
                return;
              }
              const toDelete = itens.filter(
                (item) =>
                  String(item.funcionarioId) === String(filters.funcionarioId) &&
                  String(item.eventoId) === "3"
              );
              if (toDelete.length <= 1) {
                setError("Nao ha duplicados de INSS para remover.");
                return;
              }
              openConfirm(
                {
                  title: "Limpar duplicados de INSS",
                  description: `Encontramos ${toDelete.length} lancamentos de INSS. Deseja manter apenas o primeiro?`,
                  confirmLabel: "Limpar",
                  tone: "danger",
                },
                async () => {
                  if (!API_BASE) {
                    setError("API nao configurada.");
                    return;
                  }
                  const [, ...duplicates] = toDelete;
                  for (const item of duplicates) {
                    await deleteLancamentoFolha(item.id);
                  }
                  load();
                }
              );
            }}
          >
            Limpar INSS duplicado
          </AppButton>
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Duplicar eventos para outra competencia" />
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Competencia destino"
            value={cloneCompetencia}
            onChange={(e) => setCloneCompetencia(e.target.value)}
            data={cloneCompetenciaOptions}
            placeholder="Selecione"
          />
          <div className="flex items-end">
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={() =>
                openConfirm(
                  {
                    title: "Duplicar eventos",
                    description:
                      "Deseja duplicar os eventos deste funcionario para a competencia selecionada?",
                    confirmLabel: "Duplicar",
                  },
                  handleCloneEventos
                )
              }
            >
              Duplicar eventos
            </AppButton>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Usa a competencia e o funcionario selecionados nos filtros acima.
        </div>
        {cloneError ? <p className="text-sm text-red-600">{cloneError}</p> : null}
        {cloneMessage ? <p className="text-sm text-green-600">{cloneMessage}</p> : null}
      </Card>

      {resumoFuncionario ? (
        <Card>
          <AppSubTitle text={`Holerite - ${resumoFuncionario.funcionario.nome}`} />
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-xs text-gray-400">Salario base</div>
              <div className="text-sm">R$ {resumoFuncionario.funcionario.salarioBase.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Proventos</div>
              <div className="text-sm">R$ {resumoFuncionario.totalProventos.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Descontos</div>
              <div className="text-sm">R$ {resumoFuncionario.totalDescontos.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Total liquido</div>
              <div className="text-sm">
                R$ {resumoFuncionario.totalLiquido.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase text-gray-500">Proventos</div>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="py-1">Evento</th>
                    <th className="py-1">Referencia</th>
                    <th className="py-1 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoFuncionario.proventosList.length === 0 ? (
                    <tr>
                      <td className="py-2 text-xs text-gray-500" colSpan={3}>
                        Sem proventos adicionais.
                      </td>
                    </tr>
                  ) : (
                    resumoFuncionario.proventosList.map((item) => (
                      <tr key={item.id} className="border-t text-sm">
                        <td className="py-2">{item.descricao}</td>
                        <td className="py-2">{item.referencia}</td>
                        <td className="py-2 text-right">R$ {item.valor.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Descontos</div>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="py-1">Evento</th>
                    <th className="py-1">Referencia</th>
                    <th className="py-1 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoFuncionario.descontosList.length === 0 ? (
                    <tr>
                      <td className="py-2 text-xs text-gray-500" colSpan={3}>
                        Sem descontos.
                      </td>
                    </tr>
                  ) : (
                    resumoFuncionario.descontosList.map((item) => (
                      <tr key={item.id} className="border-t text-sm">
                        <td className="py-2">{item.descricao}</td>
                        <td className="py-2">{item.referencia}</td>
                        <td className="py-2 text-right">R$ {item.valor.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Holerite simplificado. Calculos legais (INSS/IRRF) serao adicionados no backend.
          </div>
          <div className="mt-4">
            <AppButton type="button" className="w-auto px-6" onClick={printHolerite}>
              Gerar holerite
            </AppButton>
          </div>
        </Card>
      ) : null}

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum lancamento encontrado." />}
          pagination={{
            enabled: true,
            pageSize,
            page,
            total,
            onPageChange: setPage,
          }}
          columns={columns}
        />
      </Card>
      <AppPopup {...popupProps} />
    </div>
  );
};

export default LancamentosFolhaPage;
