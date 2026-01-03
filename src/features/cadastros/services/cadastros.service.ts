import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ClienteResumo = {
  id: string;
  nome: string;
  documento?: string;
  status?: string;
};

export type FornecedorResumo = {
  id: string;
  nome: string;
  documento?: string;
  status?: string;
};

export type ProdutoServicoResumo = {
  id: string;
  descricao: string;
  tipo?: string;
  status?: string;
};

export type ClientePayload = {
  nome: string;
  documento?: string;
  status?: string;
};

export type FornecedorPayload = {
  nome: string;
  documento?: string;
  status?: string;
};

export type ProdutoServicoPayload = {
  descricao: string;
  tipo?: string;
  status?: string;
};

export type ListCadastrosParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
};

export async function getCliente(id: string): Promise<ClienteResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/clientes/${id}`);
  if (!res.ok) {
    throw new Error("GET_CLIENTE_FAILED");
  }
  return (await res.json()) as ClienteResumo;
}

export async function listClientes(
  params: ListCadastrosParams = {}
): Promise<ApiListResponse<ClienteResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/cadastros/clientes?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_CLIENTES_FAILED");
  }
  return (await res.json()) as ApiListResponse<ClienteResumo>;
}

export async function createCliente(
  payload: ClientePayload
): Promise<ClienteResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/cadastros/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_CLIENTE_FAILED");
  }
  return (await res.json()) as ClienteResumo;
}

export async function updateCliente(
  id: string,
  payload: Partial<ClientePayload>
): Promise<ClienteResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/clientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_CLIENTE_FAILED");
  }
  return (await res.json()) as ClienteResumo;
}

export async function deleteCliente(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/clientes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_CLIENTE_FAILED");
  }
}

export async function getFornecedor(id: string): Promise<FornecedorResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/fornecedores/${id}`);
  if (!res.ok) {
    throw new Error("GET_FORNECEDOR_FAILED");
  }
  return (await res.json()) as FornecedorResumo;
}

export async function listFornecedores(
  params: ListCadastrosParams = {}
): Promise<ApiListResponse<FornecedorResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/cadastros/fornecedores?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_FORNECEDORES_FAILED");
  }
  return (await res.json()) as ApiListResponse<FornecedorResumo>;
}

export async function createFornecedor(
  payload: FornecedorPayload
): Promise<FornecedorResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/cadastros/fornecedores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_FORNECEDOR_FAILED");
  }
  return (await res.json()) as FornecedorResumo;
}

export async function updateFornecedor(
  id: string,
  payload: Partial<FornecedorPayload>
): Promise<FornecedorResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/fornecedores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_FORNECEDOR_FAILED");
  }
  return (await res.json()) as FornecedorResumo;
}

export async function deleteFornecedor(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/fornecedores/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_FORNECEDOR_FAILED");
  }
}

export async function getProdutoServico(
  id: string
): Promise<ProdutoServicoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/produtos-servicos/${id}`);
  if (!res.ok) {
    throw new Error("GET_PRODUTO_SERVICO_FAILED");
  }
  return (await res.json()) as ProdutoServicoResumo;
}

export async function listProdutosServicos(
  params: ListCadastrosParams = {}
): Promise<ApiListResponse<ProdutoServicoResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);

  const res = await apiFetch(`/cadastros/produtos-servicos?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_PRODUTOS_SERVICOS_FAILED");
  }
  return (await res.json()) as ApiListResponse<ProdutoServicoResumo>;
}

export async function createProdutoServico(
  payload: ProdutoServicoPayload
): Promise<ProdutoServicoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/cadastros/produtos-servicos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_PRODUTO_SERVICO_FAILED");
  }
  return (await res.json()) as ProdutoServicoResumo;
}

export async function updateProdutoServico(
  id: string,
  payload: Partial<ProdutoServicoPayload>
): Promise<ProdutoServicoResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/produtos-servicos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_PRODUTO_SERVICO_FAILED");
  }
  return (await res.json()) as ProdutoServicoResumo;
}

export async function deleteProdutoServico(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/cadastros/produtos-servicos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_PRODUTO_SERVICO_FAILED");
  }
}
