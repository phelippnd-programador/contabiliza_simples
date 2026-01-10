import React, { useMemo, useState } from "react";
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
import { listFuncionarios } from "../../rh/services/rh.service";
import type { Funcionario } from "../../rh/types/rh.types";
import { usePontoCalendario } from "../hooks/usePontoCalendario";

const CalendarioPontoPage = () => {
  const { calendario, calendarioFuncionario, saveCalendario, removeCalendario, saveCalendarioFuncionario, removeCalendarioFuncionario } =
    usePontoCalendario();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [error, setError] = useState("");
  const [formGlobal, setFormGlobal] = useState({
    date: "",
    tipo: "FERIADO",
    descricao: "",
  });
  const [formFunc, setFormFunc] = useState({
    funcionarioId: "",
    date: "",
    tipo: "FOLGA",
    descricao: "",
  });
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [importYear, setImportYear] = useState("");

  React.useEffect(() => {
    listFuncionarios({ page: 1, pageSize: 200 })
      .then((res) => setFuncionarios(res.data))
      .catch(() => setFuncionarios([]));
  }, []);

  const funcionarioOptions = useMemo(
    () => [
      { value: "", label: "Selecione" },
      ...funcionarios.map((func) => ({ value: func.id, label: func.nome })),
    ],
    [funcionarios]
  );

  const columnsGlobal = useMemo(
    () => [
      { key: "date", header: "Data", render: (row: typeof calendario[number]) => row.date },
      { key: "tipo", header: "Tipo", render: (row: typeof calendario[number]) => row.tipo },
      {
        key: "descricao",
        header: "Descricao",
        render: (row: typeof calendario[number]) => row.descricao ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: typeof calendario[number]) => (
          <AppIconButton
            icon={<TrashIcon className="h-4 w-4" />}
            label="Excluir"
            variant="danger"
            onClick={() => removeCalendario(row.id ?? row.date)}
          />
        ),
      },
    ],
    [removeCalendario]
  );

  const columnsFuncionario = useMemo(
    () => [
      {
        key: "funcionario",
        header: "Funcionario",
        render: (row: typeof calendarioFuncionario[number]) =>
          funcionarios.find((func) => String(func.id) === String(row.funcionarioId))?.nome ??
          row.funcionarioId,
      },
      { key: "date", header: "Data", render: (row: typeof calendarioFuncionario[number]) => row.date },
      { key: "tipo", header: "Tipo", render: (row: typeof calendarioFuncionario[number]) => row.tipo },
      {
        key: "descricao",
        header: "Descricao",
        render: (row: typeof calendarioFuncionario[number]) => row.descricao ?? "-",
      },
      {
        key: "acoes",
        header: "Acoes",
        align: "right" as const,
        render: (row: typeof calendarioFuncionario[number]) => (
          <AppIconButton
            icon={<TrashIcon className="h-4 w-4" />}
            label="Excluir"
            variant="danger"
            onClick={() => removeCalendarioFuncionario(row.id ?? row.date)}
          />
        ),
      },
    ],
    [funcionarios, removeCalendarioFuncionario]
  );

  const handleSaveGlobal = async () => {
    setError("");
    if (!formGlobal.date) {
      setError("Informe a data do calendario.");
      return;
    }
    try {
      await saveCalendario({
        date: formGlobal.date,
        tipo: formGlobal.tipo as "FERIADO" | "TRABALHO",
        descricao: formGlobal.descricao || undefined,
      });
      setFormGlobal({ date: "", tipo: "FERIADO", descricao: "" });
    } catch {
      setError("Nao foi possivel salvar o calendario.");
    }
  };

  const handleSaveFuncionario = async () => {
    setError("");
    if (!formFunc.funcionarioId || !formFunc.date) {
      setError("Funcionario e data sao obrigatorios.");
      return;
    }
    try {
      await saveCalendarioFuncionario({
        funcionarioId: formFunc.funcionarioId,
        date: formFunc.date,
        tipo: formFunc.tipo as "FOLGA" | "TRABALHO",
        descricao: formFunc.descricao || undefined,
      });
      setFormFunc({ funcionarioId: "", date: "", tipo: "FOLGA", descricao: "" });
    } catch {
      setError("Nao foi possivel salvar a folga.");
    }
  };

  const getEasterDate = (year: number) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${year}-${pad(month)}-${pad(day)}`;
  };

  const addDays = (date: string, delta: number) => {
    const base = new Date(`${date}T00:00:00`);
    base.setDate(base.getDate() + delta);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
  };

  const importNationalHolidays = async () => {
    setError("");
    const year = Number(importYear);
    if (!year) {
      setError("Informe o ano para importar feriados.");
      return;
    }
    const fixed = [
      { date: `${year}-01-01`, descricao: "Confraternizacao universal" },
      { date: `${year}-04-21`, descricao: "Tiradentes" },
      { date: `${year}-05-01`, descricao: "Dia do trabalho" },
      { date: `${year}-09-07`, descricao: "Independencia do Brasil" },
      { date: `${year}-10-12`, descricao: "Nossa Senhora Aparecida" },
      { date: `${year}-11-02`, descricao: "Finados" },
      { date: `${year}-11-15`, descricao: "Proclamacao da Republica" },
      { date: `${year}-12-25`, descricao: "Natal" },
    ];
    const easter = getEasterDate(year);
    const movable = [
      { date: addDays(easter, -48), descricao: "Carnaval" },
      { date: addDays(easter, -47), descricao: "Carnaval (2º dia)" },
      { date: addDays(easter, -2), descricao: "Sexta-feira santa" },
      { date: addDays(easter, 60), descricao: "Corpus Christi" },
    ];
    try {
      for (const item of [...fixed, ...movable]) {
        await saveCalendario({
          date: item.date,
          tipo: "FERIADO",
          descricao: item.descricao,
        });
      }
      setImportYear("");
    } catch {
      setError("Nao foi possivel importar feriados.");
    }
  };

  const copyYear = async () => {
    setError("");
    const from = Number(yearFrom);
    const to = Number(yearTo);
    if (!from || !to) {
      setError("Informe ano origem e destino.");
      return;
    }
    try {
      for (const item of calendario) {
        const year = Number(item.date.slice(0, 4));
        if (year !== from) continue;
        const nextDate = `${to}${item.date.slice(4)}`;
        await saveCalendario({
          date: nextDate,
          tipo: item.tipo,
          descricao: item.descricao,
        });
      }
      setYearFrom("");
      setYearTo("");
    } catch {
      setError("Nao foi possivel copiar o calendario.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Ponto - Calendario" />
        <AppSubTitle text="Feriados, dias uteis especiais e folgas individuais." />
      </div>

      <Card>
        <AppSubTitle text="Calendario geral" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Defina feriados e dias uteis especiais para toda a empresa.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <AppDateInput
            title="Data"
            value={formGlobal.date}
            onChange={(e) => setFormGlobal((prev) => ({ ...prev, date: e.target.value }))}
          />
          <AppSelectInput
            title="Tipo"
            value={formGlobal.tipo}
            onChange={(e) => setFormGlobal((prev) => ({ ...prev, tipo: e.target.value }))}
            data={[
              { value: "FERIADO", label: "Feriado" },
              { value: "TRABALHO", label: "Dia util" },
            ]}
          />
          <AppTextInput
            title="Descricao"
            value={formGlobal.descricao}
            onChange={(e) => setFormGlobal((prev) => ({ ...prev, descricao: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSaveGlobal}>
            Salvar calendario
          </AppButton>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <AppTextInput
            title="Importar feriados (ano)"
            value={importYear}
            sanitizeRegex={/[0-9]/g}
            maxRawLength={4}
            onValueChange={(raw) => setImportYear(raw)}
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto px-6" onClick={importNationalHolidays}>
              Importar feriados nacionais
            </AppButton>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <AppTextInput
            title="Copiar ano (origem)"
            value={yearFrom}
            sanitizeRegex={/[0-9]/g}
            maxRawLength={4}
            onValueChange={(raw) => setYearFrom(raw)}
          />
          <AppTextInput
            title="Copiar ano (destino)"
            value={yearTo}
            sanitizeRegex={/[0-9]/g}
            maxRawLength={4}
            onValueChange={(raw) => setYearTo(raw)}
          />
          <div className="flex items-end">
            <AppButton type="button" className="w-auto px-6" onClick={copyYear}>
              Copiar calendario
            </AppButton>
          </div>
        </div>
        <div className="mt-4">
          <AppTable
            data={calendario}
            rowKey={(row) => row.id ?? row.date}
            emptyState={<AppListNotFound texto="Nenhum feriado cadastrado." />}
            columns={columnsGlobal}
          />
        </div>
      </Card>

      <Card>
        <AppSubTitle text="Folgas por funcionario" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Registre folgas e excecoes individuais.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <AppSelectInput
            title="Funcionario"
            value={formFunc.funcionarioId}
            onChange={(e) => setFormFunc((prev) => ({ ...prev, funcionarioId: e.target.value }))}
            data={funcionarioOptions}
          />
          <AppDateInput
            title="Data"
            value={formFunc.date}
            onChange={(e) => setFormFunc((prev) => ({ ...prev, date: e.target.value }))}
          />
          <AppSelectInput
            title="Tipo"
            value={formFunc.tipo}
            onChange={(e) => setFormFunc((prev) => ({ ...prev, tipo: e.target.value }))}
            data={[
              { value: "FOLGA", label: "Folga" },
              { value: "TRABALHO", label: "Dia util" },
            ]}
          />
          <div className="md:col-span-3">
            <AppTextInput
              title="Descricao"
              value={formFunc.descricao}
              onChange={(e) => setFormFunc((prev) => ({ ...prev, descricao: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-3">
          <AppButton type="button" className="w-auto px-6" onClick={handleSaveFuncionario}>
            Salvar folga
          </AppButton>
        </div>
        <div className="mt-4">
          <AppTable
            data={calendarioFuncionario}
            rowKey={(row) => row.id ?? `${row.funcionarioId}-${row.date}`}
            emptyState={<AppListNotFound texto="Nenhuma folga cadastrada." />}
            columns={columnsFuncionario}
          />
        </div>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

export default CalendarioPontoPage;
