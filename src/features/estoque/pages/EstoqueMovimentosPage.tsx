import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { EyeIcon } from "../../../components/ui/icon/AppIcons";
import {
  listEstoque,
  listMovimentos,
  createMovimento,
  type EstoqueResumo,
  type EstoqueMovimentoResumo,
  type EstoqueMovimentoTipo,
} from "../services/estoque.service";
import { formatBRL } from "../../../shared/utils/formater";
import { listVendas, listCompras, type VendaResumo, type CompraResumo } from "../../comercial/services/comercial.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const EstoqueMovimentosPage = () => {
  const [itens, setItens] = useState<EstoqueResumo[]>([]);
  const [movimentos, setMovimentos] = useState<EstoqueMovimentoResumo[]>([]);
  const [error, setError] = useState("");
  const [movimentoError, setMovimentoError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    itemId?: string;
    data?: string;
    quantidade?: string;
    custoUnitarioCents?: string;
    origemId?: string;
  }>({});
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
  const [ajusteDirecao, setAjusteDirecao] = useState<"ENTRADA" | "SAIDA">(
    "ENTRADA"
  );
  const [vendas, setVendas] = useState<VendaResumo[]>([]);
  const [compras, setCompras] = useState<CompraResumo[]>([]);
  const [movimentoPage, setMovimentoPage] = useState(1);
  const [movimentoTotal, setMovimentoTotal] = useState(0);
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    origem: "",
    lote: "",
    serie: "",
  });

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
    let isMounted = true;
    const loadOrigens = async () => {
      const [vendasResult, comprasResult] = await Promise.allSettled([
        listVendas({ page: 1, pageSize: 200 }),
        listCompras({ page: 1, pageSize: 200 }),
      ]);
      if (!isMounted) return;
      setVendas(vendasResult.status === "fulfilled" ? vendasResult.value.data : []);
      setCompras(comprasResult.status === "fulfilled" ? comprasResult.value.data : []);
    };
    loadOrigens().catch(() => {
      if (!isMounted) return;
      setVendas([]);
      setCompras([]);
    });
    return () => {
      isMounted = false;
    };
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

  useEffect(() => {
    if (
      filtros.dataInicio ||
      filtros.dataFim ||
      filtros.origem ||
      filtros.lote ||
      filtros.serie
    ) {
      setMovimentoPage(1);
    }
  }, [filtros]);

  useEffect(() => {
    setMovimentoData((prev) => ({ ...prev, origemId: "" }));
  }, [movimentoData.origem]);

  useEffect(() => {
    if (movimentoData.tipo !== "AJUSTE") {
      setAjusteDirecao("ENTRADA");
    }
  }, [movimentoData.tipo]);

  const effectiveQuantidade =
    movimentoData.tipo === "AJUSTE" && ajusteDirecao === "SAIDA"
      ? -movimentoData.quantidade
      : movimentoData.quantidade;

  const handleMovimento = async () => {
    setMovimentoError("");
    setFieldErrors({});
    if (!movimentoData.itemId || !movimentoData.data) {
      setMovimentoError("Informe o item e a data do movimento.");
      setFieldErrors((prev) => ({
        ...prev,
        itemId: !movimentoData.itemId ? "Selecione o item." : undefined,
        data: !movimentoData.data ? "Informe a data." : undefined,
      }));
      return;
    }
    if (movimentoData.quantidade <= 0) {
      setMovimentoError("Informe a quantidade do movimento.");
      setFieldErrors((prev) => ({
        ...prev,
        quantidade: "Quantidade deve ser maior que zero.",
      }));
      return;
    }
    const requiresCusto =
      movimentoData.tipo === "ENTRADA" ||
      (movimentoData.tipo === "AJUSTE" && ajusteDirecao === "ENTRADA");
    if (requiresCusto && movimentoData.custoUnitarioCents <= 0) {
      setMovimentoError("Informe o custo unitario para entrada/ajuste.");
      setFieldErrors((prev) => ({
        ...prev,
        custoUnitarioCents: "Informe o custo unitario.",
      }));
      return;
    }
    if (movimentoData.origem !== "MANUAL" && !movimentoData.origemId) {
      setMovimentoError("Informe a referencia da origem.");
      setFieldErrors((prev) => ({
        ...prev,
        origemId: "Selecione a referencia.",
      }));
      return;
    }
    const selectedItem =
      itens.find((item) => (item.produtoId ?? item.id) === movimentoData.itemId) ??
      null;
    if (
      (movimentoData.tipo === "SAIDA" ||
        (movimentoData.tipo === "AJUSTE" && ajusteDirecao === "SAIDA")) &&
      selectedItem &&
      movimentoData.quantidade > selectedItem.quantidade
    ) {
      setMovimentoError("Quantidade maior que o saldo atual.");
      setFieldErrors((prev) => ({
        ...prev,
        quantidade: "Quantidade excede o saldo atual.",
      }));
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
        quantidade: effectiveQuantidade,
        custoUnitario:
          movimentoData.tipo === "ENTRADA" ||
          (movimentoData.tipo === "AJUSTE" && ajusteDirecao === "ENTRADA")
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
      setAjusteDirecao("ENTRADA");
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
        : selectedItem.quantidade + effectiveQuantidade
      : undefined;
  const currentCustoMedio = selectedItem?.custoMedio;
  const previewCustoMedio =
    selectedItem &&
    (movimentoData.tipo === "ENTRADA" ||
      (movimentoData.tipo === "AJUSTE" && ajusteDirecao === "ENTRADA")) &&
    movimentoData.quantidade > 0 &&
    movimentoData.custoUnitarioCents > 0
      ? Math.round(
          (selectedItem.quantidade * (selectedItem.custoMedio ?? 0) +
            movimentoData.quantidade * movimentoData.custoUnitarioCents) /
          (selectedItem.quantidade + movimentoData.quantidade)
        )
      : currentCustoMedio;
  const custoMedioLabel =
    typeof currentCustoMedio === "number"
      ? (currentCustoMedio / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : "-";
  const previewCustoLabel =
    typeof previewCustoMedio === "number"
      ? (previewCustoMedio / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : "-";

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
      {
        key: "rastreio",
        header: "Rastreio",
        align: "right" as const,
        render: (row: EstoqueMovimentoResumo) =>
          row.lote || row.serie ? (
            <AppIconButton
              icon={<EyeIcon className="h-4 w-4" />}
              label="Rastrear lote/serie"
              onClick={() =>
                setFiltros((prev) => ({
                  ...prev,
                  lote: row.lote ?? "",
                  serie: row.serie ?? "",
                }))
              }
            />
          ) : (
            "-"
          ),
      },
    ],
    []
  );

  const origemOptions = useMemo(() => {
    if (movimentoData.origem === "VENDA") {
      return vendas.map((venda) => ({
        value: venda.id,
        label: `${venda.id} - ${venda.data} - ${(venda.total / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`,
      }));
    }
    if (movimentoData.origem === "COMPRA") {
      return compras.map((compra) => ({
        value: compra.id,
        label: `${compra.id} - ${compra.data} - ${(compra.total / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`,
      }));
    }
    return [];
  }, [compras, vendas, movimentoData.origem]);

  const movimentosFiltrados = useMemo(() => {
    if (
      !filtros.dataInicio &&
      !filtros.dataFim &&
      !filtros.origem &&
      !filtros.lote &&
      !filtros.serie
    ) {
      return movimentos;
    }
    return movimentos.filter((item) => {
      if (filtros.origem && item.origem !== filtros.origem) return false;
      if (filtros.dataInicio && item.data < filtros.dataInicio) return false;
      if (filtros.dataFim && item.data > filtros.dataFim) return false;
      if (filtros.lote && item.lote !== filtros.lote) return false;
      if (filtros.serie && item.serie !== filtros.serie) return false;
      return true;
    });
  }, [filtros, movimentos]);

  const rastreioLotes = useMemo(() => {
    const map = new Map<
      string,
      {
        lote?: string;
        serie?: string;
        entradas: number;
        saidas: number;
        saldo: number;
        ultimaData: string;
      }
    >();
    movimentosFiltrados.forEach((mov) => {
      if (!mov.lote && !mov.serie) return;
      const key = `${mov.lote ?? ""}||${mov.serie ?? ""}`;
      const signed =
        mov.tipo === "SAIDA"
          ? -mov.quantidade
          : mov.quantidade;
      const atual = map.get(key) ?? {
        lote: mov.lote,
        serie: mov.serie,
        entradas: 0,
        saidas: 0,
        saldo: 0,
        ultimaData: mov.data,
      };
      if (signed >= 0) {
        atual.entradas += signed;
      } else {
        atual.saidas += Math.abs(signed);
      }
      atual.saldo += signed;
      if (mov.data > atual.ultimaData) {
        atual.ultimaData = mov.data;
      }
      map.set(key, atual);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.ultimaData < b.ultimaData ? 1 : -1
    );
  }, [movimentosFiltrados]);

  const filtrosAtivos = Boolean(
    filtros.dataInicio ||
      filtros.dataFim ||
      filtros.origem ||
      filtros.lote ||
      filtros.serie
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
            error={fieldErrors.itemId}
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
          {movimentoData.tipo === "AJUSTE" ? (
            <AppSelectInput
              title="Direcao do ajuste"
              value={ajusteDirecao}
              onChange={(e) =>
                setAjusteDirecao(e.target.value as "ENTRADA" | "SAIDA")
              }
              data={[
                { value: "ENTRADA", label: "Entrada" },
                { value: "SAIDA", label: "Saida" },
              ]}
            />
          ) : null}
          <AppDateInput
            title="Data"
            value={movimentoData.data}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, data: e.target.value }))
            }
            error={fieldErrors.data}
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
            error={fieldErrors.quantidade}
            helperText={
              movimentoData.tipo === "AJUSTE"
                ? "Informe a quantidade para ajustar o saldo."
                : undefined
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
            error={fieldErrors.custoUnitarioCents}
            disabled={
              movimentoData.tipo === "SAIDA" ||
              (movimentoData.tipo === "AJUSTE" && ajusteDirecao === "SAIDA")
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
          {movimentoData.origem === "MANUAL" ? (
            <AppTextInput
              title="Referencia"
              value={movimentoData.origemId}
              onChange={(e) =>
                setMovimentoData((prev) => ({ ...prev, origemId: e.target.value }))
              }
              error={fieldErrors.origemId}
            />
          ) : (
            <AppSelectInput
              title="Referencia"
              value={movimentoData.origemId}
              onChange={(e) =>
                setMovimentoData((prev) => ({ ...prev, origemId: e.target.value }))
              }
              data={origemOptions}
              placeholder={
                movimentoData.origem === "VENDA"
                  ? "Selecione a venda"
                  : "Selecione a compra"
              }
              error={fieldErrors.origemId}
            />
          )}
          <AppTextInput
            title="Observacoes"
            value={movimentoData.observacoes}
            onChange={(e) =>
              setMovimentoData((prev) => ({ ...prev, observacoes: e.target.value }))
            }
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          {selectedItem ? <span>Saldo atual: {selectedItem.quantidade}</span> : null}
          {selectedItem ? <span>Custo medio atual: {custoMedioLabel}</span> : null}
          {typeof previewSaldo === "number" ? (
            <span>Saldo apos movimento: {previewSaldo}</span>
          ) : null}
          {selectedItem ? <span>Custo medio apos movimento: {previewCustoLabel}</span> : null}
          {selectedItem &&
          typeof previewSaldo === "number" &&
          typeof selectedItem.estoqueMinimo === "number" &&
          selectedItem.estoqueMinimo > 0 &&
          previewSaldo <= selectedItem.estoqueMinimo ? (
            <span className="text-amber-700">
              Alerta: saldo abaixo do estoque minimo.
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
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AppDateInput
            title="Data inicial"
            value={filtros.dataInicio}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, dataInicio: e.target.value }))
            }
          />
          <AppDateInput
            title="Data final"
            value={filtros.dataFim}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, dataFim: e.target.value }))
            }
          />
          <AppSelectInput
            title="Origem"
            value={filtros.origem}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, origem: e.target.value }))
            }
            data={[
              { value: "", label: "Todas" },
              { value: "MANUAL", label: "Manual" },
              { value: "VENDA", label: "Venda" },
              { value: "COMPRA", label: "Compra" },
            ]}
          />
          <AppTextInput
            title="Lote"
            value={filtros.lote}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, lote: e.target.value }))
            }
          />
          <AppTextInput
            title="Serie"
            value={filtros.serie}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, serie: e.target.value }))
            }
          />
          <div className="flex items-end">
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={() =>
                setFiltros({
                  dataInicio: "",
                  dataFim: "",
                  origem: "",
                  lote: "",
                  serie: "",
                })
              }
              disabled={!filtrosAtivos}
            >
              Limpar filtros
            </AppButton>
          </div>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={movimentosFiltrados}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum movimento registrado." />}
          pagination={
            filtrosAtivos
              ? { enabled: false }
              : {
                  enabled: true,
                  pageSize: 8,
                  page: movimentoPage,
                  total: movimentoTotal,
                  onPageChange: setMovimentoPage,
                }
          }
          columns={movimentoColumns}
        />
      </Card>

      <Card>
        <AppSubTitle text="Rastreio por lote/serie" />
        <AppTable
          data={rastreioLotes}
          rowKey={(row) => `${row.lote ?? ""}-${row.serie ?? ""}`}
          emptyState={<AppListNotFound texto="Nenhum lote/serie registrado." />}
          pagination={{ enabled: true, pageSize: 8 }}
          columns={[
            {
              key: "lote",
              header: "Lote",
              render: (row) => row.lote ?? "-",
            },
            {
              key: "serie",
              header: "Serie",
              render: (row) => row.serie ?? "-",
            },
            {
              key: "entradas",
              header: "Entradas",
              align: "right" as const,
              render: (row) => row.entradas,
            },
            {
              key: "saidas",
              header: "Saidas",
              align: "right" as const,
              render: (row) => row.saidas,
            },
            {
              key: "saldo",
              header: "Saldo",
              align: "right" as const,
              render: (row) => row.saldo,
            },
            {
              key: "ultimaData",
              header: "Ultimo movimento",
              render: (row) => row.ultimaData,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default EstoqueMovimentosPage;
