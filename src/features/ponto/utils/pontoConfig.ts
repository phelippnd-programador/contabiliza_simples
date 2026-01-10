import type { FuncionarioContratoTipo } from "../../rh/types/rh.types";

export type PontoRule = {
  dailyHours: number;
  toleranceMinutes: number;
  overtimeRate: number;
  nightRate: number;
  monthlyHours: number;
  scheduleType: "SEMANAL_5X2" | "SEMANAL_6X1" | "ESCALA_12X36" | "CUSTOM";
  scheduleStart?: string;
  weekHours?: number[];
  bankPeriod: "MENSAL" | "ANUAL";
  bankStartMonth?: number;
};

export type PontoConfig = {
  id?: number;
  byContrato: Record<FuncionarioContratoTipo, PontoRule>;
};

export type PontoFuncionarioConfig = Partial<PontoRule> & {
  id?: number;
  funcionarioId: string;
};

const STORAGE_KEY = "ponto_config_v1";
const STORAGE_KEY_OVERRIDES = "ponto_config_overrides_v1";

export const DEFAULT_PONTO_CONFIG: PontoConfig = {
  byContrato: {
    CLT: {
      dailyHours: 8,
      toleranceMinutes: 10,
      overtimeRate: 1.5,
      nightRate: 0.2,
      monthlyHours: 220,
      scheduleType: "SEMANAL_5X2",
      weekHours: [0, 8, 8, 8, 8, 8, 0],
      bankPeriod: "MENSAL",
      bankStartMonth: 1,
    },
    PJ: {
      dailyHours: 8,
      toleranceMinutes: 0,
      overtimeRate: 1,
      nightRate: 0,
      monthlyHours: 220,
      scheduleType: "SEMANAL_5X2",
      weekHours: [0, 8, 8, 8, 8, 8, 0],
      bankPeriod: "MENSAL",
      bankStartMonth: 1,
    },
    ESTAGIO: {
      dailyHours: 6,
      toleranceMinutes: 10,
      overtimeRate: 1.5,
      nightRate: 0.2,
      monthlyHours: 120,
      scheduleType: "SEMANAL_5X2",
      weekHours: [0, 6, 6, 6, 6, 6, 0],
      bankPeriod: "MENSAL",
      bankStartMonth: 1,
    },
    OUTRO: {
      dailyHours: 8,
      toleranceMinutes: 10,
      overtimeRate: 1.5,
      nightRate: 0.2,
      monthlyHours: 220,
      scheduleType: "SEMANAL_5X2",
      weekHours: [0, 8, 8, 8, 8, 8, 0],
      bankPeriod: "MENSAL",
      bankStartMonth: 1,
    },
  },
};

const sanitizeRule = (base: PontoRule, input?: Partial<PontoRule>): PontoRule => ({
  dailyHours: Number(input?.dailyHours ?? base.dailyHours),
  toleranceMinutes: Number(input?.toleranceMinutes ?? base.toleranceMinutes),
  overtimeRate: Number(input?.overtimeRate ?? base.overtimeRate),
  nightRate: Number(input?.nightRate ?? base.nightRate),
  monthlyHours: Number(input?.monthlyHours ?? base.monthlyHours),
  scheduleType: ((input?.scheduleType && input.scheduleType !== "")
    ? input.scheduleType
    : base.scheduleType) as PontoRule["scheduleType"],
  scheduleStart: input?.scheduleStart ?? base.scheduleStart,
  weekHours: Array.isArray(input?.weekHours) && input?.weekHours.length === 7
    ? input?.weekHours.map((value) => Number(value ?? 0))
    : base.weekHours,
  bankPeriod: (input?.bankPeriod ?? base.bankPeriod) as PontoRule["bankPeriod"],
  bankStartMonth: Number(input?.bankStartMonth ?? base.bankStartMonth),
});

export const loadPontoConfig = (): PontoConfig => {
  if (typeof window === "undefined") return DEFAULT_PONTO_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PONTO_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PontoConfig>;
    return {
      byContrato: {
        CLT: sanitizeRule(DEFAULT_PONTO_CONFIG.byContrato.CLT, parsed.byContrato?.CLT),
        PJ: sanitizeRule(DEFAULT_PONTO_CONFIG.byContrato.PJ, parsed.byContrato?.PJ),
        ESTAGIO: sanitizeRule(DEFAULT_PONTO_CONFIG.byContrato.ESTAGIO, parsed.byContrato?.ESTAGIO),
        OUTRO: sanitizeRule(DEFAULT_PONTO_CONFIG.byContrato.OUTRO, parsed.byContrato?.OUTRO),
      },
    };
  } catch {
    return DEFAULT_PONTO_CONFIG;
  }
};

export const savePontoConfig = (config: PontoConfig) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const loadPontoOverrides = (): PontoFuncionarioConfig[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_OVERRIDES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PontoFuncionarioConfig[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const savePontoOverrides = (overrides: PontoFuncionarioConfig[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
};

export const getPontoRule = (
  config: PontoConfig,
  tipoContrato?: FuncionarioContratoTipo
) => {
  if (!tipoContrato) return config.byContrato.CLT;
  return config.byContrato[tipoContrato] ?? config.byContrato.CLT;
};

export const mergePontoRule = (base: PontoRule, override?: Partial<PontoRule>): PontoRule => ({
  dailyHours: Number(override?.dailyHours ?? base.dailyHours),
  toleranceMinutes: Number(override?.toleranceMinutes ?? base.toleranceMinutes),
  overtimeRate: Number(override?.overtimeRate ?? base.overtimeRate),
  nightRate: Number(override?.nightRate ?? base.nightRate),
  monthlyHours: Number(override?.monthlyHours ?? base.monthlyHours),
  scheduleType: ((override?.scheduleType && override.scheduleType !== "")
    ? override.scheduleType
    : base.scheduleType) as PontoRule["scheduleType"],
  scheduleStart: override?.scheduleStart ?? base.scheduleStart,
  weekHours: Array.isArray(override?.weekHours) && override?.weekHours.length === 7
    ? override?.weekHours.map((value) => Number(value ?? 0))
    : base.weekHours,
  bankPeriod: (override?.bankPeriod ?? base.bankPeriod) as PontoRule["bankPeriod"],
  bankStartMonth: Number(override?.bankStartMonth ?? base.bankStartMonth),
});

export const getPontoRuleForFuncionario = (
  config: PontoConfig,
  overrides: PontoFuncionarioConfig[],
  funcionarioId?: string,
  tipoContrato?: FuncionarioContratoTipo
) => {
  const base = getPontoRule(config, tipoContrato);
  if (!funcionarioId) return base;
  const override = overrides.find((item) => String(item.funcionarioId) === String(funcionarioId));
  return mergePontoRule(base, override);
};
