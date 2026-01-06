import { normalizeQuery, QueryCache } from "../utils/queryCache";

export type BankItem = {
  ispb: string;
  name: string;
  code?: number;
  fullName?: string;
};

const BANKS_URL = "https://brasilapi.com.br/api/banks/v1";

const listCache = new QueryCache<BankItem[]>(10 * 60 * 1000, 5);
const searchCache = new QueryCache<BankItem[]>(10 * 60 * 1000, 300);

function normalizeText(value: string) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function parseBanksPayload(data: unknown): BankItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : "";
      const ispb = typeof record.ispb === "string" ? record.ispb : "";
      const fullName =
        typeof record.fullName === "string" ? record.fullName : undefined;
      const code =
        typeof record.code === "number"
          ? record.code
          : typeof record.code === "string"
          ? Number(record.code)
          : undefined;
      if (!name && !ispb) return null;
      return {
        name,
        ispb,
        fullName,
        code: Number.isFinite(code) ? code : undefined,
      };
    })
    .filter((item): item is BankItem => Boolean(item));
}

async function fetchBanks(signal?: AbortSignal): Promise<BankItem[]> {
  try {
    const res = await fetch(BANKS_URL, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return parseBanksPayload(data);
  } catch {
    return [];
  }
}

export async function getBanksCached(signal?: AbortSignal): Promise<BankItem[]> {
  const key = "banks:all";
  const cached = listCache.get(key);
  if (cached) return cached;

  const inflight = listCache.getInflight(key);
  if (inflight) return inflight;

  const p = (async () => {
    const banks = await fetchBanks(signal);
    listCache.set(key, banks);
    return banks;
  })();

  listCache.setInflight(key, p);
  return p;
}

export async function searchBanks(
  query: string,
  signal?: AbortSignal
): Promise<BankItem[]> {
  const key = normalizeQuery(query);
  if (!key) return [];

  const cached = searchCache.get(key);
  if (cached) return cached;

  const inflight = searchCache.getInflight(key);
  if (inflight) return inflight;

  const p = (async () => {
    const banks = await getBanksCached(signal);
    const digits = query.replace(/\D/g, "");
    const qNorm = normalizeText(query);
    const results = banks.filter((bank) => {
      const code = bank.code != null ? String(bank.code) : "";
      const name = normalizeText(bank.name);
      const fullName = normalizeText(bank.fullName ?? "");
      if (digits) {
        if (code.startsWith(digits)) return true;
        if (bank.ispb && bank.ispb.startsWith(digits)) return true;
      }
      if (!qNorm) return false;
      return name.includes(qNorm) || fullName.includes(qNorm);
    });
    return results.slice(0, 30);
  })();

  searchCache.setInflight(key, p);
  return p;
}

export async function getBankByValueCached(
  value: string,
  signal?: AbortSignal
): Promise<BankItem | null> {
  const raw = (value || "").trim();
  if (!raw) return null;
  const banks = await getBanksCached(signal);
  const digits = raw.replace(/\D/g, "");
  const rawNorm = normalizeText(raw);

  if (digits) {
    const byCode = banks.find(
      (bank) =>
        (bank.code != null && String(bank.code) === digits) ||
        bank.ispb === digits
    );
    if (byCode) return byCode;
  }

  const byName = banks.find((bank) => {
    const name = normalizeText(bank.name);
    const fullName = normalizeText(bank.fullName ?? "");
    return name === rawNorm || fullName === rawNorm;
  });

  return byName ?? null;
}

export function resolveBankLabel(value: string, banks: BankItem[]): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits) {
    const byCode = banks.find(
      (bank) => bank.code != null && String(bank.code) === digits
    );
    if (byCode) return byCode.name;
  }
  const rawNorm = normalizeText(raw);
  const byName = banks.find((bank) => normalizeText(bank.name) === rawNorm);
  return byName?.name ?? raw;
}
