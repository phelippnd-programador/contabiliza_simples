import React, { useEffect, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import AppListNotFound from "../../../components/ui/AppListNotFound";
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

const buildBaseCsv = () => {
  const header =
    "itemId,item,tipo,data,quantidade,custoUnitario,lote,serie,origem,origemId,observacoes";
  const sample =
    "1,Produto demo,ENTRADA,2025-01-10,10,35.00,L-001,S-0001,MANUAL,,Carga inicial";
  return `${header}\n${sample}`;
};

const downloadBaseCsv = () => {
  const blob = new Blob([buildBaseCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inventario-base.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const EstoqueImportacaoPage = () => {
  const [itens, setItens] = useState<EstoqueResumo[]>([]);
  const [csvRows, setCsvRows] = useState<CsvMovimentoRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [csvImporting, setCsvImporting] = useState(false);

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

  const parseCsv = (text: string) => {
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

      const resolvedItem = itemId
        ? itens.find((item) => item.id === itemId)
        : itemLabel
          ? itens.find(
              (item) => item.item.toLowerCase() === itemLabel.toLowerCase()
            )
          : undefined;

      if (!resolvedItem) {
        errors.push(`Linha ${index + 2}: item nao encontrado.`);
        return;
      }
      if (!data) {
        errors.push(`Linha ${index + 2}: data obrigatoria.`);
        return;
      }
      if (!quantidade || Number.isNaN(quantidade)) {
        errors.push(`Linha ${index + 2}: quantidade invalida.`);
        return;
      }

      rows.push({
        itemId: resolvedItem.id,
        itemLabel: resolvedItem.item,
        tipo,
        data,
        quantidade,
        custoUnitarioCents,
        lote: idxLote >= 0 ? cols[idxLote] : undefined,
        serie: idxSerie >= 0 ? cols[idxSerie] : undefined,
        origem: idxOrigem >= 0 ? (cols[idxOrigem] as CsvMovimentoRow["origem"]) : undefined,
        origemId: idxOrigemId >= 0 ? cols[idxOrigemId] : undefined,
        observacoes: idxObs >= 0 ? cols[idxObs] : undefined,
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
      const parsed = parseCsv(content);
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
    setCsvImporting(true);
    const results = await Promise.allSettled(
      csvRows.map((row) =>
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Inventario por CSV" />
        <AppSubTitle text="Importacao em lote de movimentos de estoque." />
      </div>

      <Card>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Colunas aceitas: itemId ou item, tipo (ENTRADA/SAIDA/AJUSTE), data,
          quantidade, custoUnitario (centavos), lote, serie, origem, origemId,
          observacoes.
        </p>
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
            {csvRows.length} movimento(s) prontos para importar.
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
    </div>
  );
};

export default EstoqueImportacaoPage;
