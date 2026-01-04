import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppTableSkeleton from "../../../components/ui/table/AppTableSkeleton";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import {
  listIntegracoesBancarias,
  createIntegracaoBancaria,
  updateIntegracaoBancaria,
  deleteIntegracaoBancaria,
  type IntegracaoBancariaResumo,
} from "../services/integracoes-bancarias.service";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { getErrorMessage } from "../../../shared/services/apiClient";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ATIVA", label: "Ativa" },
  { value: "INATIVA", label: "Inativa" },
];

const bancoOptions = [
  { value: "BANCO_DO_BRASIL", label: "Banco do Brasil" },
  { value: "BRADESCO", label: "Bradesco" },
  { value: "ITAU", label: "Itau" },
  { value: "SANTANDER", label: "Santander" },
  { value: "CAIXA", label: "Caixa" },
  { value: "INTER", label: "Banco Inter" },
  { value: "NU", label: "Nubank" },
  { value: "SICOOB", label: "Sicoob" },
  { value: "SICREDI", label: "Sicredi" },
  { value: "PIX", label: "PIX" },
];

const IntegracoesBancariasPage = () => {
  const [itens, setItens] = useState<IntegracaoBancariaResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    banco: "",
    status: "ATIVA",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await listIntegracoesBancarias({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch (err) {
      setItens([]);
      setError(getErrorMessage(err, "Nao foi possivel carregar as integracoes."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "banco",
        header: "Banco",
        render: (row: IntegracaoBancariaResumo) => row.banco,
      },
      {
        key: "ultimaAtualizacao",
        header: "Ultima atualizacao",
        render: (row: IntegracaoBancariaResumo) => row.ultimaAtualizacao ?? "-",
      },
      {
        key: "status",
        header: "Status",
        render: (row: IntegracaoBancariaResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: IntegracaoBancariaResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar integracao ${row.banco}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  banco: row.banco,
                  status: row.status ?? "ATIVA",
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir integracao ${row.banco}`}
              variant="danger"
              onClick={async () => {
                if (!API_BASE) {
                  setError("API nao configurada.");
                  return;
                }
                const confirmed = window.confirm("Excluir esta integracao?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteIntegracaoBancaria(row.id);
                  load();
                } catch (err) {
                  setError(getErrorMessage(err, "Nao foi possivel excluir a integracao."));
                }
              }}
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
      banco: "",
      status: "ATIVA",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.banco) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        banco: formData.banco,
        status: formData.status,
      };
      if (editingId) {
        await updateIntegracaoBancaria(editingId, payload);
      } else {
        await createIntegracaoBancaria(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Nao foi possivel salvar a integracao."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Integracoes bancarias" />
          <AppSubTitle text="OFX, CSV e Open Finance." />
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
          {formOpen ? "Fechar" : "Nova integracao"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppSelectInput
              required
              title="Banco"
              value={formData.banco}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, banco: e.target.value }))
              }
              data={bancoOptions}
              placeholder="Selecione"
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
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={handleSubmit}
              loading={isSaving}
            >
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
          API de integracoes bancarias preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? (
          <div className="mb-4 flex items-center gap-3 text-sm text-red-600">
            <span>{error}</span>
            <AppButton type="button" className="w-auto px-4" onClick={load}>
              Tentar novamente
            </AppButton>
          </div>
        ) : null}
        {isLoading ? (
          <AppTableSkeleton columns={columns.length} rows={6} />
        ) : (
          <AppTable
            data={itens}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhuma integracao cadastrada." />}
            pagination={{
              enabled: true,
              pageSize,
              page,
              total,
              onPageChange: setPage,
            }}
            columns={columns}
          />
        )}
      </Card>
    </div>
  );
};

export default IntegracoesBancariasPage;

