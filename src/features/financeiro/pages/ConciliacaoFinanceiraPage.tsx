import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import { TrashIcon } from "../../../components/ui/icon/AppIcons";
import { listContas } from "../services/contas.service";
import { listCategorias } from "../services/categorias.service";
import { listMovimentos } from "../services/movimentos.service";
import { saveMovimento } from "../services/movimentos.service";
import {
  deleteExtratoBancario,
  listExtratoBancario,
  saveExtratoBancario,
} from "../services/conciliacao.service";
import type {
  CategoriaMovimento,
  ContaBancaria,
  ExtratoBancarioItem,
  MovimentoCaixa,
} from "../types";
import { formatLocalDate } from "../../../shared/utils/formater";

const ConciliacaoFinanceiraPage = () => {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [extratos, setExtratos] = useState<ExtratoBancarioItem[]>([]);
  const [error, setError] = useState("");
  const [selectEntryId, setSelectEntryId] = useState("");
  const [selectMovimentoId, setSelectMovimentoId] = useState("");
  const [selectGerarMovimentoId, setSelectGerarMovimentoId] = useState("");
  const [selectGerarCategoriaId, setSelectGerarCategoriaId] = useState("");
  const [importing, setImporting] = useState(false);

  const refresh = async () => {
    const [contasData, categoriasData, movimentosData, extratosData] = await Promise.all([
      listContas(),
      listCategorias(),
      listMovimentos(),
      listExtratoBancario(),
    ]);
    setContas(contasData);
    setCategorias(categoriasData);
    setMovimentos(movimentosData);
    setExtratos(extratosData);
  };

  useEffect(() => {
    refresh().catch(() => setError("Nao foi possivel carregar a conciliacao."));
  }, []);

  const contaOptions = useMemo(
    () => contas.map((conta) => ({ value: conta.id, label: `${conta.nome} (${conta.banco})` })),
    [contas]
  );

  const movimentoOptions = useMemo(
    () =>
      movimentos.map((mov) => ({
        value: mov.id,
        label: `${formatLocalDate(mov.data)} - ${mov.valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })} - ${mov.descricao ?? ""}`.trim(),
      })),
    [movimentos]
  );

  const categoriaOptions = useMemo(
    () =>
      categorias.map((categoria) => ({
        value: categoria.id,
        label: categoria.nome,
        tipo: categoria.tipo,
      })),
    [categorias]
  );

  const categoriaOptionsForExtrato = useMemo(() => {
    const extrato = extratos.find((item) => item.id === selectGerarMovimentoId);
    if (!extrato) return categoriaOptions;
    return categoriaOptions.filter((categoria) => categoria.tipo === extrato.tipo);
  }, [categoriaOptions, extratos, selectGerarMovimentoId]);

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map((item) => item.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = line.split(sep).map((item) => item.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? "";
      });
      return row;
    });
  };

  const handleImportCsv = async (file?: File | null) => {
    setError("");
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      for (const row of rows) {
        const data = row.data || row.data_lancamento || row.data_movimento;
        const descricao = row.descricao || row.historico || row.memo;
        const contaId = row.contaid || row.conta_id || row.conta;
        const valorRaw = row.valor || row.amount || row.credito || row.debito;
        if (!data || !descricao || !contaId || !valorRaw) continue;
        const valor = Number(String(valorRaw).replace(",", "."));
        const tipo = valor >= 0 ? "ENTRADA" : "SAIDA";
        await saveExtratoBancario({
          data,
          descricao,
          contaId,
          valor: Math.abs(valor),
          tipo: tipo as any,
        });
      }
      await refresh();
    } catch {
      setError("Nao foi possivel importar o CSV.");
    } finally {
      setImporting(false);
    }
  };

  const autoMatch = async () => {
    setError("");
    try {
      for (const extrato of extratos.filter((e) => !e.movimentoId)) {
        const candidatos = movimentos.filter(
          (mov) =>
            mov.contaId === extrato.contaId &&
            mov.tipo === extrato.tipo &&
            Math.abs(mov.valor - extrato.valor) < 0.01
        );
        if (!candidatos.length) continue;
        const best = candidatos.sort((a, b) =>
          Math.abs(new Date(a.data).getTime() - new Date(extrato.data).getTime()) -
          Math.abs(new Date(b.data).getTime() - new Date(extrato.data).getTime())
        )[0];
        await saveExtratoBancario({
          ...extrato,
          movimentoId: best.id,
        });
      }
      await refresh();
    } catch {
      setError("Nao foi possivel conciliar automaticamente.");
    }
  };

  const handleVincular = async () => {
    setError("");
    if (!selectEntryId || !selectMovimentoId) {
      setError("Selecione extrato e movimento.");
      return;
    }
    const extrato = extratos.find((item) => item.id === selectEntryId);
    if (!extrato) return;
    await saveExtratoBancario({ ...extrato, movimentoId: selectMovimentoId });
    setSelectEntryId("");
    setSelectMovimentoId("");
    await refresh();
  };

  const handleGerarMovimento = async () => {
    setError("");
    if (!selectGerarMovimentoId || !selectGerarCategoriaId) {
      setError("Selecione extrato e categoria.");
      return;
    }
    const extrato = extratos.find((item) => item.id === selectGerarMovimentoId);
    if (!extrato) return;
    try {
      const movimento = await saveMovimento({
        data: extrato.data,
        contaId: extrato.contaId,
        tipo: extrato.tipo,
        valor: extrato.valor,
        descricao: extrato.descricao,
        competencia: extrato.data.slice(0, 7),
        categoriaId: selectGerarCategoriaId,
      });
      await saveExtratoBancario({ ...extrato, movimentoId: movimento.id });
      setSelectGerarMovimentoId("");
      setSelectGerarCategoriaId("");
      await refresh();
    } catch {
      setError("Nao foi possivel gerar movimento a partir do extrato.");
    }
  };

  const extratoColumns = useMemo(
    () => [
      { key: "data", header: "Data", render: (row: ExtratoBancarioItem) => formatLocalDate(row.data) },
      {
        key: "conta",
        header: "Conta",
        render: (row: ExtratoBancarioItem) =>
          contaOptions.find((conta) => conta.value === row.contaId)?.label ?? row.contaId,
      },
      { key: "descricao", header: "Descricao", render: (row: ExtratoBancarioItem) => row.descricao },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: ExtratoBancarioItem) =>
          row.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      },
      {
        key: "movimento",
        header: "Movimento",
        render: (row: ExtratoBancarioItem) =>
          row.movimentoId ? `#${row.movimentoId}` : "Pendente",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ExtratoBancarioItem) => (
          <AppIconButton
            icon={<TrashIcon className="h-4 w-4" />}
            label="Excluir extrato"
            variant="danger"
            onClick={async () => {
              await deleteExtratoBancario(row.id);
              await refresh();
            }}
          />
        ),
      },
    ],
    [contaOptions, extratos]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Conciliacao bancaria" />
        <AppSubTitle text="Importe extratos, concilie e acompanhe pendencias." />
      </div>

      <Card>
        <AppSubTitle text="Importacao e conciliacao" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Importe o CSV, vincule movimentos ou gere lancamentos direto do extrato.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="file"
            accept=".csv,text/csv"
            className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-white hover:file:bg-slate-800 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:file:bg-slate-100 dark:file:text-slate-900"
            onChange={(e) => handleImportCsv(e.target.files?.[0] ?? null)}
            disabled={importing}
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto px-6" onClick={autoMatch}>
              Conciliar automaticamente
            </AppButton>
          </div>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Extrato"
            value={selectEntryId}
            onChange={(e) => setSelectEntryId(e.target.value)}
            data={[
              { value: "", label: "Selecione" },
              ...extratos.map((item) => ({
                value: item.id,
                label: `${formatLocalDate(item.data)} - ${item.descricao} - ${item.valor.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}`,
              })),
            ]}
          />
          <AppSelectInput
            title="Movimento"
            value={selectMovimentoId}
            onChange={(e) => setSelectMovimentoId(e.target.value)}
            data={[{ value: "", label: "Selecione" }, ...movimentoOptions]}
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto px-6" onClick={handleVincular}>
              Vincular manualmente
            </AppButton>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Extrato"
            value={selectGerarMovimentoId}
            onChange={(e) => {
              setSelectGerarMovimentoId(e.target.value);
              setSelectGerarCategoriaId("");
            }}
            data={[
              { value: "", label: "Selecione" },
              ...extratos
                .filter((item) => !item.movimentoId)
                .map((item) => ({
                  value: item.id,
                  label: `${formatLocalDate(item.data)} - ${item.descricao} - ${item.valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}`,
                })),
            ]}
          />
          <AppSelectInput
            title="Categoria"
            value={selectGerarCategoriaId}
            onChange={(e) => setSelectGerarCategoriaId(e.target.value)}
            data={[{ value: "", label: "Selecione" }, ...categoriaOptionsForExtrato]}
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto px-6" onClick={handleGerarMovimento}>
              Gerar movimento
            </AppButton>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card>
        <AppSubTitle text="Extratos importados" />
        <AppTable
          data={extratos}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhum extrato importado." />}
          columns={extratoColumns}
        />
      </Card>
    </div>
  );
};

export default ConciliacaoFinanceiraPage;
