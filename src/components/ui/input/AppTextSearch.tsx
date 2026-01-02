import React, { useEffect, useMemo, useRef, useState } from "react";
import AppTextInput from "../input/AppTextInput";

export type AppTextSearchProps<T> = {
    // input
    label?: string;
    required?: boolean;
    placeholder?: string;
    helperText?: string;
    error?: string;
    disabled?: boolean;

    // seleção
    value?: T | null;
    onChange: (item: T | null) => void;

    // como o item vira texto no input quando selecionado
    getDisplayValue: (item: T) => string;

    // como renderizar um item na lista
    renderItem: (item: T, active: boolean) => React.ReactNode;

    // busca
    onSearch: (query: string, signal?: AbortSignal) => Promise<T[]>;
    minCharsToSearch?: number; // default 2
    debounceMs?: number;       // default 300

    // opcional: transformar o que o usuário digitou antes de buscar (mask, trim, etc)
    transformQuery?: (raw: string) => string;

    // opcional: key do item
    getKey?: (item: T, index: number) => string;

    // textos
    texts?: {
        searching?: string;
        noResults?: string;
        typeAtLeast?: (n: number) => string;
        hintFooter?: string; // ex: "↑ ↓ • Enter • Esc"
    };

    // dropdown
    maxResults?: number; // default 30
};

export function AppTextSearch<T>({
    label,
    required,
    placeholder,
    helperText,
    error,
    disabled,

    value,
    onChange,
    getDisplayValue,
    renderItem,

    onSearch,
    minCharsToSearch = 2,
    debounceMs = 300,
    transformQuery,

    getKey,
    texts,
    maxResults = 30,
}: AppTextSearchProps<T>) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState<string>(value ? getDisplayValue(value) : "");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<T[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // sincroniza value externo → texto (com guard pra evitar render em cascata)
    useEffect(() => {
        const next = value ? getDisplayValue(value) : "";
        setQuery((prev) => (prev === next ? prev : next));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // fecha ao clicar fora
    useEffect(() => {
        function onDocMouseDown(e: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    useEffect(() => {
        if (!open || disabled) return;
        const updatePosition = () => {
            const inputEl = inputRef.current;
            if (!inputEl) return;
            const rect = inputEl.getBoundingClientRect();
            const maxWidth = rect.width;
            const left = Math.max(
                8,
                Math.min(rect.left, window.innerWidth - maxWidth - 8)
            );
            const top = rect.bottom + 8;
            setPopoverStyle({
                position: "fixed",
                top,
                left,
                width: rect.width,
                zIndex: 60,
            });
        };
        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [open, disabled]);

    // quando fecha, limpa resultados (opcional, mas melhora UX/perf)
    useEffect(() => {
        if (!open) setResults([]);
    }, [open]);

    // busca (debounce + abort)
    useEffect(() => {
        if (!open || disabled) return;

        const raw = query.trim();
        const q = transformQuery ? transformQuery(raw) : raw;

        // evita buscar se o input está exatamente no valor selecionado
        const looksSelected = value ? q === getDisplayValue(value) : false;
        if (looksSelected) return;

        if (q.length < minCharsToSearch) {
            setResults([]);
            setLoading(false);
            return;
        }

        const ctrl = new AbortController();
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await onSearch(q, ctrl.signal);
                setResults((res ?? []).slice(0, maxResults));
                setActiveIndex(0);
            } finally {
                setLoading(false);
            }
        }, debounceMs);

        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, open, disabled, minCharsToSearch, debounceMs, onSearch, transformQuery, maxResults]);

    function selectItem(item: T) {
        onChange(item);
        setOpen(false);
    }

    function clearSelection() {
        onChange(null);
        setQuery("");
        setResults([]);
        setOpen(false);
        inputRef.current?.focus();
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
        }
        if (!open) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = results[activeIndex];
            if (item) selectItem(item);
        } else if (e.key === "Escape") {
            e.preventDefault();
            if (query) clearSelection();
            else setOpen(false);
        }
    }

    function onInputChange(raw: string) {
        const next = transformQuery ? transformQuery(raw) : raw;
        setQuery(next);
        setOpen(true);

        // se usuário apagou tudo, considera “limpo”
        if (next.trim() === "" && value) onChange(null);
    }

    const headerText = useMemo(() => {
        const t = {
            searching: texts?.searching ?? "Buscando...",
            noResults: texts?.noResults ?? "Nenhum resultado",
            typeAtLeast: texts?.typeAtLeast ?? ((n: number) => `Digite pelo menos ${n} caracteres`),
            hintFooter: texts?.hintFooter ?? "↑ ↓ • Enter • Esc",
        };

        if (loading) return t.searching;

        const q = query.trim();
        if (!q || q.length < minCharsToSearch) return t.typeAtLeast(minCharsToSearch);

        if (results.length === 0) return t.noResults;

        return `${results.length} resultado(s)`;
    }, [loading, results.length, query, minCharsToSearch, texts]);

    const hintFooter = texts?.hintFooter ?? "↑ ↓ • Enter • Esc";

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <AppTextInput
                    ref={inputRef}
                    title={label}
                    required={required}
                    disabled={disabled}
                    value={query}
                    placeholder={placeholder}
                    onChange={(e) => onInputChange(e.target.value)}
                    onFocus={() => !disabled && setOpen(true)}
                    onKeyDown={onKeyDown}
                    helperText={helperText}
                    error={error}
                />

                {/* Botão limpar (só aparece se tiver algo digitado) */}
                {!disabled && query && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="cursor-pointer absolute right-3 top-[40px] text-xs text-gray-500 hover:text-red-600"
                        title="Limpar"
                    >
                        limpar
                    </button>
                )}

                {open && !disabled && (
                    <div
                        className="rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
                        style={popoverStyle}
                    >
                        <div className="px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
                            <span>{headerText}</span>
                            <span className="text-[11px]">{hintFooter}</span>
                        </div>

                        <div className="max-h-72 overflow-auto">
                            {results.map((it, idx) => {
                                const active = idx === activeIndex;
                                return (
                                    <button
                                        key={getKey ? getKey(it, idx) : String(idx)}
                                        type="button"
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onClick={() => selectItem(it)}
                                        className={[
                                            "w-full text-left px-3 py-2 text-sm",
                                            active ? "bg-blue-50" : "bg-white",
                                            "hover:bg-blue-50",
                                        ].join(" ")}
                                    >
                                        {renderItem(it, active)}
                                    </button>
                                );
                            })}
                        </div>

                        {!loading && results.length === 0 && query.trim().length >= minCharsToSearch && (
                            <div className="px-3 py-3 text-sm text-gray-600">
                                Tente refinar sua busca.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
