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
  listContasPagar,
  createContaPagar,
  updateContaPagar,
  patchContaPagar,
  deleteContaPagar,
  type ContaPagarResumo,
} from "../services/contas-pagar.service";
import { listContas } from "../services/contas.service";
import { listCategorias } from "../services/categorias.service";
import { listFornecedores, type FornecedorResumo } from "../../cadastros/services/cadastros.service";
import { formatBRL, formatLocalDate } from "../../../shared/utils/formater";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import { usePlan } from "../../../shared/context/PlanContext";
import { getPlanConfig } from "../../../app/plan/planConfig";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

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
  const [fornecedores, setFornecedores] = useState<FornecedorResumo[]>([]);
  const { popupProps, openConfirm } = useConfirmPopup();
  const { plan } = usePlan();
  const { labels } = getPlanConfig(plan);
  const contaLabels = labels.financeiro.contasPagar;
  const [contas, setContas] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [categorias, setCategorias] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [formData, setFormData] = useState({
    fornecedorId: "",
    descricao: "",
    numeroDocumento: "",
    competencia: "",
    parcela: 1,
    totalParcelas: 1,
    parcelaPaga: 0,
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
      const [contasResult, categoriasResult, fornecedoresResult] = await Promise.allSettled([
        listContas(),
        listCategorias(),
        listFornecedores({ page: 1, pageSize: 200 }),
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
      if (fornecedoresResult.status === "fulfilled") {
        setFornecedores(fornecedoresResult.value.data);
      } else {
        setFornecedores([]);
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

  const fornecedorOptions = useMemo(
    () =>
      fornecedores.map((fornecedor) => ({
        value: fornecedor.id,
        label: fornecedor.nome,
      })),
    [fornecedores]
  );

  const columns = useMemo(
    () => [
      {
        key: "fornecedor",
        header: contaLabels.table.pessoa,
        render: (row: ContaPagarResumo) =>
          fornecedorMap.get(row.fornecedorId ?? "") ||
          row.fornecedorNome ||
          row.fornecedor ||
          "-",
      },
      {
        key: "descricao",
        header: contaLabels.table.titulo,
        render: (row: ContaPagarResumo) => row.descricao ?? "-",
      },
      {
        key: "origem",
        header: contaLabels.table.origem,
        render: (row: ContaPagarResumo) =>
          row.origem ? `${row.origem}${row.origemId ? ` (${row.origemId})` : ""}` : "-",
      },
      {
        key: "dataOrigem",
        header: contaLabels.table.dataOrigem,
        render: (row: ContaPagarResumo) =>
          row.competencia ? formatLocalDate(row.competencia) : "-",
      },
      {
        key: "vencimento",
        header: contaLabels.table.vencimento,
        render: (row: ContaPagarResumo) => {
          const dataVencimento = row.vencimento
            ? new Date(`${row.vencimento}T00:00:00`)
            : null;
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const totalParcelas = row.totalParcelas ?? 1;
          const parcelaPaga = row.parcelaPaga ?? 0;
          const parcelaAberta = Math.min(parcelaPaga + 1, totalParcelas);
          const vencimentoParcela =
            totalParcelas > 1 && dataVencimento
              ? addMonths(dataVencimento, parcelaAberta - 1)
              : dataVencimento;
          const atrasada =
            vencimentoParcela &&
            vencimentoParcela.getTime() < hoje.getTime() &&
            row.status !== "PAGA" &&
            row.status !== "CANCELADA";
          const vencimentoExibido = vencimentoParcela
            ? formatLocalDate(formatDateInput(vencimentoParcela))
            : formatLocalDate(row.vencimento);
          return (
            <div className="flex items-center gap-2">
              <span>{vencimentoExibido}</span>
              {atrasada ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  Atrasada
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        key: "parcela",
        header: contaLabels.table.parcela,
        render: (row: ContaPagarResumo) =>
          row.parcela && row.totalParcelas
            ? `${row.parcela}/${row.totalParcelas}`
            : "-",
      },
      {
        key: "parcelasPagas",
        header: contaLabels.table.parcelasPagas,
        render: (row: ContaPagarResumo) =>
          row.totalParcelas
            ? `${row.parcelaPaga ?? 0}/${row.totalParcelas}`
            : "-",
      },
      {
        key: "valor",
        header: contaLabels.table.valor,
        align: "right" as const,
        render: (row: ContaPagarResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: contaLabels.table.status,
        render: (row: ContaPagarResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: contaLabels.table.acoes,
        align: "right" as const,
        render: (row: ContaPagarResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M9.5 16.5 5 12l1.4-1.4 3.1 3.1L17.6 5.6 19 7z" />
                </svg>
              }
              label={`Pagar parcela ${row.id}`}
              disabled={
                row.status === "PAGA" ||
                (row.totalParcelas
                  ? (row.parcelaPaga ?? 0) >= row.totalParcelas
                  : false)
              }
              onClick={() => {
                const totalParcelas = row.totalParcelas ?? 1;
                const parcelaPagaAtual = row.parcelaPaga ?? 0;
                const proximaParcela = parcelaPagaAtual + 1;
                if (proximaParcela > totalParcelas) return;
                openConfirm(
                  {
                    title: "Pagar parcela",
                    description: `Deseja pagar a parcela ${proximaParcela}/${totalParcelas}?`,
                    confirmLabel: "Pagar parcela",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    try {
                      setError("");
                      const status =
                        proximaParcela === totalParcelas ? "PAGA" : "ABERTA";
                      await patchContaPagar(row.id, {
                        parcelaPaga: proximaParcela,
                        status,
                        dataPagamento: new Date().toISOString().slice(0, 10),
                        valorPago: row.valor,
                      });
                      load();
                    } catch {
                      setError("Nao foi possivel pagar a parcela.");
                    }
                  }
                );
              }}
            />
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar conta ${row.id}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  fornecedorId: row.fornecedorId ?? row.fornecedor ?? "",
                  descricao: row.descricao ?? "",
                  numeroDocumento: row.numeroDocumento ?? "",
                  competencia: row.competencia ?? "",
                  parcela: row.parcela ?? 1,
                  totalParcelas: row.totalParcelas ?? 1,
                  parcelaPaga: row.parcelaPaga ?? row.parcela ?? 0,
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
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir conta ${row.id}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir conta",
                    description: "Deseja excluir esta conta a pagar?",
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
                      await deleteContaPagar(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir a conta.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [contaLabels, fornecedorMap]
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      fornecedorId: "",
      descricao: "",
      numeroDocumento: "",
      competencia: "",
      parcela: 1,
      totalParcelas: 1,
      parcelaPaga: 0,
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
    if (!formData.fornecedorId || !formData.descricao || !formData.vencimento) {
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
      if (formData.totalParcelas > 1 && !formData.parcelaPaga) {
        setFormError("Informe a parcela paga.");
        return;
      }
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      const payload = {
        fornecedorId: formData.fornecedorId,
        fornecedorNome: fornecedorMap.get(formData.fornecedorId),
        vencimento: formData.vencimento,
        valor: valorLiquidoCents,
        status: formData.status,
        descricao: formData.descricao || undefined,
        numeroDocumento: formData.numeroDocumento || undefined,
        competencia: formData.competencia || undefined,
        parcela: formData.parcela || undefined,
        totalParcelas: formData.totalParcelas || undefined,
        parcelaPaga: formData.parcelaPaga || undefined,
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
          <AppTitle text={contaLabels.title} />
          <AppSubTitle text={contaLabels.subtitle} />
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
          {formOpen ? contaLabels.closeButton : contaLabels.newButton}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <AppSelectInput
              required
              title={contaLabels.fields.pessoa}
              value={formData.fornecedorId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fornecedorId: e.target.value }))
              }
              data={fornecedorOptions}
              placeholder={
                fornecedorOptions.length
                  ? "Selecione"
                  : `Cadastre ${contaLabels.fields.pessoa.toLowerCase()}`
              }
            />
            <AppTextInput
              required
              title={contaLabels.fields.descricao}
              value={formData.descricao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descricao: e.target.value }))
              }
            />
            <AppTextInput
              title={contaLabels.fields.documento}
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
              title={contaLabels.fields.vencimento}
              value={formData.vencimento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vencimento: e.target.value }))
              }
            />
            <AppDateInput
              title={contaLabels.fields.competencia}
              type="month"
              value={formData.competencia}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, competencia: e.target.value }))
              }
            />
            <AppTextInput
              title={contaLabels.fields.parcela}
              value={formData.parcela ? String(formData.parcela) : ""}
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) =>
                setFormData((prev) => ({ ...prev, parcela: Number(raw || "0") }))
              }
            />
            <AppTextInput
              title={contaLabels.fields.totalParcelas}
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
              title={contaLabels.fields.valorTitulo}
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
              title={contaLabels.fields.desconto}
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
              title={contaLabels.fields.juros}
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
              title={contaLabels.fields.multa}
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
              title={contaLabels.fields.valorLiquido}
              value={valorLiquidoCents ? String(valorLiquidoCents) : ""}
              formatter={formatBRL}
              disabled
            />
            <AppSelectInput
              title={contaLabels.fields.status}
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              data={statusOptions}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AppDateInput
              title={contaLabels.fields.pagamento}
              value={formData.dataPagamento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dataPagamento: e.target.value }))
              }
            />
            {formData.totalParcelas > 1 ? (
              <AppSelectInput
                title={contaLabels.fields.parcelaPaga}
                value={formData.parcelaPaga ? String(formData.parcelaPaga) : ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    parcelaPaga: Number(e.target.value || "0"),
                  }))
                }
                data={Array.from({ length: formData.totalParcelas }, (_, index) => {
                  const value = index + 1;
                  return { value, label: `${value}/${formData.totalParcelas}` };
                })}
                placeholder="Selecione"
              />
            ) : null}
            <AppTextInput
              title={contaLabels.fields.valorPago}
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
              title={contaLabels.fields.formaPagamento}
              value={formData.formaPagamento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, formaPagamento: e.target.value }))
              }
              data={formaPagamentoOptions}
              placeholder="Selecione"
            />
            <AppSelectInput
              title={contaLabels.fields.conta}
              value={formData.contaId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contaId: e.target.value }))
              }
              data={contas}
              placeholder="Selecione"
            />
            <AppSelectInput
              title={contaLabels.fields.categoria}
              value={formData.categoriaId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, categoriaId: e.target.value }))
              }
              data={categorias}
              placeholder="Selecione"
            />
            <AppTextInput
              title={contaLabels.fields.observacoes}
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
          {contaLabels.apiHint}
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto={contaLabels.empty} />}
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

export default ContasPagarPage;
