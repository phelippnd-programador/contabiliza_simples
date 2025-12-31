// src/shared/utils/queryCache.ts
export type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

 export class QueryCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private inflight = new Map<string, Promise<T>>();

    constructor(
        private ttlMs: number,
        private maxSize: number = 200
    ) { }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value;
    }

    set(key: string, value: T): void {
        // controla tamanho (evita crescer infinito)
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value as string | undefined;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        });
    }

    getInflight(key: string): Promise<T> | undefined {
        return this.inflight.get(key);
    }

    setInflight(key: string, promise: Promise<T>): void {
        this.inflight.set(key, promise);
        promise.finally(() => this.inflight.delete(key));
    }

    clear(): void {
        this.cache.clear();
        this.inflight.clear();
    }
}

// normalizador de query (pra cache funcionar bem)
export function normalizeQuery(q: string): string {
    return (q || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}
