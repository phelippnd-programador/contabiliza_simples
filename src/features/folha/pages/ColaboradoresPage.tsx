import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppEndereco from "../../../components/ui/input/AppEndereco";
import {
  createColaborador,
  deleteColaborador,
  listColaboradores,
  updateColaborador,
  type ColaboradorResumo,
} from "../services/colaboradores.service";
import { categoriaInssOptions } from "../../../shared/types/select-type";
import { formatBRL, formatCpfCnpj, formatPercentBR } from "../../../shared/utils/formater";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
];

const tipoColaboradorOptions = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "CONTRIBUINTE_INDIVIDUAL", label: "Contribuinte individual" },
  { value: "MEI", label: "MEI" },
  { value: "ESTAGIARIO", label: "Estagiario" },
  { value: "PRO_LABORE", label: "Pro-labore" },
];

const ColaboradoresPage = () => {
  const [itens, setItens] = useState<ColaboradorResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    documento: "",
    tipoColaborador: "CLT",
    email: "",
    telefone: "",
    dataAdmissao: "",
    dataDemissao: "",
    cargo: "",
    pis: "",
    categoriaInss: "",
    salarioBaseCents: 0,
    percentualInss: 11,
    endereco: {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      codigoMunicipioIbge: "",
      pais: "",
    },
    status: "ATIVO",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const requiresInss = formData.tipoColaborador !== "PJ";
  const requiresSalario = formData.tipoColaborador !== "PJ";
  const requiresPis = formData.tipoColaborador === "CLT";
  const requiresAdmissao =
    formData.tipoColaborador === "CLT" ||
    formData.tipoColaborador === "ESTAGIARIO";

  const load = async () => {
    try {
      setError("");
      const response = await listColaboradores({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar os colaboradores.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      { key: "nome", header: "Nome", render: (row: ColaboradorResumo) => row.nome },
      {
        key: "documento",
        header: "Documento",
        render: (row: ColaboradorResumo) => row.documento,
      },
      {
        key: "tipo",
        header: "Tipo",
        render: (row: ColaboradorResumo) => row.tipoColaborador,
      },
      {
        key: "categoria",
        header: "INSS",
        render: (row: ColaboradorResumo) => row.categoriaInss ?? "-",
      },
      {
        key: "status",
        header: "Status",
        render: (row: ColaboradorResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ColaboradorResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar colaborador ${row.nome}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  nome: row.nome,
                  documento: row.documento,
                  tipoColaborador: row.tipoColaborador,
                  email: row.email ?? "",
                  telefone: row.telefone ?? "",
                  dataAdmissao: row.dataAdmissao ?? "",
                  dataDemissao: row.dataDemissao ?? "",
                  cargo: row.cargo ?? "",
                  pis: row.pis ?? "",
                  categoriaInss: row.categoriaInss ?? "",
                  salarioBaseCents: row.salarioBase ?? 0,
                  percentualInss: row.percentualInss ?? 11,
                  endereco: {
                    cep: row.endereco?.cep ?? "",
                    logradouro: row.endereco?.logradouro ?? "",
                    numero: row.endereco?.numero ?? "",
                    complemento: row.endereco?.complemento ?? "",
                    bairro: row.endereco?.bairro ?? "",
                    cidade: row.endereco?.cidade ?? "",
                    uf: row.endereco?.uf ?? "",
                    codigoMunicipioIbge: row.endereco?.codigoMunicipioIbge ?? "",
                    pais: row.endereco?.pais ?? "",
                  },
                  status: row.status ?? "ATIVO",
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir colaborador ${row.nome}`}
              variant="danger"
              onClick={async () => {
                if (!API_BASE) {
                  setError("API nao configurada.");
                  return;
                }
                const confirmed = window.confirm("Excluir este colaborador?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteColaborador(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir o colaborador.");
                }
              }}
            />
          </div>
        ),
      },
    ],
    []
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nome: "",
      documento: "",
      tipoColaborador: "CLT",
      email: "",
      telefone: "",
      dataAdmissao: "",
      dataDemissao: "",
      cargo: "",
      pis: "",
      categoriaInss: "",
      salarioBaseCents: 0,
      percentualInss: 11,
      endereco: {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
        codigoMunicipioIbge: "",
        pais: "",
      },
      status: "ATIVO",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.nome || !formData.documento) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (requiresInss && !formData.categoriaInss) {
      setFormError("Informe a categoria INSS.");
      return;
    }
    if (requiresSalario && formData.salarioBaseCents <= 0) {
      setFormError("Informe o salario base.");
      return;
    }
    if (requiresAdmissao && !formData.dataAdmissao) {
      setFormError("Informe a data de admissao.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    const payload = {
      nome: formData.nome,
      documento: formData.documento,
      tipoColaborador: formData.tipoColaborador as
        | "CLT"
        | "PJ"
        | "CONTRIBUINTE_INDIVIDUAL"
        | "MEI"
        | "ESTAGIARIO"
        | "PRO_LABORE",
      email: formData.email || undefined,
      telefone: formData.telefone || undefined,
      dataAdmissao: formData.dataAdmissao || undefined,
      dataDemissao: formData.dataDemissao || undefined,
      cargo: formData.cargo || undefined,
      pis: formData.pis || undefined,
      categoriaInss: formData.categoriaInss || undefined,
      salarioBase: formData.salarioBaseCents || undefined,
      percentualInss: formData.percentualInss || undefined,
      endereco: {
        cep: formData.endereco.cep || undefined,
        logradouro: formData.endereco.logradouro || undefined,
        numero: formData.endereco.numero || undefined,
        complemento: formData.endereco.complemento || undefined,
        bairro: formData.endereco.bairro || undefined,
        cidade: formData.endereco.cidade || undefined,
        uf: formData.endereco.uf || undefined,
        codigoMunicipioIbge: formData.endereco.codigoMunicipioIbge || undefined,
        pais: formData.endereco.pais || undefined,
      },
      status: formData.status,
    };
    try {
      if (editingId) {
        await updateColaborador(editingId, payload);
      } else {
        await createColaborador(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o colaborador.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Colaboradores" />
          <AppSubTitle text="Cadastro completo para folha e fisco." />
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
          {formOpen ? "Fechar" : "Novo colaborador"}
        </AppButton>
      </div>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <AppTextInput
              required
              title="Nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nome: e.target.value }))
              }
            />
            <AppTextInput
              required
              title="CPF/CNPJ"
              value={formData.documento}
              sanitizeRegex={/[0-9]/g}
              formatter={formatCpfCnpj}
              onValueChange={(raw) =>
                setFormData((prev) => ({ ...prev, documento: raw }))
              }
            />
            <AppSelectInput
              required
              title="Tipo colaborador"
              value={formData.tipoColaborador}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tipoColaborador: e.target.value }))
              }
              data={tipoColaboradorOptions}
            />
            <AppTextInput
              title="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <AppTextInput
              title="Telefone"
              value={formData.telefone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, telefone: e.target.value }))
              }
            />
            <AppTextInput
              title="Cargo"
              value={formData.cargo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, cargo: e.target.value }))
              }
            />
            {requiresPis ? (
              <AppTextInput
                title="PIS"
                value={formData.pis}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pis: e.target.value }))
                }
              />
            ) : null}
            {requiresAdmissao ? (
              <AppDateInput
                title="Admissao"
                type="date"
                value={formData.dataAdmissao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dataAdmissao: e.target.value }))
                }
              />
            ) : null}
            <AppDateInput
              title="Demissao"
              type="date"
              value={formData.dataDemissao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dataDemissao: e.target.value }))
              }
            />
            {requiresInss ? (
              <AppSelectInput
                title="Categoria INSS"
                value={formData.categoriaInss}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, categoriaInss: e.target.value }))
                }
                data={categoriaInssOptions}
                placeholder="Selecione"
              />
            ) : null}
            {requiresSalario ? (
              <AppTextInput
                title="Salario base"
                value={formData.salarioBaseCents ? String(formData.salarioBaseCents) : ""}
                sanitizeRegex={/[0-9]/g}
                formatter={formatBRL}
                onValueChange={(raw) =>
                  setFormData((prev) => ({
                    ...prev,
                    salarioBaseCents: Number(raw || "0"),
                  }))
                }
              />
            ) : null}
            {requiresInss ? (
              <AppTextInput
                title="Percentual INSS"
                value={formData.percentualInss ? String(formData.percentualInss) : ""}
                sanitizeRegex={/[0-9]/g}
                formatter={formatPercentBR}
                onValueChange={(raw) =>
                  setFormData((prev) => ({
                    ...prev,
                    percentualInss: Number(raw || "0"),
                  }))
                }
              />
            ) : null}
            <div className="md:col-span-3">
              <AppEndereco
                value={formData.endereco}
                onChange={(next) =>
                  setFormData((prev) => ({
                    ...prev,
                    endereco: { ...prev.endereco, ...next },
                  }))
                }
              />
            </div>
            <AppSelectInput
              title="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
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
          emptyState={<AppListNotFound texto="Nenhum colaborador cadastrado." />}
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
    </div>
  );
};

export default ColaboradoresPage;
