type PdfTextItem = {
  str: string;
  transform: number[];
};

type PdfTextContent = {
  items: Array<PdfTextItem | { str?: string; transform?: number[] }>;
};

type PdfPageProxy = {
  getTextContent: () => Promise<PdfTextContent>;
};

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
};

type PdfjsModule = {
  getDocument: (options: { data: ArrayBuffer; disableWorker?: boolean }) => {
    promise: Promise<PdfDocumentProxy>;
  };
  GlobalWorkerOptions: { workerSrc: string };
};

type PdfExtractDebug = {
  pages: number;
  pageStats: Array<{
    page: number;
    items: number;
    textItems: number;
    textLen: number;
    lines: number;
    chunks: number; // linhas após split por colunas
  }>;
};

type ExtractOptions = {
  /**
   * Tolerância para considerar que dois itens estão na mesma linha visual.
   * PDF costuma oscilar ~0.5–2.5.
   */
  yTolerance?: number;

  /**
   * Se a distância entre itens consecutivos no eixo X for maior que isso,
   * consideramos que mudou de coluna/bloco e quebramos em nova linha.
   * Para faturas Itaú, normalmente 80–140 funciona.
   */
  colSplitGap?: number;

  /**
   * Gap mínimo para inserir espaço entre tokens dentro da mesma “sub-linha”.
   */
  wordGap?: number;
};
export const extractWithPdfjs = async (
  buffer: ArrayBuffer,
  options: ExtractOptions = {}
) => {
  const {
    yTolerance = 2.0,
    colSplitGap = 110,
    wordGap = 2,
  } = options;

  const pdfjsLib = (await import(
    "pdfjs-dist/legacy/build/pdf"
  )) as unknown as PdfjsModule;

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
  ).href;

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const lines: string[] = [];
  const debug: PdfExtractDebug = {
    pages: pdf.numPages,
    pageStats: [],
  };

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    let textItems = 0;
    let textLen = 0;

    // 1) Normaliza items (x,y,text,width)
    const items = (content.items ?? [])
      .filter((it: any) => typeof it?.str === "string" && it.str.trim().length)
      .map((it: any) => {
        const t = it.transform ?? [];
        const x = t[4] ?? 0;
        const y = t[5] ?? 0;
        const w = typeof it.width === "number" ? it.width : 0; // pdfjs costuma fornecer
        const s = String(it.str).replace(/\s+/g, " ").trim();

        textItems += 1;
        textLen += s.length;

        return { x, y, w, text: s };
      });

    // 2) Ordena visualmente: top->down (y desc), left->right (x asc)
    items.sort((a, b) => (b.y - a.y) || (a.x - b.x));

    // 3) Cluster por linhas usando tolerância
    type Line = { y: number; items: Array<{ x: number; w: number; text: string }> };
    const clustered: Line[] = [];

    for (const it of items) {
      const last = clustered[clustered.length - 1];
      if (!last || Math.abs(it.y - last.y) > yTolerance) {
        clustered.push({ y: it.y, items: [{ x: it.x, w: it.w, text: it.text }] });
      } else {
        last.items.push({ x: it.x, w: it.w, text: it.text });
      }
    }

    // 4) Para cada linha, ordena por X e quebra em “sub-linhas” se houver grande gap (colunas)
    let chunkCount = 0;
    for (const line of clustered) {
      const row = line.items.sort((a, b) => a.x - b.x);

      let current = "";
      let prevEndX: number | null = null;

      const flush = () => {
        const out = current.replace(/\s+/g, " ").trim();
        if (out) {
          lines.push(out);
          chunkCount += 1;
        }
        current = "";
        prevEndX = null;
      };

      for (const token of row) {
        // Heurística de fim do token anterior (x + width). Se width for 0, use só x.
        const tokenStart = token.x;
        const tokenEnd = token.w ? token.x + token.w : token.x;

        if (prevEndX == null) {
          current = token.text;
          prevEndX = tokenEnd;
          continue;
        }

        const gap = tokenStart - prevEndX;

        // Se gap muito grande, assumimos mudança de coluna/bloco => nova linha
        if (gap > colSplitGap) {
          flush();
          current = token.text;
          prevEndX = tokenEnd;
          continue;
        }

        // Caso contrário, continua na mesma linha, com espaço apenas se necessário
        if (gap > wordGap) current += " ";
        current += token.text;
        prevEndX = tokenEnd;
      }

      flush();
    }

    debug.pageStats.push({
      page: pageNumber,
      items: content.items.length,
      textItems,
      textLen,
      lines: clustered.length,
      chunks: chunkCount,
    });
  }

  return { text: lines.join("\n").trim(), debug };
};
// const extractWithPdfjs = async (buffer: ArrayBuffer) => {
//   const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf")) as unknown as PdfjsModule;
//   pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//     "pdfjs-dist/legacy/build/pdf.worker.mjs",
//     import.meta.url
//   ).href;
//   const loadingTask = pdfjsLib.getDocument({ data: buffer });
//   const pdf = await loadingTask.promise;
//   const lines: string[] = [];
//   const debug: PdfExtractDebug = {
//     pages: pdf.numPages,
//     pageStats: [],
//   };

