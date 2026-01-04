import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import {
  listObrigacoes,
  createObrigacao,
  updateObrigacao,
  deleteObrigacao,
  type ObrigacaoResumo,
} from "../services/fiscal.service";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import { formatLocalDate } from "../../../shared/utils/formater";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
const SIM_STORAGE_KEY = "sim_obrigacoes";

const statusOptions = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "ATRASADA", label: "Atrasada" },
];

const regimeOptions = [
  { value: "SIMPLES", label: "Simples Nacional" },
  { value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" },
  { value: "LUCRO_REAL", label: "Lucro Real" },
];

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length };
};

const makeVencimento = (competencia: string, day: number) => {
  if (!competencia) return "";
  const [yearRaw, monthRaw] = competencia.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!year || !month) return "";
  const nextMonth = month + 1;
  const vencYear = nextMonth > 12 ? year + 1 : year;
  const vencMonth = nextMonth > 12 ? 1 : nextMonth;
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${vencYear}-${pad(vencMonth)}-${pad(day)}`;
};

const buildObrigacoes = (competencia: string, regime: string) => {
  if (!competencia) return [] as ObrigacaoResumo[];
  const base = `sim-${Date.now()}`;
  if (regime === "SIMPLES") {
    return [
      {
        id: `${base}-das`,
        obrigacao: "DAS",
        vencimento: makeVencimento(competencia, 20),
        status: "PENDENTE",
      },
      {
        id: `${base}-defis`,
        obrigacao: "DEFIS",
        vencimento: makeVencimento(competencia, 31),
        status: "PENDENTE",
      },
    ];
  }
  return [
    {
      id: `${base}-dctf`,
      obrigacao: "DCTF",
      vencimento: makeVencimento(competencia, 15),
      status: "PENDENTE",
    },
    {
      id: `${base}-spede`,
      obrigacao: "SPED ECD",
      vencimento: makeVencimento(competencia, 25),
      status: "PENDENTE",
    },
    {
      id: `${base}-spedf`,
      obrigacao: "SPED ECF",
      vencimento: makeVencimento(competencia, 30),
      status: "PENDENTE",
    },
  ];
};

const ObrigacoesPage = () => {
  const [itens, setItens] = useState<ObrigacaoResumo[]>([]);
  const [simuladas, setSimuladas] = useState<ObrigacaoResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [simError, setSimError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [formData, setFormData] = useState({
    obrigacao: "",
    vencimento: "",
    status: "PENDENTE",
  });
  const [simData, setSimData] = useState({
    competencia: "",
    regime: "SIMPLES",
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
      const response = await listObrigacoes({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as obrigacoes.");
    }
  };

  useEffect(() => {
    load();
  }, [page, simuladas]);

  useEffect(() => {
    if (API_BASE) return;
    const raw = window.localStorage.getItem(SIM_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ObrigacaoResumo[];
      setSimuladas(parsed);
    } catch {
      window.localStorage.removeItem(SIM_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (API_BASE) return;
    window.localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(simuladas));
  }, [simuladas]);

  const columns = useMemo(
    () => [
      {
        key: "obrigacao",
        header: "Obrigacao",
        render: (row: ObrigacaoResumo) => row.obrigacao,
      },
      {
        key: "vencimento",
        header: "Vencimento",
        render: (row: ObrigacaoResumo) => formatLocalDate(row.vencimento),
      },
      {
        key: "status",
        header: "Status",
        render: (row: ObrigacaoResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ObrigacaoResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar obrigacao ${row.id}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  obrigacao: row.obrigacao,
                  vencimento: row.vencimento,
                  status: row.status ?? "PENDENTE",
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir obrigacao ${row.id}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir obrigacao",
                    description: "Deseja excluir esta obrigacao?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    if (!API_BASE) {
                      setSimuladas((prev) => prev.filter((item) => item.id !== row.id));
                      return;
                    }
                    try {
                      setError("");
                      await deleteObrigacao(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir a obrigacao.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    []
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      obrigacao: "",
      vencimento: "",
      status: "PENDENTE",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.obrigacao || !formData.vencimento) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      const id = editingId ?? `sim-${Date.now()}`;
      const next: ObrigacaoResumo = {
        id,
        obrigacao: formData.obrigacao,
        vencimento: formData.vencimento,
        status: formData.status,
      };
      setSimuladas((prev) =>
        editingId ? prev.map((item) => (item.id === id ? next : item)) : [next, ...prev]
      );
      resetForm();
      setFormOpen(false);
      return;
    }
    try {
      const payload = {
        obrigacao: formData.obrigacao,
        vencimento: formData.vencimento,
        status: formData.status,
      };
      if (editingId) {
        await updateObrigacao(editingId, payload);
      } else {
        await createObrigacao(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar a obrigacao.");
    }
  };

  const handleGerarCalendario = () => {
    setSimError("");
    if (!simData.competencia) {
      setSimError("Informe a competencia para gerar o calendario.");
      return;
    }
    const lista = buildObrigacoes(simData.competencia, simData.regime);
    setSimuladas((prev) => [...lista, ...prev]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Obrigacoes" />
          <AppSubTitle text="Calendario de obrigacoes e prazos." />
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
          {formOpen ? "Fechar" : "Nova obrigacao"}
        </AppButton>
      </div>

      <Card>
        <AppSubTitle text="Gerar calendario" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AppDateInput
            required
            title="Competencia"
            type="month"
            value={simData.competencia}
            onChange={(e) =>
              setSimData((prev) => ({ ...prev, competencia: e.target.value }))
            }
          />
          <AppSelectInput
            title="Regime"
            value={simData.regime}
            onChange={(e) =>
              setSimData((prev) => ({ ...prev, regime: e.target.value }))
            }
            data={regimeOptions}
          />
        </div>
        {simError ? <p className="mt-2 text-sm text-red-600">{simError}</p> : null}
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleGerarCalendario}>
            Gerar calendario
          </AppButton>
        </div>
      </Card>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppTextInput
              required
              title="Obrigacao"
              value={formData.obrigacao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, obrigacao: e.target.value }))
              }
            />
            <AppDateInput
              required
              title="Vencimento"
              value={formData.vencimento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vencimento: e.target.value }))
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
          Simulador ativo: gere calendario automaticamente quando o backend nao estiver ativo.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma obrigacao cadastrada." />}
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

export default ObrigacoesPage;
