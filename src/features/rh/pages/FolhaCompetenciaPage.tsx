import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import {
  createCompetencia,
  listCompetencias,
  updateCompetencia,
} from "../services/folha.service";
import type { CompetenciaFolha } from "../types/rh.types";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "EM_PROCESSAMENTO", label: "Em processamento" },
  { value: "FECHADA", label: "Fechada" },
];

const FolhaCompetenciaPage = () => {
  const [itens, setItens] = useState<CompetenciaFolha[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [formData, setFormData] = useState({
    competencia: "",
    status: "ABERTA",
    observacoes: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listCompetencias({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as competencias.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "competencia",
        header: "Competencia",
        render: (row: CompetenciaFolha) => row.competencia,
      },
      { key: "status", header: "Status", render: (row: CompetenciaFolha) => row.status },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: CompetenciaFolha) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() =>
                openConfirm(
                  {
                    title: "Atualizar status",
                    description: "Deseja alterar o status desta competencia?",
                    confirmLabel: "Atualizar",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    const nextStatus =
                      row.status === "ABERTA"
                        ? "EM_PROCESSAMENTO"
                        : row.status === "EM_PROCESSAMENTO"
                        ? "FECHADA"
                        : "ABERTA";
                    try {
                      await updateCompetencia(row.id, { status: nextStatus });
                      load();
                    } catch {
                      setError("Nao foi possivel atualizar o status.");
                    }
                  }
                )
              }
            >
              {row.status === "FECHADA" ? "Reabrir" : "Avancar"}
            </AppButton>
          </div>
        ),
      },
    ],
    [openConfirm]
  );

  const resetForm = () => {
    setFormData({ competencia: "", status: "ABERTA", observacoes: "" });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.competencia) {
      setFormError("Informe a competencia.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      await createCompetencia(formData);
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar a competencia.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Competencia da folha" />
          <AppSubTitle text="Controle de competencia e fechamento." />
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
          {formOpen ? "Fechar" : "Nova competencia"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <AppDateInput
              required
              title="Competencia"
              type="month"
              value={formData.competencia}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, competencia: e.target.value }))
              }
            />
            <AppSelectInput
              title="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              data={statusOptions}
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
              Salvar
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
          emptyState={<AppListNotFound texto="Nenhuma competencia cadastrada." />}
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

export default FolhaCompetenciaPage;
