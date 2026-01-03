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
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "ATRASADA", label: "Atrasada" },
];

const ObrigacoesPage = () => {
  const [itens, setItens] = useState<ObrigacaoResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    obrigacao: "",
    vencimento: "",
    status: "PENDENTE",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
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
  }, [page]);

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
        render: (row: ObrigacaoResumo) => row.vencimento,
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
            <AppButton
              type="button"
              className="w-auto px-4"
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
            >
              Editar
            </AppButton>
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={async () => {
                if (!API_BASE) {
                  setError("API nao configurada.");
                  return;
                }
                const confirmed = window.confirm("Excluir esta obrigacao?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteObrigacao(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir a obrigacao.");
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
      setFormError("API nao configurada.");
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
          API de obrigacoes preparada para integracao.
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
    </div>
  );
};

export default ObrigacoesPage;

