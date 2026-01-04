import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import {
  listEstoque,
  createMovimento,
  type EstoqueResumo,
  type EstoqueMovimentoTipo,
} from "../services/estoque.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

type CsvMovimentoRow = {
  itemId: string;
  itemLabel?: string;
  tipo: EstoqueMovimentoTipo;
  data: string;
  quantidade: number;
  custoUnitarioCents?: number;
  quantidadeContada?: number;
  lote?: string;
  serie?: string;
  origem?: "MANUAL" | "VENDA" | "COMPRA";
  origemId?: string;
  observacoes?: string;
};

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      const next = line[i + 1];
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((value) => value.trim());
};

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "");

const buildBaseCsv = (mode: "MOVIMENTOS" | "INVENTARIO") => {
  if (mode === "INVENTARIO") {
    const header = "itemId,item,quantidade,custoUnitario,data,observacoes";
    const sample =
      "prd_2,Produto demo,120,35.00,2025-01-31,Inventario mensal";
    return `${header}\n${sample}`;
  }
  const header =
    "itemId,item,tipo,data,quantidade,custoUnitario,lote,serie,origem,origemId,observacoes";
  const sample =
    "prd_2,Produto demo,ENTRADA,2025-01-10,10,35.00,L-001,S-0001,MANUAL,,Carga inicial";
  return `${header}\n${sample}`;
};

