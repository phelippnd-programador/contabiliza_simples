import type { ParsedTransaction, ParserInput, StatementParser } from "./types";
import { parseCsv } from "../utils/csv";
import { normalizeText } from "../utils/normalize";
import { toIsoDate } from "../utils/date";

const headerMap: Record<string, string> = {
  data: "date",
  date: "date",
  dt: "date",
  historico: "description",
  descricao: "description",
  desc: "description",
  memo: "description",
  documento: "description",
  valor: "amount",
  amount: "amount",
  debito: "debit",
  credito: "credit",
  credit: "credit",
  debit: "debit",
};

const parseAmount = (value?: string) => {
  const cleaned = (value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3})/g, "")
    .replace(",", ".");
  const num = Number(cleaned || "0");
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
};

const getFieldIndex = (headers: string[], target: string) =>
  headers.findIndex(
    (header) => headerMap[normalizeText(header)] === target
  );

export const CsvGenericParser: StatementParser = {
  id: "csv_generic",
  supports: (input: ParserInput) => input.fileType === "CSV" && Boolean(input.csvRaw),
  parse: (input: ParserInput): ParsedTransaction[] => {
    const csvRaw = input.csvRaw ?? "";
    const { headers, rows } = parseCsv(csvRaw);
    const dateIndex = getFieldIndex(headers, "date");
    const descriptionIndex = getFieldIndex(headers, "description");
    const amountIndex = getFieldIndex(headers, "amount");
    const debitIndex = getFieldIndex(headers, "debit");
    const creditIndex = getFieldIndex(headers, "credit");

    return rows
      .map((row) => {
        const rawDate =
          dateIndex >= 0 ? row[dateIndex] : row[0] ?? "";
        const date = toIsoDate(rawDate);
        const description =
          (descriptionIndex >= 0 ? row[descriptionIndex] : row[1]) ??
          "Movimento";
        let amount = 0;
        if (amountIndex >= 0) {
          amount = parseAmount(row[amountIndex] ?? "");
        } else {
          const debit = parseAmount(row[debitIndex] ?? "");
          const credit = parseAmount(row[creditIndex] ?? "");
          amount = credit - debit;
        }
        return {
          date,
          description: description || "Movimento",
          amount,
          currency: "BRL" as const,
          sourceType: "BANK" as const,
          raw: row.join(" | "),
        };
      })
      .filter((item) => item.date && item.amount !== 0);
  },
};
