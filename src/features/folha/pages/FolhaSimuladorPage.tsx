import React, { useEffect, useMemo, useState } from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppTable from "../../../components/ui/table/AppTable";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import AppButton from "../../../components/ui/button/AppButton";
import AppIconButton from "../../../components/ui/button/AppIconButton";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppDateInput from "../../../components/ui/input/AppDateInput";
import AppSelectInput from "../../../components/ui/input/AppSelectInput";
import type { FolhaResumo } from "../services/folha.service";
import { formatBRL, formatLocalDate, formatPercentBR } from "../../../shared/utils/formater";
import { TrashIcon } from "../../../components/ui/icon/AppIcons";
import {
  listColaboradores,
  type ColaboradorResumo,
} from "../services/colaboradores.service";

const SIM_STORAGE_KEY = "sim_folha";
const DEPENDENTE_DEDUCAO_CENTS = 18959;

const rescisaoOptions = [
  { value: "SEM_RESCISAO", label: "Sem rescisao" },
  { value: "SEM_JUSTA_CAUSA", label: "Sem justa causa" },
  { value: "COM_JUSTA_CAUSA", label: "Com justa causa" },
  { value: "PEDIDO_DEMISSAO", label: "Pedido de demissao" },
  { value: "TERMINO_CONTRATO", label: "Termino de contrato" },
];

type EsocialEvento = {
  id: string;
  tipo: string;
  status: "PENDENTE" | "ENVIADO";
  referencia: string;
  descricao: string;
};

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length };
};