const EstoqueImportacaoPage = () => {
  const [itens, setItens] = useState<EstoqueResumo[]>([]);
  const [csvRows, setCsvRows] = useState<CsvMovimentoRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [csvImporting, setCsvImporting] = useState(false);
  const [mode, setMode] = useState<"MOVIMENTOS" | "INVENTARIO">("MOVIMENTOS");
  const [batchDate, setBatchDate] = useState("");
  const [batchRows, setBatchRows] = useState<
    Array<{
      id: string;
      itemId: string;
      quantidadeContada: number;
      custoUnitarioCents: number;
    }>
  >([{ id: "batch-1", itemId: "", quantidadeContada: 0, custoUnitarioCents: 0 }]);
  const [batchError, setBatchError] = useState("");
  const [batchImporting, setBatchImporting] = useState(false);

  const loadItens = async () => {
    try {
      const response = await listEstoque({ page: 1, pageSize: 200 });
      setItens(response.data);
    } catch {
      setItens([]);
    }
  };

  useEffect(() => {
    loadItens();
  }, []);

  const itemOptions = useMemo(
    () =>
      itens.map((item) => ({
        value: item.produtoId ?? item.id,
        label: item.descricao || item.item || item.id,
      })),
    [itens]
  );

  const resolveItem = (itemId: string, itemLabel: string) => {
    if (itemId) {
      return (
        itens.find((item) => item.id === itemId || item.produtoId === itemId) ??
        null
      );
    }
    if (itemLabel) {
      const needle = itemLabel.toLowerCase();
      return (
        itens.find((item) => {
          const label = (item.descricao || item.item || "").toLowerCase();
          return label === needle;
        }) ?? null
      );
    }
    return null;
  };

  const parseCsv = (text: string, currentMode: "MOVIMENTOS" | "INVENTARIO") => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return { rows: [], errors: ["CSV vazio."] };

    const header = parseCsvLine(lines[0]).map(normalizeHeader);
    const getIndex = (name: string) => header.indexOf(name);

    const idxItemId = getIndex("itemid");
    const idxItem = getIndex("item");
    const idxTipo = getIndex("tipo");
    const idxData = getIndex("data");
    const idxQuantidade = getIndex("quantidade");
    const idxCusto = getIndex("custounitario");
    const idxLote = getIndex("lote");
    const idxSerie = getIndex("serie");
    const idxOrigem = getIndex("origem");
    const idxOrigemId = getIndex("origemid");
    const idxObs = getIndex("observacoes");

    const errors: string[] = [];
    const rows: CsvMovimentoRow[] = [];

    lines.slice(1).forEach((line, index) => {
      const cols = parseCsvLine(line);
      const itemId = idxItemId >= 0 ? cols[idxItemId] : "";
      const itemLabel = idxItem >= 0 ? cols[idxItem] : "";
      const tipoRaw = idxTipo >= 0 ? cols[idxTipo] : "AJUSTE";
      const data = idxData >= 0 ? cols[idxData] : "";
      const quantidadeRaw = idxQuantidade >= 0 ? cols[idxQuantidade] : "0";
      const custoRaw = idxCusto >= 0 ? cols[idxCusto] : "";

      const quantidade = Number(quantidadeRaw.replace(",", "."));
      const custoUnitarioCents = custoRaw
        ? (() => {
            const normalized = custoRaw.replace(",", ".");
            const numeric = Number(normalized);
            if (Number.isNaN(numeric)) return undefined;
            if (normalized.includes(".")) return Math.round(numeric * 100);
            return Math.round(numeric);
          })()
        : undefined;
      const tipo = (tipoRaw || "AJUSTE").toUpperCase() as EstoqueMovimentoTipo;
      const resolvedItem = resolveItem(itemId, itemLabel);

      if (!resolvedItem) {
        errors.push(`Linha ${index + 2}: item nao encontrado.`);
        return;
      }
      if (!quantidade || Number.isNaN(quantidade)) {
        errors.push(`Linha ${index + 2}: quantidade invalida.`);
        return;
      }

      if (currentMode === "MOVIMENTOS") {
        if (!data) {
          errors.push(`Linha ${index + 2}: data obrigatoria.`);
          return;
        }
        rows.push({
          itemId: resolvedItem.id,
          itemLabel: resolvedItem.descricao || resolvedItem.item,
          tipo,
          data,
          quantidade,
          custoUnitarioCents,
          lote: idxLote >= 0 ? cols[idxLote] : undefined,
          serie: idxSerie >= 0 ? cols[idxSerie] : undefined,
          origem:
            idxOrigem >= 0
              ? (cols[idxOrigem] as CsvMovimentoRow["origem"])
              : undefined,
          origemId: idxOrigemId >= 0 ? cols[idxOrigemId] : undefined,
          observacoes: idxObs >= 0 ? cols[idxObs] : undefined,
        });
        return;
      }

      const contada = quantidade;
      if (contada < 0) {
        errors.push(`Linha ${index + 2}: quantidade contada invalida.`);
        return;
      }
      const saldoAtual = resolvedItem.quantidade ?? 0;
      const delta = contada - saldoAtual;
      if (delta > 0 && (!custoUnitarioCents || custoUnitarioCents <= 0)) {
        errors.push(
          `Linha ${index + 2}: custo unitario obrigatorio para ajuste positivo.`
        );
        return;
      }
      const dataMov = data || new Date().toISOString().slice(0, 10);
      rows.push({
        itemId: resolvedItem.id,
        itemLabel: resolvedItem.descricao || resolvedItem.item,
        tipo: "AJUSTE",
        data: dataMov,
        quantidade: delta,
        quantidadeContada: contada,
        custoUnitarioCents: delta > 0 ? custoUnitarioCents : undefined,
        origem: "MANUAL",
        observacoes: idxObs >= 0 ? cols[idxObs] : "Inventario CSV",
      });
    });

    return { rows, errors };
  };

  const handleCsvFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      const parsed = parseCsv(content, mode);
      setCsvRows(parsed.rows);
      setCsvErrors(parsed.errors);
      setImportError("");
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleCsvImport = async () => {
    setImportError("");
    if (!csvRows.length) {
      setImportError("Nenhum movimento para importar.");
      return;
    }
    if (!API_BASE) {
      setImportError("API nao configurada.");
      return;
    }
    const rowsToImport = csvRows.filter((row) => row.quantidade !== 0);
    if (!rowsToImport.length) {
      setImportError("Nenhum ajuste necessario (saldo ja confere).");
      return;
    }
    setCsvImporting(true);
    const results = await Promise.allSettled(
      rowsToImport.map((row) =>
        createMovimento(row.itemId, {
          tipo: row.tipo,
          data: row.data,
          quantidade: row.quantidade,
          custoUnitario: row.custoUnitarioCents,
          lote: row.lote || undefined,
          serie: row.serie || undefined,
          origem: row.origem,
          origemId: row.origemId || undefined,
          observacoes: row.observacoes || undefined,
        })
      )
    );
    const failures = results.filter((res) => res.status === "rejected").length;
    setCsvImporting(false);
    if (failures) {
      setImportError(`Falha ao importar ${failures} movimento(s).`);
    } else {
      setCsvRows([]);
      setCsvErrors([]);
      setCsvFileName("");
    }
  };

  const addBatchRow = () => {
    setBatchRows((prev) => [
      ...prev,
      {
        id: `batch-${Date.now()}`,
        itemId: "",
        quantidadeContada: 0,
        custoUnitarioCents: 0,
      },
    ]);
  };

  const updateBatchRow = (
    id: string,
    patch: Partial<(typeof batchRows)[number]>
  ) => {
    setBatchRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeBatchRow = (id: string) => {
    setBatchRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleBatchImport = async () => {
    setBatchError("");
    if (!API_BASE) {
      setBatchError("API nao configurada.");
      return;
    }
    if (!batchRows.length) {
      setBatchError("Adicione ao menos um item.");
      return;
    }
    const dataMov = batchDate || new Date().toISOString().slice(0, 10);
    const payloads: Array<{ itemId: string; quantidade: number; custo?: number }> =
      [];
    let hasError = false;

    batchRows.forEach((row, index) => {
      if (!row.itemId) {
        setBatchError(`Linha ${index + 1}: selecione o item.`);
        hasError = true;
        return;
      }
      const item = resolveItem(row.itemId, "");
      if (!item) {
        setBatchError(`Linha ${index + 1}: item nao encontrado.`);
        hasError = true;
        return;
      }
      if (row.quantidadeContada < 0 || Number.isNaN(row.quantidadeContada)) {
        setBatchError(`Linha ${index + 1}: quantidade contada invalida.`);
        hasError = true;
        return;
      }
      const delta = row.quantidadeContada - (item.quantidade ?? 0);
      if (delta > 0 && row.custoUnitarioCents <= 0) {
        setBatchError(
          `Linha ${index + 1}: custo unitario obrigatorio para ajuste positivo.`
        );
        hasError = true;
        return;
      }
      if (delta === 0) {
        return;
      }
      payloads.push({
        itemId: item.id,
        quantidade: delta,
        custo: delta > 0 ? row.custoUnitarioCents : undefined,
      });
    });

    if (hasError) return;
    if (!payloads.length) {
      setBatchError("Nenhum ajuste necessario (saldo ja confere).");
      return;
    }

    setBatchImporting(true);
    const results = await Promise.allSettled(
      payloads.map((payload) =>
        createMovimento(payload.itemId, {
          tipo: "AJUSTE",
          data: dataMov,
          quantidade: payload.quantidade,
          custoUnitario: payload.custo,
          origem: "MANUAL",
          observacoes: "Inventario em lote",
        })
      )
    );
    const failures = results.filter((res) => res.status === "rejected").length;
    setBatchImporting(false);
    if (failures) {
      setBatchError(`Falha ao importar ${failures} ajuste(s).`);
      return;
    }
    setBatchRows([
      { id: `batch-${Date.now()}`, itemId: "", quantidadeContada: 0, custoUnitarioCents: 0 },
    ]);
    setBatchDate("");
    loadItens();
  };

  const downloadBaseCsv = () => {
    const blob = new Blob([buildBaseCsv(mode)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      mode === "INVENTARIO" ? "inventario-base.csv" : "movimentos-base.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Inventario por CSV" />
        <AppSubTitle text="Ajuste em lote e importacao de inventario." />
      </div>

      <Card>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {mode === "INVENTARIO"
            ? "Colunas aceitas: itemId ou item, quantidade (contada), custoUnitario (opcional), data (opcional), observacoes."
            : "Colunas aceitas: itemId ou item, tipo (ENTRADA/SAIDA/AJUSTE), data, quantidade, custoUnitario (centavos), lote, serie, origem, origemId, observacoes."}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AppSelectInput
            title="Modo de importacao"
            value={mode}
            onChange={(e) => {
              const next = e.target.value as "MOVIMENTOS" | "INVENTARIO";
              setMode(next);
              setCsvRows([]);
              setCsvErrors([]);
              setCsvFileName("");
              setImportError("");
            }}
            data={[
              { value: "MOVIMENTOS", label: "Movimentos" },
              { value: "INVENTARIO", label: "Inventario (ajuste)" },
            ]}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFile}
            className="block text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          />
          <AppButton type="button" className="w-auto px-6" onClick={downloadBaseCsv}>
            Baixar CSV base
          </AppButton>
          {csvFileName ? (
            <span className="text-sm text-gray-500">Arquivo: {csvFileName}</span>
          ) : null}
        </div>
        {mode === "INVENTARIO" ? (
          <div className="mt-3 text-xs text-gray-500">
            No inventario, o sistema calcula o ajuste comparando a quantidade
            contada com o saldo atual.
          </div>
        ) : null}
        {csvErrors.length ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-semibold">Erros no CSV:</p>
            <ul className="list-disc pl-5">
              {csvErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {csvRows.length ? (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            {csvRows.filter((row) => row.quantidade !== 0).length}{" "}
            {mode === "INVENTARIO" ? "ajuste(s)" : "movimento(s)"} prontos para
            importar.
          </div>
        ) : null}
        {csvRows.length === 0 && !csvErrors.length ? (
          <AppListNotFound texto="Importe um CSV para validar os movimentos." />
        ) : null}
        {importError ? <p className="mt-2 text-sm text-red-600">{importError}</p> : null}
        <div className="mt-3">
          <AppButton
            type="button"
            className="w-auto px-6"
            onClick={handleCsvImport}
            disabled={csvImporting || !csvRows.length || csvErrors.length > 0}
          >
            {csvImporting ? "Importando..." : "Importar CSV"}
          </AppButton>
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Ajuste em lote" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AppDateInput
            title="Data do ajuste"
            value={batchDate}
            onChange={(e) => setBatchDate(e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {batchRows.map((row, index) => {
            const item = resolveItem(row.itemId, "");
            const saldoAtual = item?.quantidade ?? 0;
            const delta = item ? row.quantidadeContada - saldoAtual : 0;
            return (
              <div
                key={row.id}
                className="grid gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-5"
              >
                <AppSelectInput
                  title="Item"
                  value={row.itemId}
                  onChange={(e) =>
                    updateBatchRow(row.id, { itemId: e.target.value })
                  }
                  data={itemOptions}
                  placeholder="Selecione"
                />
                <AppTextInput
                  title="Quantidade contada"
                  value={
                    row.quantidadeContada ? String(row.quantidadeContada) : ""
                  }
                  sanitizeRegex={/[0-9]/g}
                  onValueChange={(raw) =>
                    updateBatchRow(row.id, {
                      quantidadeContada: Number(raw || "0"),
                    })
                  }
                />
                <AppTextInput
                  title="Custo unitario"
                  value={
                    row.custoUnitarioCents
                      ? String(row.custoUnitarioCents)
                      : ""
                  }
                  sanitizeRegex={/[0-9]/g}
                  onValueChange={(raw) =>
                    updateBatchRow(row.id, {
                      custoUnitarioCents: Number(raw || "0"),
                    })
                  }
                  helperText={
                    delta > 0
                      ? "Obrigatorio para ajuste positivo."
                      : "Opcional para ajuste negativo."
                  }
                />
                <div className="text-xs text-gray-500">
                  <div>Saldo atual: {saldoAtual}</div>
                  <div>Ajuste: {delta}</div>
                </div>
                <div className="flex items-end">
                  <AppButton
                    type="button"
                    className="w-auto"
                    onClick={() => removeBatchRow(row.id)}
                    disabled={batchRows.length === 1}
                  >
                    Remover
                  </AppButton>
                </div>
              </div>
            );
          })}
          <div className="flex gap-3">
            <AppButton type="button" className="w-auto" onClick={addBatchRow}>
              Adicionar item
            </AppButton>
            <AppButton
              type="button"
              className="w-auto"
              onClick={() =>
                setBatchRows([
                  {
                    id: `batch-${Date.now()}`,
                    itemId: "",
                    quantidadeContada: 0,
                    custoUnitarioCents: 0,
                  },
                ])
              }
            >
              Limpar lista
            </AppButton>
          </div>
          {batchError ? (
            <p className="text-sm text-red-600">{batchError}</p>
          ) : null}
          <div>
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={handleBatchImport}
              disabled={batchImporting}
            >
              {batchImporting ? "Processando..." : "Gerar ajustes"}
            </AppButton>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EstoqueImportacaoPage;
