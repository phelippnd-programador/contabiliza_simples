import type { ParsedTransaction, ParserInput, StatementParser } from "./types";
import { toIsoDate } from "../utils/date";
import { sha1Hash } from "../utils/hash";

const normalizePdfText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const normalizeKey = (value: string) => normalizePdfText(value).replace(/\s+/g, "");

const hasItauSignals = (text: string) => {
  const normalized = normalizeKey(text);
  return (
    (normalized.includes("LANCAMENTOS:COMPRASESAQUES") ||
      normalized.includes("LANCAMENTOSCOMPRASESAQUES")) &&
    (normalized.includes("BANCOITAU") || normalized.includes("ITAU")) &&
    normalized.includes("CARTAO") &&
    normalized.includes("XXXX")
  );
};

const parseAmount = (value: string) => {
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const num = Number(cleaned || "0");
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
};

const getYearFromHeader = (text: string) => {
  const match =
    text.match(/Vencimento:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/Emissao:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/Postagem:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (!match) return new Date().getFullYear();
  return Number(match[1].split("/")[2]);
};

const getMonthFromHeader = (text: string) => {
  const match =
    text.match(/Vencimento:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/Emissao:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/Postagem:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (!match) return new Date().getMonth() + 1;
  return Number(match[1].split("/")[1]);
};

const parseInstallment = (description: string) => {
  const match = description.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (!match) return { description, installment: undefined };
  const current = Number(match[1]);
  const total = Number(match[2]);
  const cleaned = description.replace(match[0], "").replace(/\s+/g, " ").trim();
  return {
    description: cleaned || description,
    installment: current && total ? { current, total } : undefined,
  };
};

const isStopLine = (line: string) => {
  const normalized = normalizeKey(line);
  return (
    normalized.includes("LANCAMENTOSNOCARTAO") ||
    normalized.includes("TOTALDOSLANCAMENTOSATUAIS")
  );
};

const normalizeDescription = (description: string) => {
  const normalized = normalizePdfText(description);
  const hasFee = ["MULTA", "JUROS DE MORA", "ENCARGOS REFINANCIAMENT"].some(
    (fee) => normalized.startsWith(fee)
  );
  return { normalized, hasFee };
};

const isUpcomingSectionLine = (line?: string) => {
  if (!line) return false;
  const normalized = normalizeKey(line);
  return (
    normalized.includes("COMPRASPARCELADAS") ||
    normalized.includes("PROXIMAFATURA") ||
    normalized.includes("DEMAISFATURAS") ||
    normalized.includes("TOTALPARAPROXIMASFATURAS")
  );
};
type Transacao = {
  data: string;    // 04/11
  valor: number;     // 77.88
  parcela?: string;  // "77,88"
  descricao: string;  // "77,88"
};
export const extrairTransacoes = (texto: string): Transacao[] => {
  const regexTransacao =
    /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])([^\r\n]*?)(?:[ \t]+|\r?\n[ \t]*)(\d{1,3}(?:\.\d{3})*,\d{2})\b/gm;

  const regexParcela = /\b(\d{2}\/\d{2})\b/;

  const transacoes: Transacao[] = [];
  let match: RegExpExecArray | null;

  while ((match = regexTransacao.exec(texto)) !== null) {
    const dia = match[1];
    const mes = match[2];
    const descricaoRaw = match[3] ?? "";
    const valorRaw = match[4];

    // Extrai parcela, se existir
    const parcelaMatch = descricaoRaw.match(regexParcela);
    const parcela = parcelaMatch?.[1];

    // Limpa a descrição removendo a parcela
    const descricao = descricaoRaw
      .replace(regexParcela, "")
      .replace(/\s+/g, " ")
      .trim();

    const valor = Number(
      valorRaw.replace(/\./g, "").replace(",", ".")
    );

    transacoes.push({
      data: `${dia}/${mes}`,
      descricao,
      parcela,
      valor,
    });
  }

  return transacoes;
};
const parseTransactionsFromText = (
  text: string,
  year: number,
  statementMonth: number
) => {
  const transactions: ParsedTransaction[] = [];
  const base = extrairTransacoes(text);
  base.forEach((item) => {
    const [day, month] = item.data.split("/").map(Number);
    if (!day || !month) return;
    let useYear = year;
    if (statementMonth === 1 && month === 12) useYear = year - 1;
    const date = toIsoDate(
      `${day.toString().padStart(2, "0")}/${month
        .toString()
        .padStart(2, "0")}/${useYear}`
    );
    const installmentMatch = item.parcela?.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    const installment =
      installmentMatch && installmentMatch[1] && installmentMatch[2]
        ? {
            current: Number(installmentMatch[1]),
            total: Number(installmentMatch[2]),
          }
        : undefined;
    const amount = Math.round((item.valor || 0) * 100);
    transactions.push({
      date,
      description: item.descricao,
      amount: -amount,
      currency: "BRL",
      sourceType: "CARD",
      issuer: "ITAU",
      direction: "DEBIT",
      installment,
      rawLine: `${item.data} ${item.descricao} ${item.parcela ?? ""} ${item.valor}`
        .replace(/\s+/g, " ")
        .trim(),
    });
  });
  return transactions;
};

