import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppEndereco, { type EnderecoValue } from "../../../components/ui/input/AppEndereco";
import { AppTabs } from "../../../components/ui/tab/AppTabs";
import { formatCpfCnpj } from "../../../shared/utils/formater";
import {
  createFuncionario,
  listFuncionarios,
  toggleFuncionarioStatus,
  updateFuncionario,
} from "../services/rh.service";
import type { Funcionario } from "../types/rh.types";
import { useCargos, useCentrosCusto, useDepartamentos } from "../hooks/useRhLookups";
import { isCpfValid } from "../utils/rh.validation";
import { EditIcon } from "../../../components/ui/icon/AppIcons";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const statusOptions = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
];

const contratoOptions = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "ESTAGIO", label: "Estagio" },
  { value: "OUTRO", label: "Outro" },
];

const jornadaOptions = [
  { value: "MENSAL", label: "Mensal" },
  { value: "SEMANAL", label: "Semanal" },
];

const salarioTipoOptions = [
  { value: "MENSAL", label: "Mensal" },
  { value: "HORA", label: "Hora" },
];

const contaTipoOptions = [
  { value: "CORRENTE", label: "Corrente" },
  { value: "POUPANCA", label: "Poupanca" },
];

type TabId =
  | "pessoal"
  | "trabalho"
  | "remuneracao"
  | "bancario"
  | "documentos";

