import React from "react";
import AppButton from "../../../components/ui/button/AppButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import type { ImportFileType, ImportSourceType } from "../types";

type UploadStepProps = {
  file?: File | null;
  fileType?: ImportFileType | null;
  sourceType: ImportSourceType;
  invoiceMonth?: string;
  accountId: string;
  accounts: Array<{ value: string; label: string }>;
  cardId: string;
  cards: Array<{ value: string; label: string }>;
  error?: string;
  disableSourceType?: boolean;
  disableCardSelect?: boolean;
  hideSourceType?: boolean;
  hideCardSelect?: boolean;
  onFileChange: (file: File | null) => void;
  onSourceTypeChange: (value: ImportSourceType) => void;
  onInvoiceMonthChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onCardChange: (value: string) => void;
  onNext: () => void;
  pdfWarning?: string;
  pdfError?: string;
  pdfDebug?: string;
  pdfStats?: string;
  title: string;
  subtitle: string;
};

const UploadStep = ({
  file,
  fileType,
  sourceType,
  invoiceMonth,
  accountId,
  accounts,
  cardId,
  cards,
  error,
  disableSourceType,
  disableCardSelect,
  hideSourceType,
  hideCardSelect,
  onFileChange,
  onSourceTypeChange,
  onInvoiceMonthChange,
  onAccountChange,
  onCardChange,
  onNext,
  pdfWarning,
  pdfError,
  pdfDebug,
  pdfStats,
  title,
  subtitle,
}: UploadStepProps) => {
  const pdfPreview = pdfDebug ? pdfDebug.slice(0, 8000) : "";

  const handleDownloadPdfLog = () => {
    if (!pdfDebug) return;
    const blob = new Blob([pdfDebug], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pdf_debug.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-300">{subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AppTextInput
          title="Arquivo"
          value={file?.name ?? ""}
          readOnly
        />
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Selecionar arquivo
          </label>
          <input
            type="file"
            accept=".csv,.ofx,.pdf"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500 dark:text-gray-300"
          />
          {fileType ? (
            <p className="text-xs text-gray-400">Tipo detectado: {fileType}</p>
          ) : null}
        </div>
        {hideSourceType ? null : (
          <AppSelectInput
            title="Origem"
            value={sourceType}
            onChange={(event) => onSourceTypeChange(event.target.value as ImportSourceType)}
            disabled={disableSourceType}
            data={[
              { value: "BANK", label: "Banco" },
              { value: "CARD", label: "Cartao" },
            ]}
          />
        )}
        {sourceType === "CARD" ? (
          <>
            {hideCardSelect ? null : (
              <AppSelectInput
                title="Cartao"
                value={cardId}
                onChange={(event) => onCardChange(event.target.value)}
                disabled={disableCardSelect}
                data={cards}
                placeholder="Selecione"
              />
            )}
            <AppDateInput
              title="Mes da fatura"
              type="month"
              value={invoiceMonth ?? ""}
              onChange={(event) => onInvoiceMonthChange(event.target.value)}
            />
          </>
        ) : null}
        {sourceType === "BANK" ? (
          <AppSelectInput
            title="Conta"
            value={accountId}
            onChange={(event) => onAccountChange(event.target.value)}
            data={accounts}
            placeholder="Selecione"
          />
        ) : null}
      </div>

      {pdfWarning ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          {pdfWarning}
        </div>
      ) : null}
      {pdfError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
          Detalhe do erro: {pdfError}
        </div>
      ) : null}
      {pdfStats ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Estatisticas do PDF: {pdfStats}
        </div>
      ) : null}
      {pdfDebug ? (
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
          <summary className="cursor-pointer font-semibold">
            Log de extracao do PDF ({pdfDebug.length} caracteres)
          </summary>
          <div className="mt-2">
            <AppButton type="button" onClick={handleDownloadPdfLog} className="w-auto px-3">
              Baixar log
            </AppButton>
          </div>
          <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">
            {pdfPreview}
          </pre>
        </details>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end">
        <AppButton type="button" className="w-auto px-6" onClick={onNext}>
          Revisar transacoes
        </AppButton>
      </div>
    </div>
  );
};

export default UploadStep;
