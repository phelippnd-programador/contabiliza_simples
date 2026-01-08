export type ImportBatchStatus = "DRAFT" | "CONFIRMED" | "CANCELED";
export type ImportSourceType = "BANK" | "CARD";
export type ImportFileType = "CSV" | "OFX" | "PDF";

export type ImportBatchSummary = {
  total: number;
  credits: number;
  debits: number;
};

export type ImportBatch = {
  id: string;
  createdAt: string;
  sourceType: ImportSourceType;
  fileName: string;
  fileType: ImportFileType;
  provider?: string;
  status: ImportBatchStatus;
  summary: ImportBatchSummary;
  accountId?: string;
  cardId?: string;
  invoiceMonth?: string;
  confirmedAt?: string;
  canceledAt?: string;
};

export type ImportTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: "BRL";
  sourceType: ImportSourceType;
  direction?: "DEBIT" | "CREDIT";
  issuer?: "ITAU";
  category?: string;
  city?: string;
  installment?: {
    current: number;
    total: number;
  };
  tags?: string[];
  rawLine?: string;
  accountId?: string;
  importBatchId?: string;
  movimentoId?: string;
  contaPagarId?: string;
  reconciledAt?: string;
  raw?: string;
  hash?: string;
  duplicateInBatch?: boolean;
  duplicateInSystem?: boolean;
  futureInstallment?: boolean;
};

export type InvoiceHeader = {
  issuer: "ITAU";
  holderName: string;
  cardMasked: string;
  statementIssueDate: string;
  statementDueDate: string;
  statementPostingDate?: string;
  statementTotal: number;
  statementMinimumPayment?: number;
  rawTextHash: string;
};
