import React, { useMemo } from "react";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";
import type { ImportTransaction } from "../types";

type ReviewStepProps = {
  transactions: ImportTransaction[];
  error?: string;
  onChange: (next: ImportTransaction[]) => void;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  summary: {
    total: number;
    credits: number;
    debits: number;
  };
};

const ReviewStep = ({
  transactions,
  error,
  onChange,
  onBack,
  onConfirm,
  onCancel,
  summary,
}: ReviewStepProps) => {
  const { popupProps, openConfirm } = useConfirmPopup();
  const formatCurrency = (value: number) =>
    (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const rows = useMemo(() => {
    const normalize = (value: string) =>
      (value || "").replace(/\b\d{1,2}\/\d{1,2}\b/g, "").trim().toUpperCase();
    const groups = new Map<string, ImportTransaction[]>();
    transactions.forEach((item) => {
      const key = `${item.date}::${normalize(item.description)}`;
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    });
    return transactions.map((item) => {
      const key = `${item.date}::${normalize(item.description)}`;
      const group = groups.get(key) ?? [];
      const duplicateInBatch = group.length > 1;
      let futureInstallment = false;
      if (duplicateInBatch) {
        const maxInstallment = group.reduce(
          (max, current) => Math.max(max, current.installment?.current ?? 0),
          0
        );
        if ((item.installment?.current ?? 0) === maxInstallment && maxInstallment > 0) {
          futureInstallment = true;
        }
      }
      return {
        ...item,
        duplicateInBatch,
        futureInstallment,
      };
    });
  }, [transactions]);

  const updateTransaction = (id: string, patch: Partial<ImportTransaction>) => {
    onChange(
      transactions.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeTransaction = (id: string) => {
    openConfirm(
      {
        title: "Remover transacao",
        description: "Deseja remover esta transacao da importacao?",
        confirmLabel: "Remover",
        cancelLabel: "Cancelar",
        tone: "danger",
      },
      () => onChange(transactions.filter((item) => item.id !== id))
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
          <p className="text-xs uppercase text-gray-400">Total</p>
          <p className="text-base font-semibold">{formatCurrency(summary.total)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
          <p className="text-xs uppercase text-gray-400">Creditos</p>
          <p className="text-base font-semibold">{formatCurrency(summary.credits)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
          <p className="text-xs uppercase text-gray-400">Debitos</p>
          <p className="text-base font-semibold">{formatCurrency(summary.debits)}</p>
        </div>
      </div>

      <AppTable
        data={rows}
        rowKey={(row) => row.id}
        emptyState={<AppListNotFound texto="Nenhuma transacao encontrada." />}
        pagination={{ enabled: true, pageSize: 8 }}
        columns={[
          {
            key: "date",
            header: "Data",
            render: (row) => (
              <AppDateInput
                value={row.date}
                onChange={(event) =>
                  updateTransaction(row.id, { date: event.target.value })
                }
              />
            ),
          },
          {
            key: "installment",
            header: "Parcela",
            render: (row) =>
              row.installment ? (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {row.installment.current}/{row.installment.total}
                </span>
              ) : (
                "-"
              ),
          },
          {
            key: "installmentPaid",
            header: "Pagas",
            render: (row) => {
              if (!row.installment || row.installment.current <= 1) return "-";
              return (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {row.installment.current - 1}
                </span>
              );
            },
          },
          {
            key: "description",
            header: "Descricao",
            render: (row) => (
              <AppTextInput
                value={row.description}
                onChange={(event) =>
                  updateTransaction(row.id, { description: event.target.value })
                }
              />
            ),
          },
          {
            key: "category",
            header: "Categoria",
            render: (row) => (
              <AppTextInput
                value={row.category ?? ""}
                onChange={(event) =>
                  updateTransaction(row.id, { category: event.target.value })
                }
              />
            ),
          },
          {
            key: "city",
            header: "Cidade",
            render: (row) => (
              <AppTextInput
                value={row.city ?? ""}
                onChange={(event) =>
                  updateTransaction(row.id, { city: event.target.value })
                }
              />
            ),
          },
          {
            key: "amount",
            header: "Valor",
            render: (row) => (
              <AppTextInput
                value={String(Math.abs(row.amount))}
                sanitizeRegex={/[0-9]/g}
                formatter={(value) => formatCurrency(Number(value || "0"))}
                onValueChange={(raw) => {
                  const cents = Number(raw || "0");
                  updateTransaction(row.id, {
                    amount: row.amount < 0 ? -cents : cents,
                  });
                }}
              />
            ),
          },
          {
            key: "duplicate",
            header: "Duplicado",
            render: (row) =>
              row.duplicateInBatch || row.duplicateInSystem ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                  Possivel duplicado
                </span>
              ) : (
                "-"
              ),
          },
          {
            key: "futureInstallment",
            header: "Futura",
            render: (row) =>
              row.futureInstallment ? (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
                  Parcela futura
                </span>
              ) : (
                "-"
              ),
          },
          {
            key: "actions",
            header: "",
            align: "center",
            render: (row) => (
              <AppIconButton
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M6 6l1 14h10l1-14" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                }
                label="Remover"
                variant="danger"
                onClick={() => removeTransaction(row.id)}
              />
            ),
          },
        ]}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <AppButton type="button" className="w-auto px-6" onClick={onBack}>
          Voltar
        </AppButton>
        <AppButton type="button" className="w-auto px-6" onClick={onConfirm}>
          Confirmar importacao
        </AppButton>
        <AppButton type="button" className="w-auto px-6" onClick={onCancel}>
          Cancelar lote
        </AppButton>
      </div>
      <AppPopup {...popupProps} />
    </div>
  );
};

export default ReviewStep;
