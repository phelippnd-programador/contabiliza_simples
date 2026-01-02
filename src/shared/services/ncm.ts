export type NcmItem = {
  codigo: string;
  descricao: string;
};

const API_BASE = "https://brasilapi.com.br/api/ncm/v1";

export async function searchNcm(query: string, signal?: AbortSignal): Promise<NcmItem[]> {
  const url = `${API_BASE}?search=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error("NCM_SEARCH_FAILED");
  }
  const data = (await res.json()) as Array<{ codigo: string; descricao: string }>;
  return data.map((item) => ({
    codigo: item.codigo,
    descricao: item.descricao,
  }));
}
