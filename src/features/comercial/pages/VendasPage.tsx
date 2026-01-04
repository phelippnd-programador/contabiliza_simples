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
  listVendas,
  createVenda,
  updateVenda,
  deleteVenda,
  type VendaResumo,
} from "../services/comercial.service";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "FECHADA", label: "Fechada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const VendasPage = () => {
  const [itens, setItens] = useState<VendaResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cliente: "",
    data: "",
    totalCents: 0,
    status: "ABERTA",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listVendas({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as vendas.");
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
        render: (row: VendaResumo) => row.cliente,
      },
      {
        key: "data",
        header: "Data",
        render: (row: VendaResumo) => row.data,
      },
      {
        key: "total",
        header: "Total",
        align: "right" as const,
        render: (row: VendaResumo) =>
          (row.total / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: VendaResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: VendaResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  cliente: row.cliente,
                  data: row.data,
                  totalCents: row.total,
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
                const confirmed = window.confirm("Excluir esta venda?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteVenda(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir a venda.");
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
      data: "",
      totalCents: 0,
      status: "ABERTA",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.cliente || !formData.data || formData.totalCents <= 0) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      if (editingId) {
        await updateVenda(editingId, {
          cliente: formData.cliente,
          data: formData.data,
          total: formData.totalCents,
          status: formData.status,
        });
      } else {
        await createVenda({
          cliente: formData.cliente,
          data: formData.data,
          total: formData.totalCents,
          status: formData.status,
        });
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar a venda.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Vendas" />
          <AppSubTitle text="Pedidos, faturamento e aprovacoes." />
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
          {formOpen ? "Fechar" : "Nova venda"}
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
              title="Data"
              value={formData.data}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, data: e.target.value }))
              }
            />
            <AppTextInput
              required
              title="Total"
              value={formData.totalCents ? String(formData.totalCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  totalCents: Number(raw || "0"),
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
          API de vendas preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma venda cadastrada." />}
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

export default VendasPage;


