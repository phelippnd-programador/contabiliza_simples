import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
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
import {
  deleteMovimento,
  listMovimentos,
  saveMovimento,
} from "../../financeiro/services/movimentos.service";
import {
  TipoMovimentoCaixa,
  TipoReferenciaMovimentoCaixa,
} from "../../financeiro/types";
import { listContas } from "../../financeiro/services/contas.service";
import { deleteContaPagar } from "../../financeiro/services/contas-pagar.service";
import { listCartoes, type CartaoResumo } from "../../financeiro/services/cartoes.service";
import {
  createCartaoLancamento,
  deleteCartaoLancamento,
  listCartaoLancamentos,
} from "../../financeiro/services/cartao-lancamentos.service";
import { usePlan } from "../../../shared/context/PlanContext";
import { getPlanConfig } from "../../../app/plan/planConfig";
import {
  createImportBatch,
  listImportBatches,
  updateImportBatch,
} from "../services/import-batches.service";
import {
  listImportTransactionsByBatch,
  saveImportTransactions,
  updateImportTransaction,
} from "../services/import-transactions.service";

type ImportWizardPageProps = {
  embedded?: boolean;
  defaultSourceType?: ImportSourceType;
  defaultCardId?: string;
  lockSourceType?: boolean;
  lockCardSelect?: boolean;
};

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

