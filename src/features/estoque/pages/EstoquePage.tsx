import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import {
  listEstoque,
  createEstoqueItem,
  updateEstoqueItem,
  deleteEstoqueItem,
  type EstoqueResumo,
} from "../services/estoque.service";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const EstoquePage = () => {
  const [itens, setItens] = useState<EstoqueResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    item: "",
    quantidade: 0,
    custoMedioCents: 0,
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listEstoque({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar o estoque.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "item",
        header: "Item",
        render: (row: EstoqueResumo) => row.item,
      },
      {
        key: "quantidade",
        header: "Quantidade",
        align: "right" as const,
        render: (row: EstoqueResumo) => row.quantidade,
      },
      {
        key: "custoMedio",
        header: "Custo medio",
        align: "right" as const,
        render: (row: EstoqueResumo) =>
          row.custoMedio
            ? (row.custoMedio / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: EstoqueResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  item: row.item,
                  quantidade: row.quantidade,
                  custoMedioCents: row.custoMedio ?? 0,
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
                const confirmed = window.confirm("Excluir este item?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteEstoqueItem(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir o item.");
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
      item: "",
      quantidade: 0,
      custoMedioCents: 0,
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.item || formData.quantidade <= 0) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      const payload = {
        item: formData.item,
        quantidade: formData.quantidade,
        custoMedio: formData.custoMedioCents || undefined,
      };
      if (editingId) {
        await updateEstoqueItem(editingId, payload);
      } else {
        await createEstoqueItem(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o item.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Estoque" />
          <AppSubTitle text="Entradas, saidas e inventario." />
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
          {formOpen ? "Fechar" : "Novo item"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppTextInput
              required
              title="Item"
              value={formData.item}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, item: e.target.value }))
              }
            />
            <AppTextInput
              required
              title="Quantidade"
              value={formData.quantidade ? String(formData.quantidade) : ""}
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  quantidade: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Custo medio"
              value={formData.custoMedioCents ? String(formData.custoMedioCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  custoMedioCents: Number(raw || "0"),
                }))
              }
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
          API de estoque preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum item em estoque." />}
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

export default EstoquePage;


