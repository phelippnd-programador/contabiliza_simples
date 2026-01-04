import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import {
  listApuracoes,
  createApuracao,
  updateApuracao,
  deleteApuracao,
  type ApuracaoResumo,
} from "../services/fiscal.service";
import AppButton from "../../../components/ui/button/AppButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import { formatBRL } from "../../../shared/utils/formater";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
const SIM_STORAGE_KEY = "sim_apuracoes";

const statusOptions = [
  { value: "ABERTA", label: "Aberta" },
  { value: "EMITIDA", label: "Emitida" },
  { value: "PAGA", label: "Paga" },
];

const guiaOptions = [
  { value: "DAS", label: "DAS (Simples)" },
  { value: "DARF", label: "DARF" },
];

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length };
};

const formatCompetencia = (value: string) => value || "";

const makeVencimento = (competencia: string, day: number) => {
  if (!competencia) return "";
  const [yearRaw, monthRaw] = competencia.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!year || !month) return "";
  const nextMonth = month + 1;
  const vencYear = nextMonth > 12 ? year + 1 : year;
  const vencMonth = nextMonth > 12 ? 1 : nextMonth;
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${vencYear}-${pad(vencMonth)}-${pad(day)}`;
};

const ApuracaoImpostosPage = () => {
  const [itens, setItens] = useState<ApuracaoResumo[]>([]);
  const [simulacoes, setSimulacoes] = useState<ApuracaoResumo[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [simError, setSimError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    competencia: "",
    tributo: "",
    valorCents: 0,
    status: "ABERTA",
    vencimento: "",
  });
  const [simData, setSimData] = useState({
    competencia: "",
    guiaTipo: "DAS",
    baseCents: 0,
    aliquota: 6,
    vencimento: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const load = async () => {
    if (!API_BASE) {
      const paged = paginate(simulacoes, page, pageSize);
      setItens(paged.data);
      setTotal(paged.total);
      return;
    }
    try {
      setError("");
      const response = await listApuracoes({ page, pageSize });
      setItens(response.data);
      setTotal(response.meta.total);
    } catch {
      setItens([]);
      setError("Nao foi possivel carregar as apuracoes.");
    }
  };

  useEffect(() => {
    load();
  }, [page, simulacoes]);

  useEffect(() => {
    if (API_BASE) return;
    const raw = window.localStorage.getItem(SIM_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ApuracaoResumo[];
      setSimulacoes(parsed);
    } catch {
      window.localStorage.removeItem(SIM_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (API_BASE) return;
    window.localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(simulacoes));
  }, [simulacoes]);

  const columns = useMemo(
    () => [
      {
        key: "competencia",
        header: "Competencia",
        render: (row: ApuracaoResumo) => row.competencia,
      },
      {
        key: "tributo",
        header: "Tributo",
        render: (row: ApuracaoResumo) => row.tributo,
      },
      {
        key: "vencimento",
        header: "Vencimento",
        render: (row: ApuracaoResumo) => row.vencimento ?? "-",
      },
      {
        key: "valor",
        header: "Valor",
        align: "right" as const,
        render: (row: ApuracaoResumo) =>
          (row.valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
      },
      {
        key: "status",
        header: "Status",
        render: (row: ApuracaoResumo) => row.status ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: ApuracaoResumo) => (
          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setEditingId(row.id);
                setFormData({
                  competencia: row.competencia,
                  tributo: row.tributo,
                  valorCents: row.valor,
                  status: row.status ?? "ABERTA",
                  vencimento: row.vencimento ?? "",
                });
                setFormError("");
                setFormOpen(true);
              }}
            >
              Editar
            </AppButton>
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={async () => {
                if (!API_BASE) {
                  setSimulacoes((prev) => prev.filter((item) => item.id !== row.id));
                  return;
                }
                const confirmed = window.confirm("Excluir esta apuracao?");
                if (!confirmed) return;
                try {
                  setError("");
                  await deleteApuracao(row.id);
                  load();
                } catch {
                  setError("Nao foi possivel excluir a apuracao.");
                }
              }}
            >
              Excluir
            </AppButton>
          </div>
        ),
      },
    ],
    []
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      competencia: "",
      tributo: "",
      valorCents: 0,
      status: "ABERTA",
      vencimento: "",
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.competencia || !formData.tributo || formData.valorCents <= 0) {
      setFormError("Preencha os campos obrigatorios.");
      return;
    }
    if (!API_BASE) {
      const id = editingId ?? `sim-${Date.now()}`;
      const next: ApuracaoResumo = {
        id,
        competencia: formData.competencia,
        tributo: formData.tributo,
        valor: formData.valorCents,
        status: formData.status,
        vencimento: formData.vencimento || undefined,
      };
      setSimulacoes((prev) =>
        editingId ? prev.map((item) => (item.id === id ? next : item)) : [next, ...prev]
      );
      resetForm();
      setFormOpen(false);
      return;
    }
    try {
      const payload = {
        competencia: formData.competencia,
        tributo: formData.tributo,
        valor: formData.valorCents,
        status: formData.status,
        vencimento: formData.vencimento || undefined,
      };
      if (editingId) {
        await updateApuracao(editingId, payload);
      } else {
        await createApuracao(payload);
      }
      resetForm();
      setFormOpen(false);
      load();
    } catch {
      setFormError("Nao foi possivel salvar a apuracao.");
    }
  };

  const simulacaoValor = useMemo(() => {
    const base = simData.baseCents;
    const aliquota = simData.aliquota;
    if (!base || !aliquota) return 0;
    return Math.round((base * aliquota) / 100);
  }, [simData]);

  const handleSimularGuia = () => {
    setSimError("");
    if (!simData.competencia || simData.baseCents <= 0 || simData.aliquota <= 0) {
      setSimError("Informe competencia, base e aliquota.");
      return;
    }
    if (!simData.vencimento) {
      const vencimento =
        simData.guiaTipo === "DAS"
          ? makeVencimento(simData.competencia, 20)
          : makeVencimento(simData.competencia, 15);
      setSimData((prev) => ({ ...prev, vencimento }));
    }
  };

  const handleGerarGuia = () => {
    setSimError("");
    if (!simData.competencia || simData.baseCents <= 0 || simData.aliquota <= 0) {
      setSimError("Informe competencia, base e aliquota.");
      return;
    }
    const vencimento =
      simData.vencimento ||
      (simData.guiaTipo === "DAS"
        ? makeVencimento(simData.competencia, 20)
        : makeVencimento(simData.competencia, 15));
    const id = `sim-${Date.now()}`;
    const next: ApuracaoResumo = {
      id,
      competencia: simData.competencia,
      tributo: simData.guiaTipo,
      valor: simulacaoValor,
      status: "EMITIDA",
      vencimento,
    };
    setSimulacoes((prev) => [next, ...prev]);
  };

  const downloadGuia = () => {
    if (!simulacaoValor) return;
    const vencimento =
      simData.vencimento ||
      (simData.guiaTipo === "DAS"
        ? makeVencimento(simData.competencia, 20)
        : makeVencimento(simData.competencia, 15));
    const content = [
      `Guia: ${simData.guiaTipo}`,
      `Competencia: ${formatCompetencia(simData.competencia)}`,
      `Base: ${(simData.baseCents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}`,
      `Aliquota: ${simData.aliquota}%`,
      `Valor: ${(simulacaoValor / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}`,
      `Vencimento: ${vencimento}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `guia-${simData.guiaTipo.toLowerCase()}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Apuracao de impostos" />
          <AppSubTitle text="Apuracao e guias (DAS, DARF)." />
        </div>
        <AppButton
          type="button"
          className="w-auto px-6"
          onClick={() => {
            resetForm();
            setFormError("");
            setFormOpen((prev) => !prev);
          }}
        >
          {formOpen ? "Fechar" : "Nova apuracao"}
        </AppButton>
      </div>

      <Card>
        <AppSubTitle text="Simulador de guia" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AppDateInput
            required
            title="Competencia"
            type="month"
            value={simData.competencia}
            onChange={(e) =>
              setSimData((prev) => ({ ...prev, competencia: e.target.value }))
            }
          />
          <AppSelectInput
            title="Guia"
            value={simData.guiaTipo}
            onChange={(e) =>
              setSimData((prev) => ({ ...prev, guiaTipo: e.target.value }))
            }
            data={guiaOptions}
          />
          <AppTextInput
            title="Base (receita)"
            value={simData.baseCents ? String(simData.baseCents) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setSimData((prev) => ({ ...prev, baseCents: Number(raw || "0") }))
            }
          />
          <AppTextInput
            title="Aliquota (%)"
            value={simData.aliquota ? String(simData.aliquota) : ""}
            sanitizeRegex={/[0-9]/g}
            onValueChange={(raw) =>
              setSimData((prev) => ({ ...prev, aliquota: Number(raw || "0") }))
            }
          />
          <AppDateInput
            title="Vencimento"
            value={simData.vencimento}
            onChange={(e) =>
              setSimData((prev) => ({ ...prev, vencimento: e.target.value }))
            }
          />
          <AppTextInput
            title="Valor calculado"
            value={simulacaoValor ? String(simulacaoValor) : ""}
            formatter={formatBRL}
            disabled
          />
        </div>
        {simError ? <p className="mt-2 text-sm text-red-600">{simError}</p> : null}
        <div className="mt-3 flex flex-wrap gap-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSimularGuia}>
            Calcular
          </AppButton>
          <AppButton type="button" className="w-auto px-6" onClick={handleGerarGuia}>
            Gerar apuracao
          </AppButton>
          <AppButton type="button" className="w-auto px-6" onClick={downloadGuia}>
            Baixar guia simulada
          </AppButton>
        </div>
      </Card>

      {formOpen ? (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <AppDateInput
              required
              title="Competencia"
              type="month"
              value={formData.competencia}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  competencia: e.target.value,
                }))
              }
            />
            <AppTextInput
              required
              title="Tributo"
              value={formData.tributo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tributo: e.target.value }))
              }
            />
            <AppTextInput
              required
              title="Valor"
              value={formData.valorCents ? String(formData.valorCents) : ""}
              sanitizeRegex={/[0-9]/g}
              formatter={formatBRL}
              onValueChange={(raw) =>
                setFormData((prev) => ({
                  ...prev,
                  valorCents: Number(raw || "0"),
                }))
              }
            />
            <AppDateInput
              title="Vencimento"
              value={formData.vencimento}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vencimento: e.target.value }))
              }
            />
            <AppSelectInput
              title="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              data={statusOptions}
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex gap-3">
            <AppButton type="button" className="w-auto px-6" onClick={handleSubmit}>
              {editingId ? "Atualizar" : "Salvar"}
            </AppButton>
            <AppButton
              type="button"
              className="w-auto px-6"
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
            >
              Cancelar
            </AppButton>
          </div>
        </Card>
      ) : null}

      <Card tone="amber">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          Simulador ativo: calcule guias e gere apuracoes localmente.
        </p>
      </Card>

      <Card>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma apuracao encontrada." />}
          pagination={{
            enabled: true,
            pageSize,
            page,
            total,
            onPageChange: setPage,
          }}
          columns={columns}
        />
      </Card>
    </div>
  );
};

export default ApuracaoImpostosPage;
