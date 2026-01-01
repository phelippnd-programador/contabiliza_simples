import React, { useEffect, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { tipoCategoriaOptions } from "../../../shared/types/select-type";
import {
  deleteCategoria,
  listCategorias,
  saveCategoria,
} from "../storage/categorias";
import { TipoMovimentoCaixa, type CategoriaMovimento } from "../types";

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

const CategoriasFinanceirasPage = () => {
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [form, setForm] = useState({
    id: "",
    nome: "",
    tipo: TipoMovimentoCaixa.SAIDA as TipoMovimentoCaixa,
  });
  const [errors, setErrors] = useState<{ nome?: string }>({});

  const refresh = () => setCategorias(listCategorias());

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = () => {
    const nome = form.nome.trim();
    if (!nome) {
      setErrors({ nome: "Informe o nome da categoria" });
      return;
    }

    saveCategoria({
      id: form.id || undefined,
      nome,
      tipo: form.tipo,
    });
    setErrors({});
    setForm({ id: "", nome: "", tipo: TipoMovimentoCaixa.SAIDA });
    refresh();
  };

  const handleEdit = (categoria: CategoriaMovimento) => {
    setForm({
      id: categoria.id,
      nome: categoria.nome,
      tipo: categoria.tipo,
    });
    setErrors({});
  };

  const handleRemove = (categoria: CategoriaMovimento) => {
    const confirmed = window.confirm(
      `Deseja remover a categoria "${categoria.nome}"?`
    );
    if (!confirmed) return;
    deleteCategoria(categoria.id);
    if (form.id === categoria.id) {
      setForm({ id: "", nome: "", tipo: TipoMovimentoCaixa.SAIDA });
    }
    refresh();
  };

  const handleReset = () => {
    setForm({ id: "", nome: "", tipo: TipoMovimentoCaixa.SAIDA });
    setErrors({});
  };

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      <AppTitle text="Categorias financeiras" />
      <AppSubTitle text="Cadastre categorias de entrada e saida." />

      <Card>
        <AppSubTitle text="Cadastro de categorias" />
        <small>
          Preencha os dados basicos da categoria. Campos com * sao obrigatorios.
        </small>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppTextInput
            required
            title="Nome"
            value={form.nome}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, nome: e.target.value }))
            }
            error={errors.nome}
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
            data={tipoCategoriaOptions}
          />

          <div className="flex items-end gap-2">
            <AppButton type="button" className="w-auto" onClick={handleSave}>
              {form.id ? "Atualizar" : "Salvar"}
            </AppButton>
            <AppButton type="button" className="w-auto" onClick={handleReset}>
              Limpar
            </AppButton>
          </div>
        </div>

        <div className="mt-6">
          <AppTable
            data={categorias}
            rowKey={(row) => row.id}
            emptyState={
              <AppListNotFound texto="Nenhuma categoria cadastrada ainda." />
            }
            pagination={{ enabled: true, pageSize: 8 }}
            columns={[
              {
                key: "nome",
                header: "Categoria",
                render: (categoria) => (
                  <span className="font-medium text-gray-900">
                    {categoria.nome}
                  </span>
                ),
              },
              {
                key: "tipo",
                header: "Tipo",
                render: (categoria) =>
                  categoria.tipo === TipoMovimentoCaixa.ENTRADA
                    ? "Entrada"
                    : "Saida",
              },
              {
                key: "acoes",
                header: "Acoes",
                align: "right",
                render: (categoria) => (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-blue-500"
                      onClick={() => handleEdit(categoria)}
                      aria-label={`Editar categoria ${categoria.nome}`}
                    >
                      <EditIcon />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:border-red-400"
                      onClick={() => handleRemove(categoria)}
                      aria-label={`Remover categoria ${categoria.nome}`}
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

export default CategoriasFinanceirasPage;