const ImportWizardPage = ({
  embedded = false,
  defaultSourceType,
  defaultCardId,
  lockSourceType = false,
  lockCardSelect = false,
}: ImportWizardPageProps) => {
  const { plan } = usePlan();
  const { labels } = getPlanConfig(plan);
  const [step, setStep] = useState<"UPLOAD" | "REVIEW">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<ImportFileType | null>(null);
  const [transactions, setTransactions] = useState<ImportTransaction[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [latestBatch, setLatestBatch] = useState<ImportBatch | null>(null);
  const [invoiceHeader, setInvoiceHeader] = useState<InvoiceHeader | null>(null);
  const [sourceType, setSourceType] = useState<ImportSourceType>(
    defaultSourceType ?? "BANK"
  );
  const [invoiceMonth, setInvoiceMonth] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<Array<{ value: string; label: string }>>(
    []
  );
  const [cardId, setCardId] = useState(defaultCardId ?? "");
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
  const [cartaoLancamentoHashes, setCartaoLancamentoHashes] = useState<Set<string>>(
    new Set()
  );
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const loadLatestBatch = async () => {
    try {
      const batches = await listImportBatches();
      setLatestBatch(batches[0] ?? null);
    } catch {
      setLatestBatch(null);
    }
  };

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
    loadLatestBatch();
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
    if (!defaultCardId) return;
    setCardId((prev) => prev || defaultCardId);
  }, [defaultCardId]);

  useEffect(() => {
    let isMounted = true;
    const loadCartaoLancamentos = async () => {
      try {
        const hashes: string[] = [];
        for (const cartao of cards) {
          const items = await listCartaoLancamentos(String(cartao.id));
          for (const item of items) {
            const parcelaLabel =
              item.parcela && item.totalParcelas ? ` ${item.parcela}/${item.totalParcelas}` : "";
            const descricao = `${item.descricao}${parcelaLabel}`.trim();
            const hash = await buildTransactionHash(
              item.data,
              Math.abs(item.valor),
              descricao
            );
            hashes.push(hash);
          }
        }
        if (!isMounted) return;
        setCartaoLancamentoHashes(new Set(hashes));
      } catch {
        if (!isMounted) return;
        setCartaoLancamentoHashes(new Set());
      }
    };
    if (!cards.length) return () => {
      isMounted = false;
    };
    loadCartaoLancamentos();
    return () => {
      isMounted = false;
    };
  }, [cards]);

  const selectedCardLabel = useMemo(() => {
    if (!cardId) return "";
    const card = cards.find((item) => String(item.id) === cardId);
    return card ? `${card.nome} (dia ${card.vencimentoDia})` : "";
  }, [cardId, cards]);

  const summary = useMemo(() => buildSummary(transactions), [transactions]);
  const buildCartaoDescricao = (item: ImportTransaction) => {
    const parcelaLabel = item.installment
      ? ` ${item.installment.current}/${item.installment.total}`
      : "";
    return `${item.description}${parcelaLabel}`.trim();
  };

  const computeCartaoCompetencia = (
    date: string,
    fechamentoDia: number,
    corteDia?: number
  ) => {
    if (!date) return "";
    const base = new Date(`${date}T00:00:00`);
    if (Number.isNaN(base.getTime())) return "";
    const competenciaDate = new Date(base);
    const diaCorte = corteDia || fechamentoDia;
    if (diaCorte && base.getDate() > diaCorte) {
      competenciaDate.setMonth(competenciaDate.getMonth() + 1);
    }
    return competenciaDate.toISOString().slice(0, 7);
  };

  const applyDuplicateFlags = async (next: ImportTransaction[]) => {
    const currentHashes =
      sourceType === "CARD" ? cartaoLancamentoHashes : movimentoHashes;
    const hashed = await Promise.all(
      next.map(async (item) => {
        const description =
          sourceType === "CARD" ? buildCartaoDescricao(item) : item.description;
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
    if (sourceType === "CARD" && !cardId) {
      setError("Selecione o cartao para importar.");
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
    const savedBatch = await createImportBatch({
      id: batchId,
      createdAt: new Date().toISOString(),
      sourceType,
      fileName: file.name,
      fileType,
      provider: parser.id === "itau_credit_pdf" ? "ITAU" : undefined,
      status: "DRAFT",
      summary: buildSummary(withDuplicates),
      accountId: accountId || undefined,
      cardId: cardId || undefined,
      invoiceMonth: invoiceMonth || undefined,
    });
    const withBatch = withDuplicates.map((item) => ({
      ...item,
      importBatchId: savedBatch.id,
    }));
    await saveImportTransactions(savedBatch.id, withBatch);
    setBatch(savedBatch);
    setTransactions(withBatch);
    await loadLatestBatch();
    setStep("REVIEW");
  };

  const handleConfirm = async () => {
    if (!transactions.length) return;
    try {
      const currentHashes =
        sourceType === "CARD" ? cartaoLancamentoHashes : movimentoHashes;
      const selectedCard = cards.find(
        (cartao) => String(cartao.id) === cardId
      );
      const updatedTransactions: ImportTransaction[] = [];
      for (const item of transactions) {
        const descricaoCartao = buildCartaoDescricao(item);
        const hashToCheck = await buildTransactionHash(
          item.date,
          Math.abs(item.amount),
          descricaoCartao
        );
        if (hashToCheck && currentHashes.has(hashToCheck)) {
          updatedTransactions.push(item);
          continue;
        }
        if (sourceType === "CARD") {
          if (item.amount >= 0) continue;
          const competencia = selectedCard
            ? computeCartaoCompetencia(
                item.date,
                selectedCard.fechamentoDia,
                selectedCard.corteDia
              )
            : invoiceMonth;
          if (!competencia) {
            setError("Informe o mes da fatura para calcular a competencia.");
            return;
          }
          const lancamento = await createCartaoLancamento({
            cartaoId: cardId,
            data: item.date,
            descricao: item.description,
            valor: Math.abs(item.amount),
            parcela: item.installment?.current,
            totalParcelas: item.installment?.total,
            faturaCompetencia: competencia,
          });
          await updateImportTransaction(item.id, {
            cartaoLancamentoId: lancamento.id,
            reconciledAt: new Date().toISOString(),
          });
          updatedTransactions.push({
            ...item,
            cartaoLancamentoId: lancamento.id,
            reconciledAt: new Date().toISOString(),
          });
          continue;
        }
        const tipo =
          item.amount >= 0 ? TipoMovimentoCaixa.ENTRADA : TipoMovimentoCaixa.SAIDA;
        const movimento = await saveMovimento({
          data: item.date,
          contaId: item.accountId ?? "",
          tipo,
          valor: Math.abs(item.amount),
          descricao: item.description,
          referencia: {
            tipo:
              item.amount >= 0
                ? TipoReferenciaMovimentoCaixa.RECEITA
                : TipoReferenciaMovimentoCaixa.DESPESA,
            id: item.importBatchId ?? "",
          },
        });
        await updateImportTransaction(item.id, {
          movimentoId: movimento.id,
          reconciledAt: new Date().toISOString(),
        });
        updatedTransactions.push({
          ...item,
          movimentoId: movimento.id,
          reconciledAt: new Date().toISOString(),
        });
      }
      if (batch) {
        const confirmed = await updateImportBatch(batch.id, {
          status: "CONFIRMED",
          summary,
          confirmedAt: new Date().toISOString(),
        });
        setBatch(confirmed);
      }
      setTransactions(updatedTransactions.length ? updatedTransactions : transactions);
      await loadLatestBatch();
      setStep("UPLOAD");
      setTransactions([]);
      setFile(null);
      setFileType(null);
    } catch {
      setError("Nao foi possivel salvar as transacoes.");
    }
  };

  const handleCancel = () => {
    if (batch) {
      updateImportBatch(batch.id, {
        status: "CANCELED",
        canceledAt: new Date().toISOString(),
      })
        .then(setBatch)
        .finally(loadLatestBatch);
    }
    setStep("UPLOAD");
    setTransactions([]);
    setFile(null);
    setFileType(null);
  };

  const handleRollback = async () => {
    if (!latestBatch || latestBatch.status !== "CONFIRMED") return;
    try {
      setRollbackLoading(true);
      const items = await listImportTransactionsByBatch(latestBatch.id);
      for (const item of items) {
        if (item.movimentoId) {
          await deleteMovimento(item.movimentoId);
        }
        if (item.contaPagarId) {
          await deleteContaPagar(item.contaPagarId);
        }
        if (item.cartaoLancamentoId) {
          await deleteCartaoLancamento(item.cartaoLancamentoId);
        }
      }
      await updateImportBatch(latestBatch.id, {
        status: "CANCELED",
        canceledAt: new Date().toISOString(),
      });
      await loadLatestBatch();
    } catch {
      setError("Nao foi possivel desfazer a importacao.");
    } finally {
      setRollbackLoading(false);
    }
  };

  return (
    <div className={embedded ? "flex flex-col gap-4" : "flex flex-col gap-6"}>
      {!embedded ? (
        <div>
          <AppTitle text={labels.integracoes.importTitle} />
          <AppSubTitle text={labels.integracoes.importSubtitle} />
        </div>
      ) : null}

      <Card>
        {embedded && selectedCardLabel ? (
          <div className="mb-4 rounded-lg border border-slate-200/70 bg-white/80 p-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            Importando para: <span className="font-semibold">{selectedCardLabel}</span>
          </div>
        ) : null}
        {step === "UPLOAD" && latestBatch ? (
          <div className="mb-6 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-gray-400">Ultimo lote</p>
                <p className="font-semibold">
                  {latestBatch.fileName} ({latestBatch.fileType})
                </p>
                <p className="text-xs text-gray-400">
                  Status: {latestBatch.status}
                </p>
              </div>
              {latestBatch.status === "CONFIRMED" ? (
                <AppButton
                  type="button"
                  className="w-auto"
                  onClick={handleRollback}
                  disabled={rollbackLoading}
                >
                  {rollbackLoading ? "Desfazendo..." : "Desfazer importacao"}
                </AppButton>
              ) : null}
            </div>
          </div>
        ) : null}
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
              if (lockSourceType) return;
              setSourceType(value);
              if (value !== "BANK") {
                setAccountId("");
              }
              if (value !== "CARD") {
                setInvoiceMonth("");
                if (!defaultCardId) {
                  setCardId("");
                }
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
            disableSourceType={lockSourceType}
            disableCardSelect={lockCardSelect}
            hideSourceType={embedded}
            hideCardSelect={embedded}
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
                applyDuplicateFlags(next).then(async (nextWithFlags) => {
                  setTransactions(nextWithFlags);
                  if (batch) {
                    await saveImportTransactions(batch.id, nextWithFlags);
                    const updated = await updateImportBatch(batch.id, {
                      summary: buildSummary(nextWithFlags),
                    });
                    setBatch(updated);
                    await loadLatestBatch();
                  }
                });
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
