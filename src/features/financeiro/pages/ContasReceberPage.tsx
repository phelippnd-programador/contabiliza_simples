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
  listContasReceber,
  createContaReceber,
  updateContaReceber,
  deleteContaReceber,
  type ContaReceberResumo,
} from "../services/contas-receber.service";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "RECEBIDA", label: "Recebida" },
  { value: "CANCELADA", label: "Cancelada" },
];

const ContasReceberPage = () => {
  const [itens, setItens] = useState<ContaReceberResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cliente: "",
    vencimento: "",
    valorCents: 0,
    status: "ABERTA",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listContasReceber({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as contas a receber.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "cliente",
        header: "Cliente",
        render: (row: ContaReceberResumo) => row.cliente,
      },
      {
        key: "vencimento",
        header: "Vencimento",
        render: (row: ContaReceberResumo) => row.vencimento,
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: ContaReceberResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: ContaReceberResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ContaReceberResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  cliente: row.cliente,
                  vencimento: row.vencimento,
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
                const confirmed = window.confirm("Excluir esta conta?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteContaReceber(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir a conta.");
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
      cliente: "",
      vencimento: "",
      valorCents: 0,
      status: "ABERTA",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.cliente || !formData.vencimento || formData.valorCents <= 0) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      if (editingId) {
        await updateContaReceber(editingId, {
          cliente: formData.cliente,
          vencimento: formData.vencimento,
          valor: formData.valorCents,
          status: formData.status,
        });
      } else {
        await createContaReceber({
          cliente: formData.cliente,
          vencimento: formData.vencimento,
          valor: formData.valorCents,
          status: formData.status,
        });
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar a conta.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Contas a receber" />
          <AppSubTitle text="Controle cobrancas e recebimentos." />
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
          {formOpen ? "Fechar" : "Nova conta"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppTextInput
              required
              title="Cliente"
              value={formData.cliente}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, cliente: e.target.value }))
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
          API de contas a receber preparada para o backend.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma conta a receber." />}
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

export default ContasReceberPage;


