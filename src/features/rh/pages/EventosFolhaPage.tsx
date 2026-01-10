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
  createEventoFolha,
  deleteEventoFolha,
  listEventosFolha,
  updateEventoFolha,
} from "../services/folha.service";
import type { EventoFolha } from "../types/rh.types";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const eventoTipoOptions = [
  { value: "PROVENTO", label: "Provento" },
  { value: "DESCONTO", label: "Desconto" },
];

const yesNoOptions = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Nao" },
];

const statusOptions = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
];

const EventosFolhaPage = () => {
  const [itens, setItens] = useState<EventoFolha[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    tipo: "PROVENTO",
    inss: "SIM",
    fgts: "SIM",
    irrf: "SIM",
    formula: "",
    valorFixo: "",
    status: "ATIVO",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    try {
      setError("");
      const response = await listEventosFolha({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar os eventos.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      { key: "codigo", header: "Codigo", render: (row: EventoFolha) => row.codigo },
      { key: "descricao", header: "Descricao", render: (row: EventoFolha) => row.descricao },
      { key: "tipo", header: "Tipo", render: (row: EventoFolha) => row.tipo },
      {
        key: "incidencias",
        header: "Incidencias",
        render: (row: EventoFolha) =>
          `INSS:${row.incidencias.inss ? "S" : "N"} / FGTS:${row.incidencias.fgts ? "S" : "N"} / IRRF:${row.incidencias.irrf ? "S" : "N"}`,
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: EventoFolha) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar ${row.descricao}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  codigo: row.codigo,
                  descricao: row.descricao,
                  tipo: row.tipo,
                  inss: row.incidencias.inss ? "SIM" : "NAO",
                  fgts: row.incidencias.fgts ? "SIM" : "NAO",
                  irrf: row.incidencias.irrf ? "SIM" : "NAO",
                  formula: row.formula ?? "",
                  valorFixo: row.valorFixo ? String(row.valorFixo) : "",
                  status: row.status ?? "ATIVO",
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir ${row.descricao}`}
              variant="danger"
              onClick={() =>
                openConfirm(
                  {
                    title: "Excluir evento",
                    description: "Deseja excluir este evento?",
                    confirmLabel: "Excluir",
                    tone: "danger",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    try {
                      await deleteEventoFolha(row.id);
                      load();
                    } catch {
                      setError("Nao foi possivel excluir o evento.");
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
    setFormData({
      codigo: "",
      descricao: "",
      tipo: "PROVENTO",
      inss: "SIM",
      fgts: "SIM",
      irrf: "SIM",
      formula: "",
      valorFixo: "",
      status: "ATIVO",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.codigo || !formData.descricao) {
      setFormError("Codigo e descricao sao obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    const payload: Partial<EventoFolha> = {
      codigo: formData.codigo,
      descricao: formData.descricao,
      tipo: formData.tipo as EventoFolha["tipo"],
      incidencias: {
        inss: formData.inss === "SIM",
        fgts: formData.fgts === "SIM",
        irrf: formData.irrf === "SIM",
      },
      formula: formData.formula || undefined,
      valorFixo: formData.valorFixo ? Number(formData.valorFixo) : undefined,
      status: formData.status as EventoFolha["status"],
    };
    try {
      if (editingId) {
        await updateEventoFolha(editingId, payload);
      } else {
        await createEventoFolha(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o evento.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Eventos de folha" />
          <AppSubTitle text="Proventos e descontos padrao." />
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
          {formOpen ? "Fechar" : "Novo evento"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <AppTextInput
              required
              title="Codigo"
              value={formData.codigo}
              onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))}
            />
            <AppTextInput
              required
              title="Descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descricao: e.target.value }))
              }
            />
            <AppSelectInput
              title="Tipo"
              value={formData.tipo}
              onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
              data={eventoTipoOptions}
            />
            <AppSelectInput
              title="INSS"
              value={formData.inss}
              onChange={(e) => setFormData((prev) => ({ ...prev, inss: e.target.value }))}
              data={yesNoOptions}
            />
            <AppSelectInput
              title="FGTS"
              value={formData.fgts}
              onChange={(e) => setFormData((prev) => ({ ...prev, fgts: e.target.value }))}
              data={yesNoOptions}
            />
            <AppSelectInput
              title="IRRF"
              value={formData.irrf}
              onChange={(e) => setFormData((prev) => ({ ...prev, irrf: e.target.value }))}
              data={yesNoOptions}
            />
            <AppTextInput
              title="Formula"
              value={formData.formula}
              onChange={(e) => setFormData((prev) => ({ ...prev, formula: e.target.value }))}
            />
            <AppTextInput
              title="Valor fixo (R$)"
              value={formData.valorFixo}
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) => setFormData((prev) => ({ ...prev, valorFixo: raw }))}
            />
            <AppSelectInput
              title="Status"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              data={statusOptions}
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

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum evento cadastrado." />}
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

export default EventosFolhaPage;
