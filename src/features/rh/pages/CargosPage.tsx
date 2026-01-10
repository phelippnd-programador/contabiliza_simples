import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import {
  createCargo,
  deleteCargo,
  listCargos,
  updateCargo,
} from "../services/rh.service";
import type { Cargo } from "../types/rh.types";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
];

const CargosPage = () => {
  const [itens, setItens] = useState<Cargo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [formData, setFormData] = useState({
    nome: "",
    nivel: "",
    descricao: "",
    status: "ATIVO",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listCargos({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar os cargos.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      { key: "nome", header: "Cargo", render: (row: Cargo) => row.nome },
      { key: "nivel", header: "Nivel", render: (row: Cargo) => row.nivel ?? "-" },
      {
        key: "status",
        header: "Status",
        render: (row: Cargo) => row.status ?? "ATIVO",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: Cargo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar ${row.nome}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  nome: row.nome,
                  nivel: row.nivel ?? "",
                  descricao: row.descricao ?? "",
                  status: row.status ?? "ATIVO",
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir ${row.nome}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir cargo",
                    description: "Deseja excluir este cargo?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    try {
                      await deleteCargo(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir o cargo.");
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

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nome: "", nivel: "", descricao: "", status: "ATIVO" });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.nome) {
      setFormError("Nome e obrigatorio.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      if (editingId) {
        await updateCargo(editingId, formData);
      } else {
        await createCargo(formData);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o cargo.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Cargos" />
          <AppSubTitle text="Estrutura de cargos e niveis." />
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
          {formOpen ? "Fechar" : "Novo cargo"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppTextInput
              required
              title="Nome"
              value={formData.nome}
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
            />
            <AppTextInput
              title="Nivel"
              value={formData.nivel}
              onChange={(e) => setFormData((prev) => ({ ...prev, nivel: e.target.value }))}
            />
            <AppSelectInput
              title="Status"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              data={statusOptions}
            />
            <div className="md:col-span-2">
              <AppTextInput
                title="Descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
              />
            </div>
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

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum cargo cadastrado." />}
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

export default CargosPage;
