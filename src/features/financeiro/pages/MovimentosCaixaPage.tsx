import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import { CnaePicker } from "../../../components/ui/picked/CnaePicker";
import type { CnaeItem } from "../../../shared/services/ibgeCnae";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { listContas } from "../services/contas.service";
import { listCategorias } from "../services/categorias.service";
import { listCentrosCusto } from "../../rh/services/rh.service";
import {
  deleteMovimento,
  listMovimentos,
  saveMovimento,
} from "../services/movimentos.service";
import {
  TipoMovimentoCaixa,
  TipoReferenciaMovimentoCaixa,
  type CategoriaMovimento,
  type ContaBancaria,
  type MovimentoCaixa,
} from "../types";
import { formatBRL, formatLocalDate } from "../../../shared/utils/formater";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import type { CentroCusto } from "../../rh/types/rh.types";


const tipoMovimentoOptions = [
  { value: TipoMovimentoCaixa.ENTRADA, label: "Entrada" },
  { value: TipoMovimentoCaixa.SAIDA, label: "Saida" },
];

const emptyForm: Omit<MovimentoCaixa, "id"> = {
  data: "",
  contaId: "",
  tipo: TipoMovimentoCaixa.SAIDA,
  valor: 0,
  descricao: "",
  competencia: "",
  cnae: "",
  categoriaId: "",
  centroCustoId: "",
};

