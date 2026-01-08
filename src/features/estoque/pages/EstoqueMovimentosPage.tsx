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
import { EyeIcon, UndoIcon } from "../../../components/ui/icon/AppIcons";
import {
  listEstoque,
  createEstoqueItem,
  listMovimentos,
  createMovimento,
  listDepositos,
  reverterMovimento,
  type EstoqueResumo,
  type EstoqueMovimentoResumo,
  type EstoqueMovimentoTipo,
  type EstoqueDepositoResumo,
} from "../services/estoque.service";
import { formatBRL, formatLocalDate, toLocalISODate } from "../../../shared/utils/formater";
import { listVendas, listCompras, type VendaResumo, type CompraResumo } from "../../comercial/services/comercial.service";
import { DEFAULT_ESTOQUE_POLICY, calcularQuantidadeDisponivel, getSignedQuantidade, validarSaldoNegativo } from "../utils/estoque.utils";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import { listFornecedores, type FornecedorResumo } from "../../cadastros/services/cadastros.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const EstoqueMovimentosPage = () => {
  const [itens, setItens] = useState<EstoqueResumo[]>([]);
  const [movimentos, setMovimentos] = useState<EstoqueMovimentoResumo[]>([]);
  const [error, setError] = useState("");
  const [movimentoError, setMovimentoError] = useState("");
  const [isLoadingItens, setIsLoadingItens] = useState(false);
  const [isLoadingMovimentos, setIsLoadingMovimentos] = useState(false);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [fieldErrors, setFieldErrors] = useState<{
    itemId?: string;
    data?: string;
    quantidade?: string;
    custoUnitarioCents?: string;
    origemId?: string;
    observacoes?: string;
  }>({});
  const [movimentoData, setMovimentoData] = useState({
    itemId: "",
    depositoId: "",
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
  const [fornecedores, setFornecedores] = useState<FornecedorResumo[]>([]);
  const [depositos, setDepositos] = useState<EstoqueDepositoResumo[]>([]);
  const [movimentoPage, setMovimentoPage] = useState(1);
  const [movimentoTotal, setMovimentoTotal] = useState(0);
  const [transferError, setTransferError] = useState("");
  const [transferData, setTransferData] = useState({
    itemId: "",
    origemDepositoId: "",
    destinoDepositoId: "",
    quantidade: 0,
    data: "",
    observacoes: "",
  });
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    origem: "",
    lote: "",
    serie: "",
    depositoId: "",
  });

  const loadItens = async () => {
    try {
      setIsLoadingItens(true);
      setError("");
      const response = await listEstoque({ page: 1, pageSize: 200 });
      setItens(response.data);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar o estoque.");
    } finally {
      setIsLoadingItens(false);
    }
  };

  useEffect(() => {
    loadItens();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadDepositos = async () => {
      try {
        const response = await listDepositos();
        if (!isMounted) return;
        setDepositos(response);
      } catch {
        if (!isMounted) return;
        setDepositos([]);
      }
    };
    loadDepositos();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadFornecedores = async () => {
      try {
        const response = await listFornecedores({ page: 1, pageSize: 200 });
        if (!isMounted) return;
        setFornecedores(response.data);
      } catch {
        if (!isMounted) return;
        setFornecedores([]);
      }
    };
    loadFornecedores();
    return () => {
      isMounted = false;
    };
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

  const loadMovimentos = async () => {
    const itemId = movimentoData.itemId;
    // if (!itemId) {
    //   setMovimentos([]);
    //   setMovimentoTotal(0);
    //   return;
    // }
    try {
      setIsLoadingMovimentos(true);
      setMovimentoError("");
      const response = await listMovimentos(itemId, {
        page: movimentoPage,
        pageSize: 8,
        dataInicio: filtros.dataInicio || undefined,
        dataFim: filtros.dataFim || undefined,
        origem: filtros.origem ? (filtros.origem as "MANUAL" | "VENDA" | "COMPRA") : undefined,
        lote: filtros.lote || undefined,
        serie: filtros.serie || undefined,
        depositoId: filtros.depositoId || undefined,
      });
      setMovimentos(response.data);
      setMovimentoTotal(response.meta.total);
    } catch {
      setMovimentos([]);
      setMovimentoTotal(0);
      setMovimentoError("Nao foi possivel carregar os movimentos.");
    } finally {
      setIsLoadingMovimentos(false);
    }
  };

  useEffect(() => {
    loadMovimentos();
  }, [movimentoData.itemId, movimentoPage, filtros]);

  useEffect(() => {
    if (
      filtros.dataInicio ||
      filtros.dataFim ||
      filtros.origem ||
      filtros.lote ||
      filtros.serie ||
      filtros.depositoId
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
    const availableQuantity = selectedItem
      ? calcularQuantidadeDisponivel(
          selectedItem.quantidade,
          selectedItem.quantidadeReservada
        )
      : undefined;
    if (
      (movimentoData.tipo === "SAIDA" ||
        (movimentoData.tipo === "AJUSTE" && ajusteDirecao === "SAIDA")) &&
      typeof availableQuantity === "number" &&
      movimentoData.quantidade > availableQuantity
    ) {
      setMovimentoError("Quantidade maior que o saldo atual.");
      setFieldErrors((prev) => ({
        ...prev,
        quantidade: "Quantidade excede o saldo disponivel.",
      }));
      return;
    }
    if (typeof availableQuantity === "number") {
      const signed = getSignedQuantidade(
        movimentoData.tipo,
        movimentoData.quantidade,
        ajusteDirecao
      );
      const policy = DEFAULT_ESTOQUE_POLICY;
      const negativeCheck = validarSaldoNegativo({
        saldoAtual: availableQuantity,
        movimento: signed,
        policy,
        observacoes: movimentoData.observacoes,
      });
      if (!negativeCheck.ok) {
        if (negativeCheck.reason === "JUSTIFICATION_REQUIRED") {
          setMovimentoError("Informe a justificativa para saldo negativo.");
          setFieldErrors((prev) => ({
            ...prev,
            observacoes: "Justificativa obrigatoria.",
          }));
          return;
        }
        setMovimentoError("Quantidade maior que o saldo atual.");
        setFieldErrors((prev) => ({
          ...prev,
          quantidade: "Quantidade excede o saldo atual.",
        }));
        return;
      }
    }
    if (!API_BASE) {
      setMovimentoError("API nao configurada.");
      return;
    }
    try {
      const resultado = await createMovimento(movimentoData.itemId, {
        tipo: movimentoData.tipo,
        data: movimentoData.data,
        quantidade: effectiveQuantidade,
        custoUnitario:
          movimentoData.tipo === "ENTRADA" ||
          (movimentoData.tipo === "AJUSTE" && ajusteDirecao === "ENTRADA")
            ? movimentoData.custoUnitarioCents
            : undefined,
        depositoId: movimentoData.depositoId || undefined,
        lote: movimentoData.lote || undefined,
        serie: movimentoData.serie || undefined,
        origem: movimentoData.origem as "MANUAL" | "VENDA" | "COMPRA",
        origemId: movimentoData.origemId || undefined,
        observacoes: movimentoData.observacoes || undefined,
      });
      if (
        typeof resultado.custoMedio === "number" &&
        selectedItem &&
        typeof selectedItem.custoMedio === "number"
      ) {
        const diff = Math.abs(resultado.custoMedio - selectedItem.custoMedio);
        if (diff > 0) {
          setMovimentoError(
            "Custo medio recalculado pelo sistema. Atualize a lista para conferir."
          );
        }
      }
      setMovimentoData((prev) => ({
        ...prev,
        quantidade: 0,
        custoUnitarioCents: 0,
        lote: "",
        serie: "",
        depositoId: prev.depositoId,
        origemId: "",
        observacoes: "",
      }));
      setAjusteDirecao("ENTRADA");
      setMovimentoPage(1);
      loadItens();
      loadMovimentos();
    } catch {
      setMovimentoError("Nao foi possivel registrar o movimento.");
    }
  };

  const handleTransferencia = async () => {
    setTransferError("");
    if (!transferData.itemId || !transferData.origemDepositoId || !transferData.destinoDepositoId) {
      setTransferError("Informe item, deposito origem e destino.");
      return;
    }
    if (transferData.origemDepositoId === transferData.destinoDepositoId) {
      setTransferError("Selecione depositos diferentes.");
      return;
    }
    if (transferData.quantidade <= 0) {
      setTransferError("Informe a quantidade para transferir.");
      return;
    }
    const origemItem = itens.find(
      (item) =>
        (item.produtoId ?? item.id) === transferData.itemId &&
        item.depositoId === transferData.origemDepositoId
    );
    if (!origemItem) {
      setTransferError("Item nao encontrado no deposito de origem.");
      return;
    }
    const disponivel = calcularQuantidadeDisponivel(
      origemItem.quantidade,
      origemItem.quantidadeReservada
    );
    if (transferData.quantidade > disponivel) {
      setTransferError("Quantidade excede o saldo disponivel.");
      return;
    }
    const destinoDeposito = depositos.find(
      (deposito) => deposito.id === transferData.destinoDepositoId
    );
    if (destinoDeposito && destinoDeposito.ativo === false) {
      setTransferError("Deposito de destino inativo.");
      return;
    }
    const custoUnitario = origemItem.custoMedio ?? 0;
    if (!custoUnitario) {
      setTransferError("Custo medio ausente. Informe o custo no estoque.");
      return;
    }
    if (!API_BASE) {
      setTransferError("API nao configurada.");
      return;
    }
    try {
      const dataMov = transferData.data || toLocalISODate(new Date());
      const destinoItem =
        itens.find(
          (item) =>
            (item.produtoId ?? item.id) === transferData.itemId &&
            item.depositoId === transferData.destinoDepositoId
        ) ?? null;
      if (!destinoItem) {
        await createEstoqueItem({
          produtoId: origemItem.produtoId ?? origemItem.id,
          depositoId: transferData.destinoDepositoId,
          descricao: origemItem.descricao,
          quantidade: 0,
          custoMedio: origemItem.custoMedio,
          estoqueMinimo: origemItem.estoqueMinimo,
        });
      }
      await createMovimento(transferData.itemId, {
        tipo: "SAIDA",
        data: dataMov,
        quantidade: transferData.quantidade,
        custoUnitario,
        depositoId: transferData.origemDepositoId,
        origem: "MANUAL",
        observacoes:
          transferData.observacoes ||
          `Transferencia para deposito ${transferData.destinoDepositoId}`,
      });
      await createMovimento(transferData.itemId, {
        tipo: "ENTRADA",
        data: dataMov,
        quantidade: transferData.quantidade,
        custoUnitario,
        depositoId: transferData.destinoDepositoId,
        origem: "MANUAL",
        observacoes:
          transferData.observacoes ||
          `Transferencia do deposito ${transferData.origemDepositoId}`,
      });
      setTransferData({
        itemId: "",
        origemDepositoId: "",
        destinoDepositoId: "",
        quantidade: 0,
        data: "",
        observacoes: "",
      });
      loadItens();
      loadMovimentos();
    } catch {
      setTransferError("Nao foi possivel registrar a transferencia.");
    }
  };

  const selectedItem = itens.find((item) => {
    const itemKey = String(item.produtoId ?? item.id);
    if (itemKey !== movimentoData.itemId) return false;
    if (!movimentoData.depositoId) return true;
    return item.depositoId === movimentoData.depositoId;
  });

  const fornecedorLookup = useMemo(() => {
    const map = new Map<string, string>();
    fornecedores.forEach((fornecedor) => {
      map.set(String(fornecedor.id), fornecedor.nome);
    });
    return map;
  }, [fornecedores]);

  const itemLookup = useMemo(() => {
    const map = new Map<string, EstoqueResumo>();
    itens.forEach((item) => {
      const key = `${String(item.produtoId ?? item.id)}||${String(item.depositoId ?? "")}`;
      map.set(key, item);
    });
    return map;
  }, [itens]);
  const quantidadeDisponivel = selectedItem
    ? calcularQuantidadeDisponivel(
        selectedItem.quantidade,
        selectedItem.quantidadeReservada
      )
    : undefined;
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
      {
        key: "data",
        header: "Data",
        render: (row: EstoqueMovimentoResumo) => formatLocalDate(row.data),
      },
      {
        key: "item",
        header: "Item",
        render: (row: EstoqueMovimentoResumo) => {
          const key = `${String(row.itemId)}||${String(row.depositoId ?? "")}`;
          const item = itemLookup.get(key) ?? itemLookup.get(`${String(row.itemId)}||`);
          return item?.descricao || item?.item || row.itemId;
        },
      },
      { key: "tipo", header: "Tipo", render: (row: EstoqueMovimentoResumo) => row.tipo },
      {
        key: "deposito",
        header: "Deposito",
        render: (row: EstoqueMovimentoResumo) =>
          depositos.find((deposito) => deposito.id === row.depositoId)?.nome ?? "-",
      },
      {
        key: "fornecedor",
        header: "Fornecedor",
        render: (row: EstoqueMovimentoResumo) => {
          const key = `${String(row.itemId)}||${String(row.depositoId ?? "")}`;
          const item = itemLookup.get(key) ?? itemLookup.get(`${String(row.itemId)}||`);
          const fornecedorId = item?.fornecedorId;
          if (!fornecedorId) return "-";
          return fornecedorLookup.get(String(fornecedorId)) ?? fornecedorId;
        },
      },
      {
        key: "localizacao",
        header: "Localizacao",
        render: (row: EstoqueMovimentoResumo) => {
          const key = `${String(row.itemId)}||${String(row.depositoId ?? "")}`;
          const item = itemLookup.get(key) ?? itemLookup.get(`${String(row.itemId)}||`);
          return item?.localizacao ?? "-";
        },
      },
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
        render: (row: EstoqueMovimentoResumo) => row.origem ?? "-",
      },
      {
        key: "origemId",
        header: "Referencia",
        render: (row: EstoqueMovimentoResumo) => row.origemId ?? "-",
      },
      {
        key: "createdBy",
        header: "Criado por",
        render: (row: EstoqueMovimentoResumo) =>
          row.createdBy
            ? `${row.createdBy}${row.createdAt ? ` em ${formatLocalDate(row.createdAt)}` : ""}`
            : "-",
      },
      {
        key: "dedupeKey",
        header: "Chave",
        render: (row: EstoqueMovimentoResumo) => row.dedupeKey ?? "-",
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
                  dataFim:'',
                  dataInicio:'',
                  lote: row.lote ?? "",
                  serie: row.serie ?? "",
                }))
              }
            />
          ) : (
            "-"
          ),
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: EstoqueMovimentoResumo) => (
          <div className="flex justify-end">
            <AppIconButton
              icon={<UndoIcon className="h-4 w-4" />}
              label={`Estornar movimento ${row.id}`}
              onClick={() =>
                openConfirm(
                  {
                    title: "Estornar movimento",
                    description: "Deseja gerar um estorno deste movimento?",
                    confirmLabel: "Estornar",
                  },
                  async () => {
                    try {
                      await reverterMovimento(row.itemId, row);
                      setMovimentoPage(1);
                      loadItens();
                      loadMovimentos();
                    } catch {
                      setMovimentoError("Nao foi possivel estornar o movimento.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [depositos, fornecedorLookup, itemLookup, openConfirm]
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
    movimentos.forEach((mov) => {
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
  }, [movimentos]);

  const filtrosAtivos = Boolean(
    filtros.dataInicio ||
      filtros.dataFim ||
      filtros.origem ||
      filtros.lote ||
      filtros.serie ||
      filtros.depositoId
  );

  const chips = useMemo(() => {
    const entries: Array<{ key: keyof typeof filtros; label: string; value: string }> = [];
    if (filtros.dataInicio) entries.push({ key: "dataInicio", label: "Inicio", value: filtros.dataInicio });
    if (filtros.dataFim) entries.push({ key: "dataFim", label: "Fim", value: filtros.dataFim });
    if (filtros.origem) entries.push({ key: "origem", label: "Origem", value: filtros.origem });
    if (filtros.lote) entries.push({ key: "lote", label: "Lote", value: filtros.lote });
    if (filtros.serie) entries.push({ key: "serie", label: "Serie", value: filtros.serie });
    if (filtros.depositoId) {
      const deposito = depositos.find((dep) => dep.id === filtros.depositoId);
      entries.push({
        key: "depositoId",
        label: "Deposito",
        value: deposito?.nome ?? filtros.depositoId,
      });
    }
    return entries;
  }, [depositos, filtros]);

  return (
    <>
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
            onChange={(e) => {
              const value = e.target.value;
              const matches = itens.filter(
                (item) => String(item.produtoId ?? item.id) === value
              );
              setMovimentoData((prev) => ({
                ...prev,
                itemId: value,
                depositoId:
                  prev.depositoId ||
                  (matches.length === 1 ? matches[0].depositoId ?? "" : ""),
                quantidade: 0,
                custoUnitarioCents: 0,
                lote: "",
                serie: "",
                origemId: "",
                observacoes: "",
              }));
            }}
            data={itens.map((item) => ({
              value: String(item.produtoId ?? item.id),
              label:
                `${item.descricao || item.item || item.id}` +
                (item.depositoId
                  ? ` (${depositos.find((dep) => dep.id === item.depositoId)?.nome ?? item.depositoId})`
                  : "") +
                (item.localizacao ? ` - ${item.localizacao}` : "") +
                (item.fornecedorId
                  ? ` / ${fornecedorLookup.get(String(item.fornecedorId)) ?? item.fornecedorId}`
                  : ""),
            }))}
            placeholder="Selecione"
            error={fieldErrors.itemId}
          />
          <AppSelectInput
            title="Deposito"
            value={movimentoData.depositoId}
            onChange={(e) =>
              setMovimentoData((prev) => ({
                ...prev,
                depositoId: e.target.value,
                origemId: "",
                observacoes: "",
              }))
            }
            data={depositos.map((deposito) => ({
              value: deposito.id,
              label: deposito.nome,
            }))}
            placeholder={depositos.length ? "Selecione" : "Cadastre um deposito"}
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
            error={fieldErrors.observacoes}
          />
        </div>
        {isLoadingItens ? (
          <p className="mt-2 text-sm text-gray-500">Carregando itens...</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          {selectedItem ? <span>Saldo atual: {selectedItem.quantidade}</span> : null}
          {typeof quantidadeDisponivel === "number" ? (
            <span>Disponivel: {quantidadeDisponivel}</span>
          ) : null}
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
          {typeof previewSaldo === "number" && previewSaldo < 0 ? (
            <span className="text-red-600">
              Saldo negativo. Informe justificativa nas observacoes.
            </span>
          ) : null}
          {!DEFAULT_ESTOQUE_POLICY.allowNegative ? (
            <span className="text-xs text-gray-500">
              Politica: saldo negativo bloqueado.
            </span>
          ) : null}
          <span className="text-xs text-gray-500">
            Custo medio definitivo e calculado no backend.
          </span>
        </div>
        {movimentoError ? <p className="mt-2 text-sm text-red-600">{movimentoError}</p> : null}
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleMovimento}>
            Registrar movimento
          </AppButton>
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Transferencia entre depositos" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Item"
            value={transferData.itemId}
            onChange={(e) => {
              const value = e.target.value;
              const matches = itens.filter(
                (item) => String(item.produtoId ?? item.id) === value
              );
              setTransferData((prev) => ({
                ...prev,
                itemId: value,
                origemDepositoId:
                  prev.origemDepositoId ||
                  (matches.length === 1 ? matches[0].depositoId ?? "" : ""),
                quantidade: 0,
                observacoes: "",
              }));
            }}
            data={itens.map((item) => ({
              value: String(item.produtoId ?? item.id),
              label:
                `${item.descricao || item.item || item.id}` +
                (item.depositoId
                  ? ` (${depositos.find((dep) => dep.id === item.depositoId)?.nome ?? item.depositoId})`
                  : "") +
                (item.localizacao ? ` - ${item.localizacao}` : "") +
                (item.fornecedorId
                  ? ` / ${fornecedorLookup.get(String(item.fornecedorId)) ?? item.fornecedorId}`
                  : ""),
            }))}
            placeholder="Selecione"
          />
          <AppSelectInput
            title="Deposito origem"
            value={transferData.origemDepositoId}
            onChange={(e) =>
              setTransferData((prev) => ({
                ...prev,
                origemDepositoId: e.target.value,
              }))
            }
            data={depositos.map((deposito) => ({
              value: deposito.id,
              label: deposito.nome,
            }))}
            placeholder="Selecione"
          />
          <AppSelectInput
            title="Deposito destino"
            value={transferData.destinoDepositoId}
            onChange={(e) =>
              setTransferData((prev) => ({
                ...prev,
                destinoDepositoId: e.target.value,
              }))
            }
            data={depositos.map((deposito) => ({
              value: deposito.id,
              label: deposito.nome,
            }))}
            placeholder="Selecione"
          />
          <AppTextInput
            title="Quantidade"
            value={transferData.quantidade ? String(transferData.quantidade) : ""}
            sanitizeRegex={/[0-9]/g}
            onValueChange={(raw) =>
              setTransferData((prev) => ({
                ...prev,
                quantidade: Number(raw || "0"),
              }))
            }
          />
          <AppDateInput
            title="Data"
            value={transferData.data}
            onChange={(e) =>
              setTransferData((prev) => ({ ...prev, data: e.target.value }))
            }
          />
          <AppTextInput
            title="Observacoes"
            value={transferData.observacoes}
            onChange={(e) =>
              setTransferData((prev) => ({
                ...prev,
                observacoes: e.target.value,
              }))
            }
          />
        </div>
        {transferError ? (
          <p className="mt-2 text-sm text-red-600">{transferError}</p>
        ) : null}
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleTransferencia}>
            Registrar transferencia
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
            title="Deposito"
            value={filtros.depositoId}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, depositoId: e.target.value }))
            }
            data={[
              { value: "", label: "Todos" },
              ...depositos.map((deposito) => ({
                value: deposito.id,
                label: deposito.nome,
              })),
            ]}
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
                depositoId: "",
              })
            }
            disabled={!filtrosAtivos}
          >
              Limpar filtros
            </AppButton>
          </div>
        </div>
        {filtrosAtivos ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="rounded-full border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-white"
                onClick={() => setFiltros((prev) => ({ ...prev, [chip.key]: "" }))}
              >
                {chip.label}: {chip.value} ✕
              </button>
            ))}
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {isLoadingMovimentos ? (
          <p className="text-sm text-gray-500">Carregando movimentos...</p>
        ) : null}
        <AppTable
          data={movimentos}
          rowKey={(row) => row.id}
          emptyState={
            <AppListNotFound
              texto={
                isLoadingMovimentos
                  ? "Carregando movimentos..."
                  : "Nenhum movimento registrado."
              }
            />
          }
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
              render: (row) => formatLocalDate(row.ultimaData),
            },
          ]}
        />
      </Card>
      </div>
      <AppPopup {...popupProps} />
    </>
  );
};

export default EstoqueMovimentosPage;
