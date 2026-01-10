import { isWeekend, parseDate } from "./pontoCalc";

export type PontoCalendarioTipo = "FERIADO" | "TRABALHO";
export type PontoCalendarioFuncionarioTipo = "FOLGA" | "TRABALHO";

export type PontoCalendarioItem = {
  id?: number;
  date: string;
  tipo: PontoCalendarioTipo;
  descricao?: string;
};

export type PontoCalendarioFuncionarioItem = {
  id?: number;
  funcionarioId: string;
  date: string;
  tipo: PontoCalendarioFuncionarioTipo;
  descricao?: string;
};

const STORAGE_KEY_GLOBAL = "ponto_calendario_v1";
const STORAGE_KEY_FUNC = "ponto_calendario_func_v1";

export const loadCalendarioLocal = (): PontoCalendarioItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_GLOBAL);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PontoCalendarioItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCalendarioLocal = (items: PontoCalendarioItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(items));
};

export const loadCalendarioFuncionarioLocal = (): PontoCalendarioFuncionarioItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_FUNC);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PontoCalendarioFuncionarioItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCalendarioFuncionarioLocal = (items: PontoCalendarioFuncionarioItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_FUNC, JSON.stringify(items));
};

const isWorkdayBySchedule = (
  date: string,
  scheduleType: string,
  scheduleStart?: string,
  weekHours?: number[]
) => {
  const jsDate = parseDate(date);
  if (scheduleType === "SEMANAL_6X1") {
    return jsDate.getDay() !== 0;
  }
  if (scheduleType === "ESCALA_12X36") {
    if (!scheduleStart) return true;
    const start = parseDate(scheduleStart);
    const diffDays = Math.floor((jsDate.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays % 2 === 0;
  }
  if (scheduleType === "CUSTOM" && Array.isArray(weekHours)) {
    return (weekHours[jsDate.getDay()] ?? 0) > 0;
  }
  return !isWeekend(jsDate);
};

export const isWorkday = (
  date: string,
  funcionarioId: string | undefined,
  calendario: PontoCalendarioItem[],
  overrides: PontoCalendarioFuncionarioItem[],
  scheduleType = "SEMANAL_5X2",
  scheduleStart?: string,
  weekHours?: number[]
) => {
  if (funcionarioId) {
    const override = [...overrides]
      .reverse()
      .find(
        (item) => item.date === date && String(item.funcionarioId) === String(funcionarioId)
      );
    if (override) return override.tipo === "TRABALHO";
  }
  const global = [...calendario].reverse().find((item) => item.date === date);
  if (global) return global.tipo === "TRABALHO";
  return isWorkdayBySchedule(date, scheduleType, scheduleStart, weekHours);
};

export const getExpectedMinutes = (
  date: string,
  funcionarioId: string | undefined,
  calendario: PontoCalendarioItem[],
  overrides: PontoCalendarioFuncionarioItem[],
  rule: { dailyHours: number; scheduleType: string; scheduleStart?: string; weekHours?: number[] }
) => {
  if (
    !isWorkday(
      date,
      funcionarioId,
      calendario,
      overrides,
      rule.scheduleType,
      rule.scheduleStart,
      rule.weekHours
    )
  ) {
    return 0;
  }
  if (rule.scheduleType === "CUSTOM" && Array.isArray(rule.weekHours)) {
    const jsDate = parseDate(date);
    return (rule.weekHours[jsDate.getDay()] ?? 0) * 60;
  }
  return rule.dailyHours * 60;
};
