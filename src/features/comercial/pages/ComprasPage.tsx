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
  listCompras,
  createCompra,
  updateCompra,
  deleteCompra,
  type CompraResumo,
} from "../services/comercial.service";
import {
  listFornecedores,
  listProdutosServicos,
  type FornecedorResumo,
  type ProdutoServicoResumo,
} from "../../cadastros/services/cadastros.service";
import { listContas } from "../../financeiro/services/contas.service";
import { listCategorias } from "../../financeiro/services/categorias.service";
import { createContaPagar } from "../../financeiro/services/contas-pagar.service";
import { createMovimento } from "../../estoque/services/estoque.service";
import { formatBRL, formatLocalDate } from "../../../shared/utils/formater";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "RECEBIDA", label: "Recebida" },
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

type CompraItemForm = {
  produtoId?: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
};

const emptyItem = (): CompraItemForm => ({
  produtoId: "",
  descricao: "",
  quantidade: 1,
  valorUnitario: 0,
  total: 0,
});

const calcSubtotal = (itens: CompraItemForm[]) =>
  itens.reduce((acc, item) => acc + item.total, 0);

const getCompetencia = (data: string) => (data ? data.slice(0, 7) : "");

const ComprasPage = () => {
  const [itens, setItens] = useState<CompraResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [fornecedores, setFornecedores] = useState<FornecedorResumo[]>([]);
  const [catalogo, setCatalogo] = useState<ProdutoServicoResumo[]>([]);
  const [contas, setContas] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [categorias, setCategorias] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [formData, setFormData] = useState({
    fornecedorId: "",
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
    },
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listCompras({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as compras.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    let isMounted = true;
    const loadLookups = async () => {
      const [fornecedoresResult, catalogoResult, contasResult, categoriasResult] =
        await Promise.allSettled([
          listFornecedores({ page: 1, pageSize: 200 }),
          listProdutosServicos({ page: 1, pageSize: 200 }),
          listContas(),
          listCategorias(),
        ]);
      if (!isMounted) return;
      setFornecedores(
        fornecedoresResult.status === "fulfilled" ? fornecedoresResult.value.data : []
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
    };
    loadLookups();
    return () => {
      isMounted = false;
    };
  }, []);

  const fornecedorMap = useMemo(() => {
    const map = new Map<string, string>();
    fornecedores.forEach((fornecedor) => {
      map.set(fornecedor.id, fornecedor.nome);
    });
    return map;
  }, [fornecedores]);

  const columns = useMemo(
    () => [
      {
        key: "fornecedor",
        header: "Fornecedor",
        render: (row: CompraResumo) =>
          fornecedorMap.get(row.fornecedorId ?? "") ||
          row.fornecedorNome ||
          row.fornecedor ||
          "-",
      },
      {
        key: "data",
        header: "Data",
        render: (row: CompraResumo) => formatLocalDate(row.data),
      },
      {
        key: "itens",
        header: "Itens",
        render: (row: CompraResumo) => row.itens?.length ?? 0,
      },
      {
        key: "total",
        header: "Total",
        align: "right" as const,
        render: (row: CompraResumo) =>
          (row.total / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: CompraResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: CompraResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar compra ${row.id}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  fornecedorId: row.fornecedorId ?? row.fornecedor ?? "",
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
                  },
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir compra ${row.id}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir compra",
                    description: "Deseja excluir esta compra?",
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
                      await deleteCompra(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir a compra.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [fornecedorMap]
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      fornecedorId: "",
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
      },
    });
  };

  const updateItem = (index: number, patch: Partial<CompraItemForm>) => {
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
    const produto = catalogo.find((item) => item.id === produtoId);
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
    if (!formData.fornecedorId || !formData.data) {
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
      fornecedorId: formData.fornecedorId,
      fornecedorNome: fornecedorMap.get(formData.fornecedorId),
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
      },
    };

    try {
      let postError = "";
      const saved = editingId
        ? await updateCompra(editingId, payload)
        : await createCompra(payload);
      const compraId = editingId || saved.id;

      if (!editingId && formData.financeiro.gerarConta === "SIM") {
        try {
          await createContaPagar({
            fornecedorId: formData.fornecedorId,
            fornecedorNome: fornecedorMap.get(formData.fornecedorId),
            vencimento: formData.financeiro.vencimento || formData.data,
            valor: totalCents,
            status: "ABERTA",
            origem: "COMPRA",
            origemId: compraId,
            descricao: `Compra ${compraId}`,
            numeroDocumento: compraId,
            competencia: getCompetencia(formData.data),
            formaPagamento: formData.financeiro.formaPagamento || undefined,
            contaId: formData.financeiro.contaId || undefined,
            categoriaId: formData.financeiro.categoriaId || undefined,
          });
        } catch {
          postError = "Compra salva, mas nao foi possivel gerar a conta a pagar.";
        }
      }

      if (!editingId && formData.estoque.gerarMovimento === "SIM") {
        try {
          await Promise.all(
            formData.itens
              .filter((item) => item.produtoId)
              .map((item) =>
                createMovimento(item.produtoId as string, {
                  tipo: "ENTRADA",
                  data: formData.data,
                  quantidade: item.quantidade,
                  custoUnitario: item.valorUnitario,
                  origem: "COMPRA",
                  origemId: compraId,
                  observacoes: `Compra ${compraId}`,
                })
              )
          );
        } catch {
          postError =
            postError ||
            "Compra salva, mas nao foi possivel movimentar o estoque.";
        }
      }

      resetForm();
      setFormOpen(false);
      load();
      if (postError) setError(postError);
    } catch {
      setFormError("Nao foi possivel salvar a compra.");
    }
  };

  const subtotal = calcSubtotal(formData.itens);
  const totalCents =
    subtotal + formData.freteCents + formData.impostosCents - formData.descontoCents;

  const fornecedorOptions = useMemo(
    () =>
      fornecedores.map((fornecedor) => ({
        value: fornecedor.id,
        label: fornecedor.nome,
      })),
    [fornecedores]
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
          <AppTitle text="Compras" />
          <AppSubTitle text="Pedidos, aprovacao e recebimento." />
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
          {formOpen ? "Fechar" : "Nova compra"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <AppSelectInput
              required
              title="Fornecedor"
              value={formData.fornecedorId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fornecedorId: e.target.value }))
              }
              data={fornecedorOptions}
              placeholder={fornecedorOptions.length ? "Selecione" : "Cadastre um fornecedor"}
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
              title="Gerar contas a pagar"
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
          API de compras preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma compra cadastrada." />}
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

export default ComprasPage;
