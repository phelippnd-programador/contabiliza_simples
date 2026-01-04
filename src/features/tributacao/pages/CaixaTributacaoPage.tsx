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
  listCaixaTributacao,
  createCaixaTributacao,
  updateCaixaTributacao,
  deleteCaixaTributacao,
  type CaixaTributacaoResumo,
} from "../services/caixa-tributacao.service";
import { formatBRL, formatLocalDate } from "../../../shared/utils/formater";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
const SIM_STORAGE_KEY = "sim_caixa_tributacao";

const statusOptions = [
  { value: "ABERTO", label: "Aberto" },
  { value: "FECHADO", label: "Fechado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length };
};

const CaixaTributacaoPage = () => {
  const [itens, setItens] = useState<CaixaTributacaoResumo[]>([]);
  const [simuladas, setSimuladas] = useState<CaixaTributacaoResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [simError, setSimError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [formData, setFormData] = useState({
    competencia: "",
    conta: "",
    valorCents: 0,
    status: "ABERTO",
  });
  const [simData, setSimData] = useState({
    competencia: "",
    conta: "Caixa principal",
    valorCents: 0,
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
      const response = await listCaixaTributacao({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar o caixa tributario.");
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
      const parsed = JSON.parse(raw) as CaixaTributacaoResumo[];
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
        key: "competencia",
        header: "Competencia",
        render: (row: CaixaTributacaoResumo) =>
          formatLocalDate(row.competencia),
      },
      {
        key: "conta",
        header: "Conta",
        render: (row: CaixaTributacaoResumo) => row.conta,
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: CaixaTributacaoResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: CaixaTributacaoResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: CaixaTributacaoResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar caixa ${row.id}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  competencia: row.competencia,
                  conta: row.conta,
                  valorCents: row.valor,
                  status: row.status ?? "ABERTO",
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir caixa ${row.id}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir registro",
                    description: "Deseja excluir este registro?",
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
                      await deleteCaixaTributacao(row.id);
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
    []
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      competencia: "",
      conta: "",
      valorCents: 0,
      status: "ABERTO",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.competencia || !formData.conta || formData.valorCents <= 0) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      const id = editingId ?? `sim-${Date.now()}`;
      const next: CaixaTributacaoResumo = {
        id,
        competencia: formData.competencia,
        conta: formData.conta,
        valor: formData.valorCents,
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
        competencia: formData.competencia,
        conta: formData.conta,
        valor: formData.valorCents,
        status: formData.status,
      };
      if (editingId) {
        await updateCaixaTributacao(editingId, payload);
      } else {
        await createCaixaTributacao(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o registro.");
    }
  };

  const handleSimular = () => {
    setSimError("");
    if (!simData.competencia || !simData.conta || simData.valorCents <= 0) {
      setSimError("Informe competencia, conta e valor.");
      return;
    }
    const next: CaixaTributacaoResumo = {
      id: `sim-${Date.now()}`,
      competencia: simData.competencia,
      conta: simData.conta,
      valor: simData.valorCents,
      status: "FECHADO",
    };
    setSimuladas((prev) => [next, ...prev]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Caixa" />
          <AppSubTitle text="Acompanhe o caixa tributario por competencia." />
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
          {formOpen ? "Fechar" : "Novo registro"}
        </AppButton>
      </div>

      <Card>
        <AppSubTitle text="Simulador" />
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
          <AppTextInput
            title="Conta"
            value={simData.conta}
            onChange={(e) =>
              setSimData((prev) => ({ ...prev, conta: e.target.value }))
            }
          />
          <AppTextInput
            required
            title="Valor"
            value={simData.valorCents ? String(simData.valorCents) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setSimData((prev) => ({ ...prev, valorCents: Number(raw || "0") }))
            }
          />
        </div>
        {simError ? <p className="mt-2 text-sm text-red-600">{simError}</p> : null}
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSimular}>
            Simular fechamento
          </AppButton>
        </div>
      </Card>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppDateInput
              required
              title="Competencia"
              type="month"
              value={formData.competencia}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  competencia: e.target.value,
                }))
              }
            />
            <AppTextInput
              required
              title="Conta"
              value={formData.conta}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, conta: e.target.value }))
              }
            />
            <AppTextInput
              required
              title="Valor"
              value={formData.valorCents ? String(formData.valorCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  valorCents: Number(raw || "0"),
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
          Simulador ativo: gere fechamento de caixa tributario sem backend.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum movimento encontrado." />}
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

export default CaixaTributacaoPage;
