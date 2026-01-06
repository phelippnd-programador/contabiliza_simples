import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import UploadStep from "../components/UploadStep";
import ReviewStep from "../components/ReviewStep";
import type {
  ImportBatch,
  ImportFileType,
  ImportSourceType,
  ImportTransaction,
  InvoiceHeader,
} from "../types";
import type { ParserInput } from "../parsers/types";
import { getBestParser } from "../parsers/registry";
import { parseItauInvoiceHeader } from "../parsers/itauCreditPdfParser";
import { buildTransactionHash } from "../utils/hash";
import { extractPdfTextWithMeta, isPdfScanned } from "../utils/pdf";
import { listMovimentos, saveMovimento } from "../../financeiro/services/movimentos.service";
import { TipoMovimentoCaixa } from "../../financeiro/types";
import { listContas } from "../../financeiro/services/contas.service";
import {
  createContaPagar,
  listContasPagar,
  type ContaPagarResumo,
} from "../../financeiro/services/contas-pagar.service";
import { listCartoes, type CartaoResumo } from "../../financeiro/services/cartoes.service";
import { usePlan } from "../../../shared/context/PlanContext";
import { getPlanConfig } from "../../../app/plan/planConfig";

type ImportSummary = {
  total: number;
  credits: number;
  debits: number;
};

const getFileType = (fileName: string): ImportFileType | null => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "csv") return "CSV";
  if (extension === "ofx") return "OFX";
  if (extension === "pdf") return "PDF";
  return null;
};

const buildSummary = (transactions: ImportTransaction[]): ImportSummary => {
  const total = transactions.reduce((acc, item) => acc + item.amount, 0);
  const credits = transactions
    .filter((item) => item.amount > 0)
    .reduce((acc, item) => acc + item.amount, 0);
  const debits = transactions
    .filter((item) => item.amount < 0)
    .reduce((acc, item) => acc + Math.abs(item.amount), 0);
  return { total, credits, debits };
};

