import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppEndereco, { type EnderecoValue } from "../../../components/ui/input/AppEndereco";
import { formatCpfCnpj } from "../../../shared/utils/formater";
import {
  listFornecedores,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
  type FornecedorResumo,
} from "../services/cadastros.service";
import { EditIcon, TrashIcon } from "../../../components/ui/icon/AppIcons";

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

const FornecedoresPage = () => {
  const [itens, setItens] = useState<FornecedorResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addressErrors, setAddressErrors] = useState<
    Partial<Record<keyof EnderecoValue, string>>
  >({});
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
  const isPessoaJuridica = formData.tipoPessoa === "PJ";
  const onlyDigits = (value: string) => value.replace(/\D+/g, "");

  const load = async () => {
    try {
      setError("");
      const response = await listFornecedores({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar os fornecedores.");
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns = useMemo(
    () => [
      {
        key: "nome",
        header: "Fornecedor",
        render: (row: FornecedorResumo) => row.nome,
      },
      {
        key: "documento",
        header: "Documento",
        render: (row: FornecedorResumo) => row.documento ?? "-",
      },
      {
        key: "status",
        header: "Status",
        render: (row: FornecedorResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: FornecedorResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar fornecedor ${row.nome}`}
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
            />
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir fornecedor ${row.nome}`}
              variant="danger"
              onClick={async () => {
                if (!API_BASE) {
                  setError("API nao configurada.");
                  return;
                }
                const confirmed = window.confirm("Excluir este fornecedor?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteFornecedor(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir o fornecedor.");
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
    setAddressErrors({});
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
    setAddressErrors({});
    if (!formData.nome) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    const documentoDigits = onlyDigits(formData.documento);
    if (!documentoDigits) {
      setFormError("Documento e obrigatorio para cadastro fiscal.");
      return;
    }
    if (isPessoaJuridica && documentoDigits.length !== 14) {
      setFormError("CNPJ deve ter 14 digitos.");
      return;
    }
    if (!isPessoaJuridica && documentoDigits.length !== 11) {
      setFormError("CPF deve ter 11 digitos.");
      return;
    }
    const uf = (formData.endereco.uf || "").trim();
    const ieDigits = onlyDigits(formData.inscricaoEstadual);
    const imDigits = onlyDigits(formData.inscricaoMunicipal);
    const nextAddressErrors: Partial<Record<keyof EnderecoValue, string>> = {};
    if ((ieDigits || imDigits) && uf.length !== 2) {
      nextAddressErrors.uf = "Informe UF para validar IE/IM.";
      setAddressErrors(nextAddressErrors);
      setFormError("UF obrigatoria para validar IE/IM.");
      return;
    }
    if (isPessoaJuridica) {
      if (formData.indicadorIE === "CONTRIBUINTE" && !ieDigits) {
        setFormError("Inscricao estadual obrigatoria para contribuinte.");
        return;
      }
      if (formData.indicadorIE !== "CONTRIBUINTE" && ieDigits) {
        setFormError("IE deve ficar vazia quando isento/nao contribuinte.");
        return;
      }
    } else if (ieDigits || imDigits) {
      setFormError("IE/IM nao se aplica a pessoa fisica.");
      return;
    }
    if (uf.length === 2 && formData.endereco.cidade && !formData.endereco.codigoMunicipioIbge) {
      nextAddressErrors.codigoMunicipioIbge = "Codigo IBGE obrigatorio.";
      setAddressErrors(nextAddressErrors);
      setFormError("Codigo IBGE obrigatorio para endereco fiscal.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    try {
      if (editingId) {
        await updateFornecedor(editingId, {
          nome: formData.nome,
          nomeFantasia: isPessoaJuridica ? formData.nomeFantasia || undefined : undefined,
          documento: documentoDigits,
          tipoPessoa: formData.tipoPessoa as "PF" | "PJ",
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          inscricaoEstadual: isPessoaJuridica
            ? formData.inscricaoEstadual || undefined
            : undefined,
          inscricaoMunicipal: isPessoaJuridica
            ? formData.inscricaoMunicipal || undefined
            : undefined,
          indicadorIE: (isPessoaJuridica
            ? formData.indicadorIE
            : "NAO_CONTRIBUINTE") as "CONTRIBUINTE" | "ISENTO" | "NAO_CONTRIBUINTE",
          endereco: {
            cep: formData.endereco.cep || undefined,
            logradouro: formData.endereco.logradouro || undefined,
            numero: formData.endereco.numero || undefined,
            complemento: formData.endereco.complemento || undefined,
            bairro: formData.endereco.bairro || undefined,
            cidade: formData.endereco.cidade || undefined,
            uf: uf || undefined,
            codigoMunicipioIbge: formData.endereco.codigoMunicipioIbge || undefined,
            pais: formData.endereco.pais || undefined,
          },
          status: formData.status,
        });
      } else {
        await createFornecedor({
          nome: formData.nome,
          nomeFantasia: isPessoaJuridica ? formData.nomeFantasia || undefined : undefined,
          documento: documentoDigits,
          tipoPessoa: formData.tipoPessoa as "PF" | "PJ",
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          inscricaoEstadual: isPessoaJuridica
            ? formData.inscricaoEstadual || undefined
            : undefined,
          inscricaoMunicipal: isPessoaJuridica
            ? formData.inscricaoMunicipal || undefined
            : undefined,
          indicadorIE: (isPessoaJuridica
            ? formData.indicadorIE
            : "NAO_CONTRIBUINTE") as "CONTRIBUINTE" | "ISENTO" | "NAO_CONTRIBUINTE",
          endereco: {
            cep: formData.endereco.cep || undefined,
            logradouro: formData.endereco.logradouro || undefined,
            numero: formData.endereco.numero || undefined,
            complemento: formData.endereco.complemento || undefined,
            bairro: formData.endereco.bairro || undefined,
            cidade: formData.endereco.cidade || undefined,
            uf: uf || undefined,
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
      setFormError("Nao foi possivel salvar o fornecedor.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Fornecedores" />
          <AppSubTitle text="Cadastro e controle de fornecedores." />
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
          {formOpen ? "Fechar" : "Novo fornecedor"}
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
            {isPessoaJuridica ? (
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
            ) : null}
            <AppTextInput
              title={isPessoaJuridica ? "CNPJ" : "CPF"}
              value={formData.documento}
              sanitizeRegex={/[0-9]/g}
              maxRawLength={14}
              formatter={formatCpfCnpj}
              onValueChange={(raw) =>
                setFormData((prev) => ({ ...prev, documento: raw }))
              }
            />
            <AppSelectInput
              title="Tipo pessoa"
              value={formData.tipoPessoa}
              onChange={(e) =>
                setFormData((prev) => {
                  const nextTipo = e.target.value;
                  if (nextTipo === "PF") {
                    return {
                      ...prev,
                      tipoPessoa: nextTipo,
                      nomeFantasia: "",
                      inscricaoEstadual: "",
                      inscricaoMunicipal: "",
                      indicadorIE: "NAO_CONTRIBUINTE",
                    };
                  }
                  return {
                    ...prev,
                    tipoPessoa: nextTipo,
                  };
                })
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
            {isPessoaJuridica ? (
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
            ) : null}
            {isPessoaJuridica ? (
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
            ) : null}
            {isPessoaJuridica ? (
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
            ) : null}
            <div className="md:col-span-3">
              <AppEndereco
                value={formData.endereco}
                errors={addressErrors}
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

      <Card tone="amber">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          API de fornecedores preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum fornecedor cadastrado." />}
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

export default FornecedoresPage;

