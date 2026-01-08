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
  listContasReceber,
  createContaReceber,
  updateContaReceber,
  deleteContaReceber,
  type ContaReceberResumo,
} from "../services/contas-receber.service";
import { listContas } from "../services/contas.service";
import { listCategorias } from "../services/categorias.service";
import { listClientes, type ClienteResumo } from "../../cadastros/services/cadastros.service";
import { formatBRL, formatLocalDate } from "../../../shared/utils/formater";
import { TipoMovimentoCaixa } from "../types";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import { usePlan } from "../../../shared/context/PlanContext";
import { getPlanConfig } from "../../../app/plan/planConfig";
import { registrarBaixa } from "../utils/baixas";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "RECEBIDA", label: "Recebida" },
  { value: "CANCELADA", label: "Cancelada" },
];

const formaPagamentoOptions = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO", label: "Cartao" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

const ContasReceberPage = () => {
  const [itens, setItens] = useState<ContaReceberResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const { popupProps, openConfirm } = useConfirmPopup();
  const { plan } = usePlan();
  const { labels } = getPlanConfig(plan);
  const contaLabels = labels.financeiro.contasReceber;
  const [contas, setContas] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [categorias, setCategorias] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [formData, setFormData] = useState({
    clienteId: "",
    descricao: "",
    numeroDocumento: "",
    competencia: "",
    parcela: 1,
    totalParcelas: 1,
    recorrente: false,
    vencimento: "",
    valorOriginalCents: 0,
    descontoCents: 0,
    jurosCents: 0,
    multaCents: 0,
    valorRecebidoCents: 0,
    dataRecebimento: "",
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
      const response = await listContasReceber({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as contas a receber.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    let isMounted = true;
    const loadLookups = async () => {
      const [contasResult, categoriasResult, clientesResult] = await Promise.allSettled([
        listContas(),
        listCategorias({ tipo: TipoMovimentoCaixa.ENTRADA }),
        listClientes({ page: 1, pageSize: 200 }),
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
          categoriasResult.value
            .filter((categoria) => categoria.tipo === TipoMovimentoCaixa.ENTRADA)
            .map((categoria) => ({
            value: categoria.id,
            label: categoria.nome,
          }))
        );
      } else {
        setCategorias([]);
      }
      if (clientesResult.status === "fulfilled") {
        setClientes(clientesResult.value.data);
      } else {
        setClientes([]);
      }
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

  const clienteOptions = useMemo(
    () =>
      clientes.map((cliente) => ({
        value: cliente.id,
        label: cliente.nome,
      })),
    [clientes]
  );

  const columns = useMemo(
    () => [
      {
        key: "cliente",
        header: contaLabels.table.pessoa,
        render: (row: ContaReceberResumo) =>
          clienteMap.get(row.clienteId ?? "") ||
          row.clienteNome ||
          row.cliente ||
          "-",
      },
      {
        key: "descricao",
        header: contaLabels.table.titulo,
        render: (row: ContaReceberResumo) => row.descricao ?? "-",
      },
      {
        key: "origem",
        header: contaLabels.table.origem,
        render: (row: ContaReceberResumo) =>
          row.origem ? `${row.origem}${row.origemId ? ` (${row.origemId})` : ""}` : "-",
      },
      {
        key: "dataOrigem",
        header: contaLabels.table.dataOrigem,
        render: (row: ContaReceberResumo) =>
          row.competencia ? formatLocalDate(row.competencia) : "-",
      },
      {
        key: "vencimento",
        header: contaLabels.table.vencimento,
        render: (row: ContaReceberResumo) => formatLocalDate(row.vencimento),
      },
      {
        key: "parcela",
        header: contaLabels.table.parcela,
        render: (row: ContaReceberResumo) =>
          row.recorrente
            ? "Recorrente"
            : row.parcela && row.totalParcelas
            ? `${row.parcela}/${row.totalParcelas}`
            : "-",
      },
      {
        key: "valor",
        header: contaLabels.table.valor,
        align: "right" as const,
        render: (row: ContaReceberResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: contaLabels.table.status,
        render: (row: ContaReceberResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: contaLabels.table.acoes,
        align: "right" as const,
        render: (row: ContaReceberResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar conta ${row.id}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  clienteId: row.clienteId ?? row.cliente ?? "",
                  descricao: row.descricao ?? "",
                  numeroDocumento: row.numeroDocumento ?? "",
                  competencia: row.competencia ?? "",
                  parcela: row.parcela ?? 1,
                  totalParcelas: row.totalParcelas ?? 1,
                  recorrente: row.recorrente ?? false,
                  vencimento: row.vencimento,
                  valorOriginalCents: row.valorOriginal ?? row.valor,
                  descontoCents: row.desconto ?? 0,
                  jurosCents: row.juros ?? 0,
                  multaCents: row.multa ?? 0,
                  valorRecebidoCents: row.valorRecebido ?? 0,
                  dataRecebimento: row.dataRecebimento ?? "",
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
                    description: "Deseja excluir esta conta a receber?",
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
                      await deleteContaReceber(row.id);
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
    [clienteMap, contaLabels]
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      clienteId: "",
      descricao: "",
      numeroDocumento: "",
      competencia: "",
      parcela: 1,
      totalParcelas: 1,
      recorrente: false,
      vencimento: "",
      valorOriginalCents: 0,
      descontoCents: 0,
      jurosCents: 0,
      multaCents: 0,
      valorRecebidoCents: 0,
      dataRecebimento: "",
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
    if (!formData.clienteId || !formData.descricao || !formData.vencimento) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (formData.valorOriginalCents <= 0) {
      setFormError("Informe o valor do titulo.");
      return;
    }
    if (formData.status === "RECEBIDA") {
      if (!formData.dataRecebimento || formData.valorRecebidoCents <= 0) {
        setFormError("Informe data e valor recebido.");
        return;
      }
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      const currentItem = editingId
        ? itens.find((item) => item.id === editingId)
        : undefined;
      const valorRecebidoCents =
        formData.valorRecebidoCents > 0
          ? formData.valorRecebidoCents
          : valorLiquidoCents;
      const shouldRegistrarBaixa =
        formData.status === "RECEBIDA" &&
        Boolean(formData.dataRecebimento) &&
        valorRecebidoCents > 0;
      const payload = {
        clienteId: formData.clienteId,
        clienteNome: clienteMap.get(formData.clienteId),
        vencimento: formData.vencimento,
        valor: valorLiquidoCents,
        status: formData.status,
        descricao: formData.descricao || undefined,
        numeroDocumento: formData.numeroDocumento || undefined,
        competencia: formData.competencia || undefined,
        parcela: formData.recorrente ? undefined : formData.parcela || undefined,
        totalParcelas: formData.recorrente ? undefined : formData.totalParcelas || undefined,
        recorrente: formData.recorrente,
        valorOriginal: formData.valorOriginalCents || undefined,
        desconto: formData.descontoCents || undefined,
        juros: formData.jurosCents || undefined,
        multa: formData.multaCents || undefined,
        valorRecebido: valorRecebidoCents || undefined,
        dataRecebimento: formData.dataRecebimento || undefined,
        formaPagamento: formData.formaPagamento || undefined,
        contaId: formData.contaId || undefined,
        categoriaId: formData.categoriaId || undefined,
        observacoes: formData.observacoes || undefined,
        baixas: currentItem?.baixas,
      };
      if (editingId) {
        const baixasAtualizadas = shouldRegistrarBaixa
          ? await registrarBaixa({
              tipo: "RECEBER",
              referenciaId: editingId,
              descricao: payload.descricao || "Recebimento",
              baixas: currentItem?.baixas,
              baixa: {
                data: formData.dataRecebimento,
                valor: valorRecebidoCents,
                formaPagamento: formData.formaPagamento || undefined,
                contaId: formData.contaId || undefined,
                categoriaId: formData.categoriaId || undefined,
                observacoes: formData.observacoes || undefined,
              },
            })
          : currentItem?.baixas;
        await updateContaReceber(editingId, {
          ...payload,
          baixas: baixasAtualizadas,
        });
      } else {
        const created = await createContaReceber(payload);
        if (shouldRegistrarBaixa) {
          const baixasAtualizadas = await registrarBaixa({
            tipo: "RECEBER",
            referenciaId: created.id,
            descricao: payload.descricao || "Recebimento",
            baixas: created.baixas,
            baixa: {
              data: formData.dataRecebimento,
              valor: valorRecebidoCents,
              formaPagamento: formData.formaPagamento || undefined,
              contaId: formData.contaId || undefined,
              categoriaId: formData.categoriaId || undefined,
              observacoes: formData.observacoes || undefined,
            },
          });
          await updateContaReceber(created.id, {
            ...payload,
            baixas: baixasAtualizadas,
          });
        }
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
              value={formData.clienteId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clienteId: e.target.value }))
              }
              data={clienteOptions}
              placeholder={
                clienteOptions.length
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
            {!formData.recorrente ? (
              <>
                <AppTextInput
                  title={contaLabels.fields.parcela}
                  value={formData.parcela ? String(formData.parcela) : ""}
                  sanitizeRegex={/[0-9]/g}
                  onValueChange={(raw) =>
                    setFormData((prev) => ({
                      ...prev,
                      parcela: Number(raw || "0"),
                    }))
                  }
                />
                <AppTextInput
                  title={contaLabels.fields.totalParcelas}
                  value={
                    formData.totalParcelas ? String(formData.totalParcelas) : ""
                  }
                  sanitizeRegex={/[0-9]/g}
                  onValueChange={(raw) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalParcelas: Number(raw || "0"),
                    }))
                  }
                />
              </>
            ) : null}
            <AppSelectInput
              title="Recorrente"
              value={formData.recorrente ? "SIM" : "NAO"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  recorrente: e.target.value === "SIM",
                }))
              }
              data={[
                { value: "NAO", label: "Nao" },
                { value: "SIM", label: "Sim" },
              ]}
              helperText="Cai todo mes sem quantidade de parcelas."
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
              title={contaLabels.fields.recebimento}
              value={formData.dataRecebimento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dataRecebimento: e.target.value }))
              }
            />
            <AppTextInput
              title={contaLabels.fields.valorRecebido}
              value={
                formData.valorRecebidoCents ? String(formData.valorRecebidoCents) : ""
              }
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  valorRecebidoCents: Number(raw || "0"),
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

export default ContasReceberPage;