const FuncionariosPage = () => {
  const location = useLocation();
  const [itens, setItens] = useState<Funcionario[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { popupProps, openConfirm } = useConfirmPopup();
  const [tab, setTab] = useState<TabId>("pessoal");
  const [addressErrors, setAddressErrors] = useState<
    Partial<Record<keyof EnderecoValue, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    rg: "",
    dataNascimento: "",
    sexo: "",
    estadoCivil: "",
    email: "",
    telefone: "",
    endereco: {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
    },
    matricula: "",
    dataAdmissao: "",
    tipoContrato: "CLT",
    jornada: "MENSAL",
    departamentoId: "",
    cargoId: "",
    centroCustoId: "",
    status: "ATIVO",
    salarioBase: "",
    salarioTipo: "MENSAL",
    adicionalPericulosidade: "NAO",
    adicionalInsalubridade: "NAO",
    inssPercentual: "",
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "CORRENTE",
    pix: "",
    anexos: [] as Array<{ name: string; size: number }>,
  });
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    departamentoId: "",
    cargoId: "",
    dataInicio: "",
    dataFim: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const { data: departamentos } = useDepartamentos({ page: 1, pageSize: 200 });
  const { data: cargos } = useCargos({ page: 1, pageSize: 200 });
  const { data: centrosCusto } = useCentrosCusto({ page: 1, pageSize: 200 });

  const load = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await listFuncionarios({
        page,
        pageSize,
        ...filters,
      });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar os funcionarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    if (location.pathname.endsWith("/rh/funcionarios/novo")) {
      resetForm();
      setFormError("");
      setFormOpen(true);
    }
  }, [location.pathname]);

  const departamentoOptions = useMemo(
    () =>
      departamentos.map((dep) => ({
        value: dep.id,
        label: dep.nome,
      })),
    [departamentos]
  );

  const cargoOptions = useMemo(
    () =>
      cargos.map((cargo) => ({
        value: cargo.id,
        label: cargo.nome,
      })),
    [cargos]
  );

  const centroOptions = useMemo(
    () =>
      centrosCusto.map((centro) => ({
        value: centro.id,
        label: centro.nome,
      })),
    [centrosCusto]
  );

  const columns = useMemo(
    () => [
      { key: "nome", header: "Nome", render: (row: Funcionario) => row.nome },
      {
        key: "cpf",
        header: "CPF",
        render: (row: Funcionario) => formatCpfCnpj(row.cpf),
      },
      { key: "matricula", header: "Matricula", render: (row: Funcionario) => row.matricula },
      {
        key: "status",
        header: "Status",
        render: (row: Funcionario) => row.status,
      },
      {
        key: "departamento",
        header: "Departamento",
        render: (row: Funcionario) =>
          departamentos.find((dep) => dep.id === row.departamentoId)?.nome ?? "-",
      },
      {
        key: "cargo",
        header: "Cargo",
        render: (row: Funcionario) =>
          cargos.find((cargo) => cargo.id === row.cargoId)?.nome ?? "-",
      },
      {
        key: "admissao",
        header: "Admissao",
        render: (row: Funcionario) => row.dataAdmissao,
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: Funcionario) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`Editar funcionario ${row.nome}`}
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  nome: row.nome,
                  cpf: row.cpf,
                  rg: row.rg ?? "",
                  dataNascimento: row.dataNascimento ?? "",
                  sexo: row.sexo ?? "",
                  estadoCivil: row.estadoCivil ?? "",
                  email: row.email ?? "",
                  telefone: row.telefone ?? "",
                  endereco: {
                    cep: row.endereco?.cep ?? "",
                    logradouro: row.endereco?.logradouro ?? "",
                    numero: row.endereco?.numero ?? "",
                    complemento: row.endereco?.complemento ?? "",
                    bairro: row.endereco?.bairro ?? "",
                    cidade: row.endereco?.cidade ?? "",
                    uf: row.endereco?.uf ?? "",
                  },
                  matricula: row.matricula,
                  dataAdmissao: row.dataAdmissao,
                  tipoContrato: row.tipoContrato,
                  jornada: row.jornada,
                  departamentoId: row.departamentoId ?? "",
                  cargoId: row.cargoId ?? "",
                  centroCustoId: row.centroCustoId ?? "",
                  status: row.status,
                  salarioBase: String(row.salarioBase ?? ""),
                  salarioTipo: row.salarioTipo,
                  adicionalPericulosidade: row.adicionalPericulosidade ? "SIM" : "NAO",
                  adicionalInsalubridade: row.adicionalInsalubridade ? "SIM" : "NAO",
                  inssPercentual:
                    row.inssPercentual !== undefined ? String(row.inssPercentual) : "",
                  banco: row.banco ?? "",
                  agencia: row.agencia ?? "",
                  conta: row.conta ?? "",
                  tipoConta: row.tipoConta ?? "CORRENTE",
                  pix: row.pix ?? "",
                  anexos: row.anexos ?? [],
                });
                setFormError("");
                setFormOpen(true);
              }}
            />
            <AppIconButton
              icon={<EditIcon className="h-4 w-4" />}
              label={`${row.status === "ATIVO" ? "Inativar" : "Reativar"} ${row.nome}`}
              onClick={() =>
                openConfirm(
                  {
                    title: row.status === "ATIVO" ? "Inativar" : "Reativar",
                    description: `Deseja ${row.status === "ATIVO" ? "inativar" : "reativar"} este funcionario?`,
                    confirmLabel: row.status === "ATIVO" ? "Inativar" : "Reativar",
                    tone: row.status === "ATIVO" ? "danger" : "default",
                  },
                  async () => {
                    if (!API_BASE) {
                      setError("API nao configurada.");
                      return;
                    }
                    try {
                      await toggleFuncionarioStatus(
                        row.id,
                        row.status === "ATIVO" ? "INATIVO" : "ATIVO"
                      );
                      load();
                    } catch {
                      setError("Nao foi possivel atualizar o status.");
                    }
                  }
                )
              }
            />
          </div>
        ),
      },
    ],
    [cargos, departamentos, openConfirm]
  );

  const resetForm = () => {
    setEditingId(null);
    setAddressErrors({});
    setFormData({
      nome: "",
      cpf: "",
      rg: "",
      dataNascimento: "",
      sexo: "",
      estadoCivil: "",
      email: "",
      telefone: "",
      endereco: {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
      },
      matricula: "",
      dataAdmissao: "",
      tipoContrato: "CLT",
      jornada: "MENSAL",
      departamentoId: "",
      cargoId: "",
      centroCustoId: "",
      status: "ATIVO",
      salarioBase: "",
      salarioTipo: "MENSAL",
      adicionalPericulosidade: "NAO",
      adicionalInsalubridade: "NAO",
      inssPercentual: "",
      banco: "",
      agencia: "",
      conta: "",
      tipoConta: "CORRENTE",
      pix: "",
      anexos: [],
    });
    setTab("pessoal");
  };

  const handleSubmit = async () => {
    setFormError("");
    setAddressErrors({});
    if (!formData.nome || !formData.cpf || !formData.matricula || !formData.dataAdmissao) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!isCpfValid(formData.cpf)) {
      setFormError("CPF invalido.");
      return;
    }
    if (!formData.salarioBase || Number(formData.salarioBase) <= 0) {
      setFormError("Informe o salario base.");
      return;
    }
    if (!API_BASE) {
      setFormError("API nao configurada.");
      return;
    }
    const payload: Partial<Funcionario> = {
      nome: formData.nome,
      cpf: formData.cpf,
      rg: formData.rg || undefined,
      dataNascimento: formData.dataNascimento || undefined,
      sexo: formData.sexo || undefined,
      estadoCivil: formData.estadoCivil || undefined,
      email: formData.email || undefined,
      telefone: formData.telefone || undefined,
      endereco: {
        cep: formData.endereco.cep || undefined,
        logradouro: formData.endereco.logradouro || undefined,
        numero: formData.endereco.numero || undefined,
        complemento: formData.endereco.complemento || undefined,
        bairro: formData.endereco.bairro || undefined,
        cidade: formData.endereco.cidade || undefined,
        uf: formData.endereco.uf || undefined,
      },
      matricula: formData.matricula,
      dataAdmissao: formData.dataAdmissao,
      tipoContrato: formData.tipoContrato as Funcionario["tipoContrato"],
      jornada: formData.jornada as Funcionario["jornada"],
      departamentoId: formData.departamentoId || undefined,
      cargoId: formData.cargoId || undefined,
      centroCustoId: formData.centroCustoId || undefined,
      status: formData.status as Funcionario["status"],
      salarioBase: Number(formData.salarioBase),
      salarioTipo: formData.salarioTipo as Funcionario["salarioTipo"],
      adicionalPericulosidade: formData.adicionalPericulosidade === "SIM",
      adicionalInsalubridade: formData.adicionalInsalubridade === "SIM",
      inssPercentual: formData.inssPercentual
        ? Number(formData.inssPercentual)
        : undefined,
      banco: formData.banco || undefined,
      agencia: formData.agencia || undefined,
      conta: formData.conta || undefined,
      tipoConta: formData.tipoConta as Funcionario["tipoConta"],
      pix: formData.pix || undefined,
      anexos: formData.anexos,
    };
    try {
      if (editingId) {
        await updateFuncionario(editingId, payload);
      } else {
        await createFuncionario(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar o funcionario.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Funcionarios" />
          <AppSubTitle text="Cadastro e gestao de pessoas." />
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
          {formOpen ? "Fechar" : "Novo funcionario"}
        </AppButton>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <AppTextInput
            title="Busca"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          />
          <AppSelectInput
            title="Status"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            data={[{ value: "", label: "Todos" }, ...statusOptions]}
          />
          <AppSelectInput
            title="Departamento"
            value={filters.departamentoId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, departamentoId: e.target.value }))
            }
            data={[{ value: "", label: "Todos" }, ...departamentoOptions]}
          />
          <AppSelectInput
            title="Cargo"
            value={filters.cargoId}
            onChange={(e) => setFilters((prev) => ({ ...prev, cargoId: e.target.value }))}
            data={[{ value: "", label: "Todos" }, ...cargoOptions]}
          />
          <AppDateInput
            title="Admissao inicio"
            value={filters.dataInicio}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataInicio: e.target.value }))
            }
          />
          <AppDateInput
            title="Admissao fim"
            value={filters.dataFim}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dataFim: e.target.value }))
            }
          />
          <div className="flex items-end">
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={() => {
                setPage(1);
                load();
              }}
            >
              Filtrar
            </AppButton>
          </div>
        </div>
      </Card>

      {formOpen ? (
        <Card>
          <AppTabs
            activeTab={tab}
            onChange={setTab}
            tabs={[
              { id: "pessoal", label: "Dados pessoais" },
              { id: "trabalho", label: "Dados trabalhistas" },
              { id: "remuneracao", label: "Remuneracao" },
              { id: "bancario", label: "Dados bancarios" },
              { id: "documentos", label: "Documentos" },
            ]}
          />
          {tab === "pessoal" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <AppTextInput
                required
                title="Nome"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              />
              <AppTextInput
                required
                title="CPF"
                value={formData.cpf}
                sanitizeRegex={/[0-9]/g}
                maxRawLength={11}
                formatter={formatCpfCnpj}
                onValueChange={(raw) => setFormData((prev) => ({ ...prev, cpf: raw }))}
              />
              <AppTextInput
                title="RG"
                value={formData.rg}
                onChange={(e) => setFormData((prev) => ({ ...prev, rg: e.target.value }))}
              />
              <AppDateInput
                title="Nascimento"
                value={formData.dataNascimento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dataNascimento: e.target.value }))
                }
              />
              <AppSelectInput
                title="Sexo"
                value={formData.sexo}
                onChange={(e) => setFormData((prev) => ({ ...prev, sexo: e.target.value }))}
                data={[
                  { value: "", label: "Selecione" },
                  { value: "M", label: "Masculino" },
                  { value: "F", label: "Feminino" },
                  { value: "OUTRO", label: "Outro" },
                ]}
              />
              <AppSelectInput
                title="Estado civil"
                value={formData.estadoCivil}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, estadoCivil: e.target.value }))
                }
                data={[
                  { value: "", label: "Selecione" },
                  { value: "SOLTEIRO", label: "Solteiro" },
                  { value: "CASADO", label: "Casado" },
                  { value: "DIVORCIADO", label: "Divorciado" },
                  { value: "VIUVO", label: "Viuvo" },
                  { value: "OUTRO", label: "Outro" },
                ]}
              />
              <AppTextInput
                title="Email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
              <AppTextInput
                title="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
              />
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
            </div>
          ) : null}

          {tab === "trabalho" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <AppTextInput
                required
                title="Matricula"
                value={formData.matricula}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, matricula: e.target.value }))
                }
              />
              <AppDateInput
                required
                title="Admissao"
                value={formData.dataAdmissao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dataAdmissao: e.target.value }))
                }
              />
              <AppSelectInput
                title="Tipo contrato"
                value={formData.tipoContrato}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tipoContrato: e.target.value }))
                }
                data={contratoOptions}
              />
              <AppSelectInput
                title="Jornada"
                value={formData.jornada}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, jornada: e.target.value }))
                }
                data={jornadaOptions}
              />
              <AppSelectInput
                title="Departamento"
                value={formData.departamentoId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, departamentoId: e.target.value }))
                }
                data={[{ value: "", label: "Selecione" }, ...departamentoOptions]}
              />
              <AppSelectInput
                title="Cargo"
                value={formData.cargoId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cargoId: e.target.value }))
                }
                data={[{ value: "", label: "Selecione" }, ...cargoOptions]}
              />
              <AppSelectInput
                title="Centro de custo"
                value={formData.centroCustoId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, centroCustoId: e.target.value }))
                }
                data={[{ value: "", label: "Selecione" }, ...centroOptions]}
              />
              <AppSelectInput
                title="Status"
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                data={statusOptions}
              />
            </div>
          ) : null}

          {tab === "remuneracao" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <AppTextInput
                required
                title="Salario base (R$)"
                value={formData.salarioBase}
                sanitizeRegex={/[0-9]/g}
                onValueChange={(raw) => setFormData((prev) => ({ ...prev, salarioBase: raw }))}
              />
              <AppSelectInput
                title="Tipo salario"
                value={formData.salarioTipo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, salarioTipo: e.target.value }))
                }
                data={salarioTipoOptions}
              />
              <AppSelectInput
                title="Periculosidade"
                value={formData.adicionalPericulosidade}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    adicionalPericulosidade: e.target.value,
                  }))
                }
                data={[
                  { value: "NAO", label: "Nao" },
                  { value: "SIM", label: "Sim" },
                ]}
              />
              <AppSelectInput
                title="Insalubridade"
                value={formData.adicionalInsalubridade}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    adicionalInsalubridade: e.target.value,
                  }))
                }
                data={[
                  { value: "NAO", label: "Nao" },
                  { value: "SIM", label: "Sim" },
                ]}
              />
              <AppTextInput
                title="INSS (%)"
                value={formData.inssPercentual}
                sanitizeRegex={/[0-9]/g}
                onValueChange={(raw) =>
                  setFormData((prev) => ({ ...prev, inssPercentual: raw }))
                }
                placeholder="Ex: 11"
              />
            </div>
          ) : null}

          {tab === "bancario" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <AppTextInput
                title="Banco"
                value={formData.banco}
                onChange={(e) => setFormData((prev) => ({ ...prev, banco: e.target.value }))}
              />
              <AppTextInput
                title="Agencia"
                value={formData.agencia}
                onChange={(e) => setFormData((prev) => ({ ...prev, agencia: e.target.value }))}
              />
              <AppTextInput
                title="Conta"
                value={formData.conta}
                onChange={(e) => setFormData((prev) => ({ ...prev, conta: e.target.value }))}
              />
              <AppSelectInput
                title="Tipo conta"
                value={formData.tipoConta}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tipoConta: e.target.value }))
                }
                data={contaTipoOptions}
              />
              <AppTextInput
                title="PIX"
                value={formData.pix}
                onChange={(e) => setFormData((prev) => ({ ...prev, pix: e.target.value }))}
              />
            </div>
          ) : null}

          {tab === "documentos" ? (
            <div className="mt-4 flex flex-col gap-4">
              <input
                type="file"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  if (!files.length) return;
                  setFormData((prev) => ({
                    ...prev,
                    anexos: [
                      ...prev.anexos,
                      ...files.map((file) => ({ name: file.name, size: file.size })),
                    ],
                  }));
                }}
              />
              {formData.anexos.length ? (
                <ul className="text-sm text-gray-600 dark:text-gray-300">
                  {formData.anexos.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum documento anexado.</p>
              )}
            </div>
          ) : null}

          {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
          <div className="mt-4 flex gap-3">
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
          API de funcionarios preparada para integracao.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {isLoading ? <p className="text-sm text-gray-500">Carregando...</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={
            <AppListNotFound texto={isLoading ? "Carregando..." : "Nenhum funcionario cadastrado."} />
          }
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

export default FuncionariosPage;
