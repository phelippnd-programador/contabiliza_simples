import React, { useEffect, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { tipoCategoriaOptions } from "../../../shared/types/select-type";
import {
  deleteCategoria,
  listCategorias,
  saveCategoria,
} from "../services/categorias.service";
import { TipoMovimentoCaixa, type CategoriaMovimento } from "../types";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";

const CategoriasFinanceirasPage = () => {
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [form, setForm] = useState({
    id: "",
    nome: "",
    tipo: TipoMovimentoCaixa.SAIDA as TipoMovimentoCaixa,
  });
  const [errors, setErrors] = useState<{ nome?: string }>({});

  const refresh = async () => setCategorias(await listCategorias());

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async () => {
    const nome = form.nome.trim();
    if (!nome) {
      setErrors({ nome: "Informe o nome da categoria" });
      return;
    }

    await saveCategoria({
      id: form.id || undefined,
      nome,
      tipo: form.tipo,
    });
    setErrors({});
    setForm({ id: "", nome: "", tipo: TipoMovimentoCaixa.SAIDA });
    await refresh();
  };

  const handleEdit = (categoria: CategoriaMovimento) => {
    setForm({
      id: categoria.id,
      nome: categoria.nome,
      tipo: categoria.tipo,
    });
    setErrors({});
  };

  const handleRemove = async (categoria: CategoriaMovimento) => {
    const confirmed = window.confirm(
      `Deseja remover a categoria "${categoria.nome}"?`
    );
    if (!confirmed) return;
    await deleteCategoria(categoria.id);
    if (form.id === categoria.id) {
      setForm({ id: "", nome: "", tipo: TipoMovimentoCaixa.SAIDA });
    }
    await refresh();
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
                    <AppIconButton
                      icon={<EditIcon className="h-4 w-4" />}
                      label={`Editar categoria ${categoria.nome}`}
                      onClick={() => handleEdit(categoria)}
                    />
                    <AppIconButton
                      icon={<TrashIcon className="h-4 w-4" />}
                      label={`Remover categoria ${categoria.nome}`}
                      variant="danger"
                      onClick={() => handleRemove(categoria)}
                    />
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