const ImportWizardPage = () => {
  const { plan } = usePlan();
  const { labels } = getPlanConfig(plan);
  const [step, setStep] = useState<"UPLOAD" | "REVIEW">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<ImportFileType | null>(null);
  const [transactions, setTransactions] = useState<ImportTransaction[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [invoiceHeader, setInvoiceHeader] = useState<InvoiceHeader | null>(null);
  const [sourceType, setSourceType] = useState<ImportSourceType>("BANK");
  const [invoiceMonth, setInvoiceMonth] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [cardId, setCardId] = useState("");
  const [cards, setCards] = useState<CartaoResumo[]>([]);
  const [cardOptions, setCardOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [error, setError] = useState("");
  const [pdfWarning, setPdfWarning] = useState("");
  const [pdfDebug, setPdfDebug] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [pdfStats, setPdfStats] = useState("");
  const [movimentoHashes, setMovimentoHashes] = useState<Set<string>>(new Set());
  const [contaPagarHashes, setContaPagarHashes] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    const loadAccounts = async () => {
      const data = await listContas();
      if (!isMounted) return;
      setAccounts(
        data.map((conta) => ({
          value: conta.id,
          label: `${conta.nome} (${conta.banco})`,
        }))
      );
    };
    loadAccounts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadMovimentos = async () => {
      try {
        const movimentos = await listMovimentos();
        const hashes = await Promise.all(
          movimentos.map((movimento) =>
            buildTransactionHash(
              movimento.data,
              movimento.tipo === TipoMovimentoCaixa.SAIDA
                ? -movimento.valor
                : movimento.valor,
              movimento.descricao ?? ""
            )
          )
        );
        if (!isMounted) return;
        setMovimentoHashes(new Set(hashes));
      } catch {
        if (!isMounted) return;
        setMovimentoHashes(new Set());
      }
    };
    loadMovimentos();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadCards = async () => {
      const data = await listCartoes();
      if (!isMounted) return;
      setCards(data);
      setCardOptions(
        data.map((cartao) => ({
          value: String(cartao.id),
          label: `${cartao.nome} (dia ${cartao.vencimentoDia})`,
        }))
      );
    };
    loadCards();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const buildDescricao = (conta: ContaPagarResumo) => {
      const base = conta.descricao ?? conta.fornecedorNome ?? conta.fornecedor ?? "";
      if (conta.parcela && conta.totalParcelas) {
        const token = `${conta.parcela}/${conta.totalParcelas}`;
        if (base.includes(token)) return base;
        return `${base} ${token}`.trim();
      }
      return base;
    };
    const loadContasPagar = async () => {
      try {
        const pageSize = 200;
        let page = 1;
        let all: ContaPagarResumo[] = [];
        while (true) {
          const response = await listContasPagar({ page, pageSize });
          all = all.concat(response.data ?? []);
          if (response.data.length < pageSize) break;
          if (response.meta?.total && all.length >= response.meta.total) break;
          page += 1;
          if (page > 20) break;
        }
        const hashes = await Promise.all(
          all.map((conta) =>
            buildTransactionHash(conta.vencimento, conta.valor, buildDescricao(conta))
          )
        );
        if (!isMounted) return;
        setContaPagarHashes(new Set(hashes));
      } catch {
        if (!isMounted) return;
        setContaPagarHashes(new Set());
      }
    };
    loadContasPagar();
    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => buildSummary(transactions), [transactions]);
  const buildContaPagarDescricao = (item: ImportTransaction) => {
    const parcelaLabel = item.installment
      ? ` ${item.installment.current}/${item.installment.total}`
      : "";
    return `${item.description}${parcelaLabel}`.trim();
  };

  const buildInvoiceDueDate = (month: string, dueDay: number) => {
    if (!month || !dueDay) return "";
    const [yearRaw, monthRaw] = month.split("-");
    const year = Number(yearRaw);
    const monthNumber = Number(monthRaw);
    if (!year || !monthNumber) return "";
    const maxDay = new Date(year, monthNumber, 0).getDate();
    const day = Math.min(Math.max(dueDay, 1), maxDay);
    return `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const buildFirstInstallmentDueDate = (
    purchaseDate: string,
    fechamentoDia: number,
    vencimentoDia: number
  ) => {
    const date = new Date(`${purchaseDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    const purchaseDay = date.getDate();
    const purchaseMonth = date.getMonth() + 1;
    const purchaseYear = date.getFullYear();
    const offset = purchaseDay <= fechamentoDia ? 1 : 2;
    let dueMonth = purchaseMonth + offset;
    let dueYear = purchaseYear;
    while (dueMonth > 12) {
      dueMonth -= 12;
      dueYear += 1;
    }
    const maxDay = new Date(dueYear, dueMonth, 0).getDate();
    const day = Math.min(Math.max(vencimentoDia, 1), maxDay);
    return `${dueYear}-${String(dueMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const applyDuplicateFlags = async (next: ImportTransaction[]) => {
    const currentHashes =
      sourceType === "CARD" ? contaPagarHashes : movimentoHashes;
    const hashed = await Promise.all(
      next.map(async (item) => {
        const description =
          sourceType === "CARD" ? buildContaPagarDescricao(item) : item.description;
        const amount = sourceType === "CARD" ? Math.abs(item.amount) : item.amount;
        return {
          ...item,
          hash: await buildTransactionHash(item.date, amount, description),
        };
      })
    );

    return hashed.map((item) => {
      const duplicateInSystem = item.hash ? currentHashes.has(item.hash) : false;
      return {
        ...item,
        duplicateInSystem,
      };
    });
  };

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setFileType(next ? getFileType(next.name) : null);
    setError("");
    setPdfWarning("");
    setInvoiceHeader(null);
    setPdfDebug("");
    setPdfError("");
    setPdfStats("");
  };

  const parseFile = async () => {
    if (!file || !fileType) {
      setError("Selecione um arquivo CSV, OFX ou PDF.");
      return;
    }
    if (sourceType === "BANK" && !accountId) {
      setError("Selecione a conta para importar.");
      return;
    }
    if (sourceType === "CARD" && (!cardId || !invoiceMonth)) {
      setError("Selecione o cartao e o mes da fatura.");
      return;
    }
    if (sourceType === "CARD") {
      const hasCard = cards.some((cartao) => String(cartao.id) === cardId);
      if (!hasCard) {
        setError("Selecione um cartao valido para importar.");
        return;
      }
    }
    setError("");
    setPdfWarning("");
    const content = await file.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(content);
    const pdfResult =
      fileType === "PDF" ? await extractPdfTextWithMeta(content) : undefined;
    const pdfText = pdfResult?.text;
    if (fileType === "PDF") {
      setPdfDebug(pdfText ?? "");
      setPdfError(pdfResult?.error ?? "");
      if (pdfResult?.debug?.pageStats?.length) {
        const stats = pdfResult.debug.pageStats
          .map(
            (stat) =>
              `Pagina ${stat.page}: itens=${stat.items}, texto=${stat.textItems}, chars=${stat.textLen}`
          )
          .join(" | ");
        setPdfStats(stats);
      } else {
        setPdfStats("");
      }
      if (!pdfText) {
        setPdfWarning(
          "Nao foi possivel extrair texto deste PDF. Tente CSV/OFX ou outro PDF com texto."
        );
      }
    }
   
    const input: ParserInput = {
      fileName: file.name,
      fileType,
      text: pdfText,
      csvRaw: fileType === "CSV" ? text : undefined,
      ofxRaw: fileType === "OFX" ? text : undefined,
    };
    if (fileType === "PDF" && input.text && isPdfScanned(input.text)) {
      setPdfWarning("Este PDF parece ser escaneado. No momento, utilize CSV ou OFX.");
      return;
    }
    const parser = getBestParser(input);
    if (parser.id === "itau_credit_pdf" && input.text) {
      const header = await parseItauInvoiceHeader(input.text);
      if (header) setInvoiceHeader(header);
    }
    console.log("Using parser I:", input);
    console.log("Using parser:", parser.parse(input));
    const parsed = parser.parse(input).map((item) => ({
      id: `imp_${file.name}_${item.date}_${Math.random().toString(36).slice(2, 8)}`,
      date: item.date,
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      sourceType: item.sourceType ?? sourceType,
      direction: item.direction,
      issuer: item.issuer,
      category: item.category,
      city: item.city,
      installment: item.installment,
      tags: item.tags,
      rawLine: item.rawLine,
      accountId: accountId || undefined,
      raw: item.raw,
      hash: item.hash,
    }));
    if (!parsed.length) {
      setError("Nenhuma transacao encontrada no arquivo.");
      return;
    }
    const withDuplicates = await applyDuplicateFlags(parsed);
    const batchId = `batch_${Date.now()}`;
    setBatch({
      id: batchId,
      createdAt: new Date().toISOString(),
      fileName: file.name,
      fileType,
      provider: parser.id === "itau_credit_pdf" ? "ITAU" : undefined,
      status: "DRAFT",
      summary: buildSummary(withDuplicates),
    });
    setTransactions(withDuplicates);
    setStep("REVIEW");
  };

  const handleConfirm = async () => {
    if (!transactions.length) return;
    try {
      const currentHashes =
        sourceType === "CARD" ? contaPagarHashes : movimentoHashes;
      const selectedCard = cards.find(
        (cartao) => String(cartao.id) === cardId
      );
      const invoiceDueDate = selectedCard
        ? buildInvoiceDueDate(invoiceMonth, selectedCard.vencimentoDia)
        : "";
      for (const item of transactions) {
        const descricaoConta = buildContaPagarDescricao(item);
        const hashToCheck = await buildTransactionHash(
          item.date,
          Math.abs(item.amount),
          descricaoConta
        );
        if (hashToCheck && currentHashes.has(hashToCheck)) {
          continue;
        }
        if (sourceType === "CARD") {
          if (item.amount >= 0) continue;
          const baseDueDate = selectedCard
            ? buildFirstInstallmentDueDate(
                item.date,
                selectedCard.fechamentoDia,
                selectedCard.vencimentoDia
              )
            : "";
          const dueDate = baseDueDate || invoiceDueDate;
          if (!dueDate) {
            setError("Informe o mes da fatura para calcular o vencimento.");
            return;
          }
          await createContaPagar({
            fornecedorId: "fornecedor-avulso",
            fornecedorNome: item.description,
            vencimento: dueDate,
            valor: Math.abs(item.amount),
            status: "ABERTA",
            origem: "MANUAL",
            descricao: descricaoConta,
            competencia: item.date,
            parcela: item.installment?.current,
            totalParcelas: item.installment?.total,
            parcelaPaga:
              item.installment?.current && item.installment.current > 1
                ? item.installment.current - 1
                : undefined,
            contaId: item.accountId ?? "",
          });
          continue;
        }
        const tipo =
          item.amount >= 0 ? TipoMovimentoCaixa.ENTRADA : TipoMovimentoCaixa.SAIDA;
        await saveMovimento({
          data: item.date,
          contaId: item.accountId ?? "",
          tipo,
          valor: Math.abs(item.amount),
          descricao: item.description,
        });
      }
      setBatch((prev) =>
        prev ? { ...prev, status: "CONFIRMED", summary } : prev
      );
      setStep("UPLOAD");
      setTransactions([]);
      setFile(null);
      setFileType(null);
    } catch {
      setError("Nao foi possivel salvar as transacoes.");
    }
  };

  const handleCancel = () => {
    setBatch((prev) =>
      prev ? { ...prev, status: "CANCELED" } : prev
    );
    setStep("UPLOAD");
    setTransactions([]);
    setFile(null);
    setFileType(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text={labels.integracoes.importTitle} />
        <AppSubTitle text={labels.integracoes.importSubtitle} />
      </div>

      <Card>
        {step === "UPLOAD" ? (
          <UploadStep
            file={file}
            fileType={fileType}
            sourceType={sourceType}
            invoiceMonth={invoiceMonth}
            accountId={accountId}
            accounts={accounts}
            cardId={cardId}
            cards={cardOptions}
            error={error}
            onFileChange={handleFileChange}
            onSourceTypeChange={(value) => {
              setSourceType(value);
              if (value !== "BANK") {
                setAccountId("");
              }
              if (value !== "CARD") {
                setInvoiceMonth("");
                setCardId("");
              }
            }}
            onInvoiceMonthChange={setInvoiceMonth}
            onAccountChange={setAccountId}
            onCardChange={setCardId}
            onNext={parseFile}
            pdfWarning={pdfWarning}
            pdfError={pdfError}
            pdfDebug={pdfDebug}
            pdfStats={pdfStats}
            title="Upload do arquivo"
            subtitle="CSV e OFX tem suporte completo. PDF exige revisao."
          />
        ) : (
          <>
            {batch ? (
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-300">
                Lote: {batch.fileName} ({batch.fileType})
              </div>
            ) : null}
            {invoiceHeader ? (
              <div className="mb-4 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs uppercase text-gray-400">Titular</p>
                    <p>{invoiceHeader.holderName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Cartao</p>
                    <p>{invoiceHeader.cardMasked || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Vencimento</p>
                    <p>{invoiceHeader.statementDueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Total</p>
                    <p>
                      {(invoiceHeader.statementTotal / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <ReviewStep
              transactions={transactions}
              error={error}
              onChange={(next) => {
                applyDuplicateFlags(next).then(setTransactions);
              }}
              onBack={() => setStep("UPLOAD")}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              summary={summary}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default ImportWizardPage;
