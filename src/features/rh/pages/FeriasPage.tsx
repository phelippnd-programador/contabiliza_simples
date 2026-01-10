import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import { TrashIcon, EditIcon } from "../../../components/ui/icon/AppIcons";
import { listFuncionarios } from "../services/rh.service";
import {
  createFerias,
  deleteFerias,
  listFerias,
  updateFerias,
} from "../services/folha.service";
import type { Ferias, Funcionario } from "../types/rh.types";
import { isDateRangeValid } from "../utils/rh.validation";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "SOLICITADA", label: "Solicitada" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "REPROVADA", label: "Reprovada" },
  { value: "GOZO", label: "Em gozo" },
  { value: "ENCERRADA", label: "Encerrada" },
];

const FeriasPage = () => {
  const [itens, setItens] = useState<Ferias[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [formData, setFormData] = useState({
    funcionarioId: "",
    inicio: "",
    fim: "",
    status: "SOLICITADA",
    observacoes: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listFerias({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as ferias.");
    }
  };

  const loadFuncionarios = async () => {
    try {
      const res = await listFuncionarios({ page: 1, pageSize: 200 });
      setFuncionarios(res.data);
    } catch {
      setFuncionarios([]);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const funcionarioOptions = useMemo(
    () =>
      funcionarios.map((func) => ({
        value: func.id,
        label: func.nome,
      })),
    [funcionarios]
  );

  const columns = useMemo(
    () => [
      {
        key: "funcionario",
        header: "Funcionario",
        render: (row: Ferias) =>
          funcionarios.find((func) => func.id === row.funcionarioId)?.nome ??
          row.funcionarioId,
      },
      { key: "inicio", header: "Inicio", render: (row: Ferias) => row.inicio },
      { key: "fim", header: "Fim", render: (row: Ferias) => row.fim },
      { key: "status", header: "Status", render: (row: Ferias) => row.status },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: Ferias) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label="Editar"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  funcionarioId: row.funcionarioId,
                  inicio: row.inicio,
                  fim: row.fim,
                  status: row.status,
                  observacoes: row.observacoes ?? "",
                });
                setFormError("");
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label="Excluir"
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir ferias",
                    description: "Deseja excluir este registro de ferias?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    try {
                      await deleteFerias(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir as ferias.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [funcionarios, openConfirm]
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      funcionarioId: "",
      inicio: "",
      fim: "",
      status: "SOLICITADA",
      observacoes: "",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.funcionarioId || !formData.inicio || !formData.fim) {
      setFormError("Funcionario, inicio e fim sao obrigatorios.");
      return;
    }
    if (!isDateRangeValid(formData.inicio, formData.fim)) {
      setFormError("A data de inicio deve ser menor ou igual ao fim.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      const payload = {
        funcionarioId: formData.funcionarioId,
        inicio: formData.inicio,
        fim: formData.fim,
        status: formData.status,
        observacoes: formData.observacoes || undefined,
      };
      if (editingId) {
        await updateFerias(editingId, payload);
      } else {
        await createFerias(payload);
      }
      resetForm();
      load();
    } catch {
      setFormError("Nao foi possivel salvar as ferias.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Ferias" />
        <AppSubTitle text="Gestao de ferias dos funcionarios." />
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Funcionario"
            value={formData.funcionarioId}
            onChange={(e) => setFormData((prev) => ({ ...prev, funcionarioId: e.target.value }))}
            data={funcionarioOptions}
            placeholder="Selecione"
          />
          <AppDateInput
            title="Inicio"
            value={formData.inicio}
            onChange={(e) => setFormData((prev) => ({ ...prev, inicio: e.target.value }))}
          />
          <AppDateInput
            title="Fim"
            value={formData.fim}
            onChange={(e) => setFormData((prev) => ({ ...prev, fim: e.target.value }))}
          />
          <AppSelectInput
            title="Status"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            data={statusOptions}
          />
          <div className="md:col-span-2">
            <AppTextInput
              title="Observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>
        </div>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <div className="mt-3 flex gap-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSubmit}>
            {editingId ? "Atualizar" : "Salvar"}
          </AppButton>
          <AppButton
            type="button"
            className="w-auto px-6"
            onClick={() => {
              resetForm();
            }}
          >
            Limpar
          </AppButton>
        </div>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma ferias cadastrada." />}
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

export default FeriasPage;
