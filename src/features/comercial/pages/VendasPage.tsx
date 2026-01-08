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
import {
  listVendas,
  createVenda,
  updateVenda,
  deleteVenda,
  type VendaResumo,
} from "../services/comercial.service";
import { listDepositos, type EstoqueDepositoResumo } from "../../estoque/services/estoque.service";
import {
  listClientes,
  listProdutosServicos,
  type ClienteResumo,
  type ProdutoServicoResumo,
} from "../../cadastros/services/cadastros.service";
import { listContas } from "../../financeiro/services/contas.service";
import { listCategorias } from "../../financeiro/services/categorias.service";
import { createContaReceber } from "../../financeiro/services/contas-receber.service";
import {
  gerarMovimentosParaVenda,
  reservarEstoqueParaVenda,
  liberarReservaVenda,
} from "../../estoque/utils/comercialMovimentos";
import { formatBRL, formatLocalDate } from "../../../shared/utils/formater";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "FATURADA", label: "Faturada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const yesNoOptions = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Nao" },
];

const formaPagamentoOptions = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO", label: "Cartao" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

type VendaItemForm = {
  produtoId?: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
};

const emptyItem = (): VendaItemForm => ({
  produtoId: "",
  descricao: "",
  quantidade: 1,
  valorUnitario: 0,
  total: 0,
});

const calcSubtotal = (itens: VendaItemForm[]) =>
  itens.reduce((acc, item) => acc + item.total, 0);

const getCompetencia = (data: string) => (data ? data.slice(0, 7) : "");

