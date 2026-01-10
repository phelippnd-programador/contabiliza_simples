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
  tooltip?: string;
  tooltipPosition?: "top" | "right" | "bottom" | "left";

  // selecao
  value?: T | null;
  onChange: (item: T | null) => void;

  // como o item vira texto no input quando selecionado
  getDisplayValue: (item: T) => string;

  // como renderizar um item na lista
  renderItem: (item: T, active: boolean) => React.ReactNode;

  // busca
  onSearch: (query: string, signal?: AbortSignal) => Promise<T[]>;
  minCharsToSearch?: number; // default 2
  debounceMs?: number; // default 300

  // opcional: transformar o que o usuario digitou antes de buscar (mask, trim, etc)
  transformQuery?: (raw: string) => string;

  // opcional: key do item
  getKey?: (item: T, index: number) => string;

  // textos
  texts?: {
    searching?: string;
    noResults?: string;
    typeAtLeast?: (n: number) => string;
    hintFooter?: string; // ex: "Setas  Enter  Esc"
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
  tooltip,
  tooltipPosition,

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

  // sincroniza value externo com texto (com guard para evitar render em cascata)
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
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - maxWidth - 8));
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

    // evita buscar se o input esta exatamente no valor selecionado
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
  }, [
    query,
    open,
    disabled,
    minCharsToSearch,
    debounceMs,
    onSearch,
    transformQuery,
    maxResults,
  ]);

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

    // se usuario apagou tudo, considera "limpo"
    if (next.trim() === "" && value) onChange(null);
  }

  const headerText = useMemo(() => {
    const t = {
      searching: texts?.searching ?? "Buscando...",
      noResults: texts?.noResults ?? "Nenhum resultado",
      typeAtLeast: texts?.typeAtLeast ?? ((n: number) => `Digite pelo menos ${n} caracteres`),
      hintFooter: texts?.hintFooter ?? "Setas  Enter  Esc",
    };

    if (loading) return t.searching;

    const q = query.trim();
    if (!q || q.length < minCharsToSearch) return t.typeAtLeast(minCharsToSearch);

    if (results.length === 0) return t.noResults;

    return `${results.length} resultado(s)`;
  }, [loading, results.length, query, minCharsToSearch, texts]);

  const hintFooter = texts?.hintFooter ?? "Setas  Enter  Esc";

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
          tooltip={tooltip}
          tooltipPosition={tooltipPosition}
        />

        {!disabled && query && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-[40px] rounded-full border border-slate-200/70 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600"
            title="Limpar"
          >
            limpar
          </button>
        )}

        {open && !disabled && (
          <div
            className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
            style={popoverStyle}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-[0.18em]">{headerText}</span>
              <span className="text-[10px] font-medium">{hintFooter}</span>
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
                      "w-full text-left px-4 py-3 text-sm transition",
                      active
                        ? "bg-sky-50 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100"
                        : "bg-transparent text-slate-700 dark:text-slate-200",
                      "hover:bg-sky-50/80 dark:hover:bg-slate-800/80",
                    ].join(" ")}
                  >
                    {renderItem(it, active)}
                  </button>
                );
              })}
            </div>

            {!loading && results.length === 0 && query.trim().length >= minCharsToSearch && (
              <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                Tente refinar sua busca.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
