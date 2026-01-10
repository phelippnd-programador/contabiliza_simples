import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import { BankPicker } from "../../../components/ui/picked/BankPicker";
import { AppTabs } from "../../../components/ui/tab/AppTabs";
import { formatBRL, formatLocalDate, toLocalISODate } from "../../../shared/utils/formater";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getBankByValueCached,
  type BankItem,
} from "../../../shared/services/banks";
import { getCartao, saveCartao } from "../services/cartoes.service";
import type { CartaoCredito, CartaoFatura, CartaoLancamento } from "../types";
import { TipoMovimentoCaixa, TipoReferenciaMovimentoCaixa } from "../types";
import { listCategorias } from "../services/categorias.service";
import { listContas } from "../services/contas.service";
import { listCentrosCusto } from "../../rh/services/rh.service";
import type { CentroCusto } from "../../rh/types/rh.types";
import type { CategoriaMovimento, ContaBancaria } from "../types";
import {
  createCartaoLancamento,
  deleteCartaoLancamento,
  listCartaoLancamentos,
} from "../services/cartao-lancamentos.service";
import {
  createCartaoFatura,
  listCartaoFaturas,
  updateCartaoFatura,
} from "../services/cartao-faturas.service";
import { saveMovimento } from "../services/movimentos.service";
import { TrashIcon } from "../../../components/ui/icon/AppIcons";
import ImportWizardPage from "../../import/pages/ImportWizardPage";
import AppSummaryCard from "../../../components/ui/card/AppSummaryCard";
import AppPopup from "../../../components/ui/popup/AppPopup";
import useConfirmPopup from "../../../shared/hooks/useConfirmPopup";

const CartaoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Omit<CartaoCredito, "id">>({
    nome: "",
    banco: "",
    vencimentoDia: 0,
    fechamentoDia: 0,
    limiteInicial: 0,
  });
  const [bankItem, setBankItem] = useState<BankItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaMovimento[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [lancamentos, setLancamentos] = useState<CartaoLancamento[]>([]);
  const [faturas, setFaturas] = useState<CartaoFatura[]>([]);
  const [error, setError] = useState("");
  const [faturaContaId, setFaturaContaId] = useState("");
  const [faturaCategoriaId, setFaturaCategoriaId] = useState("");
  const [faturaFiltroCompetencia, setFaturaFiltroCompetencia] = useState("");
  const [gastosPeriodo, setGastosPeriodo] = useState({ inicio: "", fim: "" });
  const [activeTab, setActiveTab] = useState<
    "resumo" | "dados" | "lancamentos" | "faturas" | "importacao"
  >("resumo");
  const { popupProps, openConfirm } = useConfirmPopup();
  const [formLancamento, setFormLancamento] = useState({
    data: "",
    descricao: "",
    valorCents: 0,
    parcelas: 1,
    categoriaId: "",
    centroCustoId: "",
  });
  const [parcelValueRaw, setParcelValueRaw] = useState("");

  const addMonths = (date: Date, months: number) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  };

  const formatDateInput = (date: Date) => toLocalISODate(date);

  const computeCompetencia = (dateStr: string, fechamentoDia: number) => {
    if (!dateStr) return "";
    const base = new Date(`${dateStr}T00:00:00`);
    const competenciaDate = new Date(base);
    if (fechamentoDia && base.getDate() > fechamentoDia) {
      competenciaDate.setMonth(competenciaDate.getMonth() + 1);
    }
    return competenciaDate.toISOString().slice(0, 7);
  };

  const buildDateFromCompetencia = (competencia: string, dia: number, offset = 0) => {
    if (!competencia || !dia) return "";
    const [yearRaw, monthRaw] = competencia.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    if (!year || !month) return "";
    const date = new Date(year, month - 1 + offset, dia);
    return toLocalISODate(date);
  };

  const getVencimentoStatus = (vencimentoDate?: string, vencimentoDia?: number) => {
    if (!vencimentoDate && !vencimentoDia) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = vencimentoDate
      ? new Date(`${vencimentoDate}T00:00:00`)
      : new Date(now.getFullYear(), now.getMonth(), vencimentoDia ?? 1);
    if (Number.isNaN(dueDate.getTime())) return null;
    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
    if (diffDays >= 0) {
      return {
        label: diffDays === 0 ? "Vence hoje" : `Faltam ${diffDays} dias para o vencimento`,
        overdue: false,
      };
    }
    return {
      label: `Atrasado ha ${Math.abs(diffDays)} dias`,
      overdue: true,
    };
  };

  const refreshCartaoFinance = async (cartaoId: string) => {
    const [lancamentosData, faturasData] = await Promise.all([
      listCartaoLancamentos(cartaoId),
      listCartaoFaturas(cartaoId),
    ]);
    setLancamentos(lancamentosData);
    setFaturas(faturasData);
  };

  const baseParcelValues = useMemo(() => {
    const total = Math.max(0, Number(formLancamento.valorCents || 0));
    const totalParcelas = Math.max(1, Number(formLancamento.parcelas || 1));
    if (totalParcelas <= 1 || !total) return [];
    const baseValor = Math.floor(total / totalParcelas);
    const remainder = total - baseValor * totalParcelas;
    return Array.from({ length: totalParcelas }, (_, index) => {
      const extra = index < remainder ? 1 : 0;
      return baseValor + extra;
    });
  }, [formLancamento.parcelas, formLancamento.valorCents]);

  const parcelValueMin = useMemo(() => {
    if (!baseParcelValues.length) return 0;
    return Math.max(...baseParcelValues);
  }, [baseParcelValues]);

  const parcelValueNumber = useMemo(
    () => Number(parcelValueRaw || "0"),
    [parcelValueRaw]
  );

  useEffect(() => {
    if (!baseParcelValues.length) {
      setParcelValueRaw("");
      return;
    }
    setParcelValueRaw(String(parcelValueMin));
  }, [baseParcelValues, parcelValueMin]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      const cartao = await getCartao(id);
      if (!isMounted) return;
      if (!cartao) {
        setNotFound(true);
        return;
      }
      const { id: _id, ...rest } = cartao;
      const legacyVencimento = (rest as unknown as { vencimento?: string }).vencimento;
      const vencimentoDia =
        rest.vencimentoDia ||
        (legacyVencimento ? Number(legacyVencimento.split("-")[2]) : 0);
      setForm({
        ...rest,
        vencimentoDia,
        fechamentoDia: rest.fechamentoDia ?? 0,
      });
      refreshCartaoFinance(id);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const value = form.banco?.trim();
    if (!value) {
      setBankItem(null);
      return () => {
        isMounted = false;
      };
    }
    const loadBank = async () => {
      const found = await getBankByValueCached(value);
      if (!isMounted) return;
      if (found) {
        setBankItem(found);
        return;
      }
      const code = /^\d+$/.test(value) ? Number(value) : undefined;
      setBankItem({
        ispb: "",
        name: value,
        code: Number.isFinite(code) ? code : undefined,
      });
    };
    loadBank();
    return () => {
      isMounted = false;
    };
  }, [form.banco]);

  useEffect(() => {
    let isMounted = true;
    const loadLookups = async () => {
      const [categoriasData, contasData, centrosData] = await Promise.all([
        listCategorias({ tipo: TipoMovimentoCaixa.SAIDA }),
        listContas(),
        listCentrosCusto({ page: 1, pageSize: 200 }),
      ]);
      if (!isMounted) return;
      setCategorias(categoriasData);
      setContas(contasData);
      setCentrosCusto(centrosData.data);
    };
    loadLookups();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoriaOptions = categorias.map((categoria) => ({
    value: categoria.id,
    label: categoria.nome,
  }));

  const contaOptions = contas.map((conta) => ({
    value: conta.id,
    label: `${conta.nome} (${conta.banco})`,
  }));

  const centroCustoOptions = centrosCusto.map((centro) => ({
    value: centro.id,
    label: centro.nome,
  }));

  const faturasView = useMemo(() => {
    const totals = new Map<string, number>();
    const counts = new Map<string, number>();
    lancamentos.forEach((item) => {
      const competencia = item.faturaCompetencia;
      totals.set(competencia, (totals.get(competencia) ?? 0) + item.valor);
      counts.set(competencia, (counts.get(competencia) ?? 0) + 1);
    });
    const stored = new Map<string, CartaoFatura>();
    faturas.forEach((item) => stored.set(item.competencia, item));
    const competencias = new Set<string>([...totals.keys(), ...stored.keys()]);
    return Array.from(competencias)
      .sort()
      .map((competencia) => {
        const storedItem = stored.get(competencia);
        const total = totals.get(competencia) ?? storedItem?.total ?? 0;
        return {
          id: storedItem?.id,
          competencia,
          total,
          itens: counts.get(competencia) ?? 0,
          status: storedItem?.status ?? "ABERTA",
          movimentoId: storedItem?.movimentoId,
          fechamento: buildDateFromCompetencia(
            competencia,
            form.fechamentoDia,
            -1
          ),
          vencimento: buildDateFromCompetencia(competencia, form.vencimentoDia, 0),
        };
      });
  }, [faturas, lancamentos, form.fechamentoDia, form.vencimentoDia]);

  const competenciasFatura = useMemo(() => {
    const set = new Set<string>();
    faturasView.forEach((item) => set.add(item.competencia));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [faturasView]);

  useEffect(() => {
    if (!faturasView.length) {
      setFaturaFiltroCompetencia("");
      return;
    }
    if (!faturaFiltroCompetencia) {
      setFaturaFiltroCompetencia("TODAS");
      return;
    }
    if (
      faturaFiltroCompetencia !== "TODAS" &&
      !competenciasFatura.includes(faturaFiltroCompetencia)
    ) {
      setFaturaFiltroCompetencia("TODAS");
    }
  }, [competenciasFatura, faturaFiltroCompetencia, faturasView]);

  useEffect(() => {
    if (!faturasView.length) {
      setGastosPeriodo({ inicio: "", fim: "" });
      return;
    }
    const competenciasAsc = [...competenciasFatura].sort();
    const inicio = competenciasAsc[0];
    const fim = competenciasAsc[competenciasAsc.length - 1];
    setGastosPeriodo((prev) => ({
      inicio: prev.inicio || inicio,
      fim: prev.fim || fim,
    }));
  }, [competenciasFatura, faturasView]);

  const faturasOrdenadas = useMemo(
    () => [...faturasView].sort((a, b) => (a.competencia > b.competencia ? 1 : -1)),
    [faturasView]
  );

  const faturasAbertas = useMemo(
    () => faturasView.filter((item) => item.status === "ABERTA"),
    [faturasView]
  );

  const faturasAbertasOrdenadas = useMemo(
    () => [...faturasAbertas].sort((a, b) => (a.competencia > b.competencia ? 1 : -1)),
    [faturasAbertas]
  );

  const totalFaturasAbertas = useMemo(
    () => faturasAbertas.reduce((acc, item) => acc + item.total, 0),
    [faturasAbertas]
  );

  const faturaMaisRecente = useMemo(
    () => faturasAbertasOrdenadas[0] ?? faturasOrdenadas[0],
    [faturasAbertasOrdenadas, faturasOrdenadas]
  );

  const faturasFiltradas = useMemo(() => {
    if (faturaFiltroCompetencia === "TODAS" || !faturaFiltroCompetencia) {
      return faturasOrdenadas;
    }
    return faturasOrdenadas.filter((item) => item.competencia === faturaFiltroCompetencia);
  }, [faturaFiltroCompetencia, faturasOrdenadas]);

  const vencimentoStatus = useMemo(
    () => getVencimentoStatus(faturaMaisRecente?.vencimento, form.vencimentoDia),
    [faturaMaisRecente?.vencimento, form.vencimentoDia]
  );

  const gastosMensais = useMemo(() => {
    if (!gastosPeriodo.inicio || !gastosPeriodo.fim) return [];
    const [startYear, startMonth] = gastosPeriodo.inicio.split("-").map(Number);
    const [endYear, endMonth] = gastosPeriodo.fim.split("-").map(Number);
    if (!startYear || !startMonth || !endYear || !endMonth) return [];

    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth - 1, 1);
    if (startDate > endDate) return [];

    const totalsMap = new Map<string, number>();
    faturasView.forEach((item) => {
      totalsMap.set(item.competencia, (totalsMap.get(item.competencia) ?? 0) + item.total);
    });

    const data: Array<{ competencia: string; valor: number }> = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const competencia = cursor.toISOString().slice(0, 7);
      data.push({
        competencia,
        valor: (totalsMap.get(competencia) ?? 0) / 100,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return data;
  }, [faturasView, gastosPeriodo.fim, gastosPeriodo.inicio]);

  const chartPalette = useMemo(() => {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");
    return {
      grid: isDark ? "#1f2937" : "#e5e7eb",
      axis: isDark ? "#94a3b8" : "#6b7280",
      tooltipBg: isDark ? "#0f172a" : "#ffffff",
      tooltipBorder: isDark ? "#334155" : "#e5e7eb",
      tooltipText: isDark ? "#e2e8f0" : "#111827",
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setActiveTab("dados");
      return;
    }
    if (notFound) {
      setActiveTab("dados");
      return;
    }
    setActiveTab((prev) => (prev === "dados" ? "resumo" : prev));
  }, [id, notFound]);

  const handleAddLancamento = async () => {
    setError("");
    if (!id) return;
    if (!formLancamento.data || !formLancamento.descricao || !formLancamento.valorCents) {
      setError("Informe data, descricao e valor.");
      return;
    }
    try {
      const totalParcelas = Math.max(1, Number(formLancamento.parcelas || 1));
      const baseDate = new Date(`${formLancamento.data}T00:00:00`);
      const baseValor = Math.floor(formLancamento.valorCents / totalParcelas);
      const remainder = formLancamento.valorCents - baseValor * totalParcelas;
      const parcelValueFinal = Math.max(parcelValueMin, parcelValueNumber || 0);
      const valoresParcelas =
        totalParcelas > 1 && parcelValueFinal > 0
          ? Array.from({ length: totalParcelas }, () => parcelValueFinal)
          : Array.from({ length: totalParcelas }, (_, index) => {
              const extra = index < remainder ? 1 : 0;
              return baseValor + extra;
            });

      for (let i = 0; i < totalParcelas; i += 1) {
        const parcelaDate = addMonths(baseDate, i);
        const valor = valoresParcelas[i] ?? baseValor + (i < remainder ? 1 : 0);
        await createCartaoLancamento({
          cartaoId: id,
          data: formatDateInput(parcelaDate),
          descricao: formLancamento.descricao,
            valor,
            parcela: totalParcelas > 1 ? i + 1 : undefined,
            totalParcelas: totalParcelas > 1 ? totalParcelas : undefined,
            categoriaId: formLancamento.categoriaId || undefined,
            centroCustoId: formLancamento.centroCustoId || undefined,
            faturaCompetencia: computeCompetencia(
              formatDateInput(parcelaDate),
              form.fechamentoDia
            ),
          });
        }
      setFormLancamento({
        data: "",
        descricao: "",
        valorCents: 0,
        parcelas: 1,
        categoriaId: "",
        centroCustoId: "",
      });
      await refreshCartaoFinance(id);
    } catch (err) {
      if (err instanceof Error && err.message === "COMPETENCIA_FECHADA") {
        setError("Competencia fechada. Nao e possivel lancar.");
        return;
      }
      setError("Nao foi possivel salvar o lancamento.");
    }
  };

  const handleRemoveLancamento = async (item: CartaoLancamento) => {
    setError("");
    await deleteCartaoLancamento(item.id);
    if (id) await refreshCartaoFinance(id);
  };

  const handleFecharFatura = async (competencia: string) => {
    setError("");
    if (!id) return;
    if (!form.vencimentoDia || !form.fechamentoDia) {
      setError("Informe vencimento e fechamento do cartao.");
      return;
    }
    if (!faturaContaId || !faturaCategoriaId) {
      setError("Selecione conta e categoria para gerar o movimento.");
      return;
    }
    const fatura = faturasView.find((item) => item.competencia === competencia);
    if (!fatura || fatura.total <= 0) {
      setError("Fatura sem total.");
      return;
    }
    if (fatura.status !== "ABERTA") {
      setError("Fatura ja fechada.");
      return;
    }
    try {
      const payload = {
        cartaoId: id,
        competencia,
        fechamento: fatura.fechamento,
        vencimento: fatura.vencimento,
        total: fatura.total,
        status: "FECHADA" as const,
        movimentoId: undefined,
      };
      let faturaId = fatura.id;
      if (faturaId) {
        await updateCartaoFatura(faturaId, payload);
      } else {
        const created = await createCartaoFatura(payload);
        faturaId = created.id;
      }
      const movimento = await saveMovimento({
        data: fatura.vencimento || toLocalISODate(new Date()),
        contaId: faturaContaId,
        tipo: TipoMovimentoCaixa.SAIDA,
        valor: Number((fatura.total / 100).toFixed(2)),
        descricao: `Fatura cartao ${form.nome} ${competencia}`,
        competencia,
        categoriaId: faturaCategoriaId,
        referencia: {
          tipo: TipoReferenciaMovimentoCaixa.CARTAO_FATURA,
          id: faturaId,
        },
      });
      if (faturaId) {
        await updateCartaoFatura(faturaId, { ...payload, movimentoId: movimento.id });
      }
      await refreshCartaoFinance(id);
    } catch (err) {
      if (err instanceof Error && err.message === "COMPETENCIA_FECHADA") {
        setError("Competencia fechada. Nao e possivel fechar a fatura.");
        return;
      }
      setError("Nao foi possivel fechar a fatura.");
    }
  };

  const handleSave = async () => {
    await saveCartao({ ...form, id });
    navigate("/financeiro/cartoes");
  };

  const resumoCartaoCard = (
    <>
      <Card tone="blue">
        <div className="flex items-center justify-between">
          <AppSubTitle text="Resumo do cartao" />
          <span className="rounded-full border border-sky-200/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-800/60 dark:text-sky-200">
            Atualizado
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Faturas abertas</p>
            <p className="mt-1 text-2xl font-semibold">{faturasAbertas.length}</p>
            <p className="text-xs text-slate-400">
              Total{" "}
              {(totalFaturasAbertas / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <AppSummaryCard
            title="Corte / Fechamento"
            value={`Dia ${form.fechamentoDia || "-"}`}
            details={[
              `Fechamento dia ${form.fechamentoDia || "-"}`,
            ]}
          />
          <AppSummaryCard
            title="Vencimento"
            value={`Dia ${form.vencimentoDia || "-"}`}
            helper="Pagamento da fatura"
          />
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Fatura mais recente</p>
            <p className="mt-1 text-2xl font-semibold">
              {faturaMaisRecente
                ? (faturaMaisRecente.total / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : "-"}
            </p>
            <p className="text-xs text-slate-400">
              {faturaMaisRecente?.competencia
                ? formatLocalDate(faturaMaisRecente.competencia)
                : "-"}
            </p>
            {vencimentoStatus ? (
              <p className="mt-1 text-xs font-semibold text-rose-500">
                {vencimentoStatus.label}
              </p>
            ) : null}
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <AppSubTitle text="Gastos mensais" />
          <span className="text-xs text-slate-400">
            {gastosPeriodo.inicio && gastosPeriodo.fim
              ? `${formatLocalDate(gastosPeriodo.inicio)} - ${formatLocalDate(gastosPeriodo.fim)}`
              : "Sem periodo"}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Valor mensal de gastos por fatura no periodo selecionado.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppDateInput
            title="Inicio"
            type="month"
            value={gastosPeriodo.inicio}
            onChange={(e) => setGastosPeriodo((prev) => ({ ...prev, inicio: e.target.value }))}
            tooltip="Define o inicio do periodo para o grafico de gastos."
          />
          <AppDateInput
            title="Fim"
            type="month"
            value={gastosPeriodo.fim}
            onChange={(e) => setGastosPeriodo((prev) => ({ ...prev, fim: e.target.value }))}
            tooltip="Define o fim do periodo para o grafico de gastos."
          />
        </div>
        <div className="mt-6 h-[260px] w-full">
          {gastosMensais.length ? (
            <ResponsiveContainer>
              <LineChart data={gastosMensais}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} />
                <XAxis
                  dataKey="competencia"
                  tick={{ fontSize: 12, fill: chartPalette.axis }}
                  tickFormatter={(value) =>
                    formatLocalDate(value, { month: "2-digit", year: "2-digit" })
                  }
                />
                <YAxis
                  tick={{ fontSize: 12, fill: chartPalette.axis }}
                  tickFormatter={(value) =>
                    Number(value).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })
                  }
                />
                <Tooltip
                  formatter={(value: number) =>
                    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  }
                  labelFormatter={(label) => formatLocalDate(label)}
                  labelStyle={{ fontSize: 12, color: chartPalette.tooltipText }}
                  contentStyle={{
                    backgroundColor: chartPalette.tooltipBg,
                    borderColor: chartPalette.tooltipBorder,
                    color: chartPalette.tooltipText,
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: chartPalette.tooltipText, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Gastos"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <AppListNotFound texto="Sem gastos no periodo selecionado." />
            </div>
          )}
        </div>
      </Card>
    </>
  );

  const dadosCartaoCard = (
    <Card>
        <AppSubTitle text="Dados do cartao" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Preencha os dados basicos do cartao. Campos com * sao obrigatorios.
        </p>

        {notFound ? (
          <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            Cartao nao encontrado.
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppTextInput
            required
            title="Nome do cartao"
            value={form.nome}
            onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
            tooltip="Nome interno do cartao para identificacao."
          />

          <BankPicker
            required
            value={bankItem}
            onChange={(item) => {
              setBankItem(item);
              setForm((prev) => ({
                ...prev,
                banco: item ? (item.code != null ? String(item.code) : item.name) : "",
              }));
            }}
            tooltip="Banco emissor do cartao."
          />

          <div className="flex flex-col gap-1">
            <AppSelectInput
              required
              title="Vencimento do cartao (dia)"
              value={form.vencimentoDia ? String(form.vencimentoDia) : ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  vencimentoDia: Number(e.target.value || "0"),
                }))
              }
              data={Array.from({ length: 28 }, (_, index) => {
                const value = String(index + 1);
                return { value, label: value };
              })}
              placeholder="Selecione"
              tooltip="Dia que a fatura vence e deve ser paga."
            />
            {vencimentoStatus ? (
              <span className="text-xs font-semibold text-rose-500">
                {vencimentoStatus.label}
              </span>
            ) : null}
          </div>

          <AppSelectInput
            required
            title="Fechamento da fatura (dia)"
            value={form.fechamentoDia ? String(form.fechamentoDia) : ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                fechamentoDia: Number(e.target.value || "0"),
              }))
            }
            data={Array.from({ length: 28 }, (_, index) => {
              const value = String(index + 1);
              return { value, label: value };
            })}
            placeholder="Selecione"
            tooltip="Dia em que a fatura fecha e deixa de receber novas compras."
          />

          <AppTextInput
            required
            title="Limite inicial"
            value={form.limiteInicial ? String(form.limiteInicial) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setForm((prev) => ({
                ...prev,
                limiteInicial: Number(raw || "0"),
              }))
            }
            tooltip="Limite total do cartao no inicio."
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AppButton onClick={handleSave}>Salvar</AppButton>
          <AppButton type="button" onClick={() => navigate("/financeiro/cartoes")}>
            Cancelar
          </AppButton>
        </div>
      </Card>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <AppTitle text={id ? "Editar cartao" : "Criar cartao"} />
        <AppSubTitle text="Cadastre cartoes com vencimento e limite inicial." />
      </div>

      {id && !notFound ? (
        <AppTabs
          tabs={[
            { id: "resumo", label: "Resumo" },
            { id: "dados", label: "Dados" },
            { id: "lancamentos", label: "Lancamentos" },
            { id: "faturas", label: "Faturas" },
            { id: "importacao", label: "Importacao" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      ) : null}

      {!id || notFound ? dadosCartaoCard : null}

      {id && !notFound && activeTab === "resumo" ? resumoCartaoCard : null}
      {id && !notFound && activeTab === "dados" ? dadosCartaoCard : null}

      {id && !notFound && activeTab === "lancamentos" ? (
          <Card>
            <AppSubTitle text="Lancamentos do cartao" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Registre compras e parcelamentos do cartao.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <AppDateInput
                required
                title="Data da compra"
                value={formLancamento.data}
                onChange={(e) =>
                  setFormLancamento((prev) => ({ ...prev, data: e.target.value }))
                }
                tooltip="Data em que a compra foi realizada."
              />
              <AppTextInput
                required
                title="Descricao"
                value={formLancamento.descricao}
                onChange={(e) =>
                  setFormLancamento((prev) => ({ ...prev, descricao: e.target.value }))
                }
                tooltip="Descricao que aparece na fatura."
              />
              {Number(formLancamento.parcelas || 1) > 1 && baseParcelValues.length ? (
                <div className="md:col-span-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      Valores por parcela
                    </p>
                    <p className="text-xs text-slate-400">
                      Defina o valor unico com juros. Ele nao pode ser menor que o sem juros.
                    </p>
                    <div className="mt-3">
                      <AppTextInput
                        title="Valor de cada parcela"
                        value={parcelValueRaw}
                        sanitizeRegex={/[0-9]/g}
                        formatter={formatBRL}
                        onValueChange={(raw) => {
                          setParcelValueRaw(raw);
                        }}
                        onBlur={() => {
                          setParcelValueRaw((prev) => {
                            const next = Math.max(parcelValueMin, Number(prev || "0"));
                            return next ? String(next) : "";
                          });
                        }}
                        tooltip="Valor final aplicado a todas as parcelas."
                      />
                    </div>
                  </div>
                </div>
              ) : null}
              <AppSelectInput
                title="Categoria"
                value={formLancamento.categoriaId}
                onChange={(e) =>
                  setFormLancamento((prev) => ({
                    ...prev,
                    categoriaId: e.target.value,
                  }))
                }
                data={categoriaOptions}
                placeholder="Selecione"
                disabled={!formLancamento.valorCents}
                tooltip="Categoria usada nos relatorios."
              />
              <AppSelectInput
                title="Centro de custo"
                value={formLancamento.centroCustoId}
                onChange={(e) =>
                  setFormLancamento((prev) => ({
                    ...prev,
                    centroCustoId: e.target.value,
                  }))
                }
                data={centroCustoOptions}
                placeholder="Selecione"
                disabled={!formLancamento.valorCents}
                tooltip="Centro de custo associado a compra."
              />
              <AppTextInput
                required
                title="Valor"
                value={formLancamento.valorCents ? String(formLancamento.valorCents) : ""}
                sanitizeRegex={/[0-9]/g}
                formatter={formatBRL}
                onValueChange={(raw) =>
                  setFormLancamento((prev) => ({
                    ...prev,
                    valorCents: Number(raw || "0"),
                  }))
                }
                tooltip="Valor da compra em reais."
              />
              <AppSelectInput
                title="Parcelas"
                value={String(formLancamento.parcelas ?? 1)}
                onChange={(e) =>
                  setFormLancamento((prev) => ({
                    ...prev,
                    parcelas: Number(e.target.value || "1"),
                  }))
                }
                data={Array.from({ length: 60 }, (_, index) => {
                  const value = String(index + 1);
                  return { value, label: value };
                })}
                placeholder="Selecione"
                disabled={!formLancamento.valorCents}
                tooltip="Quantidade de parcelas. Use 1 para compra a vista."
              />
            </div>

            <div className="mt-4 flex gap-3">
              <AppButton
                type="button"
                className="w-auto"
                onClick={handleAddLancamento}
                disabled={!formLancamento.valorCents}
              >
                Adicionar lancamento
              </AppButton>
            </div>

            <div className="mt-6">
              <AppTable
                data={lancamentos}
                rowKey={(row) => row.id}
                emptyState={<AppListNotFound texto="Nenhum lancamento registrado." />}
                pagination={{ enabled: true, pageSize: 8 }}
                columns={[
                  {
                    key: "data",
                    header: "Data",
                    render: (row) => formatLocalDate(row.data),
                  },
                  { key: "descricao", header: "Descricao", render: (row) => row.descricao },
                  {
                    key: "valor",
                    header: "Valor",
                    align: "right" as const,
                    render: (row) =>
                      (row.valor / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                  },
                  {
                    key: "parcela",
                    header: "Parcela",
                    render: (row) =>
                      row.totalParcelas ? `${row.parcela}/${row.totalParcelas}` : "-",
                  },
                  {
                    key: "competencia",
                    header: "Fatura",
                    render: (row) => formatLocalDate(row.faturaCompetencia),
                  },
                  {
                    key: "acoes",
                    header: "Acoes",
                    align: "right" as const,
                    render: (row) => (
                      <AppIconButton
                        icon={<TrashIcon className="h-4 w-4" />}
                        label="Remover lancamento"
                        variant="danger"
                        onClick={() => handleRemoveLancamento(row)}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </Card>
      ) : null}

      {id && !notFound && activeTab === "faturas" ? (
          <Card>
            <AppSubTitle text="Faturas do cartao" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Feche a fatura para gerar o movimento de pagamento.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <AppSelectInput
                title="Conta para pagamento"
                value={faturaContaId}
                onChange={(e) => setFaturaContaId(e.target.value)}
                data={contaOptions}
                placeholder="Selecione"
                tooltip="Conta bancaria usada para pagar a fatura."
              />
              <AppSelectInput
                title="Categoria"
                value={faturaCategoriaId}
                onChange={(e) => setFaturaCategoriaId(e.target.value)}
                data={categoriaOptions}
                placeholder="Selecione"
                tooltip="Categoria para o movimento de pagamento da fatura."
              />
            </div>

            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <AppSelectInput
                title="Filtrar competencia"
                value={faturaFiltroCompetencia}
                onChange={(e) => setFaturaFiltroCompetencia(e.target.value)}
                data={[
                  { value: "TODAS", label: "Todas" },
                  ...competenciasFatura.map((competencia) => ({
                    value: competencia,
                    label: formatLocalDate(competencia),
                  })),
                ]}
                placeholder="Selecione"
                tooltip="Filtra as faturas exibidas na tabela."
              />
            </div>

            <div className="mt-4">
              <AppTable
                data={faturasFiltradas}
                rowKey={(row) => row.competencia}
                emptyState={<AppListNotFound texto="Nenhuma fatura encontrada." />}
                pagination={{ enabled: true, pageSize: 6 }}
                columns={[
                  {
                    key: "competencia",
                    header: "Competencia",
                    render: (row) => formatLocalDate(row.competencia),
                  },
                  {
                    key: "fechamento",
                    header: "Fechamento",
                    render: (row) =>
                      row.fechamento ? formatLocalDate(row.fechamento) : "-",
                  },
                  {
                    key: "vencimento",
                    header: "Vencimento",
                    render: (row) =>
                      row.vencimento ? formatLocalDate(row.vencimento) : "-",
                  },
                  {
                    key: "total",
                    header: "Total",
                    align: "right" as const,
                    render: (row) =>
                      (row.total / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                  },
                  {
                    key: "itens",
                    header: "Itens",
                    align: "right" as const,
                    render: (row) => row.itens,
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => row.status,
                  },
                  {
                    key: "acoes",
                    header: "Acoes",
                    align: "right" as const,
                    render: (row) => (
                      <AppButton
                        type="button"
                        className="w-auto"
                        onClick={() =>
                          openConfirm(
                            {
                              title: "Fechar fatura?",
                              description:
                                "Ao fechar a fatura, nao sera mais possivel reabrir.",
                              confirmLabel: "Fechar fatura",
                              cancelLabel: "Cancelar",
                              tone: "danger",
                            },
                            () => handleFecharFatura(row.competencia)
                          )
                        }
                        disabled={row.status !== "ABERTA"}
                      >
                        Fechar fatura
                      </AppButton>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
      ) : null}

      {id && !notFound && activeTab === "importacao" ? (
        <ImportWizardPage
          embedded
          defaultSourceType="CARD"
          defaultCardId={id}
          lockSourceType
          lockCardSelect
        />
      ) : null}

      <AppPopup {...popupProps} />
    </div>
  );
};

export default CartaoPage;
