export type FileType = "CSV" | "OFX" | "PDF";

export type ParserInput = {
  fileName: string;
  fileType: FileType;
  text?: string;
  csvRaw?: string;
  ofxRaw?: string;
};

export type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  currency: "BRL";
  sourceType: "BANK" | "CARD";
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
  raw?: string;
  hash?: string;
};

export type StatementParser = {
  id: string;
  supports: (input: ParserInput) => boolean;
  parse: (input: ParserInput) => ParsedTransaction[];
};
