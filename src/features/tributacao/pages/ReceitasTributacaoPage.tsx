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
  listReceitasTributacao,
  createReceitaTributacao,
  updateReceitaTributacao,
  deleteReceitaTributacao,
  type ReceitaTributacaoResumo,
} from "../services/receitas-tributacao.service";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "APURADA", label: "Apurada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const ReceitasTributacaoPage = () => {
  const [itens, setItens] = useState<ReceitaTributacaoResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    competencia: "",
    origem: "",
    valorCents: 0,
    status: "ABERTA",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listReceitasTributacao({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as receitas.");
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
        render: (row: ReceitaTributacaoResumo) => row.competencia,
      },
      {
        key: "origem",
        header: "Origem",
        render: (row: ReceitaTributacaoResumo) => row.origem ?? "-",
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: ReceitaTributacaoResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: ReceitaTributacaoResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ReceitaTributacaoResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  competencia: row.competencia,
                  origem: row.origem ?? "",
                  valorCents: row.valor,
                  status: row.status ?? "ABERTA",
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
                const confirmed = window.confirm("Excluir esta receita?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteReceitaTributacao(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir a receita.");
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
      origem: "",
      valorCents: 0,
      status: "ABERTA",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.competencia || formData.valorCents <= 0) {
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
        origem: formData.origem || undefined,
        valor: formData.valorCents,
        status: formData.status,
      };
      if (editingId) {
        await updateReceitaTributacao(editingId, payload);
      } else {
        await createReceitaTributacao(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar a receita.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Receitas" />
          <AppSubTitle text="Visao tributaria das receitas por competencia." />
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
          {formOpen ? "Fechar" : "Nova receita"}
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
              title="Origem"
              value={formData.origem}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, origem: e.target.value }))
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
          Esta tela ja esta pronta para receber dados da API quando o backend
          estiver disponivel.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma receita encontrada." />}
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

export default ReceitasTributacaoPage;

