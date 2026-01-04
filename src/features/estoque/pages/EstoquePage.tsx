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
  listMovimentos,
  createMovimento,
  type EstoqueResumo,
  type EstoqueMovimentoResumo,
  type EstoqueMovimentoTipo,
} from "../services/estoque.service";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const EstoquePage = () => {
  const [itens, setItens] = useState<EstoqueResumo[]>([]);
  const [movimentos, setMovimentos] = useState<EstoqueMovimentoResumo[]>([]);
  const [error, setError] = useState("");
  const [movimentoError, setMovimentoError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    item: "",
    quantidade: 0,
    custoMedioCents: 0,
    estoqueMinimo: 0,
  });
  const [movimentoData, setMovimentoData] = useState({
    itemId: "",
    tipo: "ENTRADA" as EstoqueMovimentoTipo,
    data: "",
    quantidade: 0,
    custoUnitarioCents: 0,
    lote: "",
    serie: "",
    origem: "MANUAL",
    origemId: "",
    observacoes: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [movimentoPage, setMovimentoPage] = useState(1);
  const [movimentoTotal, setMovimentoTotal] = useState(0);

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

  useEffect(() => {
    const itemId = movimentoData.itemId;
    if (!itemId) {
      setMovimentos([]);
      setMovimentoTotal(0);
      return;
    }
    const loadMovimentos = async () => {
      try {
        setMovimentoError("");
        const response = await listMovimentos(itemId, {
          page: movimentoPage,
          pageSize: 8,
        });
        setMovimentos(response.data);
        setMovimentoTotal(response.meta.total);
      } catch {
        setMovimentos([]);
        setMovimentoTotal(0);
        setMovimentoError("Nao foi possivel carregar os movimentos.");
      }
    };
    loadMovimentos();
  }, [movimentoData.itemId, movimentoPage]);

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
        key: "estoqueMinimo",
        header: "Minimo",
        align: "right" as const,
        render: (row: EstoqueResumo) =>
          typeof row.estoqueMinimo === "number" ? row.estoqueMinimo : "-",
      },
      {
        key: "alerta",
        header: "Alerta",
        render: (row: EstoqueResumo) => {
          const minimo = row.estoqueMinimo ?? 0;
          if (!minimo) return "-";
          return row.quantidade <= minimo ? (
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
              Estoque baixo
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
              Ok
            </span>
          );
        },
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
                  estoqueMinimo: row.estoqueMinimo ?? 0,
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
      estoqueMinimo: 0,
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
        estoqueMinimo: formData.estoqueMinimo || undefined,
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

  const handleMovimento = async () => {
    setMovimentoError("");
    if (!movimentoData.itemId || !movimentoData.data) {
      setMovimentoError("Informe o item e a data do movimento.");
      return;
    }
    if (movimentoData.quantidade <= 0) {
      setMovimentoError("Informe a quantidade do movimento.");
      return;
    }
    if (movimentoData.tipo === "ENTRADA" && movimentoData.custoUnitarioCents <= 0) {
      setMovimentoError("Informe o custo unitario para entrada.");
      return;
    }
    if (!API_BASE) {
      setMovimentoError("API nao configurada.");
      return;
    }
    try {
      await createMovimento(movimentoData.itemId, {
        tipo: movimentoData.tipo,
        data: movimentoData.data,
        quantidade: movimentoData.quantidade,
        custoUnitario:
          movimentoData.tipo === "ENTRADA"
            ? movimentoData.custoUnitarioCents
            : undefined,
        lote: movimentoData.lote || undefined,
        serie: movimentoData.serie || undefined,
        origem: movimentoData.origem as "MANUAL" | "VENDA" | "COMPRA",
        origemId: movimentoData.origemId || undefined,
        observacoes: movimentoData.observacoes || undefined,
      });
      setMovimentoData((prev) => ({
        ...prev,
        quantidade: 0,
        custoUnitarioCents: 0,
        lote: "",
        serie: "",
        origemId: "",
        observacoes: "",
      }));
      setMovimentoPage(1);
      load();
    } catch {
      setMovimentoError("Nao foi possivel registrar o movimento.");
    }
  };

  const selectedItem = itens.find((item) => item.id === movimentoData.itemId);
  const previewSaldo =
    selectedItem && movimentoData.quantidade
      ? movimentoData.tipo === "SAIDA"
        ? selectedItem.quantidade - movimentoData.quantidade
        : selectedItem.quantidade + movimentoData.quantidade
      : undefined;
  const previewCustoMedio =
    selectedItem &&
    movimentoData.tipo === "ENTRADA" &&
    movimentoData.quantidade > 0 &&
    movimentoData.custoUnitarioCents > 0
      ? Math.round(
          (selectedItem.quantidade * (selectedItem.custoMedio ?? 0) +
            movimentoData.quantidade * movimentoData.custoUnitarioCents) /
            (selectedItem.quantidade + movimentoData.quantidade)
        )
      : undefined;

  const movimentoColumns = useMemo(
    () => [
      { key: "data", header: "Data", render: (row: EstoqueMovimentoResumo) => row.data },
      { key: "tipo", header: "Tipo", render: (row: EstoqueMovimentoResumo) => row.tipo },
      {
        key: "quantidade",
        header: "Qtd",
        align: "right" as const,
        render: (row: EstoqueMovimentoResumo) => row.quantidade,
      },
      {
        key: "custo",
        header: "Custo unit",
        align: "right" as const,
        render: (row: EstoqueMovimentoResumo) =>
          row.custoUnitario
            ? (row.custoUnitario / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "-",
      },
      {
        key: "lote",
        header: "Lote/Serie",
        render: (row: EstoqueMovimentoResumo) =>
          row.lote || row.serie ? `${row.lote ?? "-"} / ${row.serie ?? "-"}` : "-",
      },
      {
        key: "origem",
        header: "Origem",
        render: (row: EstoqueMovimentoResumo) =>
          row.origem ? `${row.origem}${row.origemId ? ` (${row.origemId})` : ""}` : "-",
      },
    ],
    []
  );

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
            <AppTextInput
              title="Estoque minimo"
              value={formData.estoqueMinimo ? String(formData.estoqueMinimo) : ""}
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  estoqueMinimo: Number(raw || "0"),
                }))
              }
            />
          </div>
          {itens.some((item) => (item.estoqueMinimo ?? 0) > 0 && item.quantidade <= (item.estoqueMinimo ?? 0)) ? (
            <p className="text-sm text-amber-700">
              Existem itens abaixo do estoque minimo.
            </p>
          ) : null}
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
        <AppSubTitle text="Movimentos de estoque" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Item"
            value={movimentoData.itemId}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, itemId: e.target.value }))
            }
            data={itens.map((item) => ({ value: item.id, label: item.item }))}
            placeholder="Selecione"
          />
          <AppSelectInput
            title="Tipo"
            value={movimentoData.tipo}
            onChange={(e) =>
              setMovimentoData((prev) => ({
                ...prev,
                tipo: e.target.value as EstoqueMovimentoTipo,
              }))
            }
            data={[
              { value: "ENTRADA", label: "Entrada" },
              { value: "SAIDA", label: "Saida" },
              { value: "AJUSTE", label: "Ajuste/Inventario" },
            ]}
          />
          <AppDateInput
            title="Data"
            value={movimentoData.data}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, data: e.target.value }))
            }
          />
          <AppTextInput
            title="Quantidade"
            value={movimentoData.quantidade ? String(movimentoData.quantidade) : ""}
            sanitizeRegex={/[0-9]/g}
            onValueChange={(raw) =>
              setMovimentoData((prev) => ({
                ...prev,
                quantidade: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="Custo unitario"
            value={
              movimentoData.custoUnitarioCents
                ? String(movimentoData.custoUnitarioCents)
                : ""
            }
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setMovimentoData((prev) => ({
                ...prev,
                custoUnitarioCents: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="Lote"
            value={movimentoData.lote}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, lote: e.target.value }))
            }
          />
          <AppTextInput
            title="Serie"
            value={movimentoData.serie}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, serie: e.target.value }))
            }
          />
          <AppSelectInput
            title="Origem"
            value={movimentoData.origem}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, origem: e.target.value }))
            }
            data={[
              { value: "MANUAL", label: "Manual" },
              { value: "VENDA", label: "Venda" },
              { value: "COMPRA", label: "Compra" },
            ]}
          />
          <AppTextInput
            title="Referencia"
            value={movimentoData.origemId}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, origemId: e.target.value }))
            }
          />
          <AppTextInput
            title="Observacoes"
            value={movimentoData.observacoes}
            onChange={(e) =>
              setMovimentoData((prev) => ({
                ...prev,
                observacoes: e.target.value,
              }))
            }
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          {typeof previewSaldo === "number" ? (
            <span>Saldo estimado: {previewSaldo}</span>
          ) : null}
          {typeof previewCustoMedio === "number" ? (
            <span>
              Custo medio estimado:{" "}
              {(previewCustoMedio / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          ) : null}
        </div>
        {movimentoError ? (
          <p className="mt-2 text-sm text-red-600">{movimentoError}</p>
        ) : null}
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleMovimento}>
            Registrar movimento
          </AppButton>
        </div>

        <div className="mt-6">
          <AppSubTitle text="Historico" />
          {movimentoError ? <p className="text-sm text-red-600">{movimentoError}</p> : null}
          <AppTable
            data={movimentos}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhum movimento registrado." />}
            pagination={{
              enabled: true,
              pageSize: 8,
              page: movimentoPage,
              total: movimentoTotal,
              onPageChange: setMovimentoPage,
            }}
            columns={movimentoColumns}
          />
        </div>
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