const attachMetadataLines = (_lines: string[], _items: ParsedTransaction[]) => { };

const markDuplicateOnLatestInstallment = (items: ParsedTransaction[]) => {
  const groups = new Map<string, ParsedTransaction[]>();
  items.forEach((item) => {
    const key = `${item.date}::${normalizePdfText(item.description)}::${Math.abs(
      item.amount
    )}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  });

  const result: ParsedTransaction[] = [];
  groups.forEach((group) => {
    if (group.length <= 1) {
      result.push(...group);
      return;
    }
    let latest = group[0];
    group.forEach((item) => {
      const currentInstallment = item.installment?.current ?? 0;
      const latestInstallment = latest.installment?.current ?? 0;
      if (currentInstallment > latestInstallment) {
        latest = item;
      }
    });
    if (latest.installment?.current != null) {
      group.forEach((item) => {
        if (item.installment?.current == null) {
          item.installment = { ...latest.installment };
        }
      });
    }
    result.push(
      ...group.map((item) =>
        item === latest
          ? {
            ...item,
            duplicateInBatch: true,
          }
          : item
      )
    );
  });

  return result;
};

export const parseItauInvoiceHeader = async (text: string) => {
  const normalized = normalizePdfText(text);
  const holderMatch = normalized.match(/TITULAR\s+([A-Z\s]+)/);
  const cardMatch = normalized.match(/CARTAO\s+(\d{4}\.XXXX\.XXXX\.\d{4})/);
  const issueMatch = normalized.match(/EMISSAO:\s*(\d{2}\/\d{2}\/\d{4})/);
  const dueMatch = normalized.match(/VENCIMENTO:\s*(\d{2}\/\d{2}\/\d{4})/);
  const postingMatch = normalized.match(/POSTAGEM:\s*(\d{2}\/\d{2}\/\d{4})/);
  const totalMatch =
    normalized.match(/TOTAL DESTA FATURA\s+([\d.]+,\d{2})/) ||
    normalized.match(/O TOTAL DA SUA FATURA E:\s*R\$\s*([\d.]+,\d{2})/);
  if (!issueMatch || !dueMatch || !totalMatch) return null;
  return {
    issuer: "ITAU" as const,
    holderName: holderMatch ? holderMatch[1].trim() : "",
    cardMasked: cardMatch ? cardMatch[1].trim() : "",
    statementIssueDate: toIsoDate(issueMatch[1]),
    statementDueDate: toIsoDate(dueMatch[1]),
    statementPostingDate: postingMatch ? toIsoDate(postingMatch[1]) : undefined,
    statementTotal: parseAmount(totalMatch[1]),
    rawTextHash: await sha1Hash(text),
  };
};

export const ItauCreditPdfParser: StatementParser = {
  id: "itau_credit_pdf",
  supports: (input: ParserInput) =>
    input.fileType === "PDF" && Boolean(input.text) && hasItauSignals(input.text ?? ""),
  parse: (input: ParserInput): ParsedTransaction[] => {
    const text = input.text ?? "";
    const normalized = normalizePdfText(text);
    const year = getYearFromHeader(normalized);
    const statementMonth = getMonthFromHeader(normalized);
    const parsed = parseTransactionsFromText(text, year, statementMonth);
    const deduped = markDuplicateOnLatestInstallment(parsed);
    return deduped.map((item) => {
      return {
        ...item,
        tags: undefined,
        category: undefined,
        city: undefined,
      };
    });
  },
};
