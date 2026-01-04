import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import {
  listFolha,
  createFolha,
  updateFolha,
  updateFolhaStatus,
  deleteFolha,
  type FolhaResumo,
} from "../services/folha.service";
import {
  listColaboradores,
  type ColaboradorResumo,
} from "../services/colaboradores.service";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import { formatBRL, formatLocalDate, formatPercentBR } from "../../../shared/utils/formater";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
const SIM_STORAGE_KEY = "sim_folha";
const DEPENDENTE_DEDUCAO_CENTS = 18959;

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "FECHADA", label: "Fechada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const rescisaoOptions = [
  { value: "SEM_RESCISAO", label: "Sem rescisao" },
  { value: "SEM_JUSTA_CAUSA", label: "Sem justa causa" },
  { value: "COM_JUSTA_CAUSA", label: "Com justa causa" },
  { value: "PEDIDO_DEMISSAO", label: "Pedido de demissao" },
  { value: "TERMINO_CONTRATO", label: "Termino de contrato" },
];

const formatMoney = (value: number) =>
  (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length };
};

const FolhaPagamentoPage = () => {
  const [itens, setItens] = useState<FolhaResumo[]>([]);
  const [simuladas, setSimuladas] = useState<FolhaResumo[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorResumo[]>([]);
  const [error, setError] = useState("");
  const [colaboradoresError, setColaboradoresError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const { popupProps, openConfirm } = useConfirmPopup();
  const [formData, setFormData] = useState({
    referencia: "",
    colaboradores: 0,
    colaboradorId: "",
    salarioBaseCents: 0,
    horasExtrasCents: 0,
    outrosProventosCents: 0,
    descontosCents: 0,
    dependentes: 0,
    inssPercentBps: 750,
    irrfPercentBps: 750,
    fgtsPercentBps: 800,
    rescisaoTipo: "SEM_RESCISAO",
    verbasRescisoriasCents: 0,
    status: "ABERTA",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    if (!API_BASE) {
      const paged = paginate(simuladas, page, pageSize);
      setItens(paged.data);
      setTotal(paged.total);
      return;
    }
    try {
      setError("");
      const response = await listFolha({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar a folha.");
    }
  };

  useEffect(() => {
    load();
  }, [page, simuladas]);

  useEffect(() => {
    let isMounted = true;
    const loadColaboradores = async () => {
      try {
        setColaboradoresError("");
        const response = await listColaboradores({ page: 1, pageSize: 200 });
        if (!isMounted) return;
        setColaboradores(response.data);
      } catch {
        if (!isMounted) return;
        setColaboradores([]);
        setColaboradoresError("Nao foi possivel carregar os colaboradores.");
      }
    };
    loadColaboradores();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (API_BASE) return;
    const raw = window.localStorage.getItem(SIM_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as FolhaResumo[];
      setSimuladas(parsed);
    } catch {
      window.localStorage.removeItem(SIM_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (API_BASE) return;
    window.localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(simuladas));
  }, [simuladas]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      referencia: "",
      colaboradores: 0,
      colaboradorId: "",
      salarioBaseCents: 0,
      horasExtrasCents: 0,
      outrosProventosCents: 0,
      descontosCents: 0,
      dependentes: 0,
      inssPercentBps: 750,
      irrfPercentBps: 750,
      fgtsPercentBps: 800,
      rescisaoTipo: "SEM_RESCISAO",
      verbasRescisoriasCents: 0,
      status: "ABERTA",
    });
  };

  const calculo = useMemo(() => {
    const baseProventos =
      formData.salarioBaseCents +
      formData.horasExtrasCents +
      formData.outrosProventosCents +
      formData.verbasRescisoriasCents;
    const inss = Math.round((baseProventos * formData.inssPercentBps) / 10000);
    const fgts = Math.round((baseProventos * formData.fgtsPercentBps) / 10000);
    const multaFgts =
      formData.rescisaoTipo === "SEM_JUSTA_CAUSA" ? Math.round(fgts * 0.4) : 0;
    const totalProventos = baseProventos + multaFgts;
    const baseIrrf = Math.max(
      0,
      totalProventos - inss - formData.dependentes * DEPENDENTE_DEDUCAO_CENTS
    );
    const irrf = Math.round((baseIrrf * formData.irrfPercentBps) / 10000);
    const totalDescontos = inss + irrf + formData.descontosCents;
    const totalLiquido = totalProventos - totalDescontos;
    return {
      baseProventos,
      inss,
      fgts,
      multaFgts,
      irrf,
      totalProventos,
      totalDescontos,
      totalLiquido,
    };
  }, [formData]);

  const handleStatusDraftChange = (rowId: string, status: string) => {
    setStatusDrafts((prev) => ({ ...prev, [rowId]: status }));
  };

  const handleStatusUpdate = async (row: FolhaResumo) => {
    const nextStatus = statusDrafts[row.id] ?? row.status ?? "ABERTA";
    if (row.status === nextStatus) return;
    if (!API_BASE) {
      setSimuladas((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, status: nextStatus } : item
        )
      );
      setStatusDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }
    try {
      setError("");
      await updateFolhaStatus(row.id, nextStatus);
      setStatusDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      load();
    } catch {
      setError("Nao foi possivel atualizar o status.");
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "referencia",
        header: "Referencia",
        render: (row: FolhaResumo) => formatLocalDate(row.referencia),
      },
      {
        key: "colaboradores",
        header: "Colaborador",
        align: "right" as const,
        render: (row: FolhaResumo) =>
          row.colaborador?.nome ?? (row.colaboradores ? row.colaboradores : "-"),
      },
      {
        key: "proventos",
        header: "Proventos",
        align: "right" as const,
        render: (row: FolhaResumo) =>
          row.totalProventos
            ? (row.totalProventos / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "-",
      },
      {
        key: "descontos",
        header: "Descontos",
        align: "right" as const,
        render: (row: FolhaResumo) =>
          row.totalDescontos
            ? (row.totalDescontos / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "-",
      },
      {
        key: "liquido",
        header: "Liquido",
        align: "right" as const,
        render: (row: FolhaResumo) =>
          row.totalLiquido
            ? (row.totalLiquido / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "-",
      },
      {
        key: "status",
        header: "Status",
        render: (row: FolhaResumo) => {
          const draftValue = statusDrafts[row.id];
          const value = draftValue ?? row.status ?? "ABERTA";
          const hasChanges = (row.status ?? "ABERTA") !== value;
          return (
            <div className="flex items-center justify-end gap-2">
              <div className="min-w-[160px]">
                <AppSelectInput
                  value={value}
                  onChange={(e) => handleStatusDraftChange(row.id, e.target.value)}
                  data={statusOptions}
                  className="h-9"
                />
              </div>
              {hasChanges ? (
                <>
                  <AppButton
                    type="button"
                    className="w-auto px-4"
                    onClick={() => handleStatusUpdate(row)}
                  >
                    Atualizar
                  </AppButton>
                  <AppButton
                    type="button"
                    className="w-auto px-4"
                    onClick={() =>
                      setStatusDrafts((prev) => {
                        const next = { ...prev };
                        delete next[row.id];
                        return next;
                      })
                    }
                  >
                    Cancelar
                  </AppButton>
                </>
              ) : null}
            </div>
          );
        },
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: FolhaResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar folha ${row.id}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  referencia: row.referencia,
                  colaboradores: row.colaboradores,
                  colaboradorId: row.colaboradorId ?? "",
                  salarioBaseCents: row.salarioBase ?? 0,
                  horasExtrasCents: row.horasExtras ?? 0,
                  outrosProventosCents: row.outrosProventos ?? 0,
                  descontosCents: row.descontos ?? 0,
                  dependentes: row.dependentes ?? 0,
                  inssPercentBps: row.inssPercentBps ?? 750,
                  irrfPercentBps: row.irrfPercentBps ?? 750,
                  fgtsPercentBps: row.fgtsPercentBps ?? 800,
                  rescisaoTipo: row.rescisaoTipo ?? "SEM_RESCISAO",
                  verbasRescisoriasCents: row.verbasRescisorias ?? 0,
                  status: row.status ?? "ABERTA",
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir folha ${row.id}`}
              variant="danger"
              onClick={async () => {
                if (!API_BASE) {
                  setSimuladas((prev) => prev.filter((item) => item.id !== row.id));
                  return;
                }
                openConfirm(
                  {
                    title: "Excluir folha",
                    description: "Deseja excluir esta folha?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    try {
                      setError("");
                      await deleteFolha(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir a folha.");
                    }
                  }
                );
              }}
            />
          </div>
        ),
      },
    ],
    [statusDrafts]
  );

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.referencia || !formData.colaboradorId) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (formData.salarioBaseCents <= 0) {
      setFormError("Informe o salario base.");
      return;
    }
    const colaboradorSelecionado =
      colaboradores.find((item) => item.id === formData.colaboradorId) ?? null;
    if (!API_BASE) {
      const id = editingId ?? `sim-${Date.now()}`;
      const next: FolhaResumo = {
        id,
        referencia: formData.referencia,
        colaboradores: formData.colaboradores || 1,
        colaboradorId: formData.colaboradorId,
        colaborador: colaboradorSelecionado
          ? { id: colaboradorSelecionado.id, nome: colaboradorSelecionado.nome }
          : undefined,
        salarioBase: formData.salarioBaseCents,
        horasExtras: formData.horasExtrasCents,
        outrosProventos: formData.outrosProventosCents,
        descontos: formData.descontosCents,
        dependentes: formData.dependentes,
        inssPercentBps: formData.inssPercentBps,
        irrfPercentBps: formData.irrfPercentBps,
        fgtsPercentBps: formData.fgtsPercentBps,
        verbasRescisorias: formData.verbasRescisoriasCents,
        status: formData.status,
        totalProventos: calculo.totalProventos,
        totalDescontos: calculo.totalDescontos,
        totalLiquido: calculo.totalLiquido,
        inss: calculo.inss,
        fgts: calculo.fgts,
        irrf: calculo.irrf,
        rescisaoTipo:
          formData.rescisaoTipo !== "SEM_RESCISAO" ? formData.rescisaoTipo : undefined,
      };
      setSimuladas((prev) =>
        editingId ? prev.map((item) => (item.id === id ? next : item)) : [next, ...prev]
      );
      resetForm();
      setFormOpen(false);
      return;
    }
    try {
      if (editingId) {
        await updateFolha(editingId, {
          referencia: formData.referencia,
          colaboradores: formData.colaboradores || 1,
          colaboradorId: formData.colaboradorId,
          salarioBase: formData.salarioBaseCents,
          horasExtras: formData.horasExtrasCents,
          outrosProventos: formData.outrosProventosCents,
          descontos: formData.descontosCents,
          dependentes: formData.dependentes,
          inssPercentBps: formData.inssPercentBps,
          irrfPercentBps: formData.irrfPercentBps,
          fgtsPercentBps: formData.fgtsPercentBps,
          verbasRescisorias: formData.verbasRescisoriasCents,
          status: formData.status,
          totalProventos: calculo.totalProventos,
          totalDescontos: calculo.totalDescontos,
          totalLiquido: calculo.totalLiquido,
          inss: calculo.inss,
          fgts: calculo.fgts,
          irrf: calculo.irrf,
          rescisaoTipo:
            formData.rescisaoTipo !== "SEM_RESCISAO" ? formData.rescisaoTipo : undefined,
        });
      } else {
        await createFolha({
          referencia: formData.referencia,
          colaboradores: formData.colaboradores || 1,
          colaboradorId: formData.colaboradorId,
          salarioBase: formData.salarioBaseCents,
          horasExtras: formData.horasExtrasCents,
          outrosProventos: formData.outrosProventosCents,
          descontos: formData.descontosCents,
          dependentes: formData.dependentes,
          inssPercentBps: formData.inssPercentBps,
          irrfPercentBps: formData.irrfPercentBps,
          fgtsPercentBps: formData.fgtsPercentBps,
          verbasRescisorias: formData.verbasRescisoriasCents,
          status: formData.status,
          totalProventos: calculo.totalProventos,
          totalDescontos: calculo.totalDescontos,
          totalLiquido: calculo.totalLiquido,
          inss: calculo.inss,
          fgts: calculo.fgts,
          irrf: calculo.irrf,
          rescisaoTipo:
            formData.rescisaoTipo !== "SEM_RESCISAO" ? formData.rescisaoTipo : undefined,
        });
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar a folha.");
    }
  };

  const handleStatusChange = async (row: FolhaResumo, status: string) => {
    if (row.status === status) return;
    if (!API_BASE) {
      setSimuladas((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, status } : item))
      );
      return;
    }
    try {
      setError("");
      await updateFolha(row.id, { status });
      load();
    } catch {
      setError("Nao foi possivel atualizar o status.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Folha de pagamento" />
          <AppSubTitle text="Rotinas e fechamento da folha." />
        </div>
        <AppButton
          type="button"
          className="w-auto px-6"
          onClick={() => {
            resetForm();
            setFormError("");
            setFormOpen((prev) => !prev);
          }}
        >
          {formOpen ? "Fechar" : "Nova folha"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <AppDateInput
              required
              title="Referencia"
              type="month"
              value={formData.referencia}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  referencia: e.target.value,
                }))
              }
            />
            <AppSelectInput
              required
              title="Colaborador"
              value={formData.colaboradorId}
              onChange={(e) => {
                const colaboradorId = e.target.value;
                const selecionado =
                  colaboradores.find((item) => item.id === colaboradorId) ?? null;
                const percentualInss = selecionado?.percentualInss ?? 0;
                const inssPercentBps =
                  percentualInss > 0 && percentualInss <= 100
                    ? percentualInss * 100
                    : percentualInss;
                setFormData((prev) => ({
                  ...prev,
                  colaboradorId,
                  colaboradores: colaboradorId ? 1 : 0,
                  salarioBaseCents: selecionado?.salarioBase ?? prev.salarioBaseCents,
                  inssPercentBps: inssPercentBps || prev.inssPercentBps,
                }));
              }}
              data={colaboradores.map((colaborador) => ({
                value: colaborador.id,
                label: colaborador.nome,
              }))}
              placeholder="Selecione"
              error={colaboradoresError}
            />
            <AppTextInput
              required
              title="Salario base"
              value={formData.salarioBaseCents ? String(formData.salarioBaseCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  salarioBaseCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Horas extras"
              value={formData.horasExtrasCents ? String(formData.horasExtrasCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  horasExtrasCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Outros proventos"
              value={
                formData.outrosProventosCents ? String(formData.outrosProventosCents) : ""
              }
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  outrosProventosCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Descontos"
              value={formData.descontosCents ? String(formData.descontosCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  descontosCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Dependentes"
              value={formData.dependentes ? String(formData.dependentes) : ""}
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  dependentes: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="INSS (%)"
              value={formData.inssPercentBps ? String(formData.inssPercentBps) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatPercentBR}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  inssPercentBps: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="IRRF (%)"
              value={formData.irrfPercentBps ? String(formData.irrfPercentBps) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatPercentBR}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  irrfPercentBps: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="FGTS (%)"
              value={formData.fgtsPercentBps ? String(formData.fgtsPercentBps) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatPercentBR}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  fgtsPercentBps: Number(raw || "0"),
                }))
              }
            />
            <AppSelectInput
              title="Rescisao"
              value={formData.rescisaoTipo}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  rescisaoTipo: e.target.value,
                }))
              }
              data={rescisaoOptions}
            />
            <AppTextInput
              title="Verbas rescisorias"
              value={
                formData.verbasRescisoriasCents
                  ? String(formData.verbasRescisoriasCents)
                  : ""
              }
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  verbasRescisoriasCents: Number(raw || "0"),
                }))
              }
            />
            <AppSelectInput
              title="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              data={statusOptions}
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
              <p className="text-xs uppercase text-gray-400">Total proventos</p>
              <p className="text-base font-semibold">{formatMoney(calculo.totalProventos)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
              <p className="text-xs uppercase text-gray-400">Total descontos</p>
              <p className="text-base font-semibold">{formatMoney(calculo.totalDescontos)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
              <p className="text-xs uppercase text-gray-400">Liquido</p>
              <p className="text-base font-semibold">{formatMoney(calculo.totalLiquido)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
              <p className="text-xs uppercase text-gray-400">INSS</p>
              <p className="text-base font-semibold">{formatMoney(calculo.inss)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
              <p className="text-xs uppercase text-gray-400">FGTS</p>
              <p className="text-base font-semibold">{formatMoney(calculo.fgts)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
              <p className="text-xs uppercase text-gray-400">IRRF</p>
              <p className="text-base font-semibold">{formatMoney(calculo.irrf)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
              <p className="text-xs uppercase text-gray-400">Multa FGTS</p>
              <p className="text-base font-semibold">{formatMoney(calculo.multaFgts)}</p>
            </div>
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex gap-3">
            <AppButton type="button" className="w-auto px-6" onClick={handleSubmit}>
              {editingId ? "Atualizar" : "Salvar"}
            </AppButton>
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
            >
              Cancelar
            </AppButton>
          </div>
        </Card>
      ) : null}

      <Card tone="amber">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          API de folha preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma folha encontrada." />}
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

export default FolhaPagamentoPage;
