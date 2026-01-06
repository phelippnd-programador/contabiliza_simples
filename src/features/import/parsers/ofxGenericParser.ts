import type { ParsedTransaction, ParserInput, StatementParser } from "./types";
import { toIsoDate } from "../utils/date";

const parseTagValue = (block: string, tag: string) => {
  const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
  return match ? match[1].trim() : "";
};

export const OfxGenericParser: StatementParser = {
  id: "ofx_generic",
  supports: (input: ParserInput) => input.fileType === "OFX" && Boolean(input.ofxRaw),
  parse: (input: ParserInput): ParsedTransaction[] => {
    const raw = input.ofxRaw ?? "";
    const blocks = raw.split(/<STMTTRN>/i).slice(1);
    return blocks
      .map((block) => {
        const dateRaw = parseTagValue(block, "DTPOSTED");
        const date = toIsoDate(dateRaw.slice(0, 8).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"));
        const amountRaw = parseTagValue(block, "TRNAMT").replace(",", ".");
        const amount = Math.round(Number(amountRaw || "0") * 100);
        const description =
          parseTagValue(block, "MEMO") || parseTagValue(block, "NAME") || "Movimento";
        return {
          date,
          description,
          amount,
          currency: "BRL" as const,
          sourceType: "BANK" as const,
          raw: block.trim(),
        };
      })
      .filter((item) => item.date && item.amount !== 0);
  },
};
