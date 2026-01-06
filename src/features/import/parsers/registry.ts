import type { ParserInput, StatementParser } from "./types";
import { CsvGenericParser } from "./csvGenericParser";
import { OfxGenericParser } from "./ofxGenericParser";
import { PdfGenericTextParser } from "./pdfGenericTextParser";
import { ItauCreditPdfParser } from "./itauCreditPdfParser";

const parsers: StatementParser[] = [
  ItauCreditPdfParser,
  CsvGenericParser,
  OfxGenericParser,
  PdfGenericTextParser,
];

export const getBestParser = (input: ParserInput) =>
  parsers.find((parser) => parser.supports(input)) ?? parsers[0];