const formatMoney = (value: number) =>
  (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FolhaSimuladorPage = () => {
  const [simuladas, setSimuladas] = useState<FolhaResumo[]>([]);
  const [itens, setItens] = useState<FolhaResumo[]>([]);
  const [eventos, setEventos] = useState<EsocialEvento[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorResumo[]>([]);
  const [simError, setSimError] = useState("");
  const [eventError, setEventError] = useState("");
  const [colaboradoresError, setColaboradoresError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [simData, setSimData] = useState({
    referencia: "",
    colaboradores: 1,
    colaboradorId: "",
    salarioBaseCents: 0,
    horasExtrasCents: 0,
    outrosProventosCents: 0,
    descontosCents: 0,
    dependentes: 0,
    inssPercentBps: 750,
    irrfPercentBps: 750,
    fgtsPercentBps: 800,
    rescisaoTipo: "SEM_RESCISAO",
    verbasRescisoriasCents: 0,
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(SIM_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as FolhaResumo[];
      setSimuladas(parsed);
    } catch {
      window.localStorage.removeItem(SIM_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(simuladas));
  }, [simuladas]);

  useEffect(() => {
    const paged = paginate(simuladas, page, pageSize);
    setItens(paged.data);
    setTotal(paged.total);
  }, [page, simuladas]);

  useEffect(() => {
    let isMounted = true;
    const loadColaboradores = async () => {
      try {
        setColaboradoresError("");
        const response = await listColaboradores({ page: 1, pageSize: 200 });
        if (!isMounted) return;
        setColaboradores(response.data);
      } catch {
        if (!isMounted) return;
        setColaboradores([]);
        setColaboradoresError("Nao foi possivel carregar os colaboradores.");
      }
    };
    loadColaboradores();
    return () => {
      isMounted = false;
    };
  }, []);

  const calculo = useMemo(() => {
    const baseProventos =
      simData.salarioBaseCents +
      simData.horasExtrasCents +
      simData.outrosProventosCents +
      simData.verbasRescisoriasCents;
    const inss = Math.round((baseProventos * simData.inssPercentBps) / 10000);
    const fgts = Math.round((baseProventos * simData.fgtsPercentBps) / 10000);
    const multaFgts =
      simData.rescisaoTipo === "SEM_JUSTA_CAUSA" ? Math.round(fgts * 0.4) : 0;
    const totalProventos = baseProventos + multaFgts;
    const baseIrrf = Math.max(
      0,
      totalProventos - inss - simData.dependentes * DEPENDENTE_DEDUCAO_CENTS
    );
    const irrf = Math.round((baseIrrf * simData.irrfPercentBps) / 10000);
    const totalDescontos = inss + irrf + simData.descontosCents;
    const totalLiquido = totalProventos - totalDescontos;
    return {
      baseProventos,
      inss,
      fgts,
      multaFgts,
      irrf,
      totalProventos,
      totalDescontos,
      totalLiquido,
    };
  }, [simData]);

  const columns = useMemo(
    () => [
      {
        key: "referencia",
        header: "Referencia",
        render: (row: FolhaResumo) => formatLocalDate(row.referencia),
      },
      {
        key: "colaboradores",
        header: "Colaborador",
        align: "right" as const,
        render: (row: FolhaResumo) =>
          row.colaborador?.nome ?? (row.colaboradores ? row.colaboradores : "-"),
      },
      {
        key: "proventos",
        header: "Proventos",
        align: "right" as const,
        render: (row: FolhaResumo) =>
          row.totalProventos ? formatMoney(row.totalProventos) : "-",
      },
      {
        key: "descontos",
        header: "Descontos",
        align: "right" as const,
        render: (row: FolhaResumo) =>
          row.totalDescontos ? formatMoney(row.totalDescontos) : "-",
      },
      {
        key: "liquido",
        header: "Liquido",
        align: "right" as const,
        render: (row: FolhaResumo) =>
          row.totalLiquido ? formatMoney(row.totalLiquido) : "-",
      },
      {
        key: "status",
        header: "Status",
        render: (row: FolhaResumo) => row.status ?? "SIMULADA",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: FolhaResumo) => (
          <div className="flex justify-end gap-2">
            <AppIconButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={`Excluir simulacao ${row.id}`}
              variant="danger"
              onClick={() =>
                setSimuladas((prev) => prev.filter((item) => item.id !== row.id))
              }
            />
          </div>
        ),
      },
    ],
    []
  );

  const eventosColumns = useMemo(
    () => [
      {
        key: "tipo",
        header: "Evento",
        render: (row: EsocialEvento) => row.tipo,
      },
      {
        key: "descricao",
        header: "Descricao",
        render: (row: EsocialEvento) => row.descricao,
      },
      {
        key: "referencia",
        header: "Referencia",
        render: (row: EsocialEvento) => formatLocalDate(row.referencia),
      },
      {
        key: "status",
        header: "Status",
        render: (row: EsocialEvento) => row.status,
      },
    ],
    []
  );

  const handleSimularFolha = () => {
    setSimError("");
    if (!simData.referencia || !simData.colaboradorId) {
      setSimError("Informe a referencia e o colaborador.");
      return;
    }
    if (simData.salarioBaseCents <= 0) {
      setSimError("Informe o salario base.");
      return;
    }
    const colaboradorSelecionado =
      colaboradores.find((item) => item.id === simData.colaboradorId) ?? null;
    const id = `sim-${Date.now()}`;
    const next: FolhaResumo = {
      id,
      referencia: simData.referencia,
      colaboradores: simData.colaboradores,
      colaboradorId: simData.colaboradorId,
      colaborador: colaboradorSelecionado
        ? { id: colaboradorSelecionado.id, nome: colaboradorSelecionado.nome }
        : undefined,
      status: "SIMULADA",
      totalProventos: calculo.totalProventos,
      totalDescontos: calculo.totalDescontos,
      totalLiquido: calculo.totalLiquido,
      inss: calculo.inss,
      fgts: calculo.fgts,
      irrf: calculo.irrf,
      rescisaoTipo:
        simData.rescisaoTipo !== "SEM_RESCISAO" ? simData.rescisaoTipo : undefined,
    };
    setSimuladas((prev) => [next, ...prev]);
  };

  const handleGerarEventos = () => {
    setEventError("");
    if (!simData.referencia) {
      setEventError("Informe a referencia para gerar eventos.");
      return;
    }
    const baseId = Date.now();
    const next: EsocialEvento[] = [
      {
        id: `evt-${baseId}-1200`,
        tipo: "S-1200",
        status: "PENDENTE",
        referencia: simData.referencia,
        descricao: "Remuneracao do trabalhador",
      },
      {
        id: `evt-${baseId}-1210`,
        tipo: "S-1210",
        status: "PENDENTE",
        referencia: simData.referencia,
        descricao: "Pagamentos de rendimentos do trabalho",
      },
    ];
    if (simData.rescisaoTipo !== "SEM_RESCISAO") {
      next.push({
        id: `evt-${baseId}-2299`,
        tipo: "S-2299",
        status: "PENDENTE",
        referencia: simData.referencia,
        descricao: "Desligamento e verbas rescisorias",
      });
    }
    setEventos(next);
  };

  const handleEnviarEventos = () => {
    if (!eventos.length) return;
    setEventos((prev) => prev.map((item) => ({ ...item, status: "ENVIADO" })));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Simulador de folha" />
          <AppSubTitle text="Calculo de encargos e eventos eSocial." />
        </div>
      </div>

      <Card>
        <AppSubTitle text="Simulador" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AppDateInput
            required
            title="Referencia"
            type="month"
            value={simData.referencia}
            onChange={(e) =>
              setSimData((prev) => ({ ...prev, referencia: e.target.value }))
            }
          />
          <AppSelectInput
            required
            title="Colaborador"
            value={simData.colaboradorId}
            onChange={(e) => {
              const colaboradorId = e.target.value;
              const selecionado =
                colaboradores.find((item) => item.id === colaboradorId) ?? null;
              const percentualInss = selecionado?.percentualInss ?? 0;
              const inssPercentBps =
                percentualInss > 0 && percentualInss <= 100
                  ? percentualInss * 100
                  : percentualInss;
              setSimData((prev) => ({
                ...prev,
                colaboradorId,
                colaboradores: colaboradorId ? 1 : 0,
                salarioBaseCents: selecionado?.salarioBase ?? prev.salarioBaseCents,
                inssPercentBps: inssPercentBps || prev.inssPercentBps,
              }));
            }}
            data={colaboradores.map((colaborador) => ({
              value: colaborador.id,
              label: colaborador.nome,
            }))}
            placeholder="Selecione"
            error={colaboradoresError}
          />
          <AppTextInput
            required
            title="Salario base"
            value={simData.salarioBaseCents ? String(simData.salarioBaseCents) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                salarioBaseCents: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="Horas extras"
            value={simData.horasExtrasCents ? String(simData.horasExtrasCents) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                horasExtrasCents: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="Outros proventos"
            value={
              simData.outrosProventosCents ? String(simData.outrosProventosCents) : ""
            }
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                outrosProventosCents: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="Descontos"
            value={simData.descontosCents ? String(simData.descontosCents) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                descontosCents: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="Dependentes"
            value={simData.dependentes ? String(simData.dependentes) : ""}
            sanitizeRegex={/[0-9]/g}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                dependentes: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="INSS (%)"
            value={simData.inssPercentBps ? String(simData.inssPercentBps) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatPercentBR}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                inssPercentBps: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="IRRF (%)"
            value={simData.irrfPercentBps ? String(simData.irrfPercentBps) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatPercentBR}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                irrfPercentBps: Number(raw || "0"),
              }))
            }
          />
          <AppTextInput
            title="FGTS (%)"
            value={simData.fgtsPercentBps ? String(simData.fgtsPercentBps) : ""}
            sanitizeRegex={/[0-9]/g}
            formatter={formatPercentBR}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                fgtsPercentBps: Number(raw || "0"),
              }))
            }
          />
          <AppSelectInput
            title="Rescisao"
            value={simData.rescisaoTipo}
            onChange={(e) =>
              setSimData((prev) => ({ ...prev, rescisaoTipo: e.target.value }))
            }
            data={rescisaoOptions}
          />
          <AppTextInput
            title="Verbas rescisorias"
            value={
              simData.verbasRescisoriasCents
                ? String(simData.verbasRescisoriasCents)
                : ""
            }
            sanitizeRegex={/[0-9]/g}
            formatter={formatBRL}
            onValueChange={(raw) =>
              setSimData((prev) => ({
                ...prev,
                verbasRescisoriasCents: Number(raw || "0"),
              }))
            }
          />
        </div>
        {simError ? <p className="mt-2 text-sm text-red-600">{simError}</p> : null}
        <div className="mt-3 flex flex-wrap gap-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSimularFolha}>
            Gerar folha simulada
          </AppButton>
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Resumo calculado" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
            <p className="text-xs uppercase text-gray-400">Total proventos</p>
            <p className="text-base font-semibold">{formatMoney(calculo.totalProventos)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
            <p className="text-xs uppercase text-gray-400">Total descontos</p>
            <p className="text-base font-semibold">{formatMoney(calculo.totalDescontos)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
            <p className="text-xs uppercase text-gray-400">Liquido</p>
            <p className="text-base font-semibold">{formatMoney(calculo.totalLiquido)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
            <p className="text-xs uppercase text-gray-400">INSS</p>
            <p className="text-base font-semibold">{formatMoney(calculo.inss)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
            <p className="text-xs uppercase text-gray-400">FGTS</p>
            <p className="text-base font-semibold">{formatMoney(calculo.fgts)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
            <p className="text-xs uppercase text-gray-400">IRRF</p>
            <p className="text-base font-semibold">{formatMoney(calculo.irrf)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-200">
            <p className="text-xs uppercase text-gray-400">Multa FGTS</p>
            <p className="text-base font-semibold">{formatMoney(calculo.multaFgts)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Eventos eSocial" />
        {eventError ? <p className="mt-2 text-sm text-red-600">{eventError}</p> : null}
        <div className="mt-3 flex flex-wrap gap-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleGerarEventos}>
            Gerar eventos eSocial
          </AppButton>
          <AppButton
            type="button"
            className="w-auto px-6"
            onClick={handleEnviarEventos}
            disabled={!eventos.length}
          >
            Enviar eventos
          </AppButton>
        </div>
        <div className="mt-4">
          <AppTable
            data={eventos}
            rowKey={(row) => row.id}
            emptyState={<AppListNotFound texto="Nenhum evento gerado." />}
            pagination={{ enabled: false }}
            columns={eventosColumns}
          />
        </div>
      </Card>

      <Card tone="amber">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          Simulador ativo: calcule folha e eventos eSocial localmente.
        </p>
      </Card>

      <Card>
        <AppTable
          data={itens}
          rowKey={(row) => row.id}
          emptyState={<AppListNotFound texto="Nenhuma folha simulada." />}
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

export default FolhaSimuladorPage;
