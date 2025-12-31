import type { CnaeItem } from "../services/ibgeCnae";

type CacheEntry = {
  value: CnaeItem[];
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CnaeItem[]>>();

const TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_SIZE = 300;

function normalizeKey(q: string) {
  return (q || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(key: string, value: CnaeItem[]) {
  if (cache.size >= MAX_SIZE) {
    const firstKey = cache.keys().next().value as string | undefined;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

export async function cachedCnaeSearch(
  query: string,
  fetcher: (q: string, signal?: AbortSignal) => Promise<CnaeItem[]>,
  signal?: AbortSignal
): Promise<CnaeItem[]> {
  const key = normalizeKey(query);
  if (key.length < 2) return [];

  const hit = getCached(key);
  if (hit) return hit;

  const inFlightPromise = inflight.get(key);
  if (inFlightPromise) return inFlightPromise;

  const p = (async () => {
    const res = await fetcher(query, signal);
    setCached(key, res);
    return res;
  })();

  inflight.set(key, p);
  p.finally(() => inflight.delete(key));

  return p;
}
