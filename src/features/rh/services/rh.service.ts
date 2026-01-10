import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";
import type {
  Cargo,
  CentroCusto,
  Departamento,
  Funcionario,
  ListParams,
} from "../types/rh.types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const buildListQuery = (
  params: ListParams,
  dateField = "dataAdmissao"
) => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.departamentoId) query.set("departamentoId", params.departamentoId);
  if (params.cargoId) query.set("cargoId", params.cargoId);
  if (params.dataInicio) {
    query.set("dataInicio", params.dataInicio);
    query.set(`${dateField}_gte`, params.dataInicio);
  }
  if (params.dataFim) {
    query.set("dataFim", params.dataFim);
    query.set(`${dateField}_lte`, params.dataFim);
  }
  return { page, pageSize, query };
};

export async function listFuncionarios(
  params: ListParams = {}
): Promise<ApiListResponse<Funcionario>> {
  const { page, pageSize, query } = buildListQuery(params);
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/funcionarios?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_FUNCIONARIOS_FAILED");
  }
  return (await res.json()) as ApiListResponse<Funcionario>;
}

export async function getFuncionario(id: string): Promise<Funcionario> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/rh/funcionarios/${id}`);
  if (!res.ok) {
    throw new Error("GET_FUNCIONARIO_FAILED");
  }
  return (await res.json()) as Funcionario;
}

export async function createFuncionario(payload: Partial<Funcionario>): Promise<Funcionario> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/rh/funcionarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_FUNCIONARIO_FAILED");
  }
  return (await res.json()) as Funcionario;
}

export async function updateFuncionario(
  id: string,
  payload: Partial<Funcionario>
): Promise<Funcionario> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/rh/funcionarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_FUNCIONARIO_FAILED");
  }
  return (await res.json()) as Funcionario;
}

export async function toggleFuncionarioStatus(
  id: string,
  status: "ATIVO" | "INATIVO"
): Promise<Funcionario> {
  return updateFuncionario(id, { status });
}

export async function listDepartamentos(
  params: ListParams = {}
): Promise<ApiListResponse<Departamento>> {
  const { page, pageSize, query } = buildListQuery(params, "createdAt");
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/departamentos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_DEPARTAMENTOS_FAILED");
  }
  return (await res.json()) as ApiListResponse<Departamento>;
}

export async function createDepartamento(
  payload: Partial<Departamento>
): Promise<Departamento> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/rh/departamentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_DEPARTAMENTO_FAILED");
  }
  return (await res.json()) as Departamento;
}

export async function updateDepartamento(
  id: string,
  payload: Partial<Departamento>
): Promise<Departamento> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/rh/departamentos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_DEPARTAMENTO_FAILED");
  }
  return (await res.json()) as Departamento;
}

export async function deleteDepartamento(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/rh/departamentos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("DELETE_DEPARTAMENTO_FAILED");
  }
}

export async function listCargos(
  params: ListParams = {}
): Promise<ApiListResponse<Cargo>> {
  const { page, pageSize, query } = buildListQuery(params, "createdAt");
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/cargos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CARGOS_FAILED");
  }
  return (await res.json()) as ApiListResponse<Cargo>;
}

export async function createCargo(payload: Partial<Cargo>): Promise<Cargo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/rh/cargos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CARGO_FAILED");
  }
  return (await res.json()) as Cargo;
}

export async function updateCargo(
  id: string,
  payload: Partial<Cargo>
): Promise<Cargo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/rh/cargos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CARGO_FAILED");
  }
  return (await res.json()) as Cargo;
}

export async function deleteCargo(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/rh/cargos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("DELETE_CARGO_FAILED");
  }
}

export async function listCentrosCusto(
  params: ListParams = {}
): Promise<ApiListResponse<CentroCusto>> {
  const { page, pageSize, query } = buildListQuery(params, "createdAt");
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const res = await apiFetch(`/rh/centros-custo?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CENTROS_CUSTO_FAILED");
  }
  return (await res.json()) as ApiListResponse<CentroCusto>;
}

export async function createCentroCusto(
  payload: Partial<CentroCusto>
): Promise<CentroCusto> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/rh/centros-custo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CENTRO_CUSTO_FAILED");
  }
  return (await res.json()) as CentroCusto;
}

export async function updateCentroCusto(
  id: string,
  payload: Partial<CentroCusto>
): Promise<CentroCusto> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/rh/centros-custo/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CENTRO_CUSTO_FAILED");
  }
  return (await res.json()) as CentroCusto;
}

export async function deleteCentroCusto(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/rh/centros-custo/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("DELETE_CENTRO_CUSTO_FAILED");
  }
}