const VendasPage = () => {
  const [itens, setItens] = useState<VendaResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [catalogo, setCatalogo] = useState<ProdutoServicoResumo[]>([]);
  const [depositos, setDepositos] = useState<EstoqueDepositoResumo[]>([]);
  const [contas, setContas] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [categorias, setCategorias] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [formData, setFormData] = useState({
    clienteId: "",
    data: "",
    status: "ABERTA",
    itens: [emptyItem()],
    descontoCents: 0,
    freteCents: 0,
    impostosCents: 0,
    observacoes: "",
    financeiro: {
      gerarConta: "NAO",
      contaId: "",
      categoriaId: "",
      vencimento: "",
      formaPagamento: "",
    },
    estoque: {
      gerarMovimento: "SIM",
      depositoId: "",
    },
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

  useEffect(() => {
    let isMounted = true;
    const loadLookups = async () => {
      const [
        clientesResult,
        catalogoResult,
        contasResult,
        categoriasResult,
        depositosResult,
      ] = await Promise.allSettled([
        listClientes({ page: 1, pageSize: 200 }),
        listProdutosServicos({ page: 1, pageSize: 200 }),
        listContas(),
        listCategorias(),
        listDepositos(),
      ]);
      if (!isMounted) return;
      setClientes(
        clientesResult.status === "fulfilled" ? clientesResult.value.data : []
      );
      setCatalogo(
        catalogoResult.status === "fulfilled" ? catalogoResult.value.data : []
      );
      if (contasResult.status === "fulfilled") {
        setContas(
          contasResult.value.map((conta) => ({
            value: conta.id,
            label: `${conta.nome} (${conta.banco})`,
          }))
        );
      } else {
        setContas([]);
      }
      if (categoriasResult.status === "fulfilled") {
        setCategorias(
          categoriasResult.value.map((categoria) => ({
            value: categoria.id,
            label: categoria.nome,
          }))
        );
      } else {
        setCategorias([]);
      }
      setDepositos(
        depositosResult.status === "fulfilled" ? depositosResult.value : []
      );
    };
    loadLookups();
    return () => {
      isMounted = false;
    };
  }, []);

  const clienteMap = useMemo(() => {
    const map = new Map<string, string>();
    clientes.forEach((cliente) => {
      map.set(cliente.id, cliente.nome);
    });
    return map;
  }, [clientes]);

  const columns = useMemo(
    () => [
      {
        key: "cliente",
        header: "Cliente",
        render: (row: VendaResumo) =>
          clienteMap.get(row.clienteId ?? "") ||
          row.clienteNome ||
          row.cliente ||
          "-",
      },
      {
        key: "data",
        header: "Data",
        render: (row: VendaResumo) => formatLocalDate(row.data),
      },
      {
        key: "itens",
        header: "Itens",
        render: (row: VendaResumo) => row.itens?.length ?? 0,
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
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar venda ${row.id}`}
              onClick={() => {
                setEditingId(row.id);
                setEditingStatus(row.status ?? "ABERTA");
                setFormData({
                  clienteId: row.clienteId ?? row.cliente ?? "",
                  data: row.data,
                  status: row.status ?? "ABERTA",
                  itens: row.itens?.length ? row.itens : [emptyItem()],
                  descontoCents: row.desconto ?? 0,
                  freteCents: row.frete ?? 0,
                  impostosCents: row.impostos ?? 0,
                  observacoes: row.observacoes ?? "",
                  financeiro: {
                    gerarConta: row.financeiro?.gerarConta ? "SIM" : "NAO",
                    contaId: row.financeiro?.contaId ?? "",
                    categoriaId: row.financeiro?.categoriaId ?? "",
                    vencimento: row.financeiro?.vencimento ?? "",
                    formaPagamento: row.financeiro?.formaPagamento ?? "",
                  },
                  estoque: {
                    gerarMovimento: row.estoque?.gerarMovimento ? "SIM" : "NAO",
                    depositoId: row.estoque?.depositoId ?? "",
                  },
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir venda ${row.id}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir venda",
                    description: "Deseja excluir esta venda?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    try {
                      setError("");
                      await deleteVenda(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir a venda.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [clienteMap]
  );

  const resetForm = () => {
    setEditingId(null);
    setEditingStatus(null);
    setFormData({
      clienteId: "",
      data: "",
      status: "ABERTA",
      itens: [emptyItem()],
      descontoCents: 0,
      freteCents: 0,
      impostosCents: 0,
      observacoes: "",
      financeiro: {
        gerarConta: "NAO",
        contaId: "",
        categoriaId: "",
        vencimento: "",
        formaPagamento: "",
      },
      estoque: {
        gerarMovimento: "SIM",
        depositoId: "",
      },
    });
  };

  const updateItem = (index: number, patch: Partial<VendaItemForm>) => {
    setFormData((prev) => {
      const nextItens = prev.itens.map((item, idx) => {
        if (idx !== index) return item;
        const merged = { ...item, ...patch };
        const totalItem =
          Math.max(0, merged.quantidade) * Math.max(0, merged.valorUnitario);
        return { ...merged, total: totalItem };
      });
      return { ...prev, itens: nextItens };
    });
  };

  const handleSelectProduto = (index: number, produtoId: string) => {
    const produto = catalogo.find((item) => String(item.id) === produtoId);
    if (!produto) {
      updateItem(index, { produtoId, descricao: "" });
      return;
    }
    updateItem(index, {
      produtoId,
      descricao: produto.descricao,
      valorUnitario: produto.valorUnitario ?? 0,
    });
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, itens: [...prev.itens, emptyItem()] }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.clienteId || !formData.data) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    const hasInvalidItem = formData.itens.some(
      (item) => !item.descricao || item.quantidade <= 0 || item.valorUnitario <= 0
    );
    if (!formData.itens.length || hasInvalidItem) {
      setFormError("Informe os itens com quantidade e valor.");
      return;
    }
    if (formData.estoque.gerarMovimento === "SIM") {
      const missingProduto = formData.itens.some((item) => !item.produtoId);
      if (missingProduto) {
        setFormError("Selecione o item do catalogo para movimentar o estoque.");
        return;
      }
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    if (formData.financeiro.gerarConta === "SIM") {
      if (!formData.financeiro.contaId || !formData.financeiro.categoriaId) {
        setFormError("Informe a conta e a categoria para gerar financeiro.");
        return;
      }
    }

    const subtotal = calcSubtotal(formData.itens);
    const totalCents =
      subtotal + formData.freteCents + formData.impostosCents - formData.descontoCents;

    const payload = {
      clienteId: formData.clienteId,
      clienteNome: clienteMap.get(formData.clienteId),
      data: formData.data,
      status: formData.status,
      itens: formData.itens,
      subtotal,
      desconto: formData.descontoCents,
      frete: formData.freteCents,
      impostos: formData.impostosCents,
      total: totalCents,
      observacoes: formData.observacoes || undefined,
      financeiro: {
        gerarConta: formData.financeiro.gerarConta === "SIM",
        contaId: formData.financeiro.contaId || undefined,
        categoriaId: formData.financeiro.categoriaId || undefined,
        vencimento: formData.financeiro.vencimento || undefined,
        formaPagamento: formData.financeiro.formaPagamento || undefined,
      },
      estoque: {
        gerarMovimento: formData.estoque.gerarMovimento === "SIM",
        depositoId: formData.estoque.depositoId || undefined,
      },
    };

    try {
      let postError = "";
      const saved = editingId
        ? await updateVenda(editingId, payload)
        : await createVenda(payload);
      const vendaId = editingId || saved.id;

      const itensComProduto = formData.itens.filter((item) => item.produtoId);
      const shouldMovimentar = formData.estoque.gerarMovimento === "SIM";
      const nextStatus = formData.status;
      const prevStatus = editingStatus ?? "";
      const isAprovada = nextStatus === "APROVADA";
      const wasAprovada = prevStatus === "APROVADA";
      const isFaturada = nextStatus === "FATURADA";
      const wasFaturada = prevStatus === "FATURADA";
      const isCancelada = nextStatus === "CANCELADA";

      if (!editingId && formData.financeiro.gerarConta === "SIM") {
        try {
          await createContaReceber({
            clienteId: formData.clienteId,
            clienteNome: clienteMap.get(formData.clienteId),
            vencimento: formData.financeiro.vencimento || formData.data,
            valor: totalCents,
            status: "ABERTA",
            origem: "VENDA",
            origemId: vendaId,
            descricao: `Venda ${vendaId}`,
            numeroDocumento: vendaId,
            competencia: getCompetencia(formData.data),
            formaPagamento: formData.financeiro.formaPagamento || undefined,
            contaId: formData.financeiro.contaId || undefined,
            categoriaId: formData.financeiro.categoriaId || undefined,
          });
        } catch {
          postError = "Venda salva, mas nao foi possivel gerar a conta a receber.";
        }
      }

      if (!editingId && shouldMovimentar) {
        if (isAprovada) {
          try {
            await reservarEstoqueParaVenda({
              itens: itensComProduto,
              depositoId: formData.estoque.depositoId || undefined,
            });
          } catch {
            postError = postError || "Venda salva, mas nao foi possivel reservar o estoque.";
          }
        }
        if (isFaturada) {
          try {
            await gerarMovimentosParaVenda({
              itens: itensComProduto,
              data: formData.data,
              vendaId,
              movimentoTipo: "SAIDA",
              depositoId: formData.estoque.depositoId || undefined,
            });
          } catch {
            postError =
              postError ||
              "Venda salva, mas nao foi possivel movimentar o estoque.";
          }
        }
      } else if (editingId && shouldMovimentar) {
        if (isAprovada && !wasAprovada) {
          try {
            await reservarEstoqueParaVenda({
              itens: itensComProduto,
              depositoId: formData.estoque.depositoId || undefined,
            });
          } catch {
            postError = postError || "Nao foi possivel reservar o estoque.";
          }
        }
        if (isCancelada && wasAprovada) {
          try {
            await liberarReservaVenda({
              itens: itensComProduto,
              depositoId: formData.estoque.depositoId || undefined,
            });
          } catch {
            postError = postError || "Nao foi possivel liberar a reserva.";
          }
        }
        if (isFaturada && !wasFaturada) {
          try {
            await gerarMovimentosParaVenda({
              itens: itensComProduto,
              data: formData.data,
              vendaId,
              movimentoTipo: "SAIDA",
              depositoId: formData.estoque.depositoId || undefined,
            });
          } catch {
            postError = postError || "Movimento nao gerado apos atualizar venda.";
          }
          if (wasAprovada) {
            try {
              await liberarReservaVenda({
                itens: itensComProduto,
                depositoId: formData.estoque.depositoId || undefined,
              });
            } catch {
              postError = postError || "Nao foi possivel liberar a reserva.";
            }
          }
        }
      }

      resetForm();
      setFormOpen(false);
      load();
      if (postError) setError(postError);
    } catch {
      setFormError("Nao foi possivel salvar a venda.");
    }
  };

  const subtotal = calcSubtotal(formData.itens);
  const totalCents =
    subtotal + formData.freteCents + formData.impostosCents - formData.descontoCents;

  const clienteOptions = useMemo(
    () =>
      clientes.map((cliente) => ({
        value: cliente.id,
        label: cliente.nome,
      })),
    [clientes]
  );

  const produtoOptions = useMemo(
    () =>
      catalogo.map((produto) => ({
        value: produto.id,
        label: produto.descricao,
      })),
    [catalogo]
  );

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
          <div className="grid gap-4 md:grid-cols-3">
            <AppSelectInput
              required
              title="Cliente"
              value={formData.clienteId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clienteId: e.target.value }))
              }
              data={clienteOptions}
              placeholder={clienteOptions.length ? "Selecione" : "Cadastre um cliente"}
            />
            <AppDateInput
              required
              title="Data"
              value={formData.data}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, data: e.target.value }))
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

          <div className="mt-6">
            <AppSubTitle text="Itens" />
            <div className="mt-3 flex flex-col gap-4">
              {formData.itens.map((item, index) => (
                <div
                  key={`item-${index}`}
                  className="grid gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-6"
                >
                  <AppSelectInput
                    title="Catalogo"
                    value={item.produtoId ?? ""}
                    onChange={(e) => handleSelectProduto(index, e.target.value)}
                    data={produtoOptions}
                    placeholder="Selecione"
                  />
                  <div className="md:col-span-2">
                    <AppTextInput
                      required
                      title="Descricao"
                      value={item.descricao}
                      onChange={(e) =>
                        updateItem(index, { descricao: e.target.value })
                      }
                    />
                  </div>
                  <AppTextInput
                    required
                    title="Qtd"
                    value={item.quantidade ? String(item.quantidade) : ""}
                    sanitizeRegex={/[0-9]/g}
                    onValueChange={(raw) =>
                      updateItem(index, { quantidade: Number(raw || "0") })
                    }
                  />
                  <AppTextInput
                    required
                    title="Valor unitario"
                    value={item.valorUnitario ? String(item.valorUnitario) : ""}
                    sanitizeRegex={/[0-9]/g}
                    formatter={formatBRL}
                    onValueChange={(raw) =>
                      updateItem(index, { valorUnitario: Number(raw || "0") })
                    }
                  />
                  <AppTextInput
                    title="Total"
                    value={item.total ? String(item.total) : ""}
                    formatter={formatBRL}
                    disabled
                  />
                  <div className="flex items-end">
                    <AppButton
                      type="button"
                      className="w-auto"
                      onClick={() => removeItem(index)}
                      disabled={formData.itens.length === 1}
                    >
                      Remover
                    </AppButton>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <AppButton type="button" className="w-auto" onClick={addItem}>
                Adicionar item
              </AppButton>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AppTextInput
              title="Desconto"
              value={formData.descontoCents ? String(formData.descontoCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  descontoCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Frete"
              value={formData.freteCents ? String(formData.freteCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  freteCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Impostos"
              value={formData.impostosCents ? String(formData.impostosCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  impostosCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Subtotal"
              value={subtotal ? String(subtotal) : ""}
              formatter={formatBRL}
              disabled
            />
            <AppTextInput
              title="Total"
              value={totalCents ? String(totalCents) : ""}
              formatter={formatBRL}
              disabled
            />
            <AppTextInput
              title="Observacoes"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, observacoes: e.target.value }))
              }
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AppSelectInput
              title="Gerar contas a receber"
              value={formData.financeiro.gerarConta}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  financeiro: { ...prev.financeiro, gerarConta: e.target.value },
                }))
              }
              data={yesNoOptions}
            />
            <AppSelectInput
              title="Conta"
              value={formData.financeiro.contaId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  financeiro: { ...prev.financeiro, contaId: e.target.value },
                }))
              }
              data={contas}
              placeholder="Selecione"
            />
            <AppSelectInput
              title="Categoria"
              value={formData.financeiro.categoriaId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  financeiro: { ...prev.financeiro, categoriaId: e.target.value },
                }))
              }
              data={categorias}
              placeholder="Selecione"
            />
            <AppDateInput
              title="Vencimento"
              value={formData.financeiro.vencimento}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  financeiro: { ...prev.financeiro, vencimento: e.target.value },
                }))
              }
            />
            <AppSelectInput
              title="Forma de pagamento"
              value={formData.financeiro.formaPagamento}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  financeiro: { ...prev.financeiro, formaPagamento: e.target.value },
                }))
              }
              data={formaPagamentoOptions}
              placeholder="Selecione"
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AppSelectInput
              title="Movimentar estoque"
              value={formData.estoque.gerarMovimento}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estoque: { ...prev.estoque, gerarMovimento: e.target.value },
                }))
              }
              data={yesNoOptions}
            />
            <AppSelectInput
              title="Deposito"
              value={formData.estoque.depositoId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estoque: { ...prev.estoque, depositoId: e.target.value },
                }))
              }
              data={depositos.map((deposito) => ({
                value: deposito.id,
                label: deposito.nome,
              }))}
              placeholder={depositos.length ? "Selecione" : "Cadastre um deposito"}
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
      <AppPopup {...popupProps} />
    </div>
  );
};

export default VendasPage;
