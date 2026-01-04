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
  listContasPagar,
  createContaPagar,
  updateContaPagar,
  deleteContaPagar,
  type ContaPagarResumo,
} from "../services/contas-pagar.service";
import { listContas } from "../services/contas.service";
import { listCategorias } from "../services/categorias.service";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "PAGA", label: "Paga" },
  { value: "CANCELADA", label: "Cancelada" },
];

const formaPagamentoOptions = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO", label: "Cartao" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

const ContasPagarPage = () => {
  const [itens, setItens] = useState<ContaPagarResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contas, setContas] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [categorias, setCategorias] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [formData, setFormData] = useState({
    fornecedor: "",
    descricao: "",
    numeroDocumento: "",
    competencia: "",
    parcela: 1,
    totalParcelas: 1,
    vencimento: "",
    valorOriginalCents: 0,
    descontoCents: 0,
    jurosCents: 0,
    multaCents: 0,
    valorPagoCents: 0,
    dataPagamento: "",
    formaPagamento: "",
    contaId: "",
    categoriaId: "",
    observacoes: "",
    status: "ABERTA",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listContasPagar({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as contas a pagar.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    let isMounted = true;
    const loadLookups = async () => {
      const [contasResult, categoriasResult] = await Promise.allSettled([
        listContas(),
        listCategorias(),
      ]);
      if (!isMounted) return;
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

  const columns = useMemo(
    () => [
      {
        key: "fornecedor",
        header: "Fornecedor",
        render: (row: ContaPagarResumo) => row.fornecedor,
      },
      {
        key: "descricao",
        header: "Titulo",
        render: (row: ContaPagarResumo) => row.descricao ?? "-",
      },
      {
        key: "origem",
        header: "Origem",
        render: (row: ContaPagarResumo) =>
          row.origem ? `${row.origem}${row.origemId ? ` (${row.origemId})` : ""}` : "-",
      },
      {
        key: "vencimento",
        header: "Vencimento",
        render: (row: ContaPagarResumo) => row.vencimento,
      },
      {
        key: "parcela",
        header: "Parcela",
        render: (row: ContaPagarResumo) =>
          row.parcela && row.totalParcelas
            ? `${row.parcela}/${row.totalParcelas}`
            : "-",
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: ContaPagarResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: ContaPagarResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ContaPagarResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  fornecedor: row.fornecedor,
                  descricao: row.descricao ?? "",
                  numeroDocumento: row.numeroDocumento ?? "",
                  competencia: row.competencia ?? "",
                  parcela: row.parcela ?? 1,
                  totalParcelas: row.totalParcelas ?? 1,
                  vencimento: row.vencimento,
                  valorOriginalCents: row.valorOriginal ?? row.valor,
                  descontoCents: row.desconto ?? 0,
                  jurosCents: row.juros ?? 0,
                  multaCents: row.multa ?? 0,
                  valorPagoCents: row.valorPago ?? 0,
                  dataPagamento: row.dataPagamento ?? "",
                  formaPagamento: row.formaPagamento ?? "",
                  contaId: row.contaId ?? "",
                  categoriaId: row.categoriaId ?? "",
                  observacoes: row.observacoes ?? "",
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
                  await deleteContaPagar(row.id);
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
      fornecedor: "",
      descricao: "",
      numeroDocumento: "",
      competencia: "",
      parcela: 1,
      totalParcelas: 1,
      vencimento: "",
      valorOriginalCents: 0,
      descontoCents: 0,
      jurosCents: 0,
      multaCents: 0,
      valorPagoCents: 0,
      dataPagamento: "",
      formaPagamento: "",
      contaId: "",
      categoriaId: "",
      observacoes: "",
      status: "ABERTA",
    });
  };

  const valorLiquidoCents =
    formData.valorOriginalCents -
    formData.descontoCents +
    formData.jurosCents +
    formData.multaCents;

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.fornecedor || !formData.descricao || !formData.vencimento) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (formData.valorOriginalCents <= 0) {
      setFormError("Informe o valor do titulo.");
      return;
    }
    if (formData.status === "PAGA") {
      if (!formData.dataPagamento || formData.valorPagoCents <= 0) {
        setFormError("Informe data e valor pago.");
        return;
      }
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      const payload = {
        fornecedor: formData.fornecedor,
        vencimento: formData.vencimento,
        valor: valorLiquidoCents,
        status: formData.status,
        descricao: formData.descricao || undefined,
        numeroDocumento: formData.numeroDocumento || undefined,
        competencia: formData.competencia || undefined,
        parcela: formData.parcela || undefined,
        totalParcelas: formData.totalParcelas || undefined,
        valorOriginal: formData.valorOriginalCents || undefined,
        desconto: formData.descontoCents || undefined,
        juros: formData.jurosCents || undefined,
        multa: formData.multaCents || undefined,
        valorPago: formData.valorPagoCents || undefined,
        dataPagamento: formData.dataPagamento || undefined,
        formaPagamento: formData.formaPagamento || undefined,
        contaId: formData.contaId || undefined,
        categoriaId: formData.categoriaId || undefined,
        observacoes: formData.observacoes || undefined,
      };
      if (editingId) {
        await updateContaPagar(editingId, payload);
      } else {
        await createContaPagar(payload);
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
          <AppTitle text="Contas a pagar" />
          <AppSubTitle text="Controle titulos, vencimentos e baixas." />
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
          <div className="grid gap-4 md:grid-cols-3">
            <AppTextInput
              required
              title="Fornecedor"
              value={formData.fornecedor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fornecedor: e.target.value }))
              }
            />
            <AppTextInput
              required
              title="Titulo"
              value={formData.descricao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descricao: e.target.value }))
              }
            />
            <AppTextInput
              title="Documento"
              value={formData.numeroDocumento}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  numeroDocumento: e.target.value,
                }))
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
              title="Competencia"
              value={formData.competencia}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, competencia: e.target.value }))
              }
            />
            <AppTextInput
              title="Parcela"
              value={formData.parcela ? String(formData.parcela) : ""}
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) =>
                setFormData((prev) => ({ ...prev, parcela: Number(raw || "0") }))
              }
            />
            <AppTextInput
              title="Total parcelas"
              value={formData.totalParcelas ? String(formData.totalParcelas) : ""}
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  totalParcelas: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              required
              title="Valor do titulo"
              value={
                formData.valorOriginalCents ? String(formData.valorOriginalCents) : ""
              }
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  valorOriginalCents: Number(raw || "0"),
                }))
              }
            />
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
              title="Juros"
              value={formData.jurosCents ? String(formData.jurosCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  jurosCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Multa"
              value={formData.multaCents ? String(formData.multaCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  multaCents: Number(raw || "0"),
                }))
              }
            />
            <AppTextInput
              title="Valor liquido"
              value={valorLiquidoCents ? String(valorLiquidoCents) : ""}
              formatter={formatBRL}
              disabled
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

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AppDateInput
              title="Pagamento"
              value={formData.dataPagamento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dataPagamento: e.target.value }))
              }
            />
            <AppTextInput
              title="Valor pago"
              value={formData.valorPagoCents ? String(formData.valorPagoCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  valorPagoCents: Number(raw || "0"),
                }))
              }
            />
            <AppSelectInput
              title="Forma de pagamento"
              value={formData.formaPagamento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, formaPagamento: e.target.value }))
              }
              data={formaPagamentoOptions}
              placeholder="Selecione"
            />
            <AppSelectInput
              title="Conta"
              value={formData.contaId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contaId: e.target.value }))
              }
              data={contas}
              placeholder="Selecione"
            />
            <AppSelectInput
              title="Categoria"
              value={formData.categoriaId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, categoriaId: e.target.value }))
              }
              data={categorias}
              placeholder="Selecione"
            />
            <AppTextInput
              title="Observacoes"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, observacoes: e.target.value }))
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
          API de contas a pagar preparada para o backend.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma conta a pagar." />}
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

export default ContasPagarPage;
