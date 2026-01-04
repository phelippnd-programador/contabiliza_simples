import React, { useEffect, useMemo, useState } from "react";
import AppListNotFound from "../AppListNotFound";

type AppTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
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
  const isPaginated = Boolean(pagination?.enabled);
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = pagination?.page ?? internalPage;
  const totalItems = pagination?.total ?? data.length;
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
    if (!isPaginated) return data;
    if (pagination?.total != null) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [currentPage, data, isPaginated, pageSize, pagination?.total]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (pagination?.onPageChange) {
      pagination.onPageChange(nextPage);
    } else {
      setInternalPage(nextPage);
    }
  };

  if (!data.length) {
    return <>{emptyState ?? <AppListNotFound />}</>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900 dark:text-gray-400">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={[
                  "px-4 py-3",
                  getAlignClass(column.align),
                  column.headerClassName ?? "",
                ].join(" ")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {pagedData.map((row, index) => (
            <tr key={rowKey ? rowKey(row, index) : String(index)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={[
                    "px-4 py-3",
                    getAlignClass(column.align),
                    column.className ?? "",
                  ].join(" ")}
                >
                  {column.render ? column.render(row) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {isPaginated && totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 text-xs text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400">
          <span>
            Pagina {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-gray-100 dark:hover:border-blue-400"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Anterior
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-gray-100 dark:hover:border-blue-400"
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
