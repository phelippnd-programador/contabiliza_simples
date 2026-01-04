import { apiFetch } from "../../../shared/services/apiClient";
import type { ApiListResponse } from "../../../shared/types/api-types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type VendaResumo = {
  id: string;
  cliente: string;
  data: string;
  total: number;
  status?: string;
  itens?: ComercialItem[];
  subtotal?: number;
  desconto?: number;
  frete?: number;
  impostos?: number;
  observacoes?: string;
  financeiro?: ComercialFinanceiro;
  estoque?: ComercialEstoque;
};

export type CompraResumo = {
  id: string;
  fornecedor: string;
  data: string;
  total: number;
  status?: string;
  itens?: ComercialItem[];
  subtotal?: number;
  desconto?: number;
  frete?: number;
  impostos?: number;
  observacoes?: string;
  financeiro?: ComercialFinanceiro;
  estoque?: ComercialEstoque;
};

export type VendaPayload = {
  cliente: string;
  data: string;
  total: number;
  status?: string;
  itens?: ComercialItem[];
  subtotal?: number;
  desconto?: number;
  frete?: number;
  impostos?: number;
  observacoes?: string;
  financeiro?: ComercialFinanceiro;
  estoque?: ComercialEstoque;
};

export type CompraPayload = {
  fornecedor: string;
  data: string;
  total: number;
  status?: string;
  itens?: ComercialItem[];
  subtotal?: number;
  desconto?: number;
  frete?: number;
  impostos?: number;
  observacoes?: string;
  financeiro?: ComercialFinanceiro;
  estoque?: ComercialEstoque;
};

export type ListComercialParams = {
  page?: number;
  pageSize?: number;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  q?: string;
};

export type VendaProdutoResumo = {
  produtoId?: string;
  descricao: string;
  quantidade: number;
  total: number;
};

export type VendaSaidaResumo = {
  id: string;
  data: string;
  produto: string;
  quantidade: number;
  total: number;
};

export type VendasAnalyticsResponse = {
  totais?: {
    quantidade: number;
    total: number;
  };
  maisVendidos: VendaProdutoResumo[];
  menosVendidos: VendaProdutoResumo[];
  ultimosSaidos: VendaSaidaResumo[];
};

export type ComercialItem = {
  produtoId?: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
};

export type ComercialFinanceiro = {
  gerarConta?: boolean;
  contaId?: string;
  categoriaId?: string;
  vencimento?: string;
  formaPagamento?: string;
};

export type ComercialEstoque = {
  gerarMovimento?: boolean;
};

export async function getVendasAnalytics(
  params: { dataInicio?: string; dataFim?: string } = {}
): Promise<VendasAnalyticsResponse> {
  if (!API_BASE) {
    return { maisVendidos: [], menosVendidos: [], ultimosSaidos: [] };
  }
  const query = new URLSearchParams();
  if (params.dataInicio) query.set("dataInicio", params.dataInicio);
  if (params.dataFim) query.set("dataFim", params.dataFim);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch(`/comercial/vendas/analytics${suffix}`);
  if (!res.ok) {
    throw new Error("GET_VENDAS_ANALYTICS_FAILED");
  }
  return (await res.json()) as VendasAnalyticsResponse;
}

export async function getVenda(id: string): Promise<VendaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/comercial/vendas/${id}`);
  if (!res.ok) {
    throw new Error("GET_VENDA_FAILED");
  }
  return (await res.json()) as VendaResumo;
}

export async function listVendas(
  params: ListComercialParams = {}
): Promise<ApiListResponse<VendaResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.dataInicio) query.set("dataInicio", params.dataInicio);
  if (params.dataFim) query.set("dataFim", params.dataFim);
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  const res = await apiFetch(`/comercial/vendas?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_VENDAS_FAILED");
  }
  return (await res.json()) as ApiListResponse<VendaResumo>;
}

export async function createVenda(payload: VendaPayload): Promise<VendaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/comercial/vendas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_VENDA_FAILED");
  }
  return (await res.json()) as VendaResumo;
}

export async function updateVenda(
  id: string,
  payload: Partial<VendaPayload>
): Promise<VendaResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/comercial/vendas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_VENDA_FAILED");
  }
  return (await res.json()) as VendaResumo;
}

export async function deleteVenda(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/comercial/vendas/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_VENDA_FAILED");
  }
}

export async function getCompra(id: string): Promise<CompraResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/comercial/compras/${id}`);
  if (!res.ok) {
    throw new Error("GET_COMPRA_FAILED");
  }
  return (await res.json()) as CompraResumo;
}

export async function listCompras(
  params: ListComercialParams = {}
): Promise<ApiListResponse<CompraResumo>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  if (!API_BASE) {
    return { data: [], meta: { page, pageSize, total: 0 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.dataInicio) query.set("dataInicio", params.dataInicio);
  if (params.dataFim) query.set("dataFim", params.dataFim);
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  const res = await apiFetch(`/comercial/compras?${query.toString()}`);
  if (!res.ok) {
    throw new Error("LIST_COMPRAS_FAILED");
  }
  return (await res.json()) as ApiListResponse<CompraResumo>;
}

export async function createCompra(
  payload: CompraPayload
): Promise<CompraResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch("/comercial/compras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("CREATE_COMPRA_FAILED");
  }
  return (await res.json()) as CompraResumo;
}

export async function updateCompra(
  id: string,
  payload: Partial<CompraPayload>
): Promise<CompraResumo> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/comercial/compras/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("UPDATE_COMPRA_FAILED");
  }
  return (await res.json()) as CompraResumo;
}

export async function deleteCompra(id: string): Promise<void> {
  if (!API_BASE) {
    throw new Error("API_NOT_CONFIGURED");
  }
  const res = await apiFetch(`/comercial/compras/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("DELETE_COMPRA_FAILED");
  }
}
