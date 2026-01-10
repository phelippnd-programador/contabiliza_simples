import React, { useEffect, useMemo, useState } from "react";
import AppListNotFound from "../AppListNotFound";

type AppTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  getFilterValue?: (row: T) => string | number | null | undefined;
  filterable?: boolean;
  filterPlaceholder?: string;
  filterMode?: "text" | "select";
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
};

type AppTablePagination = {
  enabled?: boolean;
  pageSize?: number;
  page?: number;
  total?: number;
  onPageChange?: (page: number) => void;
};

type AppTableProps<T> = {
  data: T[];
  columns: AppTableColumn<T>[];
  rowKey?: (row: T, index: number) => string;
  emptyState?: React.ReactNode;
  pagination?: AppTablePagination;
};

const getAlignClass = (align?: "left" | "right" | "center") => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

const AppTable = <T,>({
  data,
  columns,
  rowKey,
  emptyState,
  pagination,
}: AppTableProps<T>) => {
  const pageSize = pagination?.pageSize ?? 10;
  const isPaginated = pagination?.enabled !== false;
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = pagination?.page ?? internalPage;
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [enabledFilters, setEnabledFilters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      const keys = new Set(columns.map((column) => column.key));
      columns.forEach((column) => {
        if (next[column.key] === undefined) {
          next[column.key] = "";
        }
      });
      Object.keys(next).forEach((key) => {
        if (!keys.has(key)) delete next[key];
      });
      return next;
    });
  }, [columns]);

  const showFilters = useMemo(
    () => Object.values(enabledFilters).some(Boolean),
    [enabledFilters]
  );

  useEffect(() => {
    setEnabledFilters((prev) => {
      const next = { ...prev };
      const keys = new Set(columns.map((column) => column.key));
      columns.forEach((column) => {
        if (next[column.key] === undefined) {
          next[column.key] = false;
        }
      });
      Object.keys(next).forEach((key) => {
        if (!keys.has(key)) delete next[key];
      });
      return next;
    });
  }, [columns]);

  const isColumnFilterable = (column: AppTableColumn<T>) => {
    if (column.filterable !== undefined) return column.filterable;
    return !["acoes", "action", "actions"].includes(column.key.toLowerCase());
  };

  const columnFilterModes = useMemo(() => {
    const modeMap = new Map<string, "text" | "select">();
    const sample = data.slice(0, 500);
    columns.forEach((column) => {
      if (!isColumnFilterable(column)) return;
      if (column.filterMode) {
        modeMap.set(column.key, column.filterMode);
        return;
      }
      const values = new Set<string>();
      let hasComplex = false;
      sample.forEach((row) => {
        const rawValue = column.getFilterValue
          ? column.getFilterValue(row)
          : (row as Record<string, unknown>)[column.key];
        if (rawValue === null || rawValue === undefined) return;
        if (Array.isArray(rawValue)) {
          hasComplex = true;
          return;
        }
        if (typeof rawValue === "object") {
          hasComplex = true;
          return;
        }
        values.add(String(rawValue));
      });
      if (!hasComplex && values.size > 0 && values.size <= 8) {
        modeMap.set(column.key, "select");
      } else {
        modeMap.set(column.key, "text");
      }
    });
    return modeMap;
  }, [columns, data]);

  const columnFilterOptions = useMemo(() => {
    const optionsMap = new Map<string, string[]>();
    const sample = data.slice(0, 500);
    columns.forEach((column) => {
      if (columnFilterModes.get(column.key) !== "select") return;
      const values = new Set<string>();
      sample.forEach((row) => {
        const rawValue = column.getFilterValue
          ? column.getFilterValue(row)
          : (row as Record<string, unknown>)[column.key];
        if (rawValue === null || rawValue === undefined) return;
        if (Array.isArray(rawValue) || typeof rawValue === "object") return;
        values.add(String(rawValue));
      });
      optionsMap.set(column.key, Array.from(values).sort());
    });
    return optionsMap;
  }, [columnFilterModes, columns, data]);

  const filteredData = useMemo(() => {
    let result = data;
    columns.forEach((column) => {
      if (!isColumnFilterable(column)) return;
      if (!enabledFilters[column.key]) return;
      const rawFilter = (filters[column.key] ?? "").trim().toLowerCase();
      if (!rawFilter) return;
      const filterMode = columnFilterModes.get(column.key) ?? "text";
      result = result.filter((row) => {
        const rawValue = column.getFilterValue
          ? column.getFilterValue(row)
          : (row as Record<string, unknown>)[column.key];
        if (rawValue === null || rawValue === undefined) return false;
        if (Array.isArray(rawValue)) {
          return filterMode === "select"
            ? rawValue.join(" ").toLowerCase() === rawFilter
            : rawValue.join(" ").toLowerCase().includes(rawFilter);
        }
        if (typeof rawValue === "object") {
          try {
            const str = JSON.stringify(rawValue).toLowerCase();
            return filterMode === "select" ? str === rawFilter : str.includes(rawFilter);
          } catch {
            return false;
          }
        }
        const str = String(rawValue).toLowerCase();
        return filterMode === "select" ? str === rawFilter : str.includes(rawFilter);
      });
    });
    return result;
  }, [columnFilterModes, columns, data, enabledFilters, filters]);

  const isFiltering = useMemo(
    () =>
      Object.entries(filters).some(
        ([key, value]) => enabledFilters[key] && value.trim().length > 0
      ),
    [enabledFilters, filters]
  );

  const totalItems = isFiltering
    ? filteredData.length
    : pagination?.total ?? filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (!isPaginated) return;
    if (currentPage > totalPages) {
      if (pagination?.onPageChange) {
        pagination.onPageChange(totalPages);
      } else {
        setInternalPage(totalPages);
      }
    }
  }, [currentPage, isPaginated, pagination, totalPages]);

  const pagedData = useMemo(() => {
    if (!isPaginated) return filteredData;
    if (!isFiltering && pagination?.total != null) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [currentPage, filteredData, isFiltering, isPaginated, pageSize, pagination?.total]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (pagination?.onPageChange) {
      pagination.onPageChange(nextPage);
    } else {
      setInternalPage(nextPage);
    }
  };

  useEffect(() => {
    if (!isPaginated) return;
    if (!isFiltering) return;
    if (currentPage !== 1) handlePageChange(1);
  }, [currentPage, filters, isFiltering, isPaginated]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
      <table className="w-full text-left text-sm">
        <thead className="bg-gradient-to-r from-slate-50 via-white to-slate-50 text-xs uppercase text-slate-500 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-400">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={[
                  "px-4 py-3.5 tracking-wide",
                  getAlignClass(column.align),
                  column.headerClassName ?? "",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex items-center justify-between gap-2",
                    column.align === "right"
                      ? "justify-end"
                      : column.align === "center"
                      ? "justify-center"
                      : "justify-start",
                  ].join(" ")}
                >
                  <span>{column.header}</span>
                  {isColumnFilterable(column) ? (
                    <button
                      type="button"
                      aria-label={`Ativar filtro ${column.header}`}
                      onClick={() => {
                        setEnabledFilters((prev) => {
                          const next = { ...prev, [column.key]: !prev[column.key] };
                          if (!next[column.key]) {
                            setFilters((current) => ({ ...current, [column.key]: "" }));
                          }
                          return next;
                        });
                      }}
                      className={[
                        "inline-flex h-6 w-6 items-center justify-center rounded-md border text-[10px] transition",
                        enabledFilters[column.key]
                          ? "border-sky-200 bg-sky-100/70 text-sky-700"
                          : "border-slate-200/70 bg-white/70 text-slate-400",
                        "hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:border-slate-600",
                      ].join(" ")}
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                        <path d="M3 5h18l-7 8v5l-4 1v-6L3 5z" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
          {showFilters ? (
            <tr className="bg-white/70 text-[11px] uppercase text-slate-400 dark:bg-slate-950/70 dark:text-slate-500">
              {columns.map((column) => {
                const filterable = isColumnFilterable(column);
                const filterMode = columnFilterModes.get(column.key) ?? "text";
                const options = columnFilterOptions.get(column.key) ?? [];
                const isEnabled = enabledFilters[column.key];
                return (
                  <th key={`${column.key}-filter`} className="px-4 py-2 align-middle">
                    {filterable && isEnabled && filterMode === "select" ? (
                      <select
                        value={filters[column.key] ?? ""}
                        onChange={(event) =>
                          setFilters((prev) => ({
                            ...prev,
                            [column.key]: event.target.value,
                          }))
                        }
                        className={[
                          "w-full rounded-lg border border-slate-200/70 bg-white/80 px-2 py-2 text-xs font-normal text-slate-600 shadow-sm",
                          "focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200",
                          "dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:focus:ring-sky-900/40",
                          column.align === "right" ? "text-right" : "",
                          column.align === "center" ? "text-center" : "",
                        ].join(" ")}
                      >
                        <option value="">{column.filterPlaceholder ?? `Todos`}</option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : filterable && isEnabled ? (
                      <input
                        type="text"
                        value={filters[column.key] ?? ""}
                        onChange={(event) =>
                          setFilters((prev) => ({
                            ...prev,
                            [column.key]: event.target.value,
                          }))
                        }
                        placeholder={column.filterPlaceholder ?? `Filtrar ${column.header}`}
                        className={[
                          "w-full rounded-lg border border-slate-200/70 bg-white/80 px-2 py-2 text-xs font-normal text-slate-600 shadow-sm",
                          "placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200",
                          "dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-sky-900/40",
                          column.align === "right" ? "text-right" : "",
                          column.align === "center" ? "text-center" : "",
                        ].join(" ")}
                      />
                    ) : (
                      <div className="h-8" />
                    )}
                  </th>
                );
              })}
            </tr>
          ) : null}
        </thead>
        <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800">
          {pagedData.length ? (
            pagedData.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : String(index)}
                className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      "text-slate-700 dark:text-slate-100",
                      "px-4 py-3.5",
                      getAlignClass(column.align),
                      column.className ?? "",
                    ].join(" ")}
                  >
                    {column.render ? column.render(row) : null}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6">
                {emptyState ?? <AppListNotFound />}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isPaginated && totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-100/70 bg-white/80 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <span>
            Pagina {currentPage} de {totalPages} - {totalItems} itens
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Anterior
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Proxima
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AppTable;
