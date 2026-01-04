import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import {
  listConciliacaoTributacao,
  createConciliacaoTributacao,
  updateConciliacaoTributacao,
  deleteConciliacaoTributacao,
  type ConciliacaoTributacaoResumo,
} from "../services/conciliacao-tributacao.service";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
const SIM_STORAGE_KEY = "sim_conciliacao_tributacao";

const statusOptions = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONCILIADA", label: "Conciliada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length };
};

const ConciliacaoTributacaoPage = () => {
  const [itens, setItens] = useState<ConciliacaoTributacaoResumo[]>([]);
  const [simuladas, setSimuladas] = useState<ConciliacaoTributacaoResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [simError, setSimError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    data: "",
    conta: "",
    valorCents: 0,
    status: "PENDENTE",
  });
  const [simData, setSimData] = useState({
    data: "",
    conta: "Conta principal",
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
      const response = await listConciliacaoTributacao({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar a conciliacao.");
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
      const parsed = JSON.parse(raw) as ConciliacaoTributacaoResumo[];
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
        key: "data",
        header: "Data",
        render: (row: ConciliacaoTributacaoResumo) => row.data,
      },
      {
        key: "conta",
        header: "Conta",
        render: (row: ConciliacaoTributacaoResumo) => row.conta,
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: ConciliacaoTributacaoResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: ConciliacaoTributacaoResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ConciliacaoTributacaoResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  data: row.data,
                  conta: row.conta,
                  valorCents: row.valor,
                  status: row.status ?? "PENDENTE",
                });
                setFormError("");
                setFormOpen(true);
              }}
            >
              Editar
            </AppButton>
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={async () => {
                if (!API_BASE) {
                  setSimuladas((prev) => prev.filter((item) => item.id !== row.id));
                  return;
                }
                const confirmed = window.confirm("Excluir esta conciliacao?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteConciliacaoTributacao(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir a conciliacao.");
                }
              }}
            >
              Excluir
            </AppButton>
          </div>
        ),
      },
    ],
    []
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      data: "",
      conta: "",
      valorCents: 0,
      status: "PENDENTE",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.data || !formData.conta || formData.valorCents <= 0) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      const id = editingId ?? `sim-${Date.now()}`;
      const next: ConciliacaoTributacaoResumo = {
        id,
        data: formData.data,
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
        data: formData.data,
        conta: formData.conta,
        valor: formData.valorCents,
        status: formData.status,
      };
      if (editingId) {
        await updateConciliacaoTributacao(editingId, payload);
      } else {
        await createConciliacaoTributacao(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar a conciliacao.");
    }
  };

  const handleSimular = () => {
    setSimError("");
    if (!simData.data || !simData.conta || simData.valorCents <= 0) {
      setSimError("Informe data, conta e valor.");
      return;
    }
    const next: ConciliacaoTributacaoResumo = {
      id: `sim-${Date.now()}`,
      data: simData.data,
      conta: simData.conta,
      valor: simData.valorCents,
      status: "CONCILIADA",
    };
    setSimuladas((prev) => [next, ...prev]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Conciliacao" />
          <AppSubTitle text="Concilie receitas e movimentos bancarios." />
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
          {formOpen ? "Fechar" : "Nova conciliacao"}
        </AppButton>
      </div>

      <Card>
        <AppSubTitle text="Simulador" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AppDateInput
            required
            title="Data"
            value={simData.data}
            onChange={(e) => setSimData((prev) => ({ ...prev, data: e.target.value }))}
          />
          <AppTextInput
            title="Conta"
            value={simData.conta}
            onChange={(e) => setSimData((prev) => ({ ...prev, conta: e.target.value }))}
          />
          <AppTextInput
            required
            title="Valor"
            value={simData.valorCents ? String(simData.valorCents) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                valorCents: Number(raw || "0"),
              }))
            }
          />
        </div>
        {simError ? <p className="mt-2 text-sm text-red-600">{simError}</p> : null}
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSimular}>
            Simular conciliacao
          </AppButton>
        </div>
      </Card>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppDateInput
              required
              title="Data"
              value={formData.data}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  data: e.target.value,
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
          Simulador ativo: concilie automaticamente sem backend.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma conciliacao encontrada." />}
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
    </div>
  );
};

export default ConciliacaoTributacaoPage;
