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
  listCaixaTributacao,
  createCaixaTributacao,
  updateCaixaTributacao,
  deleteCaixaTributacao,
  type CaixaTributacaoResumo,
} from "../services/caixa-tributacao.service";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTO", label: "Aberto" },
  { value: "FECHADO", label: "Fechado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const CaixaTributacaoPage = () => {
  const [itens, setItens] = useState<CaixaTributacaoResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    competencia: "",
    conta: "",
    valorCents: 0,
    status: "ABERTO",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
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
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "competencia",
        header: "Competencia",
        render: (row: CaixaTributacaoResumo) => row.competencia,
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
            <AppButton
              type="button"
              className="w-auto px-4"
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
                const confirmed = window.confirm("Excluir este registro?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteCaixaTributacao(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir o registro.");
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
      setFormError("API nao configurada.");
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
          API preparada para receber movimentos tributarios quando o backend
          estiver disponivel.
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
    </div>
  );
};

export default CaixaTributacaoPage;

