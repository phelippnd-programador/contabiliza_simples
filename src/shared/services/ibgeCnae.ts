import { normalizeQuery, QueryCache } from "../utils/queryCache";

// src/services/ibgeCnae.ts
export type CnaeItem = {
    codigo: string;     // "6201-5/01"
    descricao: string;  // "Desenvolvimento de programas de computador..."
};

const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v2";

function onlyDigits(v: string) {
    return (v || "").replace(/\D/g, "");
}
const cnaeCache = new QueryCache<CnaeItem[]>(10 * 60 * 1000, 300);

export async function searchIbgeCnaeCached(
    query: string,
    signal?: AbortSignal
): Promise<CnaeItem[]> {
    const key = normalizeQuery(query);

    if (key.length < 2) return [];

    // 1) cache hit
    const cached = cnaeCache.get(key);
    if (cached) return cached;

    // 2) dedupe de requisição em andamento
    const inflight = cnaeCache.getInflight(key);
    if (inflight) return inflight;

    // 3) chama API e guarda
    const p = (async () => {
        const res = await searchIbgeCnae(query, signal);
        cnaeCache.set(key, res);
        return res;
    })();

    cnaeCache.setInflight(key, p);
    return p;
}

export function cnaeOnlyDigits(codigo: string) {
    return onlyDigits(codigo);
}

/**
 * Busca 1 CNAE específico (por código numérico) e retorna item com descrição.
 * Usa cache pra não bater na API repetido.
 */
export async function getIbgeCnaeByCodigoNumericoCached(
    codigoNumerico: string,
    signal?: AbortSignal
): Promise<CnaeItem | null> {
    const digits = onlyDigits(codigoNumerico);
    if (digits.length !== 7) return null;

    // chave do cache específica pra "get by codigo"
    const key = normalizeQuery(`cnae:${digits}`);

    const cached = cnaeCache.get(key);
    if (cached && cached.length) return cached[0];

    const inflight = cnaeCache.getInflight(key);
    if (inflight) {
        const arr = await inflight;
        return arr[0] ?? null;
    }

    const p = (async () => {
        // aqui a gente usa a busca normal, mas forçando query = digits
        // ela já tenta rotas por "codigo=digits"
        const res = await searchIbgeCnae(digits, signal);

        // tenta achar match exato
        const found = res.find((i) => onlyDigits(i.codigo) === digits);

        const one = found ? [found] : [];
        cnaeCache.set(key, one);
        return one;
    })();

    cnaeCache.setInflight(key, p);
    const arr = await p;

    return arr[0] ?? null;
}

// máscara CNAE (7 dígitos: 4 + 1 + 2)
export function maskCnae(codigo: string) {
    const digits = onlyDigits(codigo);
    if (digits.length !== 7) return codigo;
    return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5, 7)}`;
}

function normalizeText(s: string) {
    return (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function uniqueByCodigo(items: CnaeItem[]) {
    const seen = new Set<string>();
    const out: CnaeItem[] = [];
    for (const it of items) {
        const key = normalizeText(it.codigo);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(it);
    }
    return out;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getArrayFromPayload(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;

    if (isObject(data) && Array.isArray(data.items)) {
        return data.items;
    }

    return [];
}
function parseIbgePayload(data: unknown): CnaeItem[] {
    const arr = getArrayFromPayload(data);
    const out: CnaeItem[] = [];

    for (const it of arr) {
        if (!isObject(it)) continue;

        const codigoRaw =
            it.id ??
            it.codigo ??
            it.cod ??
            it.cnae ??
            it.subclasse ??
            it.classe;

        const descricaoRaw =
            it.descricao ??
            it.titulo ??
            it.nome ??
            it.denominacao ??
            it.descricao_subclasse ??
            it.descricao_classe;

        if (typeof codigoRaw !== 'string' && typeof codigoRaw !== 'number') continue;
        if (typeof descricaoRaw !== 'string') continue;

        out.push({
            codigo: maskCnae(String(codigoRaw)),
            descricao: descricaoRaw,
        });
    }

    return out;
}


/**
 * Tenta buscar CNAE no IBGE de forma robusta.
 * - Faz debounce no componente (não aqui)
 * - Usa AbortSignal para cancelar buscas antigas
 */
export async function searchIbgeCnae(query: string, signal?: AbortSignal): Promise<CnaeItem[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const digits = onlyDigits(q);

    // Rotas comuns que costumam existir no IBGE CNAE.
    // Se uma não existir, o fetch falha e a gente segue.
    const candidates: string[] = [
        // por descrição
        `${IBGE_BASE}/cnae/subclasses?descricao=${encodeURIComponent(q)}`,
        `${IBGE_BASE}/cnae/classes?descricao=${encodeURIComponent(q)}`,

        // por código (quando suportado)
        ...(digits.length >= 4
            ? [
                `${IBGE_BASE}/cnae/subclasses?codigo=${encodeURIComponent(digits)}`,
                `${IBGE_BASE}/cnae/classes?codigo=${encodeURIComponent(digits)}`,
            ]
            : []),

        // fallback: algumas APIs expõem lista completa, mas isso pode ser pesado
        // (deixo comentado pra não dar payload gigante)
        // `${IBGE_BASE}/cnae/subclasses`,
    ];

    const results: CnaeItem[] = [];

    // tenta cada rota com tolerância a erro
    for (const url of candidates) {
        try {
            const res = await fetch(url, { signal });
            if (!res.ok) continue;
            const data = await res.json();
            results.push(...parseIbgePayload(data));
        } catch {
            // ignora (404, CORS, abort, etc.)
        }
    }

    // filtro final: se digitou números, prioriza match por código
    const qNorm = normalizeText(q);
    const qDigits = digits;

    let final = uniqueByCodigo(results);

    if (qDigits.length >= 3) {
        final = final
            .sort((a, b) => {
                const ad = onlyDigits(a.codigo);
                const bd = onlyDigits(b.codigo);
                const aStarts = ad.startsWith(qDigits) ? 0 : ad.includes(qDigits) ? 1 : 2;
                const bStarts = bd.startsWith(qDigits) ? 0 : bd.includes(qDigits) ? 1 : 2;
                return aStarts - bStarts;
            })
            .slice(0, 30);
    } else {
        final = final
            .filter((it) => normalizeText(`${it.codigo} ${it.descricao}`).includes(qNorm))
            .slice(0, 30);
    }

    return final;
}
