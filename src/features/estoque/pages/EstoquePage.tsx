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
  listDepositos,
  createDeposito,
  updateDeposito,
  deleteDeposito,
  type EstoqueResumo,
  type EstoqueDepositoResumo,
} from "../services/estoque.service";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { formatBRL } from "../../../shared/utils/formater";
import {
  listProdutosServicos,
  listFornecedores,
  type ProdutoServicoResumo,
  type FornecedorResumo,
} from "../../cadastros/services/cadastros.service";
import DashboardStatCard from "../../../components/ui/card/DashboardStatCard";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const EstoquePage = () => {
  const [itens, setItens] = useState<EstoqueResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [catalogo, setCatalogo] = useState<ProdutoServicoResumo[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorResumo[]>([]);
  const [depositos, setDepositos] = useState<EstoqueDepositoResumo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [depositoFormOpen, setDepositoFormOpen] = useState(false);
  const [depositoError, setDepositoError] = useState("");
  const [editingDepositoId, setEditingDepositoId] = useState<string | null>(null);
  const [depositoForm, setDepositoForm] = useState({
    nome: "",
    ativo: "SIM",
    observacoes: "",
  });
  const [formData, setFormData] = useState({
    produtoId: "",
    depositoId: "",
    quantidade: 0,
    quantidadeReservada: 0,
    custoMedioCents: 0,
    estoqueMinimo: 0,
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await listEstoque({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar o estoque.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    let isMounted = true;
    const loadCatalogo = async () => {
      const result = await listProdutosServicos({ page: 1, pageSize: 200 });
      if (!isMounted) return;
      setCatalogo(result.data);
    };
    loadCatalogo().catch(() => setCatalogo([]));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadFornecedores = async () => {
      try {
        const result = await listFornecedores({ page: 1, pageSize: 200 });
        if (!isMounted) return;
        setFornecedores(result.data);
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

  const loadDepositos = async (isMountedRef?: { current: boolean }) => {
    try {
      const result = await listDepositos();
      if (isMountedRef && !isMountedRef.current) return;
      setDepositos(result);
    } catch {
      if (isMountedRef && !isMountedRef.current) return;
      setDepositos([]);
    }
  };

  useEffect(() => {
    const isMountedRef = { current: true };
    loadDepositos(isMountedRef);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const catalogoMap = useMemo(() => {
    const map = new Map<string, string>();
    catalogo.forEach((produto) => {
      map.set(String(produto.id), produto.descricao);
    });
    return map;
  }, [catalogo]);

  const catalogoLookup = useMemo(() => {
    const map = new Map<string, ProdutoServicoResumo>();
    catalogo.forEach((produto) => {
      map.set(String(produto.id), produto);
    });
    return map;
  }, [catalogo]);

  const fornecedorLookup = useMemo(() => {
    const map = new Map<string, FornecedorResumo>();
    fornecedores.forEach((fornecedor) => {
      map.set(String(fornecedor.id), fornecedor);
    });
    return map;
  }, [fornecedores]);

  const catalogoOptions = useMemo(
    () =>
      catalogo.map((produto) => ({
        value: produto.id,
        label: produto.descricao,
      })),
    [catalogo]
  );

  const columns = useMemo(
    () => [
      {
        key: "item",
        header: "Item",
        render: (row: EstoqueResumo) =>
          catalogoMap.get(row.produtoId ?? row.id) ||
          row.descricao ||
          row.item ||
          "-",
      },
      {
        key: "sku",
        header: "SKU",
        render: (row: EstoqueResumo) =>
          row.codigo ||
          catalogoLookup.get(String(row.produtoId ?? row.id))?.codigo ||
          "-",
      },
      {
        key: "unidade",
        header: "Unidade",
        render: (row: EstoqueResumo) =>
          row.unidade ||
          catalogoLookup.get(String(row.produtoId ?? row.id))?.unidade ||
          "-",
      },
      {
        key: "precoVenda",
        header: "Preco venda",
        align: "right" as const,
        render: (row: EstoqueResumo) => {
          const valor =
            row.valorUnitario ??
            catalogoLookup.get(String(row.produtoId ?? row.id))?.valorUnitario;
          if (!valor) return "-";
          return (valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
        },
      },
      {
        key: "fornecedor",
        header: "Fornecedor",
        render: (row: EstoqueResumo) => {
          const fornecedorId =
            row.fornecedorId ??
            catalogoLookup.get(String(row.produtoId ?? row.id))?.fornecedorId;
          if (!fornecedorId) return "-";
          return fornecedorLookup.get(String(fornecedorId))?.nome ?? fornecedorId;
        },
      },
      {
        key: "localizacao",
        header: "Localizacao",
        render: (row: EstoqueResumo) =>
          row.localizacao ??
          catalogoLookup.get(String(row.produtoId ?? row.id))?.localizacao ??
          "-",
      },
      {
        key: "quantidade",
        header: "Quantidade",
        align: "right" as const,
        render: (row: EstoqueResumo) => row.quantidade,
      },
      {
        key: "reservado",
        header: "Reservado",
        align: "right" as const,
        render: (row: EstoqueResumo) =>
          typeof row.quantidadeReservada === "number" ? row.quantidadeReservada : "-",
      },
      {
        key: "disponivel",
        header: "Disponivel",
        align: "right" as const,
        render: (row: EstoqueResumo) =>
          typeof row.quantidadeDisponivel === "number" ? row.quantidadeDisponivel : "-",
      },
      {
        key: "deposito",
        header: "Deposito",
        render: (row: EstoqueResumo) =>
          depositos.find((deposito) => deposito.id === row.depositoId)?.nome ?? "-",
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
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar estoque ${row.descricao ?? row.id}`}
              onClick={() => {
                if (!row.produtoId) {
                  setFormError("Este item nao possui produto vinculado.");
                  return;
                }
                setEditingId(row.id);
                setFormData({
                  produtoId: row.produtoId,
                  depositoId: row.depositoId ?? "",
                  quantidade: row.quantidade,
                  quantidadeReservada: row.quantidadeReservada ?? 0,
                  custoMedioCents: row.custoMedio ?? 0,
                  estoqueMinimo: row.estoqueMinimo ?? 0,
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir estoque ${row.descricao ?? row.id}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir item",
                    description: "Deseja excluir este item do estoque?",
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
                      await deleteEstoqueItem(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir o item.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [catalogoLookup, catalogoMap, depositos, fornecedorLookup]
  );

  const depositoColumns = useMemo(
    () => [
      { key: "nome", header: "Deposito", render: (row: EstoqueDepositoResumo) => row.nome },
      {
        key: "ativo",
        header: "Status",
        render: (row: EstoqueDepositoResumo) => (row.ativo === false ? "Inativo" : "Ativo"),
      },
      {
        key: "observacoes",
        header: "Observacoes",
        render: (row: EstoqueDepositoResumo) => row.observacoes || "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: EstoqueDepositoResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar deposito ${row.nome}`}
              onClick={() => {
                setEditingDepositoId(row.id);
                setDepositoForm({
                  nome: row.nome,
                  ativo: row.ativo === false ? "NAO" : "SIM",
                  observacoes: row.observacoes ?? "",
                });
                setDepositoError("");
                setDepositoFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir deposito ${row.nome}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir deposito",
                    description: "Deseja excluir este deposito?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    if (!API_BASE) {
                      setDepositoError("API nao configurada.");
                      return;
                    }
                    const hasItens = itens.some(
                      (item) =>
                        item.depositoId === row.id &&
                        ((item.quantidade ?? 0) > 0 ||
                          (item.quantidadeReservada ?? 0) > 0)
                    );
                    if (hasItens) {
                      setDepositoError(
                        "Nao e possivel excluir deposito com estoque vinculado."
                      );
                      return;
                    }
                    try {
                      setDepositoError("");
                      await deleteDeposito(row.id);
                      loadDepositos();
                    } catch {
                      setDepositoError("Nao foi possivel excluir o deposito.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [openConfirm]
  );

  const summary = useMemo(() => {
    const totalItens = itens.length;
    const totalQuantidade = itens.reduce((acc, item) => acc + item.quantidade, 0);
    const abaixoMinimo = itens.filter((item) => {
      const minimo = item.estoqueMinimo ?? 0;
      return minimo > 0 && item.quantidade <= minimo;
    }).length;
    const custoTotal = itens.reduce((acc, item) => {
      const custo = item.custoMedio ?? 0;
      return acc + item.quantidade * custo;
    }, 0);
    return { totalItens, totalQuantidade, abaixoMinimo, custoTotal };
  }, [itens]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      produtoId: "",
      depositoId: "",
      quantidade: 0,
      quantidadeReservada: 0,
      custoMedioCents: 0,
      estoqueMinimo: 0,
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.produtoId || formData.quantidade <= 0) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (formData.quantidadeReservada > formData.quantidade) {
      setFormError("Quantidade reservada nao pode exceder o saldo.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      const descricao = catalogoMap.get(formData.produtoId);
      const payload = {
        produtoId: formData.produtoId,
        depositoId: formData.depositoId || undefined,
        descricao,
        quantidade: formData.quantidade,
        quantidadeReservada: formData.quantidadeReservada || 0,
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

  const resetDepositoForm = () => {
    setEditingDepositoId(null);
    setDepositoForm({ nome: "", ativo: "SIM", observacoes: "" });
  };

  const handleDepositoSubmit = async () => {
    setDepositoError("");
    if (!depositoForm.nome.trim()) {
      setDepositoError("Informe o nome do deposito.");
      return;
    }
    if (!API_BASE) {
      setDepositoError("API nao configurada.");
      return;
    }
    try {
      const payload = {
        nome: depositoForm.nome.trim(),
        ativo: depositoForm.ativo === "SIM",
        observacoes: depositoForm.observacoes || undefined,
      };
      if (editingDepositoId) {
        await updateDeposito(editingDepositoId, payload);
      } else {
        await createDeposito(payload);
      }
      resetDepositoForm();
      setDepositoFormOpen(false);
      loadDepositos();
    } catch {
      setDepositoError("Nao foi possivel salvar o deposito.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Estoque" />
          <AppSubTitle text="Itens cadastrados e alerta de reposicao." />
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
            <AppSelectInput
              required
              title="Item"
              value={formData.produtoId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, produtoId: e.target.value }))
              }
              data={catalogoOptions}
              placeholder={catalogoOptions.length ? "Selecione" : "Cadastre um produto/servico"}
            />
            <AppSelectInput
              title="Deposito"
              value={formData.depositoId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, depositoId: e.target.value }))
              }
              data={depositos.map((deposito) => ({
                value: deposito.id,
                label: deposito.nome,
              }))}
              placeholder={depositos.length ? "Selecione" : "Cadastre um deposito"}
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
              title="Reservado"
              value={
                formData.quantidadeReservada
                  ? String(formData.quantidadeReservada)
                  : ""
              }
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  quantidadeReservada: Number(raw || "0"),
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
          {itens.some(
            (item) =>
              (item.estoqueMinimo ?? 0) > 0 &&
              item.quantidade <= (item.estoqueMinimo ?? 0)
          ) ? (
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DashboardStatCard
          title="Itens em estoque"
          value={String(summary.totalItens)}
          tone="blue"
        />
        <DashboardStatCard
          title="Quantidade total"
          value={String(summary.totalQuantidade)}
          tone="green"
        />
        <DashboardStatCard
          title="Abaixo do minimo"
          value={String(summary.abaixoMinimo)}
          tone="amber"
        />
        <DashboardStatCard
          title="Custo total estimado"
          value={(summary.custoTotal / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
          tone="purple"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <AppSubTitle text="Depositos" />
          <AppButton
            type="button"
            className="w-auto px-6"
            onClick={() => {
              resetDepositoForm();
              setDepositoError("");
              setDepositoFormOpen((prev) => !prev);
            }}
          >
            {depositoFormOpen ? "Fechar" : "Novo deposito"}
          </AppButton>
        </div>
        {depositoFormOpen ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <AppTextInput
              title="Nome"
              value={depositoForm.nome}
              onChange={(e) =>
                setDepositoForm((prev) => ({ ...prev, nome: e.target.value }))
              }
            />
            <AppSelectInput
              title="Ativo"
              value={depositoForm.ativo}
              onChange={(e) =>
                setDepositoForm((prev) => ({ ...prev, ativo: e.target.value }))
              }
              data={[
                { value: "SIM", label: "Ativo" },
                { value: "NAO", label: "Inativo" },
              ]}
            />
            <AppTextInput
              title="Observacoes"
              value={depositoForm.observacoes}
              onChange={(e) =>
                setDepositoForm((prev) => ({
                  ...prev,
                  observacoes: e.target.value,
                }))
              }
            />
            {depositoError ? (
              <p className="text-sm text-red-600 md:col-span-3">{depositoError}</p>
            ) : null}
            <div className="flex gap-3 md:col-span-3">
              <AppButton type="button" className="w-auto px-6" onClick={handleDepositoSubmit}>
                {editingDepositoId ? "Atualizar" : "Salvar"}
              </AppButton>
              <AppButton
                type="button"
                className="w-auto px-6"
                onClick={() => {
                  resetDepositoForm();
                  setDepositoFormOpen(false);
                }}
              >
                Cancelar
              </AppButton>
            </div>
          </div>
        ) : null}
        <div className="mt-4">
          <AppTable
            data={depositos}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhum deposito cadastrado." />}
            pagination={{ enabled: true, pageSize: 6 }}
            columns={depositoColumns}
          />
        </div>
      </Card>

      <Card tone="amber">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          API de estoque preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {isLoading ? (
          <p className="text-sm text-gray-500">Carregando estoque...</p>
        ) : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={
            <AppListNotFound
              texto={
                isLoading ? "Carregando itens..." : "Nenhum item em estoque."
              }
            />
          }
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

export default EstoquePage;
