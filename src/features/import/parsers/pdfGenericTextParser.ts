import type { ParsedTransaction, ParserInput, StatementParser } from "./types";
import { toIsoDate } from "../utils/date";

const amountRegex = /(-?\d{1,3}(?:\.\d{3})*,\d{2})/;
const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;

const parseAmount = (value: string) => {
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const num = Number(cleaned || "0");
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
};

export const PdfGenericTextParser: StatementParser = {
  id: "pdf_generic_text",
  supports: (input: ParserInput) => input.fileType === "PDF" && Boolean(input.text),
  parse: (input: ParserInput): ParsedTransaction[] => {
    const text = input.text ?? "";
    const normalized = text.replace(/\s+/g, " ").trim();
    const lines = normalized.split(/(?=\d{2}\/\d{2}\/\d{4})/g);
    const results: ParsedTransaction[] = [];
    lines.forEach((line) => {
      const dateMatch = line.match(dateRegex);
      const amountMatch = line.match(amountRegex);
      if (!dateMatch || !amountMatch) return;
      const date = toIsoDate(dateMatch[1]);
      const amount = parseAmount(amountMatch[1]);
      const description = line
        .replace(dateMatch[1], "")
        .replace(amountMatch[1], "")
        .replace(/\s+/g, " ")
        .trim();
      results.push({
        date,
        description: description || "Movimento",
        amount,
        currency: "BRL",
        sourceType: "BANK",
        raw: line,
      });
    });
    return results.filter((item) => item.amount !== 0);
  },
};
