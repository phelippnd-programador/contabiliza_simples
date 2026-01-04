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
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

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
        listCategorias(),
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
          categoriasResult.value.map((categoria) => ({
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
        header: "Cliente",
        render: (row: ContaReceberResumo) =>
          clienteMap.get(row.clienteId ?? "") ||
          row.clienteNome ||
          row.cliente ||
          "-",
      },
      {
        key: "descricao",
        header: "Titulo",
        render: (row: ContaReceberResumo) => row.descricao ?? "-",
      },
      {
        key: "origem",
        header: "Origem",
        render: (row: ContaReceberResumo) =>
          row.origem ? `${row.origem}${row.origemId ? ` (${row.origemId})` : ""}` : "-",
      },
      {
        key: "vencimento",
        header: "Vencimento",
        render: (row: ContaReceberResumo) => formatLocalDate(row.vencimento),
      },
      {
        key: "parcela",
        header: "Parcela",
        render: (row: ContaReceberResumo) =>
          row.parcela && row.totalParcelas
            ? `${row.parcela}/${row.totalParcelas}`
            : "-",
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: ContaReceberResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: ContaReceberResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
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
    [clienteMap]
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
      const payload = {
        clienteId: formData.clienteId,
        clienteNome: clienteMap.get(formData.clienteId),
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
        valorRecebido: formData.valorRecebidoCents || undefined,
        dataRecebimento: formData.dataRecebimento || undefined,
        formaPagamento: formData.formaPagamento || undefined,
        contaId: formData.contaId || undefined,
        categoriaId: formData.categoriaId || undefined,
        observacoes: formData.observacoes || undefined,
      };
      if (editingId) {
        await updateContaReceber(editingId, payload);
      } else {
        await createContaReceber(payload);
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
          <AppTitle text="Contas a receber" />
          <AppSubTitle text="Controle cobrancas e recebimentos." />
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
            <AppDateInput
              title="Competencia"
              type="month"
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
              title="Recebimento"
              value={formData.dataRecebimento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dataRecebimento: e.target.value }))
              }
            />
            <AppTextInput
              title="Valor recebido"
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
          API de contas a receber preparada para o backend.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma conta a receber." />}
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
