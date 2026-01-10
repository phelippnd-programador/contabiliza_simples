import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_PONTO_CONFIG,
  loadPontoConfig,
  loadPontoOverrides,
  savePontoConfig as saveLocalConfig,
  savePontoOverrides,
} from "../utils/pontoConfig";
import type { PontoConfig, PontoFuncionarioConfig } from "../utils/pontoConfig";
import {
  deletePontoFuncionarioConfig,
  listPontoConfig,
  listPontoFuncionarioConfig,
  savePontoConfig as saveApiConfig,
  savePontoFuncionarioConfig,
} from "../services/pontoConfig.service";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export const usePontoConfig = () => {
  const [config, setConfig] = useState<PontoConfig>(DEFAULT_PONTO_CONFIG);
  const [overrides, setOverrides] = useState<PontoFuncionarioConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!API_BASE) {
        setConfig(loadPontoConfig());
        setOverrides(loadPontoOverrides());
        return;
      }
      const [configRes, overridesRes] = await Promise.all([
        listPontoConfig(),
        listPontoFuncionarioConfig(),
      ]);
      if (configRes) {
        setConfig({ ...DEFAULT_PONTO_CONFIG, ...configRes });
      } else {
        setConfig(DEFAULT_PONTO_CONFIG);
        await saveApiConfig({ ...DEFAULT_PONTO_CONFIG, id: 1 });
      }
      setOverrides(overridesRes);
    } catch {
      setConfig(loadPontoConfig());
      setOverrides(loadPontoOverrides());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistConfig = useCallback(
    async (next: PontoConfig) => {
      setConfig(next);
      if (!API_BASE) {
        saveLocalConfig(next);
        return;
      }
      await saveApiConfig(next);
    },
    []
  );

  const persistOverride = useCallback(
    async (payload: PontoFuncionarioConfig) => {
      if (!API_BASE) {
        const next = [...overrides.filter((item) => item.funcionarioId !== payload.funcionarioId), payload];
        setOverrides(next);
        savePontoOverrides(next);
        return;
      }
      const saved = await savePontoFuncionarioConfig(payload);
      setOverrides((prev) => {
        const filtered = prev.filter((item) => String(item.funcionarioId) !== String(saved.funcionarioId));
        return [...filtered, saved];
      });
    },
    [overrides]
  );

  const removeOverride = useCallback(
    async (funcionarioId: string) => {
      const existing = overrides.find(
        (item) => String(item.funcionarioId) === String(funcionarioId)
      );
      if (!existing) return;
      if (!API_BASE) {
        const next = overrides.filter((item) => String(item.funcionarioId) !== String(funcionarioId));
        setOverrides(next);
        savePontoOverrides(next);
        return;
      }
      if (existing.id) {
        await deletePontoFuncionarioConfig(existing.id);
      }
      setOverrides((prev) =>
        prev.filter((item) => String(item.funcionarioId) !== String(funcionarioId))
      );
    },
    [overrides]
  );

  return {
    config,
    overrides,
    loading,
    reload: load,
    setConfig,
    setOverrides,
    saveConfig: persistConfig,
    saveOverride: persistOverride,
    removeOverride,
  };
};
