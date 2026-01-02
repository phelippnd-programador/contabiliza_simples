import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { listContas } from "../services/contas.service";
import { listCategorias } from "../services/categorias.service";
import {
  deleteMovimento,
  listMovimentos,
  saveMovimento,
} from "../services/movimentos.service";
import {
  TipoMovimentoCaixa,
  type CategoriaMovimento,
  type ContaBancaria,
  type MovimentoCaixa,
} from "../types";
import { formatBRL } from "../../../shared/utils/formater";

const EditIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.586 2.586a2 2 0 0 1 2.828 2.828l-9.5 9.5a1 1 0 0 1-.39.242l-4 1.333a.5.5 0 0 1-.632-.632l1.333-4a1 1 0 0 1 .242-.39l9.5-9.5Z" />
  </svg>
);

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
};

const MovimentosCaixaPage = () => {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [form, setForm] = useState({ id: "", ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const refresh = async () => setMovimentos(await listMovimentos());

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [contasData, categoriasData] = await Promise.all([
        listContas(),
        listCategorias(),
      ]);
      if (!isMounted) return;
      setContas(contasData);
      setCategorias(categoriasData);
      await refresh();
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.data) nextErrors.data = "Informe a data";
    if (!form.contaId) nextErrors.contaId = "Selecione a conta";
    if (!form.categoriaId) nextErrors.categoriaId = "Selecione a categoria";
    if (!form.valor || form.valor <= 0) nextErrors.valor = "Informe o valor";
    if (!form.tipo) nextErrors.tipo = "Selecione o tipo";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

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
    });
    setErrors({});
    setForm({ id: "", ...emptyForm });
    await refresh();
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
    });
    setErrors({});
  };

  const handleRemove = async (movimento: MovimentoCaixa) => {
    const confirmed = window.confirm(
      "Deseja remover este movimento de caixa?"
    );
    if (!confirmed) return;
    await deleteMovimento(movimento.id);
    if (form.id === movimento.id) {
      setForm({ id: "", ...emptyForm });
    }
    await refresh();
  };

  const handleReset = () => {
    setForm({ id: "", ...emptyForm });
    setErrors({});
  };

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text="Lancamento de caixa" />
      <AppSubTitle text="Registre entradas e saidas do financeiro." />

      <Card>
        <AppSubTitle text="Novo movimento" />
        <small>Preencha os dados basicos do movimento de caixa.</small>

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

          <AppDateInput
            title="Competencia"
            type="month"
            value={form.competencia ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, competencia: e.target.value }))
            }
          />

          <AppTextInput
            title="CNAE (opcional)"
            value={form.cnae ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cnae: e.target.value }))
            }
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
                render: (movimento) => movimento.data,
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
                key: "acoes",
                header: "Acoes",
                align: "right",
                render: (movimento) => (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-blue-500"
                      onClick={() => handleEdit(movimento)}
                      aria-label="Editar movimento"
                    >
                      <EditIcon />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:border-red-400"
                      onClick={() => handleRemove(movimento)}
                      aria-label="Remover movimento"
                    >
                      Remover
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default MovimentosCaixaPage;
