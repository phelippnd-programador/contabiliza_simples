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
  listEstoque,
  listMovimentos,
  createMovimento,
  type EstoqueResumo,
  type EstoqueMovimentoResumo,
  type EstoqueMovimentoTipo,
} from "../services/estoque.service";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const EstoqueMovimentosPage = () => {
  const [itens, setItens] = useState<EstoqueResumo[]>([]);
  const [movimentos, setMovimentos] = useState<EstoqueMovimentoResumo[]>([]);
  const [error, setError] = useState("");
  const [movimentoError, setMovimentoError] = useState("");
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
  const [movimentoPage, setMovimentoPage] = useState(1);
  const [movimentoTotal, setMovimentoTotal] = useState(0);

  const loadItens = async () => {
    try {
      setError("");
      const response = await listEstoque({ page: 1, pageSize: 200 });
      setItens(response.data);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar o estoque.");
    }
  };

  useEffect(() => {
    loadItens();
  }, []);

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
      loadItens();
    } catch {
      setMovimentoError("Nao foi possivel registrar o movimento.");
    }
  };

  const selectedItem = itens.find(
    (item) => (item.produtoId ?? item.id) === movimentoData.itemId
  );
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
      <div>
        <AppTitle text="Movimentos de estoque" />
        <AppSubTitle text="Entradas, saidas e ajustes com custo medio." />
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Item"
            value={movimentoData.itemId}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, itemId: e.target.value }))
            }
            data={itens.map((item) => ({
              value: item.produtoId ?? item.id,
              label: item.descricao || item.item || item.id,
            }))}
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
              setMovimentoData((prev) => ({ ...prev, observacoes: e.target.value }))
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
        {movimentoError ? <p className="mt-2 text-sm text-red-600">{movimentoError}</p> : null}
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleMovimento}>
            Registrar movimento
          </AppButton>
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Historico" />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
      </Card>
    </div>
  );
};

export default EstoqueMovimentosPage;