//   for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
//     const page = await pdf.getPage(pageNumber);
//     const content = await page.getTextContent();
//     let textItems = 0;
//     let textLen = 0;
//     const rows = new Map<number, Array<{ x: number; text: string }>>();

//     content.items.forEach((item) => {
//       if (!("str" in item)) return;
//       if (!item.str) return;
//       if (item.str.trim()) {
//         textItems += 1;
//         textLen += item.str.trim().length;
//       }
//       const transform = item.transform ?? [];
//       const x = transform[4] ?? 0;
//       const y = transform[5] ?? 0;
//       const key = Math.round(y / 2) * 2;
//       const list = rows.get(key) ?? [];
//       list.push({ x, text: item.str });
//       rows.set(key, list);
//     });

//     const sortedKeys = Array.from(rows.keys()).sort((a, b) => b - a);
//     sortedKeys.forEach((key) => {
//       const row = rows
//         .get(key)
//         ?.sort((a, b) => a.x - b.x)
//         .map((entry) => entry.text)
//         .join(" ")
//         .replace(/\s+/g, " ")
//         .trim();
//       if (row) lines.push(row);
//     });

//     debug.pageStats.push({
//       page: pageNumber,
//       items: content.items.length,
//       textItems,
//       textLen,
//     });
//   }

//   return { text: lines.join("\n").trim(), debug };
// };

export type PdfExtractResult = {
  text: string;
  error?: string;
  debug?: PdfExtractDebug;
};

export const extractPdfTextWithMeta = async (
  buffer: ArrayBuffer
): Promise<PdfExtractResult> => {
  let error: string | undefined;
  try {
    const extracted = await extractWithPdfjs(buffer);
    if (extracted.text) return { text: extracted.text, debug: extracted.debug };
  } catch (err) {
    error = err instanceof Error ? err.message : "Erro desconhecido ao ler PDF.";
  }
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(buffer);
  if (raw.trim().startsWith("%PDF")) {
    return {
      text: "",
      error: error ?? "PDF bruto sem texto extraivel.",
      debug: { pages: 0, pageStats: [] },
    };
  }
  const matches = raw.match(/\(([^)]+)\)/g);
  if (!matches) {
    return {
      text: "",
      error: error ?? "Nao encontrei strings de texto no PDF.",
      debug: { pages: 0, pageStats: [] },
    };
  }
  return {
    text: matches
      .map((chunk) => chunk.replace(/[()]/g, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
    error,
    debug: { pages: 0, pageStats: [] },
  };
};

export const extractPdfText = async (buffer: ArrayBuffer) => {
  const result = await extractPdfTextWithMeta(buffer);
  return result.text;
};

export const isPdfScanned = (text: string) => text.replace(/\s+/g, "").length < 20;
