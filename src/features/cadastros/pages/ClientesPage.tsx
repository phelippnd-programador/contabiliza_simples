import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import {
  listClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  type ClienteResumo,
} from "../services/cadastros.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
];

const tipoPessoaOptions = [
  { value: "PJ", label: "Pessoa juridica" },
  { value: "PF", label: "Pessoa fisica" },
];

const indicadorIeOptions = [
  { value: "CONTRIBUINTE", label: "Contribuinte" },
  { value: "ISENTO", label: "Isento" },
  { value: "NAO_CONTRIBUINTE", label: "Nao contribuinte" },
];

const ClientesPage = () => {
  const [itens, setItens] = useState<ClienteResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    nomeFantasia: "",
    documento: "",
    tipoPessoa: "PJ",
    email: "",
    telefone: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    indicadorIE: "CONTRIBUINTE",
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

  const load = async () => {
    try {
      setError("");
      const response = await listClientes({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar os clientes.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "nome",
        header: "Cliente",
        render: (row: ClienteResumo) => row.nome,
      },
      {
        key: "documento",
        header: "Documento",
        render: (row: ClienteResumo) => row.documento ?? "-",
      },
      {
        key: "status",
        header: "Status",
        render: (row: ClienteResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ClienteResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  nome: row.nome,
                  nomeFantasia: row.nomeFantasia ?? "",
                  documento: row.documento ?? "",
                  tipoPessoa: row.tipoPessoa ?? "PJ",
                  email: row.email ?? "",
                  telefone: row.telefone ?? "",
                  inscricaoEstadual: row.inscricaoEstadual ?? "",
                  inscricaoMunicipal: row.inscricaoMunicipal ?? "",
                  indicadorIE: row.indicadorIE ?? "CONTRIBUINTE",
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
            >
              Editar
            </AppButton>
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={async () => {
                if (!API_BASE) {
                  setError("API nao configurada.");
                  return;
                }
                const confirmed = window.confirm("Excluir este cliente?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteCliente(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir o cliente.");
                }
              }}
            >
              Excluir
            </AppButton>
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
      nomeFantasia: "",
      documento: "",
      tipoPessoa: "PJ",
      email: "",
      telefone: "",
      inscricaoEstadual: "",
      inscricaoMunicipal: "",
      indicadorIE: "CONTRIBUINTE",
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
    if (!formData.nome) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      if (editingId) {
        await updateCliente(editingId, {
          nome: formData.nome,
          nomeFantasia: formData.nomeFantasia || undefined,
          documento: formData.documento || undefined,
          tipoPessoa: formData.tipoPessoa as "PF" | "PJ",
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          inscricaoEstadual: formData.inscricaoEstadual || undefined,
          inscricaoMunicipal: formData.inscricaoMunicipal || undefined,
          indicadorIE: formData.indicadorIE as
            | "CONTRIBUINTE"
            | "ISENTO"
            | "NAO_CONTRIBUINTE",
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
        });
      } else {
        await createCliente({
          nome: formData.nome,
          nomeFantasia: formData.nomeFantasia || undefined,
          documento: formData.documento || undefined,
          tipoPessoa: formData.tipoPessoa as "PF" | "PJ",
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          inscricaoEstadual: formData.inscricaoEstadual || undefined,
          inscricaoMunicipal: formData.inscricaoMunicipal || undefined,
          indicadorIE: formData.indicadorIE as
            | "CONTRIBUINTE"
            | "ISENTO"
            | "NAO_CONTRIBUINTE",
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
        });
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o cliente.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Clientes" />
          <AppSubTitle text="Cadastro e relacionamento com clientes." />
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
          {formOpen ? "Fechar" : "Novo cliente"}
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
              title="Nome fantasia"
              value={formData.nomeFantasia}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nomeFantasia: e.target.value,
                }))
              }
            />
            <AppTextInput
              title="Documento"
              value={formData.documento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, documento: e.target.value }))
              }
            />
            <AppSelectInput
              title="Tipo pessoa"
              value={formData.tipoPessoa}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tipoPessoa: e.target.value }))
              }
              data={tipoPessoaOptions}
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
              title="Inscricao estadual"
              value={formData.inscricaoEstadual}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  inscricaoEstadual: e.target.value,
                }))
              }
            />
            <AppTextInput
              title="Inscricao municipal"
              value={formData.inscricaoMunicipal}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  inscricaoMunicipal: e.target.value,
                }))
              }
            />
            <AppSelectInput
              title="Indicador IE"
              value={formData.indicadorIE}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  indicadorIE: e.target.value,
                }))
              }
              data={indicadorIeOptions}
            />
            <AppTextInput
              title="CEP"
              value={formData.endereco.cep}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: { ...prev.endereco, cep: e.target.value },
                }))
              }
            />
            <AppTextInput
              title="Logradouro"
              value={formData.endereco.logradouro}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: { ...prev.endereco, logradouro: e.target.value },
                }))
              }
            />
            <AppTextInput
              title="Numero"
              value={formData.endereco.numero}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: { ...prev.endereco, numero: e.target.value },
                }))
              }
            />
            <AppTextInput
              title="Complemento"
              value={formData.endereco.complemento}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: { ...prev.endereco, complemento: e.target.value },
                }))
              }
            />
            <AppTextInput
              title="Bairro"
              value={formData.endereco.bairro}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: { ...prev.endereco, bairro: e.target.value },
                }))
              }
            />
            <AppTextInput
              title="Cidade"
              value={formData.endereco.cidade}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: { ...prev.endereco, cidade: e.target.value },
                }))
              }
            />
            <AppTextInput
              title="UF"
              value={formData.endereco.uf}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: { ...prev.endereco, uf: e.target.value },
                }))
              }
            />
            <AppTextInput
              title="Codigo IBGE"
              value={formData.endereco.codigoMunicipioIbge}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: {
                    ...prev.endereco,
                    codigoMunicipioIbge: e.target.value,
                  },
                }))
              }
            />
            <AppTextInput
              title="Pais"
              value={formData.endereco.pais}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endereco: { ...prev.endereco, pais: e.target.value },
                }))
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
          API de clientes preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum cliente cadastrado." />}
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

export default ClientesPage;