const MovimentosCaixaPage = () => {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [form, setForm] = useState({ id: "", ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cnaeItem, setCnaeItem] = useState<CnaeItem | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();

  const refresh = async () => setMovimentos(await listMovimentos());

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [contasData, categoriasData, centrosResult] = await Promise.all([
        listContas(),
        listCategorias(),
        listCentrosCusto({ page: 1, pageSize: 200 }),
      ]);
      if (!isMounted) return;
      setContas(contasData);
      setCategorias(categoriasData);
      setCentrosCusto(centrosResult.data);
      await refresh();
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!form.cnae) {
      setCnaeItem(null);
      return;
    }
    setCnaeItem({ codigo: form.cnae, descricao: "" });
  }, [form.cnae]);

  const contaOptions = useMemo(
    () =>
      contas.map((conta) => ({
        value: conta.id,
        label: `${conta.nome} (${conta.banco})`,
      })),
    [contas]
  );

  const categoriaOptions = useMemo(
    () =>
      categorias.map((categoria) => ({
        value: categoria.id,
        label: categoria.nome,
      })),
    [categorias]
  );

  const centroCustoOptions = useMemo(
    () =>
      centrosCusto.map((centro) => ({
        value: centro.id,
        label: centro.nome,
      })),
    [centrosCusto]
  );

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.data) nextErrors.data = "Informe a data";
    if (!form.contaId) nextErrors.contaId = "Selecione a conta";
    if (!form.categoriaId) nextErrors.categoriaId = "Selecione a categoria";
    if (!form.valor || form.valor <= 0) nextErrors.valor = "Informe o valor";
    if (!form.tipo) nextErrors.tipo = "Selecione o tipo";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await saveMovimento({
        id: form.id || undefined,
        data: form.data,
        contaId: form.contaId,
        tipo: form.tipo,
        valor: Number(form.valor),
        descricao: form.descricao || undefined,
        competencia: form.competencia || undefined,
        cnae: form.cnae || undefined,
        categoriaId: form.categoriaId,
        centroCustoId: form.centroCustoId || undefined,
      });
      setErrors({});
      setForm({ id: "", ...emptyForm });
      await refresh();
    } catch (err) {
      if (err instanceof Error && err.message === "COMPETENCIA_FECHADA") {
        setErrors((prev) => ({ ...prev, competencia: "Competencia fechada." }));
        return;
      }
    }
  };

  const handleEdit = (movimento: MovimentoCaixa) => {
    setForm({
      id: movimento.id,
      data: movimento.data,
      contaId: movimento.contaId,
      tipo: movimento.tipo,
      valor: movimento.valor,
      descricao: movimento.descricao ?? "",
      competencia: movimento.competencia ?? "",
      cnae: movimento.cnae ?? "",
      categoriaId: movimento.categoriaId ?? "",
      centroCustoId: movimento.centroCustoId ?? "",
    });
    setErrors({});
  };

  const handleRemove = (movimento: MovimentoCaixa) => {
    openConfirm(
      {
        title: "Remover movimento",
        description: "Deseja remover este movimento de caixa?",
        confirmLabel: "Remover",
        tone: "danger",
      },
      async () => {
        try {
          await deleteMovimento(movimento.id);
          if (form.id === movimento.id) {
            setForm({ id: "", ...emptyForm });
          }
          await refresh();
        } catch (err) {
          if (err instanceof Error && err.message === "COMPETENCIA_FECHADA") {
            setErrors((prev) => ({ ...prev, competencia: "Competencia fechada." }));
          }
        }
      }
    );
  };

  const handleReset = () => {
    setForm({ id: "", ...emptyForm });
    setErrors({});
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <AppTitle text="Lancamento de caixa" />
        <AppSubTitle text="Registre entradas e saidas do financeiro." />
      </div>

      <Card>
        <AppSubTitle text="Novo movimento" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Preencha os dados basicos do movimento de caixa.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppDateInput
            required
            title="Data"
            type="date"
            value={form.data}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, data: e.target.value }))
            }
            error={errors.data}
          />

          <AppSelectInput
            required
            title="Conta"
            value={form.contaId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, contaId: e.target.value }))
            }
            data={contaOptions}
            placeholder="Selecione"
            error={errors.contaId}
          />

          <AppSelectInput
            required
            title="Tipo"
            value={form.tipo}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tipo: e.target.value as TipoMovimentoCaixa,
              }))
            }
            data={tipoMovimentoOptions}
            error={errors.tipo}
          />

          <AppTextInput
            required
            title="Valor"
            value={form.valor ? String(form.valor) : ""}
            onChange={(raw) =>
              setForm((prev) => ({
                ...prev,
                valor: raw ? Number(raw) : 0,
              }))
            }
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            error={errors.valor}
          />
          {/* <AppTextInput
            // onValueChange={v => setRbt12(v)}
            onChange={v => setRbt12(v.target.value)}
            value={rbt12}
            onValueChange={(v) =>
              setForm((p: EmpresaFormData) => ({ ...p, rbt12: Number(v) }))
            }
            error={errors.rbt12}
            formatter={(v) => formatBRLRangeClamp(v, 0, 4800000)}
            sanitizeRegex={/[0-9]/g} required title='RBT12'
            tooltip='RBT12 = Receita Bruta Total acumulada dos últimos 12 meses.'
            placeholder='' /> */}

          <AppSelectInput
            required
            title="Categoria"
            value={form.categoriaId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, categoriaId: e.target.value }))
            }
            data={categoriaOptions}
            placeholder="Selecione"
            error={errors.categoriaId}
          />

          <AppTextInput
            title="Descricao"
            value={form.descricao ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, descricao: e.target.value }))
            }
          />

          <AppSelectInput
            title="Centro de custo"
            value={form.centroCustoId ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, centroCustoId: e.target.value }))
            }
            data={centroCustoOptions}
            placeholder="Selecione"
          />

          <AppDateInput
            title="Competencia"
            type="month"
            value={form.competencia ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, competencia: e.target.value }))
            }
            error={errors.competencia}
          />

          <CnaePicker
            label="CNAE (opcional)"
            value={cnaeItem}
            onChange={(item) => setCnaeItem(item)}
            onChangeCodigo={(codigo) =>
              setForm((prev) => ({ ...prev, cnae: codigo ?? "" }))
            }
            helperText="Selecione um CNAE se o movimento estiver vinculado."
          />
        </div>

        <div className="mt-6 flex gap-2">
          <AppButton type="button" className="w-auto" onClick={handleSave}>
            {form.id ? "Atualizar" : "Salvar"}
          </AppButton>
          <AppButton type="button" className="w-auto" onClick={handleReset}>
            Limpar
          </AppButton>
        </div>

        <div className="mt-6">
          <AppTable
            data={movimentos}
            rowKey={(row) => row.id}
            emptyState={
              <AppListNotFound texto="Nenhum movimento cadastrado ainda." />
            }
            pagination={{ enabled: true, pageSize: 8 }}
            columns={[
              {
                key: "data",
                header: "Data",
                render: (movimento) => formatLocalDate(movimento.data),
              },
              {
                key: "conta",
                header: "Conta",
                render: (movimento) =>
                  contaOptions.find((conta) => conta.value === movimento.contaId)
                    ?.label ?? "Conta removida",
              },
              {
                key: "tipo",
                header: "Tipo",
                render: (movimento) =>
                  movimento.tipo === TipoMovimentoCaixa.ENTRADA
                    ? "Entrada"
                    : "Saida",
              },
              {
                key: "valor",
                header: "Valor",
                align: "right",
                render: (movimento) => movimento.valor.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }),
              },
              {
                key: "categoria",
                header: "Categoria",
                render: (movimento) =>
                  categoriaOptions.find(
                    (categoria) => categoria.value === movimento.categoriaId
                  )?.label ?? "Categoria removida",
              },
              {
                key: "centroCusto",
                header: "Centro de custo",
                render: (movimento) =>
                  centroCustoOptions.find(
                    (centro) => centro.value === movimento.centroCustoId
                  )?.label ?? "-",
              },
              {
                key: "referencia",
                header: "Origem",
                render: (movimento) => {
                  if (!movimento.referencia) return "-";
                  const tipo =
                    movimento.referencia.tipo === TipoReferenciaMovimentoCaixa.RECEITA
                      ? "Receber"
                      : movimento.referencia.tipo === TipoReferenciaMovimentoCaixa.DESPESA
                      ? "Pagar"
                      : movimento.referencia.tipo === TipoReferenciaMovimentoCaixa.CARTAO_FATURA
                      ? "Cartao"
                      : movimento.referencia.tipo;
                  return `${tipo} #${movimento.referencia.id}`;
                },
              },
              {
                key: "acoes",
                header: "Acoes",
                align: "right",
                render: (movimento) => (
                  <div className="flex justify-end gap-2">
                    <AppIconButton
                      icon={<EditIcon className="h-4 w-4" />}
                      label="Editar movimento"
                      onClick={() => handleEdit(movimento)}
                    />
                    <AppIconButton
                      icon={<TrashIcon className="h-4 w-4" />}
                      label="Remover movimento"
                      variant="danger"
                      onClick={() => handleRemove(movimento)}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>
      <AppPopup {...popupProps} />
    </div>
  );
};

export default MovimentosCaixaPage;
